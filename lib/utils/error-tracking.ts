export interface ErrorEvent {
  id: string;
  timestamp: string;
  type:
    | "api"
    | "client"
    | "network"
    | "validation"
    | "authentication"
    | "authorization";
  severity: "low" | "medium" | "high" | "critical";
  message: string;
  stack?: string;
  url: string;
  userAgent: string;
  userId?: string;
  sessionId?: string;
  metadata: {
    endpoint?: string;
    method?: string;
    statusCode?: number;
    responseTime?: number;
    requestId?: string;
    errorCode?: string;
    context?: Record<string, any>;
  };
}

export interface ErrorReport {
  totalErrors: number;
  errorsByType: Record<string, number>;
  errorsBySeverity: Record<string, number>;
  recentErrors: ErrorEvent[];
  criticalErrors: ErrorEvent[];
  averageResponseTime: number;
  errorRate: number;
  uptime: number;
}

export interface ErrorTrackingConfig {
  enabled: boolean;
  endpoint: string;
  batchSize: number;
  flushInterval: number;
  maxRetries: number;
  includeStackTraces: boolean;
  includeUserData: boolean;
  severityThreshold: "low" | "medium" | "high" | "critical";
}

class ErrorTracker {
  private errors: ErrorEvent[] = [];
  private config: ErrorTrackingConfig;
  private flushTimer: NodeJS.Timeout | null = null;
  private isFlushing = false;

  constructor(config: Partial<ErrorTrackingConfig> = {}) {
    this.config = {
      enabled: true,
      endpoint: "/api/analytics/errors",
      batchSize: 10,
      flushInterval: 30000, // 30 seconds
      maxRetries: 3,
      includeStackTraces: true,
      includeUserData: false,
      severityThreshold: "low",
      ...config,
    };

    if (this.config.enabled) {
      this.startPeriodicFlush();
    }
  }

  /**
   * Track an API error
   */
  trackApiError(
    error: Error | string,
    context: {
      endpoint: string;
      method: string;
      statusCode?: number;
      responseTime?: number;
      requestId?: string;
      userId?: string;
      sessionId?: string;
    }
  ): void {
    if (!this.config.enabled) return;

    const errorEvent: ErrorEvent = {
      id: this.generateErrorId(),
      timestamp: new Date().toISOString(),
      type: "api",
      severity: this.determineSeverity(context.statusCode || 500),
      message: typeof error === "string" ? error : error.message,
      stack:
        this.config.includeStackTraces && error instanceof Error
          ? error.stack
          : undefined,
      url: typeof window !== "undefined" ? window.location.href : "",
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
      userId: context.userId,
      sessionId: context.sessionId,
      metadata: {
        endpoint: context.endpoint,
        method: context.method,
        statusCode: context.statusCode,
        responseTime: context.responseTime,
        requestId: context.requestId,
        errorCode: this.extractErrorCode(error),
        context: this.sanitizeContext(context),
      },
    };

    this.addError(errorEvent);
  }

  /**
   * Track a client-side error
   */
  trackClientError(
    error: Error | string,
    context: {
      component?: string;
      action?: string;
      userId?: string;
      sessionId?: string;
    } = {}
  ): void {
    if (!this.config.enabled) return;

    const errorEvent: ErrorEvent = {
      id: this.generateErrorId(),
      timestamp: new Date().toISOString(),
      type: "client",
      severity: "medium",
      message: typeof error === "string" ? error : error.message,
      stack:
        this.config.includeStackTraces && error instanceof Error
          ? error.stack
          : undefined,
      url: typeof window !== "undefined" ? window.location.href : "",
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
      userId: context.userId,
      sessionId: context.sessionId,
      metadata: {
        errorCode: this.extractErrorCode(error),
        context: {
          component: context.component,
          action: context.action,
          ...this.sanitizeContext(context),
        },
      },
    };

    this.addError(errorEvent);
  }

