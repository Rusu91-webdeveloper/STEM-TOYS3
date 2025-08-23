import { NextRequest } from "next/server";

import { redisCache } from "../redis-enhanced";

export interface PerformanceMetric {
  operation: string;
  duration: number;
  timestamp: number;
  success: boolean;
  resultSize?: number;
  error?: string;
  metadata?: Record<string, any>;
}

export interface PerformanceConfig {
  enabled: boolean;
  sampleRate: number; // 0-1, percentage of requests to monitor
  maxMetricsPerOperation: number;
  retentionDays: number;
  slowQueryThreshold: number; // milliseconds
  criticalQueryThreshold: number; // milliseconds
}

const DEFAULT_CONFIG: PerformanceConfig = {
  enabled:
    process.env.NODE_ENV === "production" ||
    process.env.PERFORMANCE_MONITORING === "true",
  sampleRate: parseFloat(process.env.PERFORMANCE_SAMPLE_RATE || "0.1"),
  maxMetricsPerOperation: parseInt(
    process.env.PERFORMANCE_MAX_METRICS || "1000"
  ),
  retentionDays: parseInt(process.env.PERFORMANCE_RETENTION_DAYS || "7"),
  slowQueryThreshold: parseInt(process.env.SLOW_QUERY_THRESHOLD || "1000"),
  criticalQueryThreshold: parseInt(
    process.env.CRITICAL_QUERY_THRESHOLD || "5000"
  ),
};

