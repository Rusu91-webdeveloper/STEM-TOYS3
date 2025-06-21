/**
 * A structured logger with log levels to safely log in development and production
 */

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
];

/**
 * Sanitize an object by redacting sensitive values
 */
function sanitizeData(data: any): any {
  if (!data) return data;

  // Handle primitive values
  if (typeof data !== "object") return data;

  // Handle arrays
  if (Array.isArray(data)) {
    return data.map((item) => sanitizeData(item));
  }

  // Handle objects
  const sanitized = { ...data };

  for (const key in sanitized) {
    const lowerKey = key.toLowerCase();

    // Check if this key contains sensitive information
    const isSensitive = SENSITIVE_KEYS.some((sensitiveKey) =>
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

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

/**
 * Determines if a message should be logged based on current log level
 */
function shouldLog(level: LogLevel): boolean {
  const configuredLevel =
    (process.env.LOG_LEVEL as LogLevel) || DEFAULT_LOG_LEVEL;
  return LOG_LEVELS[level] >= LOG_LEVELS[configuredLevel];
}

/**
 * Format a log message with timestamp and level
 */
function formatLogMessage(
  level: LogLevel,
  message: string,
  data?: any
): string {
  const timestamp = new Date().toISOString();
  const sanitizedData = data ? sanitizeData(data) : undefined;

  let formattedMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;

  if (sanitizedData) {
    try {
      formattedMessage += ` ${JSON.stringify(sanitizedData)}`;
    } catch (e) {
      formattedMessage += " [Data could not be stringified]";
    }
  }

  return formattedMessage;
}

/**
 * The logger interface
 */
export const logger = {
  debug: (message: string, data?: any) => {
    if (shouldLog("debug")) {
      console.debug(formatLogMessage("debug", message, data));
    }
  },

  info: (message: string, data?: any) => {
    if (shouldLog("info")) {
      console.info(formatLogMessage("info", message, data));
    }
  },

  warn: (message: string, data?: any) => {
    if (shouldLog("warn")) {
      console.warn(formatLogMessage("warn", message, data));
    }
  },

  error: (message: string, error?: any, additionalData?: any) => {
    if (shouldLog("error")) {
      const errorMessage =
        error instanceof Error
          ? `${error.name}: ${error.message}`
          : String(error);

      console.error(
        formatLogMessage(
          "error",
          `${message} - ${errorMessage}`,
          additionalData
        )
      );

      // Log stack trace for errors in non-production environments
      if (
        process.env.NODE_ENV !== "production" &&
        error instanceof Error &&
        error.stack
      ) {
        console.error(error.stack);
      }
    }
  },
};