  /**
   * Track a network error
   */
  trackNetworkError(
    error: Error | string,
    context: {
      endpoint?: string;
      method?: string;
      userId?: string;
      sessionId?: string;
    } = {}
  ): void {
    if (!this.config.enabled) return;

    const errorEvent: ErrorEvent = {
      id: this.generateErrorId(),
      timestamp: new Date().toISOString(),
      type: "network",
      severity: "high",
      message: typeof error === "string" ? error : error.message,
      stack:
        this.config.includeStackTraces && error instanceof Error
          ? error.stack
          : undefined,
      url: typeof window !== "undefined" ? window.location.href : "",
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
      userId: context.userId,
      sessionId: context.sessionId,
      metadata: {
        endpoint: context.endpoint,
        method: context.method,
        errorCode: this.extractErrorCode(error),
        context: this.sanitizeContext(context),
      },
    };

    this.addError(errorEvent);
  }

  /**
   * Track a validation error
   */
  trackValidationError(
    error: Error | string,
    context: {
      field?: string;
      value?: any;
      schema?: string;
      userId?: string;
      sessionId?: string;
    } = {}
  ): void {
    if (!this.config.enabled) return;

    const errorEvent: ErrorEvent = {
      id: this.generateErrorId(),
      timestamp: new Date().toISOString(),
      type: "validation",
      severity: "low",
      message: typeof error === "string" ? error : error.message,
      stack:
        this.config.includeStackTraces && error instanceof Error
          ? error.stack
          : undefined,
      url: typeof window !== "undefined" ? window.location.href : "",
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
      userId: context.userId,
      sessionId: context.sessionId,
      metadata: {
        errorCode: this.extractErrorCode(error),
        context: {
          field: context.field,
          schema: context.schema,
          ...this.sanitizeContext(context),
        },
      },
    };

    this.addError(errorEvent);
  }

  /**
   * Track an authentication error
   */
  trackAuthError(
    error: Error | string,
    context: {
      action?: string;
      userId?: string;
      sessionId?: string;
    } = {}
  ): void {
    if (!this.config.enabled) return;

    const errorEvent: ErrorEvent = {
      id: this.generateErrorId(),
      timestamp: new Date().toISOString(),
      type: "authentication",
      severity: "high",
      message: typeof error === "string" ? error : error.message,
      stack:
        this.config.includeStackTraces && error instanceof Error
          ? error.stack
          : undefined,
      url: typeof window !== "undefined" ? window.location.href : "",
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
      userId: context.userId,
      sessionId: context.sessionId,
      metadata: {
        errorCode: this.extractErrorCode(error),
        context: {
          action: context.action,
          ...this.sanitizeContext(context),
        },
      },
    };

    this.addError(errorEvent);
  }

  /**
   * Track an authorization error
   */
  trackAuthzError(
    error: Error | string,
    context: {
      resource?: string;
      action?: string;
      userId?: string;
      sessionId?: string;
    } = {}
  ): void {
    if (!this.config.enabled) return;

    const errorEvent: ErrorEvent = {
      id: this.generateErrorId(),
      timestamp: new Date().toISOString(),
      type: "authorization",
      severity: "high",
      message: typeof error === "string" ? error : error.message,
      stack:
        this.config.includeStackTraces && error instanceof Error
          ? error.stack
          : undefined,
      url: typeof window !== "undefined" ? window.location.href : "",
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
      userId: context.userId,
      sessionId: context.sessionId,
      metadata: {
        errorCode: this.extractErrorCode(error),
        context: {
          resource: context.resource,
          action: context.action,
          ...this.sanitizeContext(context),
        },
      },
    };

    this.addError(errorEvent);
  }

