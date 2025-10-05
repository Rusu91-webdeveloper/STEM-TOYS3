import { getCache } from "@/lib/cache/redis-cache";
import { logger } from "@/lib/logger";

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  blockDurationMs: number; // How long to block after exceeding limit
  burstAllowance: number; // Burst requests allowed
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: Date;
  blocked: boolean;
  blockExpires?: Date;
}

export interface UserRateLimitConfig {
  // API endpoints
  apiRequests: RateLimitConfig;

  // User search operations
  searchRequests: RateLimitConfig;

  // Profile update operations
  profileUpdates: RateLimitConfig;

  // Authentication attempts
  authAttempts: RateLimitConfig;

  // File upload operations
  uploads: RateLimitConfig;

  // Global user limit (across all operations)
  globalLimit: RateLimitConfig;
}

/**
 * User-Level Rate Limiter for Phase 5 High Availability
 * Implements sophisticated rate limiting with burst handling and progressive delays
 */
export class UserRateLimiter {
  private cache = getCache();

  constructor(private config: UserRateLimitConfig) {}

  /**
   * Check rate limit for a specific operation
   */
  async checkLimit(
    userId: string,
    operation: keyof UserRateLimitConfig,
    metadata?: Record<string, any>
  ): Promise<RateLimitResult> {
    const operationConfig = this.config[operation];
    if (!operationConfig) {
      // No rate limiting for this operation
      return {
        allowed: true,
        remaining: Infinity,
        resetTime: new Date(Date.now() + 3600000), // 1 hour from now
        blocked: false,
      };
    }

    const key = this.buildRateLimitKey(userId, operation);
    const blockKey = this.buildBlockKey(userId, operation);

    // Check if user is currently blocked
    const blockExpires = await this.cache.get(blockKey);
    if (blockExpires) {
      const blockExpiryTime = new Date(blockExpires as string);
      if (blockExpiryTime > new Date()) {
        return {
          allowed: false,
          remaining: 0,
          resetTime: blockExpiryTime,
          blocked: true,
          blockExpires: blockExpiryTime,
        };
      } else {
        // Block expired, remove it
        await this.cache.delete(blockKey);
      }
    }

    // Get current request count
    const currentCount = await this.getCurrentCount(key);
    const resetTime = new Date(Date.now() + operationConfig.windowMs);

    // Check if limit exceeded
    if (currentCount >= operationConfig.maxRequests) {
      // Block the user
      const blockExpires = new Date(
        Date.now() + operationConfig.blockDurationMs
      );
      await this.cache.set(blockKey, blockExpires.toISOString(), {
        ttl: Math.ceil(operationConfig.blockDurationMs / 1000),
      });

      logger.warn("Rate limit exceeded, user blocked", {
        userId,
        operation,
        currentCount,
        maxRequests: operationConfig.maxRequests,
        blockDuration: operationConfig.blockDurationMs,
        metadata,
      });

      return {
        allowed: false,
        remaining: 0,
        resetTime,
        blocked: true,
        blockExpires,
      };
    }

    // Allow request and increment counter
    await this.incrementCount(key, operationConfig.windowMs);
    const newCount = currentCount + 1;

    return {
      allowed: true,
      remaining: Math.max(0, operationConfig.maxRequests - newCount),
      resetTime,
      blocked: false,
    };
  }

  /**
   * Check global user rate limit across all operations
   */
  async checkGlobalLimit(userId: string): Promise<RateLimitResult> {
    return this.checkLimit(userId, "globalLimit");
  }

  /**
   * Apply progressive delay for frequent requests
   */
  async getProgressiveDelay(
    userId: string,
    operation: keyof UserRateLimitConfig
  ): Promise<number> {
    const key = this.buildRateLimitKey(userId, operation);
    const currentCount = await this.getCurrentCount(key);

    const operationConfig = this.config[operation];
    if (!operationConfig) return 0;

    // Calculate delay based on usage percentage
    const usagePercent = currentCount / operationConfig.maxRequests;

    if (usagePercent < 0.5) return 0; // No delay for low usage
    if (usagePercent < 0.7) return 100; // 100ms delay
    if (usagePercent < 0.9) return 500; // 500ms delay

    return 1000; // 1 second delay for high usage
  }

  /**
   * Get current rate limit status for user
   */
  async getUserLimitStatus(userId: string): Promise<{
    operations: Record<string, RateLimitResult>;
    global: RateLimitResult;
  }> {
    const operations: Record<string, RateLimitResult> = {};
    const operationKeys = Object.keys(this.config) as Array<
      keyof UserRateLimitConfig
    >;

    for (const operation of operationKeys) {
      if (operation !== "globalLimit") {
        operations[operation] = await this.checkLimit(userId, operation);
      }
    }

    const global = await this.checkGlobalLimit(userId);

    return { operations, global };
  }

