/**
 * Enhanced structured logger using Pino for high-performance logging
 */

import pino from "pino";

type LogLevel = "debug" | "info" | "warn" | "error";

// Set minimum log level based on environment
const DEFAULT_LOG_LEVEL: LogLevel =
  process.env.NODE_ENV === "production" ? "info" : "debug";

// Values that should be redacted in logs
const SENSITIVE_KEYS = [
  "password",
  "token",
  "secret",
  "key",
  "auth",
  "cookie",
  "session",
  "email",
  "address",
  "phone",
  "credit",
  "card",
  "cvv",
  "ssn",
  "apikey",
  "authorization",
  "bearer",
];

// Check if we should disable Pino (for worker thread issues)
const shouldDisablePino =
  process.env.DISABLE_PINO === "true" ||
  (process.env.NODE_ENV === "development" &&
    process.env.ENABLE_PINO !== "true");

// Create Pino logger instance or fallback console logger
const pinoLogger = !shouldDisablePino
  ? pino({
      level: process.env.LOG_LEVEL || DEFAULT_LOG_LEVEL,

      // Production configuration
      ...(process.env.NODE_ENV === "production"
        ? {
            // Structured logging for production
            formatters: {
              level: label => ({ level: label }),
            },
            timestamp: pino.stdTimeFunctions.isoTime,
            redact: {
              paths: SENSITIVE_KEYS,
              censor: "[REDACTED]",
            },
          }
        : {
            // Pretty printing for development
            transport: {
              target: "pino-pretty",
              options: {
                colorize: true,
                translateTime: "SYS:standard",
                ignore: "pid,hostname",
                singleLine: false,
                hideObject: false,
              },
            },
            redact: {
              paths: SENSITIVE_KEYS,
              censor: "[REDACTED]",
            },
          }),

      // Base context
      base: {
        pid: process.pid,
        hostname: process.env.HOSTNAME || "unknown",
        env: process.env.NODE_ENV || "development",
        service: "stem-toys-ecommerce",
        version: process.env.npm_package_version || "1.0.0",
      },
    })
  : {
      // Fallback console logger to avoid worker thread issues
      debug: (data: any, message: string) =>
        console.debug(`[DEBUG] ${message}`, data),
      info: (data: any, message: string) =>
        console.log(`[INFO] ${message}`, data),
      warn: (data: any, message: string) =>
        console.warn(`[WARN] ${message}`, data),
      error: (data: any, message: string) =>
        console.error(`[ERROR] ${message}`, data),
      child: () => pinoLogger, // Return self for child loggers
    };

/**
 * Enhanced sanitize function with more thorough checks
 */
function sanitizeData(data: any): any {
  if (!data) return data;

  // Handle primitive values
  if (typeof data !== "object") return data;

  // Handle arrays
  if (Array.isArray(data)) {
    return data.map(item => sanitizeData(item));
  }

  // Handle objects
  const sanitized = { ...data };

  for (const key in sanitized) {
    const lowerKey = key.toLowerCase();

    // Check if this key contains sensitive information
    const isSensitive = SENSITIVE_KEYS.some(sensitiveKey =>
      lowerKey.includes(sensitiveKey)
    );

    if (isSensitive) {
      // Redact sensitive values but preserve type information
      if (typeof sanitized[key] === "string") {
        sanitized[key] = "[REDACTED]";
      } else if (typeof sanitized[key] === "number") {
        sanitized[key] = 0;
      } else if (
        typeof sanitized[key] === "object" &&
        sanitized[key] !== null
      ) {
        sanitized[key] = "[REDACTED_OBJECT]";
      }
    } else if (typeof sanitized[key] === "object" && sanitized[key] !== null) {
      // Recursively sanitize nested objects
      sanitized[key] = sanitizeData(sanitized[key]);
    }
  }

  return sanitized;
}

// Performance and request tracking
interface RequestContext {
  requestId?: string;
  userId?: string;
  userAgent?: string;
  ip?: string;
  method?: string;
  url?: string;
  duration?: number;
}

interface LogContext {
  request?: RequestContext;
  component?: string;
  operation?: string;
  [key: string]: any;
}

/**
 * Enhanced logger interface with structured logging and context support
 */
