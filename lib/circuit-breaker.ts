import { logger } from "@/lib/logger";

export interface CircuitBreakerConfig {
  failureThreshold: number; // Number of failures before opening
  recoveryTimeout: number; // Milliseconds to wait before trying half-open
  monitoringPeriod: number; // Milliseconds to track failures
  successThreshold: number; // Successes needed to close circuit in half-open state
}

export type CircuitState = "CLOSED" | "OPEN" | "HALF_OPEN";

export interface CircuitBreakerStats {
  state: CircuitState;
  failures: number;
  successes: number;
  lastFailureTime: Date | null;
  lastSuccessTime: Date | null;
  totalRequests: number;
  totalFailures: number;
  totalSuccesses: number;
}

/**
 * Circuit Breaker for external service calls - Phase 5 High Availability
 * Prevents cascading failures by temporarily stopping calls to failing services
 */
export class CircuitBreaker {
  private state: CircuitState = "CLOSED";
  private failures = 0;
  private successes = 0;
  private lastFailureTime: Date | null = null;
  private lastSuccessTime: Date | null = null;
  private totalRequests = 0;
  private totalFailures = 0;
  private totalSuccesses = 0;

  constructor(
    private name: string,
    private config: CircuitBreakerConfig
  ) {}

  /**
   * Execute a function with circuit breaker protection
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    this.totalRequests++;

    if (this.state === "OPEN") {
      if (this.shouldAttemptReset()) {
        this.state = "HALF_OPEN";
        logger.info(`Circuit breaker ${this.name} transitioning to HALF_OPEN`);
      } else {
        throw new Error(`Circuit breaker ${this.name} is OPEN`);
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  /**
   * Handle successful execution
   */
  private onSuccess(): void {
    this.successes++;
    this.totalSuccesses++;
    this.lastSuccessTime = new Date();

    if (this.state === "HALF_OPEN") {
      if (this.successes >= this.config.successThreshold) {
        this.reset();
      }
    } else if (this.state === "CLOSED") {
      // Reset failure count on success in closed state
      this.failures = 0;
    }
  }

  /**
   * Handle failed execution
   */
  private onFailure(): void {
    this.failures++;
    this.totalFailures++;
    this.lastFailureTime = new Date();

    if (this.state === "HALF_OPEN") {
      // Single failure in half-open state reopens circuit
      this.trip();
    } else if (
      this.state === "CLOSED" &&
      this.failures >= this.config.failureThreshold
    ) {
      this.trip();
    }
  }

  /**
   * Trip the circuit breaker (open it)
   */
  private trip(): void {
    this.state = "OPEN";
    this.failures = 0;
    this.successes = 0;
    logger.warn(`Circuit breaker ${this.name} tripped to OPEN state`, {
      failures: this.totalFailures,
      threshold: this.config.failureThreshold,
    });
  }

  /**
   * Reset the circuit breaker (close it)
   */
  private reset(): void {
    this.state = "CLOSED";
    this.failures = 0;
    this.successes = 0;
    logger.info(`Circuit breaker ${this.name} reset to CLOSED state`);
  }

  /**
   * Check if we should attempt to reset from OPEN to HALF_OPEN
   */
  private shouldAttemptReset(): boolean {
    if (!this.lastFailureTime) return true;

    const timeSinceLastFailure = Date.now() - this.lastFailureTime.getTime();
    return timeSinceLastFailure >= this.config.recoveryTimeout;
  }

  /**
   * Get current circuit breaker statistics
   */
  getStats(): CircuitBreakerStats {
    return {
      state: this.state,
      failures: this.failures,
      successes: this.successes,
      lastFailureTime: this.lastFailureTime,
      lastSuccessTime: this.lastSuccessTime,
      totalRequests: this.totalRequests,
      totalFailures: this.totalFailures,
      totalSuccesses: this.totalSuccesses,
    };
  }

  /**
   * Force the circuit breaker to a specific state (for testing/admin)
   */
  forceState(state: CircuitState): void {
    this.state = state;
    logger.info(`Circuit breaker ${this.name} forced to ${state} state`);
  }

  /**
   * Check if the circuit breaker allows calls
   */
  canExecute(): boolean {
    return this.state === "CLOSED" || this.state === "HALF_OPEN";
  }
}

/**
 * Circuit Breaker Registry for managing multiple breakers
 */
export class CircuitBreakerRegistry {
  private breakers: Map<string, CircuitBreaker> = new Map();

  /**
   * Get or create a circuit breaker
   */
  getBreaker(
    name: string,
    config?: Partial<CircuitBreakerConfig>
  ): CircuitBreaker {
    if (!this.breakers.has(name)) {
      const defaultConfig: CircuitBreakerConfig = {
        failureThreshold: 5,
        recoveryTimeout: 60000, // 1 minute
        monitoringPeriod: 300000, // 5 minutes
        successThreshold: 3,
        ...config,
      };

      this.breakers.set(name, new CircuitBreaker(name, defaultConfig));
    }

    return this.breakers.get(name)!;
  }

  /**
   * Get statistics for all circuit breakers
   */
  getAllStats(): Record<string, CircuitBreakerStats> {
    const stats: Record<string, CircuitBreakerStats> = {};

    for (const [name, breaker] of this.breakers) {
      stats[name] = breaker.getStats();
    }

    return stats;
  }

  /**
   * Reset all circuit breakers
   */
  resetAll(): void {
    for (const breaker of this.breakers.values()) {
      breaker.forceState("CLOSED");
    }

    logger.info("All circuit breakers reset");
  }

  /**
   * Get circuit breakers that are currently open
   */
  getOpenBreakers(): string[] {
    const openBreakers: string[] = [];

    for (const [name, breaker] of this.breakers) {
      if (breaker.getStats().state === "OPEN") {
        openBreakers.push(name);
      }
    }

    return openBreakers;
  }
}

// Global registry instance
let registryInstance: CircuitBreakerRegistry | null = null;

/**
 * Get the global circuit breaker registry
 */
export function getCircuitBreakerRegistry(): CircuitBreakerRegistry {
  if (!registryInstance) {
    registryInstance = new CircuitBreakerRegistry();
  }

  return registryInstance;
}

/**
 * Execute with circuit breaker protection using registry
 */
export async function withCircuitBreaker<T>(
  serviceName: string,
  fn: () => Promise<T>,
  config?: Partial<CircuitBreakerConfig>
): Promise<T> {
  const registry = getCircuitBreakerRegistry();
  const breaker = registry.getBreaker(serviceName, config);

  return breaker.execute(fn);
}

/**
 * Common circuit breaker configurations for different service types
 */
export const CircuitBreakerConfigs = {
  // External API calls (payment processors, email services, etc.)
  EXTERNAL_API: {
    failureThreshold: 3,
    recoveryTimeout: 30000, // 30 seconds
    monitoringPeriod: 300000, // 5 minutes
    successThreshold: 2,
  },

  // Database connections
  DATABASE: {
    failureThreshold: 5,
    recoveryTimeout: 10000, // 10 seconds
    monitoringPeriod: 60000, // 1 minute
    successThreshold: 3,
  },

  // Cache/redis connections
  CACHE: {
    failureThreshold: 3,
    recoveryTimeout: 5000, // 5 seconds
    monitoringPeriod: 60000, // 1 minute
    successThreshold: 2,
  },

  // File storage services
  STORAGE: {
    failureThreshold: 2,
    recoveryTimeout: 60000, // 1 minute
    monitoringPeriod: 300000, // 5 minutes
    successThreshold: 1,
  },
};
