import { logger } from "@/lib/logger";

export interface RetryOptions {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
  retryCondition?: (error: unknown) => boolean;
  onRetry?: (attempt: number, error: unknown) => void;
}

export interface CircuitBreakerOptions {
  failureThreshold: number;
  recoveryTimeout: number;
  monitoringPeriod: number;
}

export interface FallbackOptions<T> {
  primary: () => Promise<T>;
  fallback: () => Promise<T>;
  condition?: (error: unknown) => boolean;
}

/**
 * Enterprise-grade error recovery utilities
 */
export class ErrorRecovery {
  /**
   * Retry mechanism with exponential backoff
   */
  static async withRetry<T>(
    operation: () => Promise<T>,
    options: Partial<RetryOptions> = {}
  ): Promise<T> {
    const {
      maxAttempts = 3,
      baseDelay = 1000,
      maxDelay = 30000,
      backoffFactor = 2,
      retryCondition = error => this.isRetryableError(error),
      onRetry,
    } = options;

    let lastError: unknown;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;

        // Check if we should retry
        if (attempt === maxAttempts || !retryCondition(error)) {
          throw error;
        }

        // Calculate delay with jitter
        const delay = Math.min(
          baseDelay * Math.pow(backoffFactor, attempt - 1),
          maxDelay
        );
        const jitter = Math.random() * 0.1 * delay; // Add 10% jitter
        const finalDelay = delay + jitter;

        logger.warn(
          `Retry attempt ${attempt}/${maxAttempts} failed, retrying in ${Math.round(finalDelay)}ms`,
          {
            error: error instanceof Error ? error.message : String(error),
            attempt,
            delay: finalDelay,
          }
        );

        // Call retry callback if provided
        if (onRetry) {
          onRetry(attempt, error);
        }

        // Wait before retrying
        await this.delay(finalDelay);
      }
    }

    throw lastError;
  }

  /**
   * Circuit breaker pattern implementation
   */
  static createCircuitBreaker<T extends any[], R>(
    fn: (...args: T) => Promise<R>,
    options: Partial<CircuitBreakerOptions> = {}
  ): (...args: T) => Promise<R> {
    const {
      failureThreshold = 5,
      recoveryTimeout = 60000, // 1 minute
      monitoringPeriod = 60000, // 1 minute
    } = options;

    let failures = 0;
    let lastFailureTime = 0;
    let state: "closed" | "open" | "half-open" = "closed";

    const updateState = () => {
      const now = Date.now();

      if (state === "open" && now - lastFailureTime >= recoveryTimeout) {
        state = "half-open";
        logger.info("Circuit breaker transitioning to half-open state");
      }
    };

    return async (...args: T): Promise<R> => {
      updateState();

      if (state === "open") {
        throw new Error(
          "Circuit breaker is open - service temporarily unavailable"
        );
      }

      try {
        const result = await fn(...args);

        // Success - reset failure count and close circuit
        if (state === "half-open") {
          state = "closed";
          failures = 0;
          logger.info("Circuit breaker closed after successful recovery");
        }

        return result;
      } catch (error) {
        failures++;
        lastFailureTime = Date.now();

        if (failures >= failureThreshold) {
          state = "open";
          logger.warn(`Circuit breaker opened after ${failures} failures`);
        }

        throw error;
      }
    };
  }

  /**
   * Fallback mechanism - try primary, fall back to secondary
   */
  static async withFallback<T>(options: FallbackOptions<T>): Promise<T> {
    const { primary, fallback, condition } = options;

    try {
      return await primary();
    } catch (error) {
      // Check if we should use fallback
      if (!condition || condition(error)) {
        logger.warn("Primary operation failed, using fallback", {
          error: error instanceof Error ? error.message : String(error),
        });

        try {
          return await fallback();
        } catch (fallbackError) {
          logger.error("Both primary and fallback operations failed", {
            primaryError:
              error instanceof Error ? error.message : String(error),
            fallbackError:
              fallbackError instanceof Error
                ? fallbackError.message
                : String(fallbackError),
          });
          throw fallbackError;
        }
      }

      // Re-throw original error if fallback condition not met
      throw error;
    }
  }

  /**
   * Graceful degradation - return default value on failure
   */
  static async withGracefulDegradation<T>(
    operation: () => Promise<T>,
    defaultValue: T,
    logContext?: string
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      logger.warn(
        `Operation failed, using graceful degradation: ${logContext || "unknown"}`,
        {
          error: error instanceof Error ? error.message : String(error),
        }
      );
      return defaultValue;
    }
  }

  /**
   * Bulk operation with partial failure handling
   */
  static async bulkOperation<T, R>(
    items: T[],
    operation: (item: T) => Promise<R>,
    options: {
      concurrency?: number;
      continueOnError?: boolean;
      onItemSuccess?: (result: R, item: T) => void;
      onItemError?: (error: unknown, item: T) => void;
    } = {}
  ): Promise<{
    successful: Array<{ item: T; result: R }>;
    failed: Array<{ item: T; error: unknown }>;
    summary: {
      total: number;
      successful: number;
      failed: number;
      successRate: number;
    };
  }> {
    const {
      concurrency = 5,
      continueOnError = true,
      onItemSuccess,
      onItemError,
    } = options;

    const results = {
      successful: [] as Array<{ item: T; result: R }>,
      failed: [] as Array<{ item: T; error: unknown }>,
      summary: {
        total: items.length,
        successful: 0,
        failed: 0,
        successRate: 0,
      },
    };

    // Process items in batches to control concurrency
    for (let i = 0; i < items.length; i += concurrency) {
      const batch = items.slice(i, i + concurrency);

      const batchPromises = batch.map(async item => {
        try {
          const result = await operation(item);
          results.successful.push({ item, result });
          results.summary.successful++;

          if (onItemSuccess) {
            onItemSuccess(result, item);
          }

          return { success: true, item, result };
        } catch (error) {
          results.failed.push({ item, error });
          results.summary.failed++;

          if (onItemError) {
            onItemError(error, item);
          }

          if (!continueOnError) {
            throw error;
          }

          return { success: false, item, error };
        }
      });

      await Promise.allSettled(batchPromises);
    }

    results.summary.successRate =
      (results.summary.successful / results.summary.total) * 100;

    logger.info("Bulk operation completed", {
      context: "bulk_operation",
      summary: results.summary,
    });

    return results;
  }

  /**
   * Timeout wrapper for operations
   */
  static async withTimeout<T>(
    operation: () => Promise<T>,
    timeoutMs: number,
    timeoutMessage = "Operation timed out"
  ): Promise<T> {
    return Promise.race([
      operation(),
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs);
      }),
    ]);
  }

  /**
   * Health check mechanism for services
   */
  static async healthCheck(
    serviceName: string,
    checkFn: () => Promise<boolean>,
    options: {
      interval: number;
      timeout: number;
      maxFailures: number;
    } = {
      interval: 30000, // 30 seconds
      timeout: 5000, // 5 seconds
      maxFailures: 3,
    }
  ): Promise<{
    isHealthy: boolean;
    responseTime: number;
    lastChecked: Date;
    consecutiveFailures: number;
  }> {
    const { interval, timeout, maxFailures } = options;

    let consecutiveFailures = 0;
    let lastChecked = new Date();
    let isHealthy = true;

    const performCheck = async () => {
      const startTime = Date.now();

      try {
        const result = await this.withTimeout(
          () => checkFn(),
          timeout,
          `${serviceName} health check timed out`
        );

        const responseTime = Date.now() - startTime;
        lastChecked = new Date();

        if (result) {
          consecutiveFailures = 0;
          isHealthy = true;
        } else {
          consecutiveFailures++;
          if (consecutiveFailures >= maxFailures) {
            isHealthy = false;
          }
        }

        return { isHealthy, responseTime, lastChecked, consecutiveFailures };
      } catch (error) {
        consecutiveFailures++;
        if (consecutiveFailures >= maxFailures) {
          isHealthy = false;
        }

        const responseTime = Date.now() - startTime;
        lastChecked = new Date();

        logger.warn(`${serviceName} health check failed`, {
          error: error instanceof Error ? error.message : String(error),
          consecutiveFailures,
        });

        return { isHealthy, responseTime, lastChecked, consecutiveFailures };
      }
    };

    return performCheck();
  }

  /**
   * Determine if an error is retryable
   */
  private static isRetryableError(error: unknown): boolean {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();

      // Network errors
      if (
        message.includes("network") ||
        message.includes("connection") ||
        message.includes("timeout") ||
        message.includes("econnreset") ||
        message.includes("enotfound")
      ) {
        return true;
      }

      // Rate limiting
      if (
        message.includes("rate limit") ||
        message.includes("too many requests") ||
        message.includes("429")
      ) {
        return true;
      }

      // Temporary server errors
      if (
        message.includes("502") ||
        message.includes("503") ||
        message.includes("504") ||
        message.includes("temporarily unavailable")
      ) {
        return true;
      }

      // Database connection errors
      if (
        message.includes("connection") &&
        (message.includes("lost") || message.includes("failed"))
      ) {
        return true;
      }
    }

    return false;
  }

  /**
   * Utility function for delays
   */
  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