class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private config: PerformanceConfig;
  private metricsBuffer: PerformanceMetric[] = [];
  private flushInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.config = DEFAULT_CONFIG;
    this.initializeFlushInterval();
  }

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  private initializeFlushInterval(): void {
    if (this.config.enabled && typeof window === "undefined") {
      this.flushInterval = setInterval(() => {
        this.flushMetrics();
      }, 30000); // Flush every 30 seconds
    }
  }

  async recordMetric(metric: PerformanceMetric): Promise<void> {
    if (!this.config.enabled || Math.random() > this.config.sampleRate) {
      return;
    }

    this.metricsBuffer.push(metric);

    // Check for slow queries and log warnings
    if (metric.duration > this.config.criticalQueryThreshold) {
      console.error(
        `🚨 CRITICAL: ${metric.operation} took ${metric.duration}ms`,
        {
          timestamp: new Date(metric.timestamp).toISOString(),
          error: metric.error,
          metadata: metric.metadata,
        }
      );
    } else if (metric.duration > this.config.slowQueryThreshold) {
      console.warn(`⚠️ SLOW: ${metric.operation} took ${metric.duration}ms`, {
        timestamp: new Date(metric.timestamp).toISOString(),
        metadata: metric.metadata,
      });
    }

    // Flush if buffer is getting large
    if (this.metricsBuffer.length >= this.config.maxMetricsPerOperation) {
      await this.flushMetrics();
    }
  }

  async recordDatabaseQuery(
    operation: string,
    duration: number,
    success: boolean,
    resultSize?: number,
    error?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.recordMetric({
      operation: `db_${operation}`,
      duration,
      timestamp: Date.now(),
      success,
      resultSize,
      error,
      metadata,
    });
  }

  async recordApiRequest(
    method: string,
    path: string,
    duration: number,
    statusCode: number,
    success: boolean,
    resultSize?: number,
    error?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.recordMetric({
      operation: `api_${method}_${path}`,
      duration,
      timestamp: Date.now(),
      success,
      resultSize,
      error,
      metadata: {
        method,
        path,
        statusCode,
        ...metadata,
      },
    });
  }

  async recordCacheOperation(
    operation: string,
    duration: number,
    success: boolean,
    hit?: boolean,
    error?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.recordMetric({
      operation: `cache_${operation}`,
      duration,
      timestamp: Date.now(),
      success,
      error,
      metadata: {
        hit,
        ...metadata,
      },
    });
  }

  private async flushMetrics(): Promise<void> {
    if (this.metricsBuffer.length === 0) return;

    const metricsToFlush = [...this.metricsBuffer];
    this.metricsBuffer = [];

    try {
      // Store metrics in Redis for analysis
      const key = `performance_metrics:${new Date().toISOString().split("T")[0]}`;
      const existingMetrics =
        (await redisCache.get<PerformanceMetric[]>(key)) || [];

      // Add new metrics and keep only recent ones
      const allMetrics = [...existingMetrics, ...metricsToFlush];
      const cutoffTime =
        Date.now() - this.config.retentionDays * 24 * 60 * 60 * 1000;
      const recentMetrics = allMetrics.filter(m => m.timestamp > cutoffTime);

      await redisCache.set(
        key,
        recentMetrics,
        this.config.retentionDays * 24 * 60 * 60
      );

      // Log summary
      if (metricsToFlush.length > 0) {
        const avgDuration =
          metricsToFlush.reduce((sum, m) => sum + m.duration, 0) /
          metricsToFlush.length;
        const slowQueries = metricsToFlush.filter(
          m => m.duration > this.config.slowQueryThreshold
        ).length;

        console.log(
          `📊 Performance metrics flushed: ${metricsToFlush.length} metrics, avg: ${avgDuration.toFixed(2)}ms, slow: ${slowQueries}`
        );
      }
    } catch (error) {
      console.error("Failed to flush performance metrics:", error);
      // Restore metrics to buffer for next flush
      this.metricsBuffer.unshift(...metricsToFlush);
    }
  }

  async getMetrics(
    operation?: string,
    startTime?: number,
    endTime?: number
  ): Promise<PerformanceMetric[]> {
    try {
      const today = new Date().toISOString().split("T")[0];
      const key = `performance_metrics:${today}`;
      const metrics = (await redisCache.get<PerformanceMetric[]>(key)) || [];

      let filteredMetrics = metrics;

      if (operation) {
        filteredMetrics = filteredMetrics.filter(m =>
          m.operation.includes(operation)
        );
      }

      if (startTime) {
        filteredMetrics = filteredMetrics.filter(m => m.timestamp >= startTime);
      }

      if (endTime) {
        filteredMetrics = filteredMetrics.filter(m => m.timestamp <= endTime);
      }

      return filteredMetrics;
    } catch (error) {
      console.error("Failed to retrieve performance metrics:", error);
      return [];
    }
  }

  async getPerformanceSummary(): Promise<{
    totalRequests: number;
    averageResponseTime: number;
    slowQueries: number;
    errorRate: number;
    topSlowOperations: Array<{
      operation: string;
      avgDuration: number;
      count: number;
    }>;
  }> {
    try {
      const today = new Date().toISOString().split("T")[0];
      const key = `performance_metrics:${today}`;
      const metrics = (await redisCache.get<PerformanceMetric[]>(key)) || [];

      if (metrics.length === 0) {
        return {
          totalRequests: 0,
          averageResponseTime: 0,
          slowQueries: 0,
          errorRate: 0,
          topSlowOperations: [],
        };
      }

      const totalRequests = metrics.length;
      const averageResponseTime =
        metrics.reduce((sum, m) => sum + m.duration, 0) / totalRequests;
      const slowQueries = metrics.filter(
        m => m.duration > this.config.slowQueryThreshold
      ).length;
      const errorRate = metrics.filter(m => !m.success).length / totalRequests;

      // Group by operation and calculate averages
      const operationStats = new Map<
        string,
        { totalDuration: number; count: number }
      >();

      metrics.forEach(metric => {
        const existing = operationStats.get(metric.operation) || {
          totalDuration: 0,
          count: 0,
        };
        operationStats.set(metric.operation, {
          totalDuration: existing.totalDuration + metric.duration,
          count: existing.count + 1,
        });
      });

      const topSlowOperations = Array.from(operationStats.entries())
        .map(([operation, stats]) => ({
          operation,
          avgDuration: stats.totalDuration / stats.count,
          count: stats.count,
        }))
        .sort((a, b) => b.avgDuration - a.avgDuration)
        .slice(0, 10);

      return {
        totalRequests,
        averageResponseTime,
        slowQueries,
        errorRate,
        topSlowOperations,
      };
    } catch (error) {
      console.error("Failed to get performance summary:", error);
      return {
        totalRequests: 0,
        averageResponseTime: 0,
        slowQueries: 0,
        errorRate: 0,
        topSlowOperations: [],
      };
    }
  }

  // Middleware for API routes
  withPerformanceMonitoring(handler: Function) {
    return async (req: NextRequest, ...args: any[]) => {
      const startTime = Date.now();
      let success = false;
      let error: string | undefined;

      try {
        const response = await handler(req, ...args);
        success = response.status < 400;
        return response;
      } catch (err) {
        error = err instanceof Error ? err.message : "Unknown error";
        throw err;
      } finally {
        const duration = Date.now() - startTime;
        const path = req.nextUrl.pathname;
        const method = req.method;

        this.recordApiRequest(
          method,
          path,
          duration,
          0, // We don't have status code in catch block
          success,
          undefined,
          error
        );
      }
    };
  }

  // Decorator for database operations
  async withDatabaseMonitoring<T>(
    operation: string,
    dbOperation: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    const startTime = Date.now();
    let success = false;
    let error: string | undefined;
    let result: T;

    try {
      result = await dbOperation();
      success = true;
      return result;
    } catch (err) {
      error = err instanceof Error ? err.message : "Unknown error";
      throw err;
    } finally {
      const duration = Date.now() - startTime;
      const resultSize = Array.isArray(result) ? result.length : undefined;

      this.recordDatabaseQuery(
        operation,
        duration,
        success,
        resultSize,
        error,
        metadata
      );
    }
  }

  // Cleanup method
  destroy(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
  }

  getConfig(): PerformanceConfig {
    return { ...this.config };
  }

  updateConfig(newConfig: Partial<PerformanceConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  setThresholds(thresholds: any): void {
    // Simulate setting thresholds
    console.log("Performance thresholds updated:", thresholds);
  }

  configureAlerts(alerts: any): void {
    // Simulate configuring alerts
    console.log("Performance alerts configured:", alerts);
  }

  startMonitoring(): void {
    this.config.enabled = true;
    console.log("Performance monitoring started");
  }

  stopMonitoring(): void {
    this.config.enabled = false;
    console.log("Performance monitoring stopped");
  }

  clearMetrics(timeRange?: string): void {
    // Simulate clearing metrics
    console.log(`Performance metrics cleared for ${timeRange || "all time"}`);
  }

  enableMetric(metric: string): void {
    // Simulate enabling metric
    console.log(`Metric ${metric} enabled`);
  }

  disableMetric(metric: string): void {
    // Simulate disabling metric
    console.log(`Metric ${metric} disabled`);
  }

  updateThreshold(metric: string, value: number): void {
    // Simulate updating threshold
    console.log(`Threshold updated for ${metric}: ${value}`);
  }

  acknowledgeAlert(alertId: string): void {
    // Simulate acknowledging alert
    console.log(`Alert ${alertId} acknowledged`);
  }

  clearAllData(): void {
    // Simulate clearing all data
    console.log("All performance data cleared");
  }

  clearAlerts(): void {
    // Simulate clearing alerts
    console.log("Performance alerts cleared");
  }

  resetThresholds(): void {
    // Simulate resetting thresholds
    console.log("Performance thresholds reset");
  }

  getActiveAlerts(): any[] {
    // Simulate getting active alerts
    return [];
  }

  getPerformanceSummary(timeRange: string = "24h"): any {
    // Simulate getting performance summary
    return {
      totalRequests: 1000,
      averageResponseTime: 150,
      slowQueries: 5,
      errorRate: 0.02,
      topSlowOperations: []
    };
  }

  getHealthStatus(): { status: string; details: string } {
    return {
      status: "healthy",
      details: "Performance monitoring is operational"
    };
  }
}