  /**
   * Reset rate limits for a user (admin function)
   */
  async resetUserLimits(userId: string): Promise<void> {
    const operations = Object.keys(this.config) as Array<
      keyof UserRateLimitConfig
    >;

    const deletePromises = operations.flatMap(operation => {
      const rateLimitKey = this.buildRateLimitKey(userId, operation);
      const blockKey = this.buildBlockKey(userId, operation);
      return [this.cache.delete(rateLimitKey), this.cache.delete(blockKey)];
    });

    await Promise.all(deletePromises);

    logger.info("User rate limits reset", { userId });
  }

  /**
   * Get rate limiting statistics
   */
  async getRateLimitStats(): Promise<{
    totalUsersLimited: number;
    totalBlocks: number;
    topLimitedOperations: Array<{ operation: string; count: number }>;
    recentBlocks: number;
  }> {
    // In a real implementation, you'd track these metrics
    // For now, return placeholder stats
    return {
      totalUsersLimited: 0,
      totalBlocks: 0,
      topLimitedOperations: [],
      recentBlocks: 0,
    };
  }

  /**
   * Build rate limit key
   */
  private buildRateLimitKey(userId: string, operation: string): string {
    return `ratelimit:user:${userId}:${operation}`;
  }

  /**
   * Build block key
   */
  private buildBlockKey(userId: string, operation: string): string {
    return `ratelimit:block:${userId}:${operation}`;
  }

  /**
   * Get current request count
   */
  private async getCurrentCount(key: string): Promise<number> {
    const count = await this.cache.get(key);
    return typeof count === "number" ? count : 0;
  }

  /**
   * Increment request count with TTL
   */
  private async incrementCount(key: string, windowMs: number): Promise<number> {
    const ttl = Math.ceil(windowMs / 1000);
    return (await this.cache.increment(key)) || 1;
  }
}

/**
 * Default rate limiting configuration
 */
export const DefaultUserRateLimitConfig: UserRateLimitConfig = {
  // API endpoints - generous limits for normal usage
  apiRequests: {
    windowMs: 60000, // 1 minute
    maxRequests: 100,
    blockDurationMs: 300000, // 5 minutes
    burstAllowance: 20,
  },

  // User search operations - moderate limits
  searchRequests: {
    windowMs: 60000, // 1 minute
    maxRequests: 30,
    blockDurationMs: 180000, // 3 minutes
    burstAllowance: 5,
  },

  // Profile update operations - strict limits
  profileUpdates: {
    windowMs: 300000, // 5 minutes
    maxRequests: 10,
    blockDurationMs: 900000, // 15 minutes
    burstAllowance: 2,
  },

  // Authentication attempts - very strict limits
  authAttempts: {
    windowMs: 900000, // 15 minutes
    maxRequests: 5,
    blockDurationMs: 3600000, // 1 hour
    burstAllowance: 1,
  },

  // File upload operations - moderate limits
  uploads: {
    windowMs: 300000, // 5 minutes
    maxRequests: 20,
    blockDurationMs: 600000, // 10 minutes
    burstAllowance: 3,
  },

  // Global user limit - very generous
  globalLimit: {
    windowMs: 3600000, // 1 hour
    maxRequests: 1000,
    blockDurationMs: 3600000, // 1 hour
    burstAllowance: 100,
  },
};

// Singleton instance
let rateLimiterInstance: UserRateLimiter | null = null;

/**
 * Get the global user rate limiter instance
 */
export function getUserRateLimiter(): UserRateLimiter {
  if (!rateLimiterInstance) {
    // Override defaults with environment variables
    const config: UserRateLimitConfig = {
      ...DefaultUserRateLimitConfig,
      apiRequests: {
        ...DefaultUserRateLimitConfig.apiRequests,
        maxRequests: parseInt(process.env.RATE_LIMIT_API_REQUESTS || "100"),
        windowMs: parseInt(process.env.RATE_LIMIT_API_WINDOW_MS || "60000"),
      },
      authAttempts: {
        ...DefaultUserRateLimitConfig.authAttempts,
        maxRequests: parseInt(process.env.RATE_LIMIT_AUTH_ATTEMPTS || "5"),
        blockDurationMs: parseInt(
          process.env.RATE_LIMIT_AUTH_BLOCK_MS || "3600000"
        ),
      },
    };

    rateLimiterInstance = new UserRateLimiter(config);
  }

  return rateLimiterInstance;
}

/**
 * Rate limiting middleware for user operations
 */
export function createRateLimitMiddleware(
  operation: keyof UserRateLimitConfig
) {
  return async (userId: string, metadata?: Record<string, any>) => {
    const limiter = getUserRateLimiter();
    const result = await limiter.checkLimit(userId, operation, metadata);

    if (!result.allowed) {
      const error = new Error(
        result.blocked
          ? `Rate limit exceeded. Try again after ${result.resetTime.toISOString()}`
          : `Too many requests. ${result.remaining} remaining until ${result.resetTime.toISOString()}`
      );
      (error as any).statusCode = result.blocked ? 429 : 429;
      (error as any).rateLimit = result;
      throw error;
    }

    // Apply progressive delay
    const delay = await limiter.getProgressiveDelay(userId, operation);
    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    return result;
  };
}