const loggerInstance = {
  /**
   * Create a child logger with additional context
   */
  child: (context: LogContext) => {
    const childLogger = pinoLogger.child(sanitizeData(context));

    return {
      debug: (message: string, data?: any) => {
        childLogger.debug(sanitizeData(data), message);
      },

      info: (message: string, data?: any) => {
        childLogger.info(sanitizeData(data), message);
      },

      warn: (message: string, data?: any) => {
        childLogger.warn(sanitizeData(data), message);
      },

      error: (message: string, error?: any, additionalData?: any) => {
        const errorData = {
          ...sanitizeData(additionalData),
          error:
            error instanceof Error
              ? {
                  name: error.name,
                  message: error.message,
                  stack:
                    process.env.NODE_ENV !== "production"
                      ? error.stack
                      : undefined,
                }
              : error,
        };

        childLogger.error(errorData, message);
      },
    };
  },

  /**
   * Debug level logging
   */
  debug: (message: string, data?: any) => {
    pinoLogger.debug(sanitizeData(data), message);
  },

  /**
   * Info level logging
   */
  info: (message: string, data?: any) => {
    pinoLogger.info(sanitizeData(data), message);
  },

  /**
   * Warning level logging
   */
  warn: (message: string, data?: any) => {
    pinoLogger.warn(sanitizeData(data), message);
  },

  /**
   * Error level logging with enhanced error handling
   */
  error: (message: string, error?: any, additionalData?: any) => {
    const errorData = {
      ...sanitizeData(additionalData),
      error:
        error instanceof Error
          ? {
              name: error.name,
              message: error.message,
              stack:
                process.env.NODE_ENV !== "production" ? error.stack : undefined,
              code: (error as any).code,
              statusCode: (error as any).statusCode,
            }
          : error,
    };

    pinoLogger.error(errorData, message);
  },

  /**
   * HTTP request logging
   */
  http: {
    request: (req: any, context?: LogContext) => {
      const requestData = {
        ...context,
        request: {
          method: req.method,
          url: req.url,
          userAgent: req.headers?.["user-agent"],
          ip: req.headers?.["x-forwarded-for"] || req.ip,
          requestId:
            req.headers?.["x-request-id"] || context?.request?.requestId,
        },
      };

      pinoLogger.info(sanitizeData(requestData), "HTTP Request");
    },

    response: (req: any, res: any, duration: number, context?: LogContext) => {
      const responseData = {
        ...context,
        request: {
          method: req.method,
          url: req.url,
          requestId:
            req.headers?.["x-request-id"] || context?.request?.requestId,
        },
        response: {
          statusCode: res.statusCode,
          duration,
          contentLength: res.get?.("content-length"),
        },
      };

      const level = res.statusCode >= 400 ? "warn" : "info";
      pinoLogger[level](sanitizeData(responseData), "HTTP Response");
    },
  },

  /**
   * Database operation logging
   */
  db: {
    query: (query: string, duration?: number, context?: LogContext) => {
      pinoLogger.debug(
        sanitizeData({
          ...context,
          database: {
            query: query.substring(0, 500), // Truncate long queries
            duration,
          },
        }),
        "Database Query"
      );
    },

    error: (query: string, error: any, context?: LogContext) => {
      loggerInstance.error("Database Query Failed", error, {
        ...context,
        database: {
          query: query.substring(0, 500),
        },
      });
    },
  },

  /**
   * Business logic and application events
   */
  app: {
    startup: (port?: number, env?: string) => {
      pinoLogger.info(
        {
          application: {
            port,
            environment: env || process.env.NODE_ENV,
            startup: true,
          },
        },
        "Application Started"
      );
    },

    shutdown: (reason?: string) => {
      pinoLogger.info(
        {
          application: {
            shutdown: true,
            reason,
          },
        },
        "Application Shutdown"
      );
    },
  },

  /**
   * Performance and metrics logging
   */
  metrics: {
    performance: (
      operation: string,
      duration: number,
      context?: LogContext
    ) => {
      pinoLogger.info(
        sanitizeData({
          ...context,
          performance: {
            operation,
            duration,
            timestamp: Date.now(),
          },
        }),
        "Performance Metric"
      );
    },

    counter: (metric: string, value: number, tags?: Record<string, string>) => {
      pinoLogger.info(
        sanitizeData({
          metrics: {
            type: "counter",
            name: metric,
            value,
            tags,
          },
        }),
        "Counter Metric"
      );
    },
  },
};

// Import safe logger wrapper
import { createSafeLogger } from "./logger-safe";

// Create wrapped logger for safe usage in environments with worker thread issues
const safeLogger = createSafeLogger({
  ...loggerInstance,
  // Expose the original pino logger methods that the safe wrapper expects
  debug: (message: string, data?: any) => loggerInstance.debug(message, data),
  info: (message: string, data?: any) => loggerInstance.info(message, data),
  warn: (message: string, data?: any) => loggerInstance.warn(message, data),
  error: (message: string, error?: any, additionalData?: any) =>
    loggerInstance.error(message, error, additionalData),
  trace: () => {}, // Add trace method for compatibility
  fatal: (message: string, error?: any) =>
    loggerInstance.error(`[FATAL] ${message}`, error),
});

// Export the safe logger
export { safeLogger as logger };

// Export types for use in other modules
export type { LogContext, RequestContext };