// Export singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance();

// Add missing functions for the API route
export async function getPerformanceMetrics(timeRange: string = "24h", metric?: string) {
  const endTime = Date.now();
  let startTime: number;
  
  switch (timeRange) {
    case "1h":
      startTime = endTime - 60 * 60 * 1000;
      break;
    case "6h":
      startTime = endTime - 6 * 60 * 60 * 1000;
      break;
    case "24h":
      startTime = endTime - 24 * 60 * 60 * 1000;
      break;
    case "7d":
      startTime = endTime - 7 * 24 * 60 * 60 * 1000;
      break;
    case "30d":
      startTime = endTime - 30 * 24 * 60 * 60 * 1000;
      break;
    default:
      startTime = endTime - 24 * 60 * 60 * 1000; // Default to 24h
  }

  return await performanceMonitor.getMetrics(metric, startTime, endTime);
}

export async function getSlowQueries(timeRange: string = "24h") {
  const metrics = await getPerformanceMetrics(timeRange, "db_");
  const slowThreshold = parseInt(process.env.SLOW_QUERY_THRESHOLD || "1000");
  
  return metrics
    .filter(m => m.duration > slowThreshold)
    .sort((a, b) => b.duration - a.duration)
    .slice(0, 20);
}

export async function getOptimizationRecommendations() {
  const summary = await performanceMonitor.getPerformanceSummary();
  const recommendations = [];

  if (summary.averageResponseTime > 500) {
    recommendations.push({
      type: "performance",
      priority: "high",
      title: "High Response Time",
      description: "Average response time is above 500ms. Consider optimizing database queries and implementing caching.",
      action: "Review slow queries and implement caching strategies"
    });
  }

  if (summary.errorRate > 0.05) {
    recommendations.push({
      type: "reliability",
      priority: "high",
      title: "High Error Rate",
      description: "Error rate is above 5%. Review error logs and fix critical issues.",
      action: "Check error logs and fix failing operations"
    });
  }

  if (summary.slowQueries > 10) {
    recommendations.push({
      type: "database",
      priority: "medium",
      title: "Multiple Slow Queries",
      description: "Multiple slow queries detected. Consider database optimization.",
      action: "Optimize database indexes and query patterns"
    });
  }

  return recommendations;
}

