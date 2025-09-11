/**
 * AI Performance Monitoring Service
 * Tracks metrics, performance, and health of AI services
 */

import { aiCache, AICacheKeys, AICacheTTL } from "./cache";
import { aiRateLimiter } from "./rate-limiter";

export interface AIMetrics {
  // Request metrics
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  successRate: number;

  // Performance metrics
  averageResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;

  // Rate limiting metrics
  rateLimitHits: number;
  rateLimitBypasses: number;

  // Cache metrics
  cacheHits: number;
  cacheMisses: number;
  cacheHitRate: number;

  // Batch processing metrics
  totalBatches: number;
  successfulBatches: number;
  failedBatches: number;
  averageBatchSize: number;
  averageBatchProcessingTime: number;

  // Error metrics
  errorCounts: Record<string, number>;
  errorRate: number;

  // Cost metrics (if available)
  totalTokens: number;
  estimatedCost: number;

  // Timestamps
  timestamp: number;
  windowStart: number;
  windowEnd: number;
}

export interface AIHealthStatus {
  provider: string;
  isHealthy: boolean;
  lastCheck: number;
  responseTime: number;
  errorRate: number;
  rateLimitStatus: {
    minute: number;
    hour: number;
    day: number;
  };
  cacheStatus: {
    isConnected: boolean;
    hitRate: number;
  };
  metrics: AIMetrics;
}

export interface PerformanceAlert {
  id: string;
  type:
    | "error_rate"
    | "response_time"
    | "rate_limit"
    | "cache"
    | "batch_failure";
  severity: "low" | "medium" | "high" | "critical";
  message: string;
  timestamp: number;
  provider: string;
  userId?: string;
  resolved: boolean;
  resolvedAt?: number;
}

/**
 * AI Performance Monitoring Service
 */
export class AIMonitoringService {
  private metrics: Map<string, AIMetrics> = new Map();
  private alerts: Map<string, PerformanceAlert> = new Map();
  private healthChecks: Map<string, AIHealthStatus> = new Map();

  /**
   * Record a request metric
   */
  async recordRequest(
    provider: string,
    success: boolean,
    responseTime: number,
    tokens?: number,
    cost?: number,
    userId?: string
  ): Promise<void> {
    const key = this.getMetricsKey(provider, userId);
    const metrics = await this.getMetrics(key);

    // Update request counts
    metrics.totalRequests++;
    if (success) {
      metrics.successfulRequests++;
    } else {
      metrics.failedRequests++;
    }

    // Update success rate
    metrics.successRate =
      (metrics.successfulRequests / metrics.totalRequests) * 100;

    // Update response time metrics
    this.updateResponseTimeMetrics(metrics, responseTime);

    // Update token and cost metrics
    if (tokens) {
      metrics.totalTokens += tokens;
    }
    if (cost) {
      metrics.estimatedCost += cost;
    }

    // Save updated metrics
    await this.saveMetrics(key, metrics);

    // Check for alerts
    await this.checkAlerts(provider, metrics, userId);
  }

  /**
   * Record a cache hit/miss
   */
  async recordCacheEvent(
    provider: string,
    hit: boolean,
    userId?: string
  ): Promise<void> {
    const key = this.getMetricsKey(provider, userId);
    const metrics = await this.getMetrics(key);

    if (hit) {
      metrics.cacheHits++;
    } else {
      metrics.cacheMisses++;
    }

    // Update cache hit rate
    const totalCacheEvents = metrics.cacheHits + metrics.cacheMisses;
    metrics.cacheHitRate =
      totalCacheEvents > 0 ? (metrics.cacheHits / totalCacheEvents) * 100 : 0;

    await this.saveMetrics(key, metrics);
  }

  /**
   * Record a rate limit event
   */
  async recordRateLimitEvent(
    provider: string,
    hit: boolean,
    userId?: string
  ): Promise<void> {
    const key = this.getMetricsKey(provider, userId);
    const metrics = await this.getMetrics(key);

    if (hit) {
      metrics.rateLimitHits++;
    } else {
      metrics.rateLimitBypasses++;
    }

    await this.saveMetrics(key, metrics);
  }

