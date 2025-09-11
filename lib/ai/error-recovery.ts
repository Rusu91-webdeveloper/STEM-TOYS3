/**
 * AI Error Recovery and Retry Service
 * Handles retries, circuit breakers, and error recovery for AI services
 */

import { aiMonitoring } from "./monitoring";
import { aiCache } from "./cache";

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number; // in milliseconds
  maxDelay: number; // in milliseconds
  backoffMultiplier: number;
  jitter: boolean;
  retryableErrors: string[];
}

export interface CircuitBreakerConfig {
  failureThreshold: number;
  recoveryTimeout: number; // in milliseconds
  monitoringWindow: number; // in milliseconds
  halfOpenMaxCalls: number;
}

export interface RetryResult<T> {
  success: boolean;
  result?: T;
  error?: Error;
  attempts: number;
  totalTime: number;
  lastError?: Error;
}

export interface CircuitBreakerState {
  state: "closed" | "open" | "half-open";
  failureCount: number;
  lastFailureTime: number;
  nextAttemptTime: number;
  successCount: number;
  totalCalls: number;
}

/**
 * Default retry configurations
 */
export const DEFAULT_RETRY_CONFIGS: Record<string, RetryConfig> = {
  openai: {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2,
    jitter: true,
    retryableErrors: [
      "RateLimitError",
      "TimeoutError",
      "NetworkError",
      "ServiceUnavailableError",
      "InternalServerError",
    ],
  },
  anthropic: {
    maxRetries: 3,
    baseDelay: 1500,
    maxDelay: 15000,
    backoffMultiplier: 2,
    jitter: true,
    retryableErrors: [
      "RateLimitError",
      "TimeoutError",
      "NetworkError",
      "ServiceUnavailableError",
      "InternalServerError",
    ],
  },
  gemini: {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2,
    jitter: true,
    retryableErrors: [
      "RateLimitError",
      "TimeoutError",
      "NetworkError",
      "ServiceUnavailableError",
      "InternalServerError",
    ],
  },
};

/**
 * Default circuit breaker configurations
 */
export const DEFAULT_CIRCUIT_BREAKER_CONFIGS: Record<
  string,
  CircuitBreakerConfig
> = {
  openai: {
    failureThreshold: 5,
    recoveryTimeout: 60000, // 1 minute
    monitoringWindow: 300000, // 5 minutes
    halfOpenMaxCalls: 3,
  },
  anthropic: {
    failureThreshold: 5,
    recoveryTimeout: 90000, // 1.5 minutes
    monitoringWindow: 300000, // 5 minutes
    halfOpenMaxCalls: 3,
  },
  gemini: {
    failureThreshold: 5,
    recoveryTimeout: 60000, // 1 minute
    monitoringWindow: 300000, // 5 minutes
    halfOpenMaxCalls: 3,
  },
};

/**
 * AI Error Recovery Service
 */
export class AIErrorRecoveryService {
  private retryConfigs: Map<string, RetryConfig> = new Map();
  private circuitBreakerConfigs: Map<string, CircuitBreakerConfig> = new Map();
  private circuitBreakerStates: Map<string, CircuitBreakerState> = new Map();

  constructor() {
    // Initialize with default configurations
    Object.entries(DEFAULT_RETRY_CONFIGS).forEach(([provider, config]) => {
      this.retryConfigs.set(provider, config);
    });

    Object.entries(DEFAULT_CIRCUIT_BREAKER_CONFIGS).forEach(
      ([provider, config]) => {
        this.circuitBreakerConfigs.set(provider, config);
      }
    );
  }

  /**
   * Set retry configuration for a provider
   */
  setRetryConfig(provider: string, config: RetryConfig): void {
    this.retryConfigs.set(provider, config);
  }

  /**
   * Set circuit breaker configuration for a provider
   */
  setCircuitBreakerConfig(
    provider: string,
    config: CircuitBreakerConfig
  ): void {
    this.circuitBreakerConfigs.set(provider, config);
  }

