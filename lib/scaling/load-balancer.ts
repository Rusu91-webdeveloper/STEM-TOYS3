import { performanceMonitor } from "../monitoring/performance-monitor";
import { redisCache } from "../redis-enhanced";

export interface ServerInstance {
  id: string;
  url: string;
  region: string;
  health: "healthy" | "unhealthy" | "degraded";
  load: number; // 0-100
  responseTime: number; // milliseconds
  uptime: number; // seconds
  lastHealthCheck: Date;
  activeConnections: number;
  maxConnections: number;
  cpuUsage: number; // 0-100
  memoryUsage: number; // 0-100
  diskUsage: number; // 0-100
}

export interface LoadBalancerConfig {
  algorithm: "round-robin" | "least-connections" | "weighted" | "ip-hash" | "least-response-time";
  healthCheckInterval: number; // milliseconds
  healthCheckTimeout: number; // milliseconds
  maxRetries: number;
  retryDelay: number; // milliseconds
  stickySessions: boolean;
  sessionTimeout: number; // seconds
  autoScaling: {
    enabled: boolean;
    minInstances: number;
    maxInstances: number;
    scaleUpThreshold: number; // CPU usage percentage
    scaleDownThreshold: number; // CPU usage percentage
    scaleUpCooldown: number; // seconds
    scaleDownCooldown: number; // seconds
  };
  regions: {
    primary: string;
    fallback: string[];
    latencyThreshold: number; // milliseconds
  };
}

export interface ScalingMetrics {
  totalRequests: number;
  averageResponseTime: number;
  errorRate: number;
  activeConnections: number;
  cpuUsage: number;
  memoryUsage: number;
  instances: ServerInstance[];
}

const DEFAULT_CONFIG: LoadBalancerConfig = {
  algorithm: "least-response-time",
  healthCheckInterval: 30000, // 30 seconds
  healthCheckTimeout: 5000, // 5 seconds
  maxRetries: 3,
  retryDelay: 1000, // 1 second
  stickySessions: true,
  sessionTimeout: 3600, // 1 hour
  autoScaling: {
    enabled: true,
    minInstances: 2,
    maxInstances: 10,
    scaleUpThreshold: 80, // 80% CPU
    scaleDownThreshold: 30, // 30% CPU
    scaleUpCooldown: 300, // 5 minutes
    scaleDownCooldown: 600, // 10 minutes
  },
  regions: {
    primary: "us-east-1",
    fallback: ["us-west-2", "eu-west-1"],
    latencyThreshold: 200, // 200ms
  },
};

class LoadBalancer {
  private static instance: LoadBalancer;
  private config: LoadBalancerConfig;
  private instances: Map<string, ServerInstance> = new Map();
  private sessionMap: Map<string, string> = new Map(); // sessionId -> instanceId
  private lastScaleUp: Date | null = null;
  private lastScaleDown: Date | null = null;
  private currentIndex = 0; // for round-robin
  private healthCheckInterval: NodeJS.Timeout | null = null;

  private constructor(config: Partial<LoadBalancerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.initializeInstances();
    this.startHealthChecks();
  }

  static getInstance(config?: Partial<LoadBalancerConfig>): LoadBalancer {
    if (!LoadBalancer.instance) {
      LoadBalancer.instance = new LoadBalancer(config);
    }
    return LoadBalancer.instance;
  }

  /**
   * Initialize default server instances
   */
  private initializeInstances(): void {
    // Primary instance
    this.addInstance({
      id: "primary-1",
      url: process.env.PRIMARY_SERVER_URL || "http://localhost:3000",
      region: this.config.regions.primary,
      health: "healthy",
      load: 0,
      responseTime: 0,
      uptime: 0,
      lastHealthCheck: new Date(),
      activeConnections: 0,
      maxConnections: 1000,
      cpuUsage: 0,
      memoryUsage: 0,
      diskUsage: 0,
    });

    // Fallback instances
    this.config.regions.fallback.forEach((region, index) => {
      this.addInstance({
        id: `fallback-${index + 1}`,
        url: process.env[`FALLBACK_SERVER_URL_${index + 1}`] || `http://localhost:${3001 + index}`,
        region,
        health: "healthy",
        load: 0,
        responseTime: 0,
        uptime: 0,
        lastHealthCheck: new Date(),
        activeConnections: 0,
        maxConnections: 1000,
        cpuUsage: 0,
        memoryUsage: 0,
        diskUsage: 0,
      });
    });
  }