  /**
   * Record a batch processing event
   */
  async recordBatchEvent(
    provider: string,
    success: boolean,
    batchSize: number,
    processingTime: number,
    userId?: string
  ): Promise<void> {
    const key = this.getMetricsKey(provider, userId);
    const metrics = await this.getMetrics(key);

    // Update batch counts
    metrics.totalBatches++;
    if (success) {
      metrics.successfulBatches++;
    } else {
      metrics.failedBatches++;
    }

    // Update batch size metrics
    const totalBatchSize =
      metrics.averageBatchSize * (metrics.totalBatches - 1) + batchSize;
    metrics.averageBatchSize = totalBatchSize / metrics.totalBatches;

    // Update batch processing time metrics
    const totalProcessingTime =
      metrics.averageBatchProcessingTime * (metrics.totalBatches - 1) +
      processingTime;
    metrics.averageBatchProcessingTime =
      totalProcessingTime / metrics.totalBatches;

    await this.saveMetrics(key, metrics);
  }

  /**
   * Record an error
   */
  async recordError(
    provider: string,
    errorType: string,
    userId?: string
  ): Promise<void> {
    const key = this.getMetricsKey(provider, userId);
    const metrics = await this.getMetrics(key);

    // Update error counts
    metrics.errorCounts[errorType] = (metrics.errorCounts[errorType] || 0) + 1;

    // Update error rate
    const totalErrors = Object.values(metrics.errorCounts).reduce(
      (sum, count) => sum + count,
      0
    );
    metrics.errorRate = (totalErrors / metrics.totalRequests) * 100;

    await this.saveMetrics(key, metrics);

    // Create alert if error rate is high
    if (metrics.errorRate > 10) {
      // 10% error rate threshold
      await this.createAlert({
        type: "error_rate",
        severity: metrics.errorRate > 25 ? "critical" : "high",
        message: `High error rate detected: ${metrics.errorRate.toFixed(2)}%`,
        provider,
        userId,
      });
    }
  }

  /**
   * Get metrics for a provider
   */
  async getMetrics(provider: string, userId?: string): Promise<AIMetrics> {
    const key = this.getMetricsKey(provider, userId);
    return await this.getMetrics(key);
  }

  /**
   * Get health status for a provider
   */
  async getHealthStatus(provider: string): Promise<AIHealthStatus> {
    const cached = await aiCache.getCachedAIHealth(provider);
    if (cached) {
      return cached;
    }

    // Perform health check
    const healthStatus = await this.performHealthCheck(provider);

    // Cache the result
    await aiCache.cacheAIHealth(provider, healthStatus);

    return healthStatus;
  }

  /**
   * Get all alerts
   */
  async getAlerts(
    provider?: string,
    severity?: string,
    resolved?: boolean
  ): Promise<PerformanceAlert[]> {
    let alerts = Array.from(this.alerts.values());

    if (provider) {
      alerts = alerts.filter(alert => alert.provider === provider);
    }

    if (severity) {
      alerts = alerts.filter(alert => alert.severity === severity);
    }

    if (resolved !== undefined) {
      alerts = alerts.filter(alert => alert.resolved === resolved);
    }

    return alerts.sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Resolve an alert
   */
  async resolveAlert(alertId: string): Promise<void> {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.resolved = true;
      alert.resolvedAt = Date.now();
      this.alerts.set(alertId, alert);
    }
  }

  /**
   * Get performance summary
   */
  async getPerformanceSummary(): Promise<{
    overall: AIMetrics;
    byProvider: Record<string, AIMetrics>;
    health: Record<string, AIHealthStatus>;
    alerts: PerformanceAlert[];
  }> {
    const providers = Array.from(this.metrics.keys());
    const byProvider: Record<string, AIMetrics> = {};
    const health: Record<string, AIHealthStatus> = {};

    // Aggregate metrics by provider
    for (const provider of providers) {
      byProvider[provider] = await this.getMetrics(provider);
      health[provider] = await this.getHealthStatus(provider);
    }

    // Calculate overall metrics
    const overall = this.aggregateMetrics(Object.values(byProvider));

    // Get recent alerts
    const alerts = await this.getAlerts(undefined, undefined, false);

    return {
      overall,
      byProvider,
      health,
      alerts: alerts.slice(0, 10), // Last 10 alerts
    };
  }