  /**
   * Execute function with retry logic
   */
  async executeWithRetry<T>(
    provider: string,
    operation: () => Promise<T>,
    userId?: string
  ): Promise<RetryResult<T>> {
    const config = this.retryConfigs.get(provider);
    if (!config) {
      throw new Error(`No retry configuration found for provider: ${provider}`);
    }

    const startTime = Date.now();
    let lastError: Error | undefined;
    let attempts = 0;

    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
      attempts = attempt + 1;

      try {
        // Check circuit breaker
        if (!this.isCircuitBreakerClosed(provider)) {
          throw new Error(`Circuit breaker is open for provider: ${provider}`);
        }

        const result = await operation();

        // Record success
        await this.recordSuccess(provider);

        return {
          success: true,
          result,
          attempts,
          totalTime: Date.now() - startTime,
        };
      } catch (error) {
        lastError = error as Error;

        // Record failure
        await this.recordFailure(provider, error as Error);

        // Check if error is retryable
        if (!this.isRetryableError(error as Error, config.retryableErrors)) {
          return {
            success: false,
            error: error as Error,
            attempts,
            totalTime: Date.now() - startTime,
            lastError,
          };
        }

        // If this is the last attempt, return failure
        if (attempt === config.maxRetries) {
          return {
            success: false,
            error: error as Error,
            attempts,
            totalTime: Date.now() - startTime,
            lastError,
          };
        }

        // Calculate delay for next attempt
        const delay = this.calculateDelay(attempt, config);

        // Wait before retry
        await this.sleep(delay);
      }
    }

