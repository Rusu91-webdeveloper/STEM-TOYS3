import { logger } from "@/lib/logger";
import { getCache } from "@/lib/cache/redis-cache";

export interface PerformanceMetric {
  operation: string;
  duration: number;
  success: boolean;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface PerformanceStats {
  operation: string;
  count: number;
  avgDuration: number;
  minDuration: number;
  maxDuration: number;
  p95Duration: number;
  p99Duration: number;
  successRate: number;
  lastExecuted: Date;
}

/**
 * User Performance Monitor for Phase 5 Performance Optimization
 * Tracks and analyzes performance metrics for user-related operations
 */
export class UserPerformanceMonitor {
  private cache = getCache();
  private metrics: PerformanceMetric[] = [];
  private readonly maxMetricsInMemory = 10000;

  /**
   * Record a performance metric
   */
  async recordMetric(
    operation: string,
    duration: number,
    success: boolean,
    metadata?: Record<string, any>
  ): Promise<void> {
    const metric: PerformanceMetric = {
      operation,
      duration,
      success,
      timestamp: new Date(),
      metadata,
    };

    // Store in memory for immediate analysis
    this.metrics.push(metric);

    // Keep only recent metrics in memory
    if (this.metrics.length > this.maxMetricsInMemory) {
      this.metrics = this.metrics.slice(-this.maxMetricsInMemory);
    }

    // Cache the metric for persistence
    await this.cacheMetric(metric);

    // Log slow operations
    if (duration > 1000) {
      // > 1 second
      logger.warn("Slow user operation detected", {
        operation,
        duration,
        success,
        metadata,
      });
    }

    // Log failures
    if (!success) {
      logger.error("User operation failed", {
        operation,
        duration,
        metadata,
      });
    }
  }

  /**
   * Get performance statistics for an operation
   */
  async getPerformanceStats(
    operation?: string,
    timeWindowMinutes: number = 60
  ): Promise<PerformanceStats[]> {
    const cutoffTime = new Date(Date.now() - timeWindowMinutes * 60 * 1000);

    // Get metrics from cache and memory
    const cachedMetrics = await this.getCachedMetrics(operation, cutoffTime);
    const recentMetrics = this.metrics.filter(
      m =>
        (!operation || m.operation === operation) && m.timestamp >= cutoffTime
    );

    const allMetrics = [...cachedMetrics, ...recentMetrics];

    if (allMetrics.length === 0) {
      return [];
    }

    // Group by operation and calculate stats
    const operationGroups = new Map<string, PerformanceMetric[]>();

    allMetrics.forEach(metric => {
      const key = metric.operation;
      if (!operationGroups.has(key)) {
        operationGroups.set(key, []);
      }
      operationGroups.get(key)!.push(metric);
    });

    const stats: PerformanceStats[] = [];

    for (const [op, metrics] of operationGroups) {
      const durations = metrics.map(m => m.duration).sort((a, b) => a - b);
      const successful = metrics.filter(m => m.success);
      const total = metrics.length;

      stats.push({
        operation: op,
        count: total,
        avgDuration: durations.reduce((a, b) => a + b, 0) / total,
        minDuration: durations[0],
        maxDuration: durations[durations.length - 1],
        p95Duration: this.calculatePercentile(durations, 95),
        p99Duration: this.calculatePercentile(durations, 99),
        successRate: (successful.length / total) * 100,
        lastExecuted: metrics[metrics.length - 1].timestamp,
      });
    }

    return stats.sort((a, b) => b.count - a.count);
  }

  /**
   * Get slow operations report
   */
  async getSlowOperations(
    thresholdMs: number = 1000,
    limit: number = 50
  ): Promise<PerformanceMetric[]> {
    const allMetrics = [
      ...this.metrics,
      ...(await this.getCachedMetrics(
        undefined,
        new Date(Date.now() - 24 * 60 * 60 * 1000)
      )), // Last 24 hours
    ];

    return allMetrics
      .filter(m => m.duration > thresholdMs)
      .sort((a, b) => b.duration - a.duration)
      .slice(0, limit);
  }

  /**
   * Get operation throughput (operations per minute)
   */
  async getThroughputStats(
    timeWindowMinutes: number = 5
  ): Promise<Record<string, number>> {
    const cutoffTime = new Date(Date.now() - timeWindowMinutes * 60 * 1000);

    const relevantMetrics = this.metrics.filter(m => m.timestamp >= cutoffTime);

    const throughput: Record<string, number> = {};

    relevantMetrics.forEach(metric => {
      if (!throughput[metric.operation]) {
        throughput[metric.operation] = 0;
      }
      throughput[metric.operation]++;
    });

    // Convert to per-minute rate
    Object.keys(throughput).forEach(operation => {
      throughput[operation] = throughput[operation] / timeWindowMinutes;
    });

    return throughput;
  }

