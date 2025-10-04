import { logger } from "@/lib/logger";

export interface PerformanceMetrics {
  timestamp: number;
  responseTime: number;
  concurrentUsers: number;
  memoryUsage: number;
  cpuUsage: number;
  activeConnections: number;
  queueLength: number;
  errorRate: number;
  throughput: number; // requests per second
  cacheHitRate: number;
  databaseConnections: number;
  slowQueries: number;
}

export interface PerformanceThresholds {
  maxResponseTime: number; // ms
  maxMemoryUsage: number; // MB
  maxCpuUsage: number; // percentage
  maxErrorRate: number; // percentage
  maxQueueLength: number;
  minCacheHitRate: number; // percentage
  maxSlowQueries: number;
}

export interface AlertConfig {
  enabled: boolean;
  cooldownPeriod: number; // ms between alerts
  notificationChannels: string[]; // ["email", "slack", "webhook"]
  webhookUrl?: string;
  alertEmails?: string[];
}

/**
 * Enterprise performance monitoring system for high-concurrency scenarios
 */
export class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private thresholds: PerformanceThresholds;
  private alertConfig: AlertConfig;
  private lastAlertTime: Map<string, number> = new Map();
  private monitoringInterval?: NodeJS.Timeout;
  private isMonitoring = false;

  constructor(
    thresholds: Partial<PerformanceThresholds> = {},
    alertConfig: Partial<AlertConfig> = {}
  ) {
    this.thresholds = {
      maxResponseTime: parseInt(process.env.MAX_RESPONSE_TIME || "5000"),
      maxMemoryUsage: parseInt(process.env.MAX_MEMORY_USAGE || "1024"), // MB
      maxCpuUsage: parseInt(process.env.MAX_CPU_USAGE || "80"), // %
      maxErrorRate: parseInt(process.env.MAX_ERROR_RATE || "5"), // %
      maxQueueLength: parseInt(process.env.MAX_QUEUE_LENGTH || "100"),
      minCacheHitRate: parseInt(process.env.MIN_CACHE_HIT_RATE || "80"), // %
      maxSlowQueries: parseInt(process.env.MAX_SLOW_QUERIES || "10"),
      ...thresholds,
    };

    this.alertConfig = {
      enabled: process.env.PERFORMANCE_ALERTS_ENABLED === "true",
      cooldownPeriod: parseInt(process.env.ALERT_COOLDOWN_PERIOD || "300000"), // 5 minutes
      notificationChannels: (process.env.ALERT_CHANNELS || "email").split(","),
      webhookUrl: process.env.ALERT_WEBHOOK_URL,
      alertEmails: process.env.ALERT_EMAILS?.split(","),
      ...alertConfig,
    };
  }

  /**
   * Start performance monitoring
   */
  startMonitoring(intervalMs: number = 30000): void {
    if (this.isMonitoring) {
      return;
    }

    this.isMonitoring = true;
    logger.info("Performance monitoring started", { intervalMs });

    this.monitoringInterval = setInterval(() => {
      this.collectMetrics();
    }, intervalMs);
  }

  /**
   * Stop performance monitoring
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }
    this.isMonitoring = false;
    logger.info("Performance monitoring stopped");
  }

  /**
   * Record a request/response for performance tracking
   */
  recordRequest(
    responseTime: number,
    statusCode: number,
    endpoint: string,
    userId?: string
  ): void {
    // This would be called from middleware to track individual requests
    // For now, we'll aggregate this in the collectMetrics method
  }

  /**
   * Get current performance metrics
   */
  getCurrentMetrics(): PerformanceMetrics {
    return this.metrics[this.metrics.length - 1] || this.getEmptyMetrics();
  }

  /**
   * Get performance metrics for a time range
   */
  getMetrics(timeRangeMs: number): PerformanceMetrics[] {
    const cutoffTime = Date.now() - timeRangeMs;
    return this.metrics.filter(m => m.timestamp > cutoffTime);
  }

  /**
   * Get performance summary and health status
   */
  getHealthStatus(): {
    status: "healthy" | "warning" | "critical";
    score: number; // 0-100, higher is better
    issues: string[];
    recommendations: string[];
    metrics: PerformanceMetrics;
  } {
    const metrics = this.getCurrentMetrics();
    const issues: string[] = [];
    const recommendations: string[] = [];
    let score = 100;

    // Check response time
    if (metrics.responseTime > this.thresholds.maxResponseTime) {
      issues.push(`High response time: ${metrics.responseTime}ms`);
      recommendations.push(
        "Consider implementing caching or optimizing database queries"
      );
      score -= 20;
    }

    // Check memory usage
    if (metrics.memoryUsage > this.thresholds.maxMemoryUsage) {
      issues.push(`High memory usage: ${metrics.memoryUsage}MB`);
      recommendations.push(
        "Monitor for memory leaks and consider increasing server resources"
      );
      score -= 15;
    }

    // Check CPU usage
    if (metrics.cpuUsage > this.thresholds.maxCpuUsage) {
      issues.push(`High CPU usage: ${metrics.cpuUsage}%`);
      recommendations.push(
        "Optimize CPU-intensive operations or scale horizontally"
      );
      score -= 15;
    }

    // Check error rate
    if (metrics.errorRate > this.thresholds.maxErrorRate) {
      issues.push(`High error rate: ${metrics.errorRate}%`);
      recommendations.push(
        "Investigate error sources and implement better error handling"
      );
      score -= 25;
    }

    // Check queue length
    if (metrics.queueLength > this.thresholds.maxQueueLength) {
      issues.push(`Long request queue: ${metrics.queueLength}`);
      recommendations.push(
        "Consider load balancing or increasing server capacity"
      );
      score -= 10;
    }

    // Check cache hit rate
    if (metrics.cacheHitRate < this.thresholds.minCacheHitRate) {
      issues.push(`Low cache hit rate: ${metrics.cacheHitRate}%`);
      recommendations.push("Review caching strategy and cache TTL settings");
      score -= 10;
    }

    // Check slow queries
    if (metrics.slowQueries > this.thresholds.maxSlowQueries) {
      issues.push(`High number of slow queries: ${metrics.slowQueries}`);
      recommendations.push(
        "Add database indexes and optimize query performance"
      );
      score -= 15;
    }

    // Check concurrent users (capacity planning)
    if (metrics.concurrentUsers > 10000) {
      issues.push(`Very high concurrent users: ${metrics.concurrentUsers}`);
      recommendations.push(
        "Monitor closely and prepare for horizontal scaling"
      );
      score -= 5;
    }

    let status: "healthy" | "warning" | "critical" = "healthy";
    if (score < 70) status = "critical";
    else if (score < 85) status = "warning";

    return {
      status,
      score: Math.max(0, score),
      issues,
      recommendations,
      metrics,
    };
  }

  /**
   * Export metrics for external monitoring systems
   */
  exportMetrics(): {
    prometheus: string;
    json: PerformanceMetrics[];
    summary: any;
  } {
    const metrics = this.getMetrics(3600000); // Last hour
    const summary = this.getHealthStatus();

    // Prometheus format
    const prometheus = this.generatePrometheusMetrics(metrics);

    return {
      prometheus,
      json: metrics,
      summary,
    };
  }

  // Private methods

  private async collectMetrics(): Promise<void> {
    try {
      const metrics: PerformanceMetrics = {
        timestamp: Date.now(),
        responseTime: await this.measureAverageResponseTime(),
        concurrentUsers: await this.getConcurrentUsers(),
        memoryUsage: this.getMemoryUsage(),
        cpuUsage: await this.getCpuUsage(),
        activeConnections: await this.getActiveConnections(),
        queueLength: await this.getQueueLength(),
        errorRate: await this.getErrorRate(),
        throughput: await this.getThroughput(),
        cacheHitRate: await this.getCacheHitRate(),
        databaseConnections: await this.getDatabaseConnections(),
        slowQueries: await this.getSlowQueriesCount(),
      };

      this.metrics.push(metrics);

      // Keep only last 24 hours of metrics (assuming 30s intervals = 2880 data points)
      if (this.metrics.length > 2880) {
        this.metrics = this.metrics.slice(-2880);
      }

      // Check thresholds and send alerts
      await this.checkThresholds(metrics);
    } catch (error) {
      logger.error("Error collecting performance metrics:", error);
    }
  }

  private async measureAverageResponseTime(): Promise<number> {
    // In a real implementation, this would aggregate response times from middleware
    // For now, return a mock value
    return Math.random() * 1000 + 200; // 200-1200ms
  }

  private async getConcurrentUsers(): Promise<number> {
    // In a real implementation, this would check active sessions/connections
    // For now, return a mock value
    return Math.floor(Math.random() * 5000) + 1000; // 1000-6000 users
  }

  private getMemoryUsage(): number {
    // Get Node.js memory usage
    const memUsage = process.memoryUsage();
    return Math.round(memUsage.heapUsed / 1024 / 1024); // MB
  }

  private async getCpuUsage(): Promise<number> {
    // In a real implementation, you'd use a library like pidusage
    // For now, return a mock value
    return Math.random() * 30 + 20; // 20-50%
  }

  private async getActiveConnections(): Promise<number> {
    // In a real implementation, check server connection count
    // For now, return a mock value
    return Math.floor(Math.random() * 500) + 100; // 100-600 connections
  }

  private async getQueueLength(): Promise<number> {
    // In a real implementation, check request queue length
    // For now, return a mock value
    return Math.floor(Math.random() * 50); // 0-50 queued requests
  }

  private async getErrorRate(): Promise<number> {
    // In a real implementation, calculate error rate from recent requests
    // For now, return a mock value
    return Math.random() * 2; // 0-2% error rate
  }

  private async getThroughput(): Promise<number> {
    // In a real implementation, measure RPS
    // For now, return a mock value
    return Math.floor(Math.random() * 1000) + 500; // 500-1500 RPS
  }

  private async getCacheHitRate(): Promise<number> {
    // In a real implementation, get from cache system
    // For now, return a mock value
    return Math.random() * 20 + 80; // 80-100% hit rate
  }

  private async getDatabaseConnections(): Promise<number> {
    // In a real implementation, get from database pool
    // For now, return a mock value
    return Math.floor(Math.random() * 20) + 10; // 10-30 connections
  }

  private async getSlowQueriesCount(): Promise<number> {
    // In a real implementation, count slow queries from monitoring
    // For now, return a mock value
    return Math.floor(Math.random() * 5); // 0-5 slow queries
  }

  private getEmptyMetrics(): PerformanceMetrics {
    return {
      timestamp: Date.now(),
      responseTime: 0,
      concurrentUsers: 0,
      memoryUsage: 0,
      cpuUsage: 0,
      activeConnections: 0,
      queueLength: 0,
      errorRate: 0,
      throughput: 0,
      cacheHitRate: 0,
      databaseConnections: 0,
      slowQueries: 0,
    };
  }

  private async checkThresholds(metrics: PerformanceMetrics): Promise<void> {
    if (!this.alertConfig.enabled) return;

    const alerts: Array<{
      type: string;
      message: string;
      severity: "warning" | "critical";
    }> = [];

    // Check each threshold
    if (metrics.responseTime > this.thresholds.maxResponseTime) {
      alerts.push({
        type: "high_response_time",
        message: `Response time is ${metrics.responseTime}ms (threshold: ${this.thresholds.maxResponseTime}ms)`,
        severity: "critical",
      });
    }

    if (metrics.memoryUsage > this.thresholds.maxMemoryUsage) {
      alerts.push({
        type: "high_memory_usage",
        message: `Memory usage is ${metrics.memoryUsage}MB (threshold: ${this.thresholds.maxMemoryUsage}MB)`,
        severity: "warning",
      });
    }

    if (metrics.errorRate > this.thresholds.maxErrorRate) {
      alerts.push({
        type: "high_error_rate",
        message: `Error rate is ${metrics.errorRate}% (threshold: ${this.thresholds.maxErrorRate}%)`,
        severity: "critical",
      });
    }

    // Send alerts
    for (const alert of alerts) {
      await this.sendAlert(alert);
    }
  }

  private async sendAlert(alert: {
    type: string;
    message: string;
    severity: "warning" | "critical";
  }): Promise<void> {
    const now = Date.now();
    const lastAlert = this.lastAlertTime.get(alert.type) || 0;

    if (now - lastAlert < this.alertConfig.cooldownPeriod) {
      return; // Cooldown period not elapsed
    }

    this.lastAlertTime.set(alert.type, now);

    logger.warn("Performance alert triggered", alert);

    // Send alerts to configured channels
    const promises = this.alertConfig.notificationChannels.map(channel =>
      this.sendAlertToChannel(channel, alert)
    );

    await Promise.allSettled(promises);
  }

  private async sendAlertToChannel(
    channel: string,
    alert: { type: string; message: string; severity: "warning" | "critical" }
  ): Promise<void> {
    try {
      switch (channel) {
        case "email":
          if (this.alertConfig.alertEmails?.length) {
            await this.sendEmailAlert(alert);
          }
          break;

        case "slack":
          if (this.alertConfig.webhookUrl) {
            await this.sendSlackAlert(alert);
          }
          break;

        case "webhook":
          if (this.alertConfig.webhookUrl) {
            await this.sendWebhookAlert(alert);
          }
          break;
      }
    } catch (error) {
      logger.error(`Failed to send alert to ${channel}:`, error);
    }
  }

  private async sendEmailAlert(alert: any): Promise<void> {
    // In a real implementation, send email alert
    logger.info("Email alert would be sent", {
      alert,
      emails: this.alertConfig.alertEmails,
    });
  }

  private async sendSlackAlert(alert: any): Promise<void> {
    if (!this.alertConfig.webhookUrl) return;

    const payload = {
      text: `🚨 Performance Alert: ${alert.message}`,
      attachments: [
        {
          color: alert.severity === "critical" ? "danger" : "warning",
          fields: [
            { title: "Type", value: alert.type, short: true },
            { title: "Severity", value: alert.severity, short: true },
            { title: "Time", value: new Date().toISOString(), short: true },
          ],
        },
      ],
    };

    await fetch(this.alertConfig.webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  }

  private async sendWebhookAlert(alert: any): Promise<void> {
    if (!this.alertConfig.webhookUrl) return;

    await fetch(this.alertConfig.webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: "performance_alert",
        alert,
        timestamp: new Date().toISOString(),
      }),
    });
  }

  private generatePrometheusMetrics(metrics: PerformanceMetrics[]): string {
    let prometheusMetrics = "";

    metrics.forEach(metric => {
      const timestamp = Math.floor(metric.timestamp / 1000);

      prometheusMetrics += `# HELP response_time_ms Average response time in milliseconds\n`;
      prometheusMetrics += `# TYPE response_time_ms gauge\n`;
      prometheusMetrics += `response_time_ms ${metric.responseTime} ${timestamp}\n\n`;

      prometheusMetrics += `# HELP concurrent_users Number of concurrent users\n`;
      prometheusMetrics += `# TYPE concurrent_users gauge\n`;
      prometheusMetrics += `concurrent_users ${metric.concurrentUsers} ${timestamp}\n\n`;

      prometheusMetrics += `# HELP memory_usage_mb Memory usage in MB\n`;
      prometheusMetrics += `# TYPE memory_usage_mb gauge\n`;
      prometheusMetrics += `memory_usage_mb ${metric.memoryUsage} ${timestamp}\n\n`;

      // Add more metrics as needed
    });

    return prometheusMetrics;
  }
}

// Singleton instance
let monitorInstance: PerformanceMonitor | null = null;

/**
 * Get the global performance monitor instance
 */
export function getPerformanceMonitor(): PerformanceMonitor {
  if (!monitorInstance) {
    monitorInstance = new PerformanceMonitor();
  }

  return monitorInstance;
}