  /**
   * Perform health check for a provider
   */
  private async performHealthCheck(provider: string): Promise<AIHealthStatus> {
    const startTime = Date.now();

    try {
      // Get current metrics
      const metrics = await this.getMetrics(provider);

      // Get rate limit status
      const rateLimitStatus = await aiRateLimiter.getRateLimitStatus(provider);

      // Test cache connection
      const cacheStatus = await this.testCacheConnection();

      // Calculate health score
      const isHealthy = this.calculateHealthScore(
        metrics,
        rateLimitStatus,
        cacheStatus
      );

      const healthStatus: AIHealthStatus = {
        provider,
        isHealthy,
        lastCheck: Date.now(),
        responseTime: Date.now() - startTime,
        errorRate: metrics.errorRate,
        rateLimitStatus: {
          minute: rateLimitStatus.minute.remaining,
          hour: rateLimitStatus.hour.remaining,
          day: rateLimitStatus.day.remaining,
        },
        cacheStatus,
        metrics,
      };

      return healthStatus;
    } catch (error) {
      console.error(`Health check failed for provider ${provider}:`, error);

      return {
        provider,
        isHealthy: false,
        lastCheck: Date.now(),
        responseTime: Date.now() - startTime,
        errorRate: 100,
        rateLimitStatus: { minute: 0, hour: 0, day: 0 },
        cacheStatus: { isConnected: false, hitRate: 0 },
        metrics: this.createEmptyMetrics(),
      };
    }
  }

  /**
   * Test cache connection
   */
  private async testCacheConnection(): Promise<{
    isConnected: boolean;
    hitRate: number;
  }> {
    try {
      await aiCache.getCachedAIHealth("test");
      return { isConnected: true, hitRate: 0 };
    } catch (error) {
      return { isConnected: false, hitRate: 0 };
    }
  }

  /**
   * Calculate health score
   */
  private calculateHealthScore(
    metrics: AIMetrics,
    rateLimitStatus: any,
    cacheStatus: any
  ): boolean {
    // Health is considered good if:
    // - Error rate is below 5%
    // - Success rate is above 95%
    // - Response time is reasonable
    // - Cache is connected
    // - Rate limits are not exhausted

    const errorRateOk = metrics.errorRate < 5;
    const successRateOk = metrics.successRate > 95;
    const responseTimeOk = metrics.averageResponseTime < 5000; // 5 seconds
    const cacheOk = cacheStatus.isConnected;
    const rateLimitOk = rateLimitStatus.minute.remaining > 0;

    return (
      errorRateOk && successRateOk && responseTimeOk && cacheOk && rateLimitOk
    );
  }

  /**
   * Check for alerts
   */
  private async checkAlerts(
    provider: string,
    metrics: AIMetrics,
    userId?: string
  ): Promise<void> {
    // Check response time alert
    if (metrics.averageResponseTime > 10000) {
      // 10 seconds
      await this.createAlert({
        type: "response_time",
        severity: "high",
        message: `High response time detected: ${metrics.averageResponseTime.toFixed(2)}ms`,
        provider,
        userId,
      });
    }

    // Check cache hit rate alert
    if (metrics.cacheHitRate < 50) {
      // 50% cache hit rate
      await this.createAlert({
        type: "cache",
        severity: "medium",
        message: `Low cache hit rate: ${metrics.cacheHitRate.toFixed(2)}%`,
        provider,
        userId,
      });
    }
  }

  /**
   * Create an alert
   */
  private async createAlert(
    alertData: Omit<PerformanceAlert, "id" | "timestamp" | "resolved">
  ): Promise<void> {
    const alert: PerformanceAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      resolved: false,
      ...alertData,
    };

    this.alerts.set(alert.id, alert);

