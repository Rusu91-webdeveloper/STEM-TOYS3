/**
 * AI Rate Limiter Service
 * Manages rate limiting for AI API calls and batch processing
 */

import { aiCache, AICacheTTL } from "./cache";

export interface RateLimitConfig {
  // Requests per time window
  requestsPerMinute: number;
  requestsPerHour: number;
  requestsPerDay: number;

  // Batch processing limits
  maxBatchSize: number;
  maxConcurrentBatches: number;

  // User-specific limits
  userRequestsPerMinute: number;
  userRequestsPerHour: number;
  userRequestsPerDay: number;

  // Burst limits
  burstLimit: number;
  burstWindow: number; // in seconds
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
  limit: number;
  window: string;
}

export interface BatchRateLimitResult {
  allowed: boolean;
  maxBatchSize: number;
  estimatedWaitTime: number;
  queuePosition: number;
}

/**
 * Default rate limit configurations
 */
export const DEFAULT_RATE_LIMITS: Record<string, RateLimitConfig> = {
  openai: {
    requestsPerMinute: 60,
    requestsPerHour: 3600,
    requestsPerDay: 10000,
    maxBatchSize: 50,
    maxConcurrentBatches: 3,
    userRequestsPerMinute: 30,
    userRequestsPerHour: 1800,
    userRequestsPerDay: 5000,
    burstLimit: 10,
    burstWindow: 60,
  },
  anthropic: {
    requestsPerMinute: 50,
    requestsPerHour: 3000,
    requestsPerDay: 8000,
    maxBatchSize: 40,
    maxConcurrentBatches: 2,
    userRequestsPerMinute: 25,
    userRequestsPerHour: 1500,
    userRequestsPerDay: 4000,
    burstLimit: 8,
    burstWindow: 60,
  },
  gemini: {
    requestsPerMinute: 100,
    requestsPerHour: 6000,
    requestsPerDay: 15000,
    maxBatchSize: 60,
    maxConcurrentBatches: 4,
    userRequestsPerMinute: 50,
    userRequestsPerHour: 3000,
    userRequestsPerDay: 7500,
    burstLimit: 15,
    burstWindow: 60,
  },
};

/**
 * AI Rate Limiter Service
 */
export class AIRateLimiter {
  private configs: Map<string, RateLimitConfig> = new Map();

  constructor() {
    // Initialize with default configurations
    Object.entries(DEFAULT_RATE_LIMITS).forEach(([provider, config]) => {
      this.configs.set(provider, config);
    });
  }

  /**
   * Set rate limit configuration for a provider
   */
  setConfig(provider: string, config: RateLimitConfig): void {
    this.configs.set(provider, config);
  }

  /**
   * Get rate limit configuration for a provider
   */
  getConfig(provider: string): RateLimitConfig | null {
    return this.configs.get(provider) || null;
  }

  /**
   * Check rate limit for AI requests
   */
  async checkRateLimit(
    provider: string,
    userId?: string,
    window: "minute" | "hour" | "day" = "minute"
  ): Promise<RateLimitResult> {
    const config = this.getConfig(provider);
    if (!config) {
      throw new Error(
        `No rate limit configuration found for provider: ${provider}`
      );
    }

    const now = Date.now();
    const windowSeconds = this.getWindowSeconds(window);
    const limit = this.getLimitForWindow(config, window, userId);

    // Create rate limit key
    const key = this.createRateLimitKey(
      provider,
      userId,
      window,
      now,
      windowSeconds
    );

    // Check current count
    const current = await aiCache.checkRateLimit(provider, userId, limit);

    // Calculate reset time
    const resetTime = now + windowSeconds * 1000;

    // Check burst limit
    const burstKey = this.createBurstKey(
      provider,
      userId,
      now,
      config.burstWindow
    );
    const burstCount = await aiCache.checkRateLimit(
      provider,
      userId,
      config.burstLimit
    );

    const allowed = current.allowed && burstCount.allowed;
    const remaining = Math.min(current.remaining, burstCount.remaining);

    return {
      allowed,
      remaining,
      resetTime,
      retryAfter: allowed ? undefined : Math.ceil((resetTime - now) / 1000),
      limit,
      window,
    };
  }

