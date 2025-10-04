import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";

export interface LoadBalancerConfig {
  enableLoadBalancing: boolean;
  instances: string[]; // Array of instance URLs
  healthCheckInterval: number; // Health check interval in ms
  healthCheckTimeout: number; // Health check timeout in ms
  maxRetries: number; // Max retries per request
  sessionAffinity: boolean; // Sticky sessions
  algorithm:
    | "round-robin"
    | "least-connections"
    | "ip-hash"
    | "weighted-round-robin";
}

export interface InstanceHealth {
  url: string;
  healthy: boolean;
  responseTime: number;
  activeConnections: number;
  totalRequests: number;
  errorRate: number;
  lastHealthCheck: Date;
  consecutiveFailures: number;
}

/**
 * Load balancer for horizontal scaling across multiple instances
 */
export class LoadBalancer {
  private config: LoadBalancerConfig;
  private instances: Map<string, InstanceHealth> = new Map();
  private currentIndex = 0;
  private healthCheckTimer?: NodeJS.Timeout;

  constructor(config: Partial<LoadBalancerConfig> = {}) {
    this.config = {
      enableLoadBalancing: process.env.ENABLE_LOAD_BALANCING === "true",
      instances: this.parseInstances(process.env.LOAD_BALANCER_INSTANCES),
      healthCheckInterval: parseInt(
        process.env.HEALTH_CHECK_INTERVAL || "30000"
      ),
      healthCheckTimeout: parseInt(process.env.HEALTH_CHECK_TIMEOUT || "5000"),
      maxRetries: parseInt(process.env.MAX_RETRIES || "3"),
      sessionAffinity: process.env.SESSION_AFFINITY === "true",
      algorithm: (process.env.LOAD_BALANCER_ALGORITHM as any) || "round-robin",
      ...config,
    };

    if (this.config.enableLoadBalancing && this.config.instances.length > 0) {
      this.initializeInstances();
      this.startHealthChecks();
    }
  }

  /**
   * Handle incoming request with load balancing
   */
  async handleRequest(request: NextRequest): Promise<NextResponse> {
    if (!this.config.enableLoadBalancing) {
      // If load balancing is disabled, handle locally
      return this.handleLocalRequest(request);
    }

    const instance = this.selectInstance(request);

    if (!instance) {
      return NextResponse.json(
        { error: "No healthy instances available" },
        { status: 503 }
      );
    }

    // Track request metrics
    this.updateInstanceMetrics(instance.url, "request");

    let lastError: unknown;

    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      try {
        const response = await this.proxyRequest(request, instance.url);

        // Track successful response
        this.updateInstanceMetrics(instance.url, "success");

        // Add load balancer headers
        response.headers.set("X-Load-Balancer-Instance", instance.url);
        response.headers.set("X-Load-Balancer-Attempt", attempt.toString());

        return response;
      } catch (error) {
        lastError = error;
        this.updateInstanceMetrics(instance.url, "error");

        logger.warn("Request failed, retrying", {
          instance: instance.url,
          attempt: attempt + 1,
          maxRetries: this.config.maxRetries,
          error: error instanceof Error ? error.message : String(error),
        });

        // Wait before retry (exponential backoff)
        if (attempt < this.config.maxRetries) {
          await this.delay(Math.pow(2, attempt) * 100);
        }
      }
    }

    // All retries failed
    logger.error("All load balancer retries failed", {
      instance: instance.url,
      error: lastError instanceof Error ? lastError.message : String(lastError),
    });