  /**
   * Get cache performance statistics
   */
  async getCacheStats() {
    return await this.cache.getStats();
  }

  /**
   * Generate performance report
   */
  async generatePerformanceReport(): Promise<{
    summary: PerformanceStats[];
    slowOperations: PerformanceMetric[];
    throughput: Record<string, number>;
    cacheStats: any;
    recommendations: string[];
  }> {
    const [summary, slowOperations, throughput, cacheStats] = await Promise.all(
      [
        this.getPerformanceStats(),
        this.getSlowOperations(),
        this.getThroughputStats(),
        this.getCacheStats(),
      ]
    );

    const recommendations = this.generateRecommendations(
      summary,
      slowOperations,
      cacheStats
    );

    return {
      summary,
      slowOperations,
      throughput,
      cacheStats,
      recommendations,
    };
  }

  /**
   * Cache a metric for persistence
   */
  private async cacheMetric(metric: PerformanceMetric): Promise<void> {
    const cacheKey = `perf:metric:${metric.operation}:${Date.now()}`;

    await this.cache.set(cacheKey, metric, {
      ttl: 24 * 60 * 60, // 24 hours
      tags: [`perf:${metric.operation}`, "performance-metrics"],
    });
  }

  /**
   * Get cached metrics
   */
  private async getCachedMetrics(
    operation?: string,
    cutoffTime?: Date
  ): Promise<PerformanceMetric[]> {
    try {
      // In a real implementation, you'd query metrics from cache or database
      // For now, return empty array as we store in memory
      return [];
    } catch (error) {
      logger.error("Failed to get cached metrics", { error });
      return [];
    }
  }

  /**
   * Calculate percentile from sorted array
   */
  private calculatePercentile(
    sortedArray: number[],
    percentile: number
  ): number {
    if (sortedArray.length === 0) return 0;

    const index = (percentile / 100) * (sortedArray.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);

    if (lower === upper) {
      return sortedArray[lower];
    }

    return (
      sortedArray[lower] +
      (sortedArray[upper] - sortedArray[lower]) * (index - lower)
    );
  }

  /**
   * Generate performance recommendations
   */
  private generateRecommendations(
    summary: PerformanceStats[],
    slowOperations: PerformanceMetric[],
    cacheStats: any
  ): string[] {
    const recommendations: string[] = [];

    // Check for slow operations
    if (slowOperations.length > 0) {
      recommendations.push(
        `${slowOperations.length} operations exceeded 1s threshold. Consider optimizing database queries or adding indexes.`
      );
    }

    // Check success rates
    const lowSuccessRate = summary.filter(s => s.successRate < 95);
    if (lowSuccessRate.length > 0) {
      recommendations.push(
        `${lowSuccessRate.length} operations have success rates below 95%. Investigate error causes.`
      );
    }

    // Check cache performance
    if (cacheStats.memoryUsage > 100 * 1024 * 1024) {
      // > 100MB
      recommendations.push(
        "Cache memory usage is high. Consider cache size limits or compression."
      );
    }

    // Check throughput bottlenecks
    const highThroughput = Object.entries(summary)
      .filter(([, stats]) => stats.p95Duration > 500)
      .map(([operation]) => operation);

    if (highThroughput.length > 0) {
      recommendations.push(
        `High latency detected for: ${highThroughput.join(", ")}. Consider load balancing or query optimization.`
      );
    }

    // General recommendations
    if (summary.length === 0) {
      recommendations.push(
        "No performance metrics collected yet. Enable performance monitoring."
      );
    } else {
      recommendations.push(
        "Consider implementing query result caching for frequently accessed data."
      );
      recommendations.push(
        "Monitor database connection pool usage and optimize connection settings."
      );
    }

    return recommendations;
  }
}

// Singleton instance
let performanceMonitorInstance: UserPerformanceMonitor | null = null;

/**
 * Get the global performance monitor instance
 */
export function getUserPerformanceMonitor(): UserPerformanceMonitor {
  if (!performanceMonitorInstance) {
    performanceMonitorInstance = new UserPerformanceMonitor();
  }

  return performanceMonitorInstance;
}

/**
 * Performance monitoring decorator for user operations
 */
export function withPerformanceMonitoring(operationName: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const monitor = getUserPerformanceMonitor();
      const startTime = Date.now();

      try {
        const result = await originalMethod.apply(this, args);
        const duration = Date.now() - startTime;

        await monitor.recordMetric(operationName, duration, true, {
          method: propertyKey,
          args: args.length,
        });

        return result;
      } catch (error) {
        const duration = Date.now() - startTime;

        await monitor.recordMetric(operationName, duration, false, {
          method: propertyKey,
          error: error.message,
        });

        throw error;
      }
    };

    return descriptor;
  };
}