  /**
   * Check batch processing rate limit
   */
  async checkBatchRateLimit(
    provider: string,
    batchSize: number,
    userId?: string
  ): Promise<BatchRateLimitResult> {
    const config = this.getConfig(provider);
    if (!config) {
      throw new Error(
        `No rate limit configuration found for provider: ${provider}`
      );
    }

    // Check if batch size is within limits
    if (batchSize > config.maxBatchSize) {
      return {
        allowed: false,
        maxBatchSize: config.maxBatchSize,
        estimatedWaitTime: 0,
        queuePosition: 0,
      };
    }

    // Check concurrent batch limit
    const concurrentKey = `ai:concurrent:${provider}:${userId || "global"}`;
    const currentConcurrent = await aiCache.checkRateLimit(
      provider,
      userId,
      config.maxConcurrentBatches
    );

    if (!currentConcurrent.allowed) {
      // Estimate wait time based on current batch processing
      const estimatedWaitTime = await this.estimateBatchWaitTime(
        provider,
        userId
      );

      return {
        allowed: false,
        maxBatchSize: config.maxBatchSize,
        estimatedWaitTime,
        queuePosition: currentConcurrent.remaining,
      };
    }

    return {
      allowed: true,
      maxBatchSize: config.maxBatchSize,
      estimatedWaitTime: 0,
      queuePosition: 0,
    };
  }

  /**
   * Record a request
   */
  async recordRequest(
    provider: string,
    userId?: string,
    window: "minute" | "hour" | "day" = "minute"
  ): Promise<void> {
    const config = this.getConfig(provider);
    if (!config) {
      throw new Error(
        `No rate limit configuration found for provider: ${provider}`
      );
    }

    const now = Date.now();
    const windowSeconds = this.getWindowSeconds(window);
    const limit = this.getLimitForWindow(config, window, userId);

    // Record in main rate limit
    const key = this.createRateLimitKey(
      provider,
      userId,
      window,
      now,
      windowSeconds
    );
    await aiCache.checkRateLimit(provider, userId, limit);

    // Record in burst limit
    const burstKey = this.createBurstKey(
      provider,
      userId,
      now,
      config.burstWindow
    );
    await aiCache.checkRateLimit(provider, userId, config.burstLimit);
  }

  /**
   * Record batch start
   */
  async recordBatchStart(
    provider: string,
    batchId: string,
    userId?: string
  ): Promise<void> {
    const concurrentKey = `ai:concurrent:${provider}:${userId || "global"}`;
    const batchKey = `ai:batch:${batchId}`;

    // Add to concurrent batches
    await aiCache.checkRateLimit(provider, userId, 1);

    // Store batch info
    await aiCache.cacheBatchProgress(batchId, {
      startTime: Date.now(),
      provider,
      userId,
      status: "processing",
    });
  }

  /**
   * Record batch completion
   */
  async recordBatchComplete(
    provider: string,
    batchId: string,
    userId?: string
  ): Promise<void> {
    const concurrentKey = `ai:concurrent:${provider}:${userId || "global"}`;

    // Remove from concurrent batches
    await aiCache.resetRateLimit(provider, userId);

    // Update batch info
    await aiCache.cacheBatchProgress(batchId, {
      endTime: Date.now(),
      status: "completed",
    });
  }

  /**
   * Get rate limit status
   */
  async getRateLimitStatus(
    provider: string,
    userId?: string
  ): Promise<{
    minute: RateLimitResult;
    hour: RateLimitResult;
    day: RateLimitResult;
    batch: BatchRateLimitResult;
  }> {
    const [minute, hour, day, batch] = await Promise.all([
      this.checkRateLimit(provider, userId, "minute"),
      this.checkRateLimit(provider, userId, "hour"),
      this.checkRateLimit(provider, userId, "day"),
      this.checkBatchRateLimit(provider, 1, userId), // Check with minimal batch size
    ]);

    return { minute, hour, day, batch };
  }

  /**
   * Reset rate limits for a user
   */
  async resetRateLimits(provider: string, userId?: string): Promise<void> {
    await aiCache.resetRateLimit(provider, userId);
  }

  /**
   * Get window seconds
   */
  private getWindowSeconds(window: "minute" | "hour" | "day"): number {
    switch (window) {
      case "minute":
        return 60;
      case "hour":
        return 3600;
      case "day":
        return 86400;
      default:
        return 60;
    }
  }