  /**
   * Get error statistics
   */
  getErrorReport(): ErrorReport {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const recentErrors = this.errors.filter(
      e => new Date(e.timestamp) > oneHourAgo
    );
    const criticalErrors = this.errors.filter(e => e.severity === "critical");

    const errorsByType = this.errors.reduce(
      (acc, error) => {
        acc[error.type] = (acc[error.type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const errorsBySeverity = this.errors.reduce(
      (acc, error) => {
        acc[error.severity] = (acc[error.severity] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const apiErrors = this.errors.filter(e => e.type === "api");
    const averageResponseTime =
      apiErrors.length > 0
        ? apiErrors.reduce(
            (sum, e) => sum + (e.metadata.responseTime || 0),
            0
          ) / apiErrors.length
        : 0;

    const totalRequests = this.errors.length + recentErrors.length; // Simplified
    const errorRate =
      totalRequests > 0 ? (this.errors.length / totalRequests) * 100 : 0;

    return {
      totalErrors: this.errors.length,
      errorsByType,
      errorsBySeverity,
      recentErrors,
      criticalErrors,
      averageResponseTime,
      errorRate,
      uptime: 100 - errorRate, // Simplified uptime calculation
    };
  }

  /**
   * Clear all errors
   */
  clearErrors(): void {
    this.errors = [];
  }

  /**
   * Force flush errors to server
   */
  async flushErrors(): Promise<void> {
    if (this.isFlushing || this.errors.length === 0) return;

    this.isFlushing = true;
    const errorsToSend = this.errors.splice(0, this.config.batchSize);

    try {
      await this.sendErrorsToServer(errorsToSend);
    } catch (error) {
      // Re-add errors to queue if sending failed
      this.errors.unshift(...errorsToSend);
      console.error("Failed to send errors to server:", error);
    } finally {
      this.isFlushing = false;
    }
  }

  private addError(error: ErrorEvent): void {
    // Check severity threshold
    const severityLevels = { low: 0, medium: 1, high: 2, critical: 3 };
    const thresholdLevel = severityLevels[this.config.severityThreshold];
    const errorLevel = severityLevels[error.severity];

    if (errorLevel >= thresholdLevel) {
      this.errors.push(error);

      // Flush immediately for critical errors
      if (error.severity === "critical") {
        this.flushErrors();
      }

      // Flush if batch size reached
      if (this.errors.length >= this.config.batchSize) {
        this.flushErrors();
      }
    }
  }

  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private determineSeverity(
    statusCode: number
  ): "low" | "medium" | "high" | "critical" {
    if (statusCode >= 500) return "critical";
    if (statusCode >= 400) return "high";
    if (statusCode >= 300) return "medium";
    return "low";
  }

  private extractErrorCode(error: Error | string): string {
    if (error instanceof Error) {
      // Try to extract error code from common patterns
      const codeMatch = error.message.match(/\[([A-Z_]+)\]/);
      return codeMatch ? codeMatch[1] : "UNKNOWN_ERROR";
    }
    return "STRING_ERROR";
  }

  private sanitizeContext(context: any): Record<string, any> {
    if (!this.config.includeUserData) {
      const { userId, sessionId, ...sanitized } = context;
      return sanitized;
    }
    return context;
  }

  private startPeriodicFlush(): void {
    this.flushTimer = setInterval(() => {
      this.flushErrors();
    }, this.config.flushInterval);
  }

  private async sendErrorsToServer(errors: ErrorEvent[]): Promise<void> {
    let retries = 0;

    while (retries < this.config.maxRetries) {
      try {
        const response = await fetch(this.config.endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ errors }),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return; // Success
      } catch (error) {
        retries++;
        if (retries >= this.config.maxRetries) {
          throw error;
        }

        // Exponential backoff
        await new Promise(resolve =>
          setTimeout(resolve, Math.pow(2, retries) * 1000)
        );
      }
    }
  }
}

// Global error tracker instance
export const errorTracker = new ErrorTracker();

// Global error handlers
if (typeof window !== "undefined") {
  // Handle unhandled promise rejections
  window.addEventListener("unhandledrejection", event => {
    errorTracker.trackClientError(
      new Error(event.reason?.message || "Unhandled Promise Rejection"),
      { action: "unhandledrejection" }
    );
  });

  // Handle global errors
  window.addEventListener("error", event => {
    errorTracker.trackClientError(new Error(event.message || "Global Error"), {
      action: "global_error",
      context: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      },
    });
  });
}

// Export convenience functions
export const trackApiError = (error: Error | string, context: any) =>
  errorTracker.trackApiError(error, context);

export const trackClientError = (error: Error | string, context?: any) =>
  errorTracker.trackClientError(error, context);

export const trackNetworkError = (error: Error | string, context?: any) =>
  errorTracker.trackNetworkError(error, context);

export const trackValidationError = (error: Error | string, context?: any) =>
  errorTracker.trackValidationError(error, context);

export const trackAuthError = (error: Error | string, context?: any) =>
  errorTracker.trackAuthError(error, context);

export const trackAuthzError = (error: Error | string, context?: any) =>
  errorTracker.trackAuthzError(error, context);

export const getErrorReport = () => errorTracker.getErrorReport();
export const clearErrors = () => errorTracker.clearErrors();
export const flushErrors = () => errorTracker.flushErrors();