    // Log critical alerts
    if (alert.severity === "critical") {
      console.error(`CRITICAL AI ALERT: ${alert.message}`, alert);
    }
  }

  /**
   * Get metrics key
   */
  private getMetricsKey(provider: string, userId?: string): string {
    const userPart = userId ? `:${userId}` : "";
    return `ai:metrics:${provider}${userPart}`;
  }

  /**
   * Get metrics from cache
   */
  private async getMetrics(key: string): Promise<AIMetrics> {
    const cached = await aiCache.getCachedAIMetrics(key);
    if (cached) {
      return cached;
    }

    return this.createEmptyMetrics();
  }

  /**
   * Save metrics to cache
   */
  private async saveMetrics(key: string, metrics: AIMetrics): Promise<void> {
    metrics.timestamp = Date.now();
    await aiCache.cacheAIMetrics(key, metrics);
  }

  /**
   * Create empty metrics
   */
  private createEmptyMetrics(): AIMetrics {
    return {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      successRate: 0,
      averageResponseTime: 0,
      minResponseTime: 0,
      maxResponseTime: 0,
      p95ResponseTime: 0,
      p99ResponseTime: 0,
      rateLimitHits: 0,
      rateLimitBypasses: 0,
      cacheHits: 0,
      cacheMisses: 0,
      cacheHitRate: 0,
      totalBatches: 0,
      successfulBatches: 0,
      failedBatches: 0,
      averageBatchSize: 0,
      averageBatchProcessingTime: 0,
      errorCounts: {},
      errorRate: 0,
      totalTokens: 0,
      estimatedCost: 0,
      timestamp: Date.now(),
      windowStart: Date.now(),
      windowEnd: Date.now(),
    };
  }

  /**
   * Update response time metrics
   */
  private updateResponseTimeMetrics(
    metrics: AIMetrics,
    responseTime: number
  ): void {
    if (metrics.totalRequests === 1) {
      metrics.minResponseTime = responseTime;
      metrics.maxResponseTime = responseTime;
      metrics.averageResponseTime = responseTime;
    } else {
      metrics.minResponseTime = Math.min(metrics.minResponseTime, responseTime);
      metrics.maxResponseTime = Math.max(metrics.maxResponseTime, responseTime);

      // Update average
      const totalTime =
        metrics.averageResponseTime * (metrics.totalRequests - 1) +
        responseTime;
      metrics.averageResponseTime = totalTime / metrics.totalRequests;

      // Update percentiles (simplified calculation)
      if (responseTime > metrics.p95ResponseTime) {
        metrics.p95ResponseTime = responseTime;
      }
      if (responseTime > metrics.p99ResponseTime) {
        metrics.p99ResponseTime = responseTime;
      }
    }
  }

  /**
   * Aggregate metrics from multiple sources
   */
  private aggregateMetrics(metricsList: AIMetrics[]): AIMetrics {
    if (metricsList.length === 0) {
      return this.createEmptyMetrics();
    }

    const aggregated = this.createEmptyMetrics();

    for (const metrics of metricsList) {
      aggregated.totalRequests += metrics.totalRequests;
      aggregated.successfulRequests += metrics.successfulRequests;
      aggregated.failedRequests += metrics.failedRequests;
      aggregated.rateLimitHits += metrics.rateLimitHits;
      aggregated.rateLimitBypasses += metrics.rateLimitBypasses;
      aggregated.cacheHits += metrics.cacheHits;
      aggregated.cacheMisses += metrics.cacheMisses;
      aggregated.totalBatches += metrics.totalBatches;
      aggregated.successfulBatches += metrics.successfulBatches;
      aggregated.failedBatches += metrics.failedBatches;
      aggregated.totalTokens += metrics.totalTokens;
      aggregated.estimatedCost += metrics.estimatedCost;

      // Aggregate error counts
      for (const [errorType, count] of Object.entries(metrics.errorCounts)) {
        aggregated.errorCounts[errorType] =
          (aggregated.errorCounts[errorType] || 0) + count;
      }
    }

    // Calculate derived metrics
    aggregated.successRate =
      aggregated.totalRequests > 0
        ? (aggregated.successfulRequests / aggregated.totalRequests) * 100
        : 0;

    aggregated.cacheHitRate =
      aggregated.cacheHits + aggregated.cacheMisses > 0
        ? (aggregated.cacheHits /
            (aggregated.cacheHits + aggregated.cacheMisses)) *
          100
        : 0;

    aggregated.errorRate =
      aggregated.totalRequests > 0
        ? (Object.values(aggregated.errorCounts).reduce(
            (sum, count) => sum + count,
            0
          ) /
            aggregated.totalRequests) *
          100
        : 0;

    aggregated.averageBatchSize =
      aggregated.totalBatches > 0
        ? metricsList.reduce((sum, m) => sum + m.averageBatchSize, 0) /
          metricsList.length
        : 0;

    aggregated.averageBatchProcessingTime =
      aggregated.totalBatches > 0
        ? metricsList.reduce(
            (sum, m) => sum + m.averageBatchProcessingTime,
            0
          ) / metricsList.length
        : 0;

    return aggregated;
  }
}

// Export singleton instance
export const aiMonitoring = new AIMonitoringService();

/**
 * Performance monitoring decorator
 */
export function withMonitoring(provider: string) {
  return function (
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor
  ) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const startTime = Date.now();
      const userId = args[0]?.userId || args[0]?.user?.id;

      try {
        const result = await method.apply(this, args);
        const responseTime = Date.now() - startTime;

        // Record successful request
        await aiMonitoring.recordRequest(
          provider,
          true,
          responseTime,
          undefined,
          undefined,
          userId
        );

        return result;
      } catch (error) {
        const responseTime = Date.now() - startTime;

        // Record failed request
        await aiMonitoring.recordRequest(
          provider,
          false,
          responseTime,
          undefined,
          undefined,
          userId
        );

        // Record error
        await aiMonitoring.recordError(
          provider,
          error.constructor.name,
          userId
        );

        throw error;
      }
    };

    return descriptor;
  };
}