  /**
   * Get limit for window
   */
  private getLimitForWindow(
    config: RateLimitConfig,
    window: "minute" | "hour" | "day",
    userId?: string
  ): number {
    if (userId) {
      switch (window) {
        case "minute":
          return config.userRequestsPerMinute;
        case "hour":
          return config.userRequestsPerHour;
        case "day":
          return config.userRequestsPerDay;
        default:
          return config.userRequestsPerMinute;
      }
    } else {
      switch (window) {
        case "minute":
          return config.requestsPerMinute;
        case "hour":
          return config.requestsPerHour;
        case "day":
          return config.requestsPerDay;
        default:
          return config.requestsPerMinute;
      }
    }
  }

  /**
   * Create rate limit key
   */
  private createRateLimitKey(
    provider: string,
    userId: string | undefined,
    window: string,
    timestamp: number,
    windowSeconds: number
  ): string {
    const windowStart =
      Math.floor(timestamp / (windowSeconds * 1000)) * (windowSeconds * 1000);
    const userPart = userId ? `:${userId}` : "";
    return `ai:rate:${provider}${userPart}:${window}:${windowStart}`;
  }

  /**
   * Create burst key
   */
  private createBurstKey(
    provider: string,
    userId: string | undefined,
    timestamp: number,
    burstWindow: number
  ): string {
    const windowStart =
      Math.floor(timestamp / (burstWindow * 1000)) * (burstWindow * 1000);
    const userPart = userId ? `:${userId}` : "";
    return `ai:burst:${provider}${userPart}:${windowStart}`;
  }

  /**
   * Estimate batch wait time
   */
  private async estimateBatchWaitTime(
    provider: string,
    userId?: string
  ): Promise<number> {
    // This is a simplified estimation
    // In a real implementation, you'd track actual batch processing times
    const config = this.getConfig(provider);
    if (!config) return 0;

    // Estimate based on average processing time per product
    const avgProcessingTimePerProduct = 2000; // 2 seconds per product
    const maxBatchSize = config.maxBatchSize;

    return maxBatchSize * avgProcessingTimePerProduct;
  }
}

// Export singleton instance
export const aiRateLimiter = new AIRateLimiter();

/**
 * Rate limit decorator for AI service methods
 */
export function withRateLimit(
  provider: string,
  window: "minute" | "hour" | "day" = "minute"
) {
  return function (
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor
  ) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const userId = args[0]?.userId || args[0]?.user?.id;

      // Check rate limit
      const rateLimitResult = await aiRateLimiter.checkRateLimit(
        provider,
        userId,
        window
      );

      if (!rateLimitResult.allowed) {
        throw new Error(
          `Rate limit exceeded. Retry after ${rateLimitResult.retryAfter} seconds.`
        );
      }

      // Record the request
      await aiRateLimiter.recordRequest(provider, userId, window);

      // Execute the original method
      return method.apply(this, args);
    };

    return descriptor;
  };
}

/**
 * Batch rate limit decorator
 */
export function withBatchRateLimit(provider: string) {
  return function (
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor
  ) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const userId = args[0]?.userId || args[0]?.user?.id;
      const batchSize = args[0]?.products?.length || args[0]?.length || 1;

      // Check batch rate limit
      const batchRateLimitResult = await aiRateLimiter.checkBatchRateLimit(
        provider,
        batchSize,
        userId
      );

      if (!batchRateLimitResult.allowed) {
        throw new Error(
          `Batch rate limit exceeded. Max batch size: ${batchRateLimitResult.maxBatchSize}, ` +
            `Estimated wait time: ${batchRateLimitResult.estimatedWaitTime}ms`
        );
      }

      // Record batch start
      const batchId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await aiRateLimiter.recordBatchStart(provider, batchId, userId);

      try {
        // Execute the original method
        const result = await method.apply(this, args);

        // Record batch completion
        await aiRateLimiter.recordBatchComplete(provider, batchId, userId);

        return result;
      } catch (error) {
        // Record batch completion even on error
        await aiRateLimiter.recordBatchComplete(provider, batchId, userId);
        throw error;
      }
    };

    return descriptor;
  };
}