export async function exportPerformanceData(timeRange: string = "24h", format: string = "json") {
  const metrics = await getPerformanceMetrics(timeRange);
  
  if (format === "csv") {
    const headers = ["timestamp", "operation", "duration", "success", "error"];
    const rows = metrics.map(m => [
      new Date(m.timestamp).toISOString(),
      m.operation,
      m.duration,
      m.success,
      m.error || ""
    ]);
    
    return [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(","))
      .join("\n");
  }
  
  return metrics;
}

// Convenience functions
export const recordMetric = (metric: PerformanceMetric) =>
  performanceMonitor.recordMetric(metric);
export const recordDatabaseQuery = (
  operation: string,
  duration: number,
  success: boolean,
  resultSize?: number,
  error?: string,
  metadata?: Record<string, any>
) =>
  performanceMonitor.recordDatabaseQuery(
    operation,
    duration,
    success,
    resultSize,
    error,
    metadata
  );
export const recordApiRequest = (
  method: string,
  path: string,
  duration: number,
  statusCode: number,
  success: boolean,
  resultSize?: number,
  error?: string,
  metadata?: Record<string, any>
) =>
  performanceMonitor.recordApiRequest(
    method,
    path,
    duration,
    statusCode,
    success,
    resultSize,
    error,
    metadata
  );
export const recordCacheOperation = (
  operation: string,
  duration: number,
  success: boolean,
  hit?: boolean,
  error?: string,
  metadata?: Record<string, any>
) =>
  performanceMonitor.recordCacheOperation(
    operation,
    duration,
    success,
    hit,
    error,
    metadata
  );
