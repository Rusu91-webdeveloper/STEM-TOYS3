/**
 * Safe logger wrapper that prevents worker thread crashes
 */

const isDevelopment = process.env.NODE_ENV === "development";

// Detect if we're in a worker thread context or if pino is having issues
const isWorkerThread =
  typeof process !== "undefined" &&
  ((process.env && process.env.NODE_UNIQUE_ID) ||
    (typeof window === "undefined" &&
      typeof global !== "undefined" &&
      (global as any).Worker));

// Simple console-based logger for development when pino fails
const fallbackLogger = {
  info: (...args: any[]) => console.log("[INFO]", ...args),
  warn: (...args: any[]) => console.warn("[WARN]", ...args),
  error: (...args: any[]) => console.error("[ERROR]", ...args),
  debug: (...args: any[]) => isDevelopment && console.debug("[DEBUG]", ...args),
  trace: (...args: any[]) => isDevelopment && console.trace("[TRACE]", ...args),
  fatal: (...args: any[]) => console.error("[FATAL]", ...args),
};

// Wrap logger methods to catch worker thread errors
export function createSafeLogger(originalLogger: any) {
  const safeLogger: any = {};

  // Wrap each logging method
  ["info", "warn", "error", "debug", "trace", "fatal"].forEach(level => {
    safeLogger[level] = (...args: any[]) => {
      try {
        // Skip pino in worker threads or when it's causing issues
        if (isWorkerThread || (globalThis as any).__pinoDisabled) {
          return fallbackLogger[level as keyof typeof fallbackLogger](...args);
        }

        // Try to use the original logger
        if (originalLogger && typeof originalLogger[level] === "function") {
          return originalLogger[level](...args);
        }

        // Fallback to console
        return fallbackLogger[level as keyof typeof fallbackLogger](...args);
      } catch (error) {
        // If pino crashes, disable it and use fallback
        if (
          error instanceof Error &&
          (error.message.includes("worker") ||
            error.message.includes("thread") ||
            error.message.includes("ENOENT") ||
            (error as any).code === "MODULE_NOT_FOUND")
        ) {
          (globalThis as any).__pinoDisabled = true;
          if (isDevelopment) {
            console.warn(
              `[SAFE-LOGGER] Disabled pino due to error: ${error.message}`
            );
          }
          return fallbackLogger[level as keyof typeof fallbackLogger](...args);
        }

        // For other errors, just use console
        if (isDevelopment) {
          console.error(`[SAFE-LOGGER] Logger error in ${level}:`, error);
        }
        return fallbackLogger[level as keyof typeof fallbackLogger](...args);
      }
    };
  });

  // Add nested logger objects
  safeLogger.app = createSafeLoggerCategory(originalLogger?.app, "APP");
  safeLogger.db = createSafeLoggerCategory(originalLogger?.db, "DB");
  safeLogger.auth = createSafeLoggerCategory(originalLogger?.auth, "AUTH");
  safeLogger.api = createSafeLoggerCategory(originalLogger?.api, "API");
  safeLogger.metrics = createSafeLoggerCategory(
    originalLogger?.metrics,
    "METRICS"
  );

  return safeLogger;
}

// Create safe logger category
function createSafeLoggerCategory(originalCategory: any, prefix: string) {
  return {
    info: (...args: any[]) =>
      safeLog(originalCategory?.info, "info", prefix, args),
    warn: (...args: any[]) =>
      safeLog(originalCategory?.warn, "warn", prefix, args),
    error: (...args: any[]) =>
      safeLog(originalCategory?.error, "error", prefix, args),
    debug: (...args: any[]) =>
      safeLog(originalCategory?.debug, "debug", prefix, args),
    success: (...args: any[]) =>
      safeLog(originalCategory?.success, "info", prefix, args),
    startup: (...args: any[]) =>
      safeLog(originalCategory?.startup, "info", prefix, args),
    shutdown: (...args: any[]) =>
      safeLog(originalCategory?.shutdown, "info", prefix, args),
    request: (...args: any[]) =>
      safeLog(originalCategory?.request, "info", prefix, args),
    response: (...args: any[]) =>
      safeLog(originalCategory?.response, "info", prefix, args),
    unauthorized: (...args: any[]) =>
      safeLog(originalCategory?.unauthorized, "warn", prefix, args),
    rateLimit: (...args: any[]) =>
      safeLog(originalCategory?.rateLimit, "warn", prefix, args),
    performance: (...args: any[]) =>
      safeLog(originalCategory?.performance, "info", prefix, args),
    counter: (...args: any[]) =>
      safeLog(originalCategory?.counter, "info", prefix, args),
  };
}

// Safe logging helper
function safeLog(
  originalMethod: any,
  fallbackLevel: string,
  prefix: string,
  args: any[]
) {
  const logToConsole = (level: string) => {
    const prefixedArgs = [`[${prefix}]`, ...args];
    switch (level) {
      case "error":
        return console.error(...prefixedArgs);
      case "warn":
        return console.warn(...prefixedArgs);
      case "debug":
        return console.debug(...prefixedArgs);
      default:
        return console.log(...prefixedArgs);
    }
  };

  try {
    if (isWorkerThread || (globalThis as any).__pinoDisabled) {
      return logToConsole(fallbackLevel);
    }

    if (originalMethod && typeof originalMethod === "function") {
      return originalMethod(...args);
    }

    return logToConsole(fallbackLevel);
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message.includes("worker") ||
        error.message.includes("thread") ||
        error.message.includes("ENOENT") ||
        (error as any).code === "MODULE_NOT_FOUND")
    ) {
      (globalThis as any).__pinoDisabled = true;
      if (isDevelopment) {
        console.warn(
          `[SAFE-LOGGER] Disabled pino in safeLog due to error: ${error.message}`
        );
      }
    }
    return logToConsole(fallbackLevel);
  }
}