  /**
   * Add a new server instance
   */
  addInstance(instance: ServerInstance): void {
    this.instances.set(instance.id, instance);
    console.log(`[LoadBalancer] Added instance: ${instance.id} (${instance.url})`);
  }

  /**
   * Remove a server instance
   */
  removeInstance(instanceId: string): boolean {
    const removed = this.instances.delete(instanceId);
    if (removed) {
      console.log(`[LoadBalancer] Removed instance: ${instanceId}`);
    }
    return removed;
  }

  /**
   * Get the best server instance for a request
   */
  getInstance(sessionId?: string): ServerInstance | null {
    const healthyInstances = Array.from(this.instances.values()).filter(
      instance => instance.health === "healthy"
    );

    if (healthyInstances.length === 0) {
      console.warn("[LoadBalancer] No healthy instances available");
      return null;
    }

    // Check for sticky session
    if (sessionId && this.config.stickySessions) {
      const stickyInstanceId = this.sessionMap.get(sessionId);
      if (stickyInstanceId) {
        const stickyInstance = this.instances.get(stickyInstanceId);
        if (stickyInstance && stickyInstance.health === "healthy") {
          return stickyInstance;
        }
      }
    }

    // Apply load balancing algorithm
    let selectedInstance: ServerInstance;

    switch (this.config.algorithm) {
      case "round-robin":
        selectedInstance = this.roundRobin(healthyInstances);
        break;
      case "least-connections":
        selectedInstance = this.leastConnections(healthyInstances);
        break;
      case "weighted":
        selectedInstance = this.weighted(healthyInstances);
        break;
      case "ip-hash":
        selectedInstance = this.ipHash(healthyInstances, sessionId);
        break;
      case "least-response-time":
        selectedInstance = this.leastResponseTime(healthyInstances);
        break;
      default:
        selectedInstance = healthyInstances[0];
    }

    // Update sticky session mapping
    if (sessionId && this.config.stickySessions) {
      this.sessionMap.set(sessionId, selectedInstance.id);
    }

    return selectedInstance;
  }

  /**
   * Round-robin algorithm
   */
  private roundRobin(instances: ServerInstance[]): ServerInstance {
    const instance = instances[this.currentIndex % instances.length];
    this.currentIndex = (this.currentIndex + 1) % instances.length;
    return instance;
  }

  /**
   * Least connections algorithm
   */
  private leastConnections(instances: ServerInstance[]): ServerInstance {
    return instances.reduce((min, current) => 
      current.activeConnections < min.activeConnections ? current : min
    );
  }

  /**
   * Weighted algorithm (based on response time and load)
   */
  private weighted(instances: ServerInstance[]): ServerInstance {
    return instances.reduce((best, current) => {
      const currentScore = this.calculateWeight(current);
      const bestScore = this.calculateWeight(best);
      return currentScore > bestScore ? current : best;
    });
  }

  /**
   * Calculate weight for weighted algorithm
   */
  private calculateWeight(instance: ServerInstance): number {
    const responseTimeWeight = Math.max(0, 1000 - instance.responseTime) / 1000;
    const loadWeight = Math.max(0, 100 - instance.load) / 100;
    return responseTimeWeight * 0.7 + loadWeight * 0.3;
  }

  /**
   * IP hash algorithm
   */
  private ipHash(instances: ServerInstance[], sessionId?: string): ServerInstance {
    const hash = this.hashString(sessionId || "default");
    return instances[hash % instances.length];
  }

