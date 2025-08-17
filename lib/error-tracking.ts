/**
 * Error tracking integration that combines structured logging with Sentry
 */

import * as Sentry from "@sentry/nextjs";

import { logger, type LogContext } from "./logger";

// Error severity levels
export type ErrorSeverity = "low" | "normal" | "high" | "critical";

// Enhanced error context
export interface ErrorContext extends LogContext {
  severity?: ErrorSeverity;
  userId?: string;
  sessionId?: string;
  fingerprint?: string[];
  tags?: Record<string, string>;
  extra?: Record<string, any>;
}

/**
 * Enhanced error tracking that integrates with both logger and Sentry
 */
export class ErrorTracker {
  /**
   * Track an error with enhanced context
   */
  static captureError(error: Error | string, context?: ErrorContext) {
    const errorMessage = typeof error === "string" ? error : error.message;
    const isErrorObject = error instanceof Error;

    // Always log to our structured logger first
    logger.error(errorMessage, isErrorObject ? error : undefined, context);

    // Send to Sentry if available and enabled
    if (
      process.env.NODE_ENV === "production" ||
      process.env.VERCEL_ENV === "preview"
    ) {
      Sentry.withScope(scope => {
        // Set user context
        if (context?.userId) {
          scope.setUser({ id: context.userId });
        }

        // Set tags
        if (context?.tags) {
          Object.entries(context.tags).forEach(([key, value]) => {
            scope.setTag(key, value);
          });
        }

        // Set additional context
        if (context?.extra) {
          Object.entries(context.extra).forEach(([key, value]) => {
            scope.setExtra(key, value);
          });
        }

        // Set severity level
        if (context?.severity) {
          const sentryLevel = this.mapSeverityToSentryLevel(context.severity);
          scope.setLevel(sentryLevel);
        }

        // Set fingerprint for grouping
        if (context?.fingerprint) {
          scope.setFingerprint(context.fingerprint);
        }

        // Set context information
        if (context?.component) {
          scope.setTag("component", context.component);
        }

        if (context?.operation) {
          scope.setTag("operation", context.operation);
        }

        // Capture the error
        if (isErrorObject) {
          Sentry.captureException(error);
        } else {
          Sentry.captureMessage(error, "error");
        }
      });
    }
  }

  /**
   * Track API errors with request context
   */
  static captureAPIError(
    error: Error | string,
    request: {
      method?: string;
      url?: string;
      statusCode?: number;
      userId?: string;
    },
    context?: ErrorContext
  ) {
    const apiContext: ErrorContext = {
      ...context,
      component: "api",
      request: {
        method: request.method,
        url: request.url,
        userId: request.userId,
      },
      tags: {
        ...context?.tags,
        api_method: request.method || "unknown",
        status_code: request.statusCode?.toString() || "unknown",
      },
      extra: {
        ...context?.extra,
        statusCode: request.statusCode,
      },
    };

    this.captureError(error, apiContext);
  }

  /**
   * Map our severity levels to Sentry levels
   */
  private static mapSeverityToSentryLevel(
    severity: ErrorSeverity
  ): Sentry.SeverityLevel {
    switch (severity) {
      case "low":
        return "info";
      case "normal":
        return "warning";
      case "high":
        return "error";
      case "critical":
        return "fatal";
      default:
        return "error";
    }
  }
}

// Convenience functions for common error patterns
export const trackError = ErrorTracker.captureError;
export const trackAPIError = ErrorTracker.captureAPIError;
