/**
 * Application monitoring for uptime, performance, and metrics tracking
 */

import { ErrorTracker } from "./error-tracking";
import { logger } from "./logger";

// Performance thresholds (in milliseconds)
const PERFORMANCE_THRESHOLDS = {
  api: {
    fast: 100,
    acceptable: 500,
    slow: 1000,
  },
  database: {
    fast: 50,
    acceptable: 200,
    slow: 1000,
  },
  page: {
    fast: 1000,
    acceptable: 3000,
    slow: 5000,
  },
} as const;

// Metric types
export interface PerformanceMetric {
  operation: string;
  duration: number;
  timestamp: number;
  context?: Record<string, any>;
  threshold?: number;
}

export interface UptimeCheck {
  service: string;
  status: "healthy" | "degraded" | "down";
  responseTime?: number;
  timestamp: number;
  error?: string;
}

/**
 * Application monitoring class
 */
class AppMonitorClass {
  private static instance: AppMonitorClass;
  private metrics: PerformanceMetric[] = [];
  private uptimeChecks: UptimeCheck[] = [];
  private startTime: number = Date.now();

  constructor() {
    this.startPeriodicChecks();
  }

  static getInstance(): AppMonitorClass {
    if (!this.instance) {
      this.instance = new AppMonitorClass();
    }
    return this.instance;
  }

  /**
   * Track performance metric
   */
  trackPerformance(
    operation: string,
    duration: number,
    context?: Record<string, any>
  ) {
    const metric: PerformanceMetric = {
      operation,
      duration,
      timestamp: Date.now(),
      context,
    };

    // Add to metrics array (keep last 1000 metrics)
    this.metrics.push(metric);
    if (this.metrics.length > 1000) {
      this.metrics.shift();
    }

    // Determine threshold based on operation type
    let threshold: number;
    if (operation.includes("api") || operation.includes("route")) {
      threshold = PERFORMANCE_THRESHOLDS.api.slow;
    } else if (operation.includes("db") || operation.includes("database")) {
      threshold = PERFORMANCE_THRESHOLDS.database.slow;
    } else {
      threshold = PERFORMANCE_THRESHOLDS.page.slow;
    }

    // Log performance metric
    logger.metrics.performance(operation, duration, context);

    // Alert on slow operations
    if (duration > threshold) {
      ErrorTracker.captureError(`Slow operation detected: ${operation}`, {
        severity: "normal",
        operation,
        tags: {
          performance_issue: "slow_operation",
          operation_type: this.getOperationType(operation),
        },
        extra: {
          duration,
          threshold,
          overage: duration - threshold,
          ...context,
        },
      });
    }

    return metric;
  }

  /**
   * Track API endpoint performance
   */
  trackAPIPerformance(
    method: string,
    path: string,
    duration: number,
    statusCode: number,
    context?: Record<string, any>
  ) {
    const operation = `api-${method.toLowerCase()}-${path}`;

    const apiContext = {
      ...context,
      method,
      path,
      statusCode,
      component: "api",
    };

    this.trackPerformance(operation, duration, apiContext);

    // Track error rates
    if (statusCode >= 400) {
      logger.metrics.counter("api_errors", 1, {
        method,
        path,
        status_code: statusCode.toString(),
      });
    } else {
      logger.metrics.counter("api_success", 1, {
        method,
        path,
        status_code: statusCode.toString(),
      });
    }
  }

  /**
   * Get uptime percentage
   */
  getUptimePercentage(): number {
    if (this.uptimeChecks.length === 0) return 100;

    const healthyChecks = this.uptimeChecks.filter(
      check => check.status === "healthy"
    ).length;
    return (healthyChecks / this.uptimeChecks.length) * 100;
  }

  /**
   * Get application runtime
   */
  getUptime(): number {
    return Date.now() - this.startTime;
  }

  /**
   * Start periodic monitoring checks
   */
  private startPeriodicChecks() {
    // Only run periodic checks in production or if explicitly enabled
    if (
      process.env.NODE_ENV !== "production" &&
      !process.env.ENABLE_MONITORING
    ) {
      return;
    }

    // Log application start
    logger.app.startup(
      process.env.PORT ? parseInt(process.env.PORT) : undefined,
      process.env.NODE_ENV
    );
  }

  /**
   * Get operation type for categorization
   */
  private getOperationType(operation: string): string {
    if (operation.includes("api")) return "api";
    if (operation.includes("db") || operation.includes("database"))
      return "database";
    if (operation.includes("auth")) return "authentication";
    if (operation.includes("payment")) return "payment";
    return "general";
  }
}

// Performance timing helpers
export class PerformanceTimer {
  private startTime: number;
  private operation: string;

  constructor(operation: string) {
    this.operation = operation;
    this.startTime = Date.now();
  }

  finish(context?: Record<string, any>): number {
    const duration = Date.now() - this.startTime;
    monitor.trackPerformance(this.operation, duration, context);
    return duration;
  }
}

// Convenience functions
export const monitor = AppMonitorClass.getInstance();

export function timeOperation(operation: string) {
  return new PerformanceTimer(operation);
}

export function trackAPI(
  method: string,
  path: string,
  duration: number,
  statusCode: number,
  context?: Record<string, any>
) {
  return monitor.trackAPIPerformance(
    method,
    path,
    duration,
    statusCode,
    context
  );
}