    return NextResponse.json(
      { error: "Service temporarily unavailable" },
      { status: 503 }
    );
  }

  /**
   * Get load balancer statistics
   */
  getStats(): {
    enabled: boolean;
    totalInstances: number;
    healthyInstances: number;
    algorithm: string;
    instances: Array<{
      url: string;
      healthy: boolean;
      activeConnections: number;
      totalRequests: number;
      errorRate: number;
      responseTime: number;
    }>;
  } {
    const instances = Array.from(this.instances.values());

    return {
      enabled: this.config.enableLoadBalancing,
      totalInstances: instances.length,
      healthyInstances: instances.filter(i => i.healthy).length,
      algorithm: this.config.algorithm,
      instances: instances.map(i => ({
        url: i.url,
        healthy: i.healthy,
        activeConnections: i.activeConnections,
        totalRequests: i.totalRequests,
        errorRate: i.errorRate,
        responseTime: i.responseTime,
      })),
    };
  }

  /**
   * Manually mark an instance as healthy/unhealthy
   */
  setInstanceHealth(url: string, healthy: boolean): boolean {
    const instance = this.instances.get(url);
    if (instance) {
      instance.healthy = healthy;
      instance.consecutiveFailures = healthy
        ? 0
        : instance.consecutiveFailures + 1;
      logger.info("Instance health manually set", { url, healthy });
      return true;
    }
    return false;
  }

  /**
   * Add a new instance dynamically
   */
  addInstance(url: string): boolean {
    if (this.instances.has(url)) {
      return false;
    }

    this.instances.set(url, {
      url,
      healthy: true,
      responseTime: 0,
      activeConnections: 0,
      totalRequests: 0,
      errorRate: 0,
      lastHealthCheck: new Date(),
      consecutiveFailures: 0,
    });

    logger.info("Instance added to load balancer", { url });
    return true;
  }

  /**
   * Remove an instance
   */
  removeInstance(url: string): boolean {
    const removed = this.instances.delete(url);
    if (removed) {
      logger.info("Instance removed from load balancer", { url });
    }
    return removed;
  }

  /**
   * Graceful shutdown
   */
  shutdown(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
    }
    logger.info("Load balancer shut down");
  }

  // Private methods

  private parseInstances(instancesStr?: string): string[] {
    if (!instancesStr) return [];

    try {
      return JSON.parse(instancesStr);
    } catch {
      // If not JSON, treat as comma-separated
      return instancesStr
        .split(",")
        .map(url => url.trim())
        .filter(Boolean);
    }
  }

  private initializeInstances(): void {
    this.config.instances.forEach(url => {
      this.instances.set(url, {
        url,
        healthy: true, // Assume healthy initially
        responseTime: 0,
        activeConnections: 0,
        totalRequests: 0,
        errorRate: 0,
        lastHealthCheck: new Date(),
        consecutiveFailures: 0,
      });
    });

    logger.info("Load balancer instances initialized", {
      count: this.instances.size,
      instances: this.config.instances,
    });
  }

  private startHealthChecks(): void {
    this.healthCheckTimer = setInterval(() => {
      this.performHealthChecks();
    }, this.config.healthCheckInterval);
  }

  private async performHealthChecks(): Promise<void> {
    const checks = Array.from(this.instances.entries()).map(
      async ([url, instance]) => {
        try {
          const startTime = Date.now();

          const controller = new AbortController();
          const timeoutId = setTimeout(
            () => controller.abort(),
            this.config.healthCheckTimeout
          );

          const response = await fetch(`${url}/api/health`, {
            method: "GET",
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          const responseTime = Date.now() - startTime;
          const healthy = response.ok;

          // Update instance health
          instance.healthy = healthy;
          instance.responseTime = responseTime;
          instance.lastHealthCheck = new Date();

          if (healthy) {
            instance.consecutiveFailures = 0;
          } else {
            instance.consecutiveFailures++;
            // Mark as unhealthy after 3 consecutive failures
            if (instance.consecutiveFailures >= 3) {
              instance.healthy = false;
            }
          }
        } catch (error) {
          instance.consecutiveFailures++;
          instance.healthy = false;
          instance.lastHealthCheck = new Date();

          logger.warn("Health check failed", {
            url,
            consecutiveFailures: instance.consecutiveFailures,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
    );

    await Promise.allSettled(checks);
  }

  private selectInstance(request: NextRequest): InstanceHealth | null {
    const healthyInstances = Array.from(this.instances.values()).filter(
      i => i.healthy
    );

    if (healthyInstances.length === 0) {
      return null;
    }

    switch (this.config.algorithm) {
      case "round-robin":
        return this.selectRoundRobin(healthyInstances);

      case "least-connections":
        return this.selectLeastConnections(healthyInstances);

      case "ip-hash":
        return this.selectByIpHash(request, healthyInstances);

      case "weighted-round-robin":
        return this.selectWeightedRoundRobin(healthyInstances);

      default:
        return healthyInstances[0];
    }
  }

  private selectRoundRobin(instances: InstanceHealth[]): InstanceHealth {
    const instance = instances[this.currentIndex % instances.length];
    this.currentIndex = (this.currentIndex + 1) % instances.length;
    return instance;
  }

  private selectLeastConnections(instances: InstanceHealth[]): InstanceHealth {
    return instances.reduce((min, current) =>
      current.activeConnections < min.activeConnections ? current : min
    );
  }

  private selectByIpHash(
    request: NextRequest,
    instances: InstanceHealth[]
  ): InstanceHealth {
    const ip =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "127.0.0.1";

    // Simple hash function for IP
    let hash = 0;
    for (let i = 0; i < ip.length; i++) {
      hash = (hash << 5) - hash + ip.charCodeAt(i);
      hash = hash & hash; // Convert to 32-bit integer
    }

    const index = Math.abs(hash) % instances.length;
    return instances[index];
  }

  private selectWeightedRoundRobin(
    instances: InstanceHealth[]
  ): InstanceHealth {
    // For simplicity, weight by inverse of error rate
    // Lower error rate = higher weight
    const weightedInstances = instances.map(instance => ({
      instance,
      weight: Math.max(0.1, 1 - instance.errorRate), // Minimum weight of 0.1
    }));

    const totalWeight = weightedInstances.reduce(
      (sum, wi) => sum + wi.weight,
      0
    );
    let random = Math.random() * totalWeight;

    for (const wi of weightedInstances) {
      random -= wi.weight;
      if (random <= 0) {
        return wi.instance;
      }
    }

    return instances[0]; // Fallback
  }

  private async proxyRequest(
    request: NextRequest,
    instanceUrl: string
  ): Promise<NextResponse> {
    const url = new URL(request.url);
    const targetUrl = `${instanceUrl}${url.pathname}${url.search}`;

    // Create headers for proxy request
    const headers = new Headers(request.headers);

    // Add forwarded headers
    headers.set("X-Forwarded-Host", request.headers.get("host") || "");
    headers.set("X-Forwarded-Proto", url.protocol.replace(":", ""));
    headers.set(
      "X-Forwarded-For",
      request.headers.get("x-forwarded-for") ||
        request.headers.get("x-real-ip") ||
        ""
    );

    // Remove hop-by-hop headers
    const hopByHopHeaders = [
      "connection",
      "keep-alive",
      "proxy-authenticate",
      "proxy-authorization",
      "te",
      "trailers",
      "transfer-encoding",
      "upgrade",
    ];

    hopByHopHeaders.forEach(header => headers.delete(header));

    try {
      const response = await fetch(targetUrl, {
        method: request.method,
        headers,
        body:
          request.method !== "GET" && request.method !== "HEAD"
            ? await request.arrayBuffer()
            : undefined,
        signal: AbortSignal.timeout(30000), // 30 second timeout
      });

      // Create new response with proxied content
      const responseHeaders = new Headers(response.headers);

      // Add load balancer headers
      responseHeaders.set("X-Load-Balanced", "true");

      return new NextResponse(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
      });
    } catch (error) {
      throw new Error(
        `Proxy request failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private async handleLocalRequest(
    request: NextRequest
  ): Promise<NextResponse> {
    // In a real implementation, this would handle the request locally
    // For now, return a simple response
    return NextResponse.json({ message: "Request handled locally" });
  }

  private updateInstanceMetrics(
    url: string,
    type: "request" | "success" | "error"
  ): void {
    const instance = this.instances.get(url);
    if (!instance) return;

    switch (type) {
      case "request":
        instance.activeConnections++;
        instance.totalRequests++;
        break;
      case "success":
        instance.activeConnections = Math.max(
          0,
          instance.activeConnections - 1
        );
        break;
      case "error":
        instance.activeConnections = Math.max(
          0,
          instance.activeConnections - 1
        );
        instance.errorRate = instance.errorRate * 0.9 + 0.1 * 1; // Exponential moving average
        break;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Singleton instance
let loadBalancerInstance: LoadBalancer | null = null;

/**
 * Get the global load balancer instance
 */
export function getLoadBalancer(): LoadBalancer {
  if (!loadBalancerInstance) {
    loadBalancerInstance = new LoadBalancer();
  }

  return loadBalancerInstance;
}

/**
 * Middleware for load balancing
 */
export async function loadBalancerMiddleware(
  request: NextRequest
): Promise<NextResponse | null> {
  const loadBalancer = getLoadBalancer();

  // Skip load balancing for certain paths
  const skipPaths = ["/api/health", "/api/metrics", "/_next"];
  if (skipPaths.some(path => request.nextUrl.pathname.startsWith(path))) {
    return null; // Continue with normal processing
  }

  return loadBalancer.handleRequest(request);
}