    return {
      success: false,
      error: lastError,
      attempts,
      totalTime: Date.now() - startTime,
      lastError,
    };
  }

  /**
   * Execute function with circuit breaker
   */
  async executeWithCircuitBreaker<T>(
    provider: string,
    operation: () => Promise<T>,
    userId?: string
  ): Promise<T> {
    const state = this.getCircuitBreakerState(provider);

    // Check if circuit breaker is open
    if (state.state === "open") {
      if (Date.now() < state.nextAttemptTime) {
        throw new Error(
          `Circuit breaker is open for provider: ${provider}. Next attempt at: ${new Date(state.nextAttemptTime).toISOString()}`
        );
      } else {
        // Transition to half-open
        state.state = "half-open";
        state.successCount = 0;
        this.circuitBreakerStates.set(provider, state);
      }
    }

    // Check half-open state
    if (state.state === "half-open") {
      const config = this.circuitBreakerConfigs.get(provider);
      if (state.successCount >= config!.halfOpenMaxCalls) {
        throw new Error(
          `Circuit breaker is in half-open state and max calls reached for provider: ${provider}`
        );
      }
    }

    try {
      const result = await operation();

      // Record success
      await this.recordSuccess(provider);

      // Update circuit breaker state
      if (state.state === "half-open") {
        state.successCount++;
        if (
          state.successCount >=
          this.circuitBreakerConfigs.get(provider)!.halfOpenMaxCalls
        ) {
          // Transition to closed
          state.state = "closed";
          state.failureCount = 0;
          state.successCount = 0;
        }
      } else {
        // Reset failure count on success
        state.failureCount = 0;
      }

      this.circuitBreakerStates.set(provider, state);

      return result;
    } catch (error) {
      // Record failure
      await this.recordFailure(provider, error as Error);

      // Update circuit breaker state
      state.failureCount++;
      state.lastFailureTime = Date.now();
      state.totalCalls++;

      const config = this.circuitBreakerConfigs.get(provider);
      if (state.failureCount >= config!.failureThreshold) {
        // Transition to open
        state.state = "open";
        state.nextAttemptTime = Date.now() + config!.recoveryTimeout;
      }

      this.circuitBreakerStates.set(provider, state);

      throw error;
    }
  }

  /**
   * Execute function with both retry and circuit breaker
   */
  async executeWithRecovery<T>(
    provider: string,
    operation: () => Promise<T>,
    userId?: string
  ): Promise<RetryResult<T>> {
    return this.executeWithRetry(
      provider,
      () => this.executeWithCircuitBreaker(provider, operation, userId),
      userId
    );
  }

  /**
   * Get circuit breaker state
   */
  getCircuitBreakerState(provider: string): CircuitBreakerState {
    let state = this.circuitBreakerStates.get(provider);

    if (!state) {
      state = {
        state: "closed",
        failureCount: 0,
        lastFailureTime: 0,
        nextAttemptTime: 0,
        successCount: 0,
        totalCalls: 0,
      };
      this.circuitBreakerStates.set(provider, state);
    }

    return state;
  }

  /**
   * Reset circuit breaker
   */
  resetCircuitBreaker(provider: string): void {
    const state = this.getCircuitBreakerState(provider);
    state.state = "closed";
    state.failureCount = 0;
    state.lastFailureTime = 0;
    state.nextAttemptTime = 0;
    state.successCount = 0;
    state.totalCalls = 0;
    this.circuitBreakerStates.set(provider, state);
  }

  /**
   * Get recovery status for all providers
   */
  getRecoveryStatus(): Record<
    string,
    {
      circuitBreaker: CircuitBreakerState;
      retryConfig: RetryConfig;
      circuitBreakerConfig: CircuitBreakerConfig;
    }
  > {
    const status: Record<string, any> = {};

    for (const provider of this.retryConfigs.keys()) {
      status[provider] = {
        circuitBreaker: this.getCircuitBreakerState(provider),
        retryConfig: this.retryConfigs.get(provider),
        circuitBreakerConfig: this.circuitBreakerConfigs.get(provider),
      };
    }

    return status;
  }

  /**
   * Check if circuit breaker is closed
   */
  private isCircuitBreakerClosed(provider: string): boolean {
    const state = this.getCircuitBreakerState(provider);
    return state.state === "closed";
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: Error, retryableErrors: string[]): boolean {
    const errorName = error.constructor.name;
    const errorMessage = error.message.toLowerCase();

    // Check by error name
    if (retryableErrors.includes(errorName)) {
      return true;
    }

    // Check by error message patterns
    const retryablePatterns = [
      "rate limit",
      "timeout",
      "network",
      "service unavailable",
      "internal server error",
      "temporary",
      "retry",
      "throttle",
    ];

    return retryablePatterns.some(pattern => errorMessage.includes(pattern));
  }

  /**
   * Calculate delay for retry
   */
  private calculateDelay(attempt: number, config: RetryConfig): number {
    let delay = config.baseDelay * Math.pow(config.backoffMultiplier, attempt);

    // Apply maximum delay limit
    delay = Math.min(delay, config.maxDelay);

    // Add jitter if enabled
    if (config.jitter) {
      const jitterAmount = delay * 0.1; // 10% jitter
      delay += (Math.random() - 0.5) * 2 * jitterAmount;
    }

    return Math.max(0, delay);
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Record success
   */
  private async recordSuccess(provider: string): Promise<void> {
    const state = this.getCircuitBreakerState(provider);
    state.totalCalls++;
    this.circuitBreakerStates.set(provider, state);
  }

  /**
   * Record failure
   */
  private async recordFailure(provider: string, error: Error): Promise<void> {
    const state = this.getCircuitBreakerState(provider);
    state.totalCalls++;
    this.circuitBreakerStates.set(provider, state);

    // Record error in monitoring
    await aiMonitoring.recordError(provider, error.constructor.name);
  }
}

// Export singleton instance
export const aiErrorRecovery = new AIErrorRecoveryService();

/**
 * Retry decorator
 */
export function withRetry(provider: string) {
  return function (
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor
  ) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const userId = args[0]?.userId || args[0]?.user?.id;

      const result = await aiErrorRecovery.executeWithRetry(
        provider,
        () => method.apply(this, args),
        userId
      );

      if (!result.success) {
        throw result.error;
      }

      return result.result;
    };

    return descriptor;
  };
}

/**
 * Circuit breaker decorator
 */
export function withCircuitBreaker(provider: string) {
  return function (
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor
  ) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const userId = args[0]?.userId || args[0]?.user?.id;

      return aiErrorRecovery.executeWithCircuitBreaker(
        provider,
        () => method.apply(this, args),
        userId
      );
    };

    return descriptor;
  };
}

/**
 * Full recovery decorator (retry + circuit breaker)
 */
export function withRecovery(provider: string) {
  return function (
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor
  ) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const userId = args[0]?.userId || args[0]?.user?.id;

      const result = await aiErrorRecovery.executeWithRecovery(
        provider,
        () => method.apply(this, args),
        userId
      );

      if (!result.success) {
        throw result.error;
      }

      return result.result;
    };

    return descriptor;
  };
}
