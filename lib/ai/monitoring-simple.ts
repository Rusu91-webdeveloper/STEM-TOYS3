/**
 * Simplified AI Monitoring Service
 * Lightweight monitoring without complex dependencies
 */

export interface SimpleAIMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  successRate: number;
  lastUpdated: number;
}

/**
 * Simple AI Monitoring Service
 * No external dependencies, just basic in-memory tracking
 */
export class SimpleAIMonitoringService {
  private metrics: Map<string, SimpleAIMetrics> = new Map();

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
    const key = userId ? `${provider}:${userId}` : provider;
    const metrics = this.metrics.get(key) || this.createEmptyMetrics();

    // Update request counts
    metrics.totalRequests++;
    if (success) {
      metrics.successfulRequests++;
    } else {
      metrics.failedRequests++;
    }

    // Update success rate
    metrics.successRate = (metrics.successfulRequests / metrics.totalRequests) * 100;
    metrics.lastUpdated = Date.now();

    this.metrics.set(key, metrics);
  }

  /**
   * Record an error
   */
  async recordError(
    provider: string,
    errorType: string,
    userId?: string
  ): Promise<void> {
    // Just log the error for now
    console.log(`AI Error recorded: ${provider} - ${errorType}`);
  }

  /**
   * Record cache event
   */
  async recordCacheEvent(
    provider: string,
    hit: boolean,
    userId?: string
  ): Promise<void> {
    // No-op for simplified version
  }

  /**
   * Record rate limit event
   */
  async recordRateLimitEvent(
    provider: string,
    hit: boolean,
    userId?: string
  ): Promise<void> {
    // No-op for simplified version
  }

  /**
   * Record batch event
   */
  async recordBatchEvent(
    provider: string,
    success: boolean,
    batchSize: number,
    processingTime: number,
    userId?: string
  ): Promise<void> {
    // No-op for simplified version
  }

  /**
   * Get metrics for a provider
   */
  getMetrics(provider: string, userId?: string): SimpleAIMetrics {
    const key = userId ? `${provider}:${userId}` : provider;
    return this.metrics.get(key) || this.createEmptyMetrics();
  }

  /**
   * Create empty metrics
   */
  private createEmptyMetrics(): SimpleAIMetrics {
    return {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      successRate: 0,
      lastUpdated: Date.now(),
    };
  }

  /**
   * Get all metrics
   */
  getAllMetrics(): Record<string, SimpleAIMetrics> {
    const result: Record<string, SimpleAIMetrics> = {};
    for (const [key, metrics] of this.metrics.entries()) {
      result[key] = metrics;
    }
    return result;
  }
}

// Export singleton instance
export const simpleAIMonitoring = new SimpleAIMonitoringService();