  /**
   * Simple hash function
   */
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Least response time algorithm
   */
  private leastResponseTime(instances: ServerInstance[]): ServerInstance {
    return instances.reduce((min, current) => 
      current.responseTime < min.responseTime ? current : min
    );
  }

  /**
   * Start health checks
   */
  private startHealthChecks(): void {
    this.healthCheckInterval = setInterval(() => {
      this.performHealthChecks();
    }, this.config.healthCheckInterval);
  }

  /**
   * Perform health checks on all instances
   */
  private async performHealthChecks(): Promise<void> {
    const healthCheckPromises = Array.from(this.instances.values()).map(
      instance => this.checkInstanceHealth(instance)
    );

    await Promise.allSettled(healthCheckPromises);
    
    // Trigger auto-scaling if enabled
    if (this.config.autoScaling.enabled) {
      this.checkAutoScaling();
    }
  }

  /**
   * Check health of a single instance
   */
  private async checkInstanceHealth(instance: ServerInstance): Promise<void> {
    const startTime = Date.now();
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.healthCheckTimeout);

      const response = await fetch(`${instance.url}/api/health`, {
        method: "GET",
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const responseTime = Date.now() - startTime;
      const healthData = await response.json();

      // Update instance health
      instance.health = response.ok ? "healthy" : "degraded";
      instance.responseTime = responseTime;
      instance.lastHealthCheck = new Date();
      instance.uptime = healthData.uptime || instance.uptime;
      instance.activeConnections = healthData.activeConnections || instance.activeConnections;
      instance.cpuUsage = healthData.cpuUsage || instance.cpuUsage;
      instance.memoryUsage = healthData.memoryUsage || instance.memoryUsage;
      instance.diskUsage = healthData.diskUsage || instance.diskUsage;
      instance.load = this.calculateLoad(instance);

      this.instances.set(instance.id, instance);

      // Record health check metric
      performanceMonitor.recordMetric("load_balancer", "health_check", Date.now(), {
        instanceId: instance.id,
        responseTime,
        health: instance.health,
        load: instance.load,
      });

    } catch (error) {
      console.error(`[LoadBalancer] Health check failed for ${instance.id}:`, error);
      
      // Mark instance as unhealthy
      instance.health = "unhealthy";
      instance.lastHealthCheck = new Date();
      this.instances.set(instance.id, instance);

      // Record failed health check
      performanceMonitor.recordMetric("load_balancer", "health_check_failed", Date.now(), {
        instanceId: instance.id,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Calculate load percentage for an instance
   */
  private calculateLoad(instance: ServerInstance): number {
    const connectionLoad = (instance.activeConnections / instance.maxConnections) * 100;
    const resourceLoad = (instance.cpuUsage + instance.memoryUsage) / 2;
    return Math.max(connectionLoad, resourceLoad);
  }

  /**
   * Check if auto-scaling is needed
   */
  private checkAutoScaling(): void {
    const now = new Date();
    const instances = Array.from(this.instances.values());
    const healthyInstances = instances.filter(i => i.health === "healthy");
    
    const averageLoad = healthyInstances.reduce((sum, i) => sum + i.load, 0) / healthyInstances.length;
    const averageCpu = healthyInstances.reduce((sum, i) => sum + i.cpuUsage, 0) / healthyInstances.length;

    // Check scale up conditions
    if (averageCpu > this.config.autoScaling.scaleUpThreshold &&
        healthyInstances.length < this.config.autoScaling.maxInstances &&
        (!this.lastScaleUp || (now.getTime() - this.lastScaleUp.getTime()) > this.config.autoScaling.scaleUpCooldown * 1000)) {
      
      this.scaleUp();
      this.lastScaleUp = now;
    }

    // Check scale down conditions
    if (averageCpu < this.config.autoScaling.scaleDownThreshold &&
        healthyInstances.length > this.config.autoScaling.minInstances &&
        (!this.lastScaleDown || (now.getTime() - this.lastScaleDown.getTime()) > this.config.autoScaling.scaleDownCooldown * 1000)) {
      
      this.scaleDown();
      this.lastScaleDown = now;
    }
  }

  /**
   * Scale up by adding new instances
   */
  private async scaleUp(): Promise<void> {
    console.log("[LoadBalancer] Scaling up...");
    
    try {
      // In a real implementation, this would create new server instances
      // For now, we'll just log the action
      const newInstanceId = `auto-scaled-${Date.now()}`;
      
      // Record scaling metric
      performanceMonitor.recordMetric("load_balancer", "scale_up", Date.now(), {
        newInstanceId,
        reason: "high_cpu_usage",
      });

      console.log(`[LoadBalancer] Would create new instance: ${newInstanceId}`);
    } catch (error) {
      console.error("[LoadBalancer] Scale up failed:", error);
    }
  }

  /**
   * Scale down by removing instances
   */
  private async scaleDown(): Promise<void> {
    console.log("[LoadBalancer] Scaling down...");
    
    try {
      // Find the least loaded instance to remove
      const instances = Array.from(this.instances.values());
      const healthyInstances = instances.filter(i => i.health === "healthy");
      
      if (healthyInstances.length > this.config.autoScaling.minInstances) {
        const leastLoaded = healthyInstances.reduce((min, current) => 
          current.load < min.load ? current : min
        );

        // Record scaling metric
        performanceMonitor.recordMetric("load_balancer", "scale_down", Date.now(), {
          removedInstanceId: leastLoaded.id,
          reason: "low_cpu_usage",
        });

        console.log(`[LoadBalancer] Would remove instance: ${leastLoaded.id}`);
      }
    } catch (error) {
      console.error("[LoadBalancer] Scale down failed:", error);
    }
  }

  /**
   * Get scaling metrics
   */
  getScalingMetrics(): ScalingMetrics {
    const instances = Array.from(this.instances.values());
    const healthyInstances = instances.filter(i => i.health === "healthy");
    
    const totalRequests = healthyInstances.reduce((sum, i) => sum + i.activeConnections, 0);
    const averageResponseTime = healthyInstances.reduce((sum, i) => sum + i.responseTime, 0) / healthyInstances.length;
    const errorRate = instances.filter(i => i.health === "unhealthy").length / instances.length;
    const activeConnections = totalRequests;
    const cpuUsage = healthyInstances.reduce((sum, i) => sum + i.cpuUsage, 0) / healthyInstances.length;
    const memoryUsage = healthyInstances.reduce((sum, i) => sum + i.memoryUsage, 0) / healthyInstances.length;

    return {
      totalRequests,
      averageResponseTime,
      errorRate,
      activeConnections,
      cpuUsage,
      memoryUsage,
      instances,
    };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<LoadBalancerConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  getConfig(): LoadBalancerConfig {
    return { ...this.config };
  }

  /**
   * Stop health checks
   */
  stop(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }

  /**
   * Clean up expired sessions
   */
  cleanupSessions(): void {
    const now = Date.now();
    const sessionTimeout = this.config.sessionTimeout * 1000;
    
    for (const [sessionId, instanceId] of this.sessionMap.entries()) {
      // In a real implementation, you'd check session expiration
      // For now, we'll just clean up old sessions periodically
      if (Math.random() < 0.01) { // 1% chance to clean up each session
        this.sessionMap.delete(sessionId);
      }
    }
  }
}

// Export singleton instance
export const loadBalancer = LoadBalancer.getInstance();

// Convenience functions
export const getInstance = (sessionId?: string) => 
  loadBalancer.getInstance(sessionId);

export const getScalingMetrics = () => 
  loadBalancer.getScalingMetrics();

export const addInstance = (instance: ServerInstance) => 
  loadBalancer.addInstance(instance);

export const removeInstance = (instanceId: string) => 
  loadBalancer.removeInstance(instanceId);

export type { LoadBalancerConfig, ServerInstance, ScalingMetrics };
