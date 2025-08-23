import { NextRequest, NextResponse } from "next/server";

import { performanceMonitor } from "../monitoring/performance-monitor";
import { redisCache } from "../redis-enhanced";

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  keyGenerator: (req: NextRequest) => string; // Function to generate rate limit key
  skipSuccessfulRequests: boolean; // Skip rate limiting for successful requests
  skipFailedRequests: boolean; // Skip rate limiting for failed requests
  message: string; // Error message
  statusCode: number; // HTTP status code for rate limit exceeded
  headers: boolean; // Include rate limit headers in response
  retryAfterHeader: boolean; // Include retry-after header
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number;
  retryAfter: number;
}

const DEFAULT_CONFIG: RateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100,
  keyGenerator: (req: NextRequest) => {
    // Use IP address as default key
    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0] : req.ip || "unknown";
    return `rate_limit:${ip}`;
  },
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
  message: "Too many requests, please try again later.",
  statusCode: 429,
  headers: true,
  retryAfterHeader: true,
};

class RateLimiter {
  private static instance: RateLimiter;
  private memoryStore: Map<string, { count: number; resetTime: number }> =
    new Map();

  private constructor() {
    // Clean up expired entries every minute
    if (typeof window === "undefined") {
      setInterval(() => this.cleanupMemoryStore(), 60000);
    }
  }

  static getInstance(): RateLimiter {
    if (!RateLimiter.instance) {
      RateLimiter.instance = new RateLimiter();
    }
    return RateLimiter.instance;
  }

  private async getRateLimitInfo(
    key: string,
    config: RateLimitConfig
  ): Promise<RateLimitInfo> {
    const now = Date.now();
    const _windowStart = now - config.windowMs;

    try {
      // Try Redis first
      const redisKey = `rate_limit:${key}`;
      const stored = await redisCache.get<{ count: number; resetTime: number }>(
        redisKey
      );

      if (stored && stored.resetTime > now) {
        return {
          limit: config.maxRequests,
          remaining: Math.max(0, config.maxRequests - stored.count),
          reset: stored.resetTime,
          retryAfter: Math.ceil((stored.resetTime - now) / 1000),
        };
      }

      // Fallback to memory store
      const memoryEntry = this.memoryStore.get(key);
      if (memoryEntry && memoryEntry.resetTime > now) {
        return {
          limit: config.maxRequests,
          remaining: Math.max(0, config.maxRequests - memoryEntry.count),
          reset: memoryEntry.resetTime,
          retryAfter: Math.ceil((memoryEntry.resetTime - now) / 1000),
        };
      }

      // No existing rate limit info
      return {
        limit: config.maxRequests,
        remaining: config.maxRequests,
        reset: now + config.windowMs,
        retryAfter: Math.ceil(config.windowMs / 1000),
      };
    } catch (error) {
      console.error("Rate limit info retrieval error:", error);
      // Fallback to memory store
      const memoryEntry = this.memoryStore.get(key);
      if (memoryEntry && memoryEntry.resetTime > now) {
        return {
          limit: config.maxRequests,
          remaining: Math.max(0, config.maxRequests - memoryEntry.count),
          reset: memoryEntry.resetTime,
          retryAfter: Math.ceil((memoryEntry.resetTime - now) / 1000),
        };
      }
      return {
        limit: config.maxRequests,
        remaining: config.maxRequests,
        reset: now + config.windowMs,
        retryAfter: Math.ceil(config.windowMs / 1000),
      };
    }
  }

  private async incrementRateLimit(
    key: string,
    config: RateLimitConfig
  ): Promise<RateLimitInfo> {
    const now = Date.now();
    const resetTime = now + config.windowMs;

    try {
      // Try Redis first
      const redisKey = `rate_limit:${key}`;
      const stored = await redisCache.get<{ count: number; resetTime: number }>(
        redisKey
      );

      if (stored && stored.resetTime > now) {
        const newCount = stored.count + 1;
        await redisCache.set(
          redisKey,
          { count: newCount, resetTime: stored.resetTime },
          Math.ceil(config.windowMs / 1000)
        );

        return {
          limit: config.maxRequests,
          remaining: Math.max(0, config.maxRequests - newCount),
          reset: stored.resetTime,
          retryAfter: Math.ceil((stored.resetTime - now) / 1000),
        };
      }
      // Start new window
      await redisCache.set(
        redisKey,
        { count: 1, resetTime },
        Math.ceil(config.windowMs / 1000)
      );

      return {
        limit: config.maxRequests,
        remaining: config.maxRequests - 1,
        reset: resetTime,
        retryAfter: Math.ceil(config.windowMs / 1000),
      };
    } catch (error) {
      console.error(
        "Rate limit increment error, falling back to memory:",
        error
      );
      // Fallback to memory store
      const memoryEntry = this.memoryStore.get(key);

      if (memoryEntry && memoryEntry.resetTime > now) {
        const newCount = memoryEntry.count + 1;
        this.memoryStore.set(key, {
          count: newCount,
          resetTime: memoryEntry.resetTime,
        });

        return {
          limit: config.maxRequests,
          remaining: Math.max(0, config.maxRequests - newCount),
          reset: memoryEntry.resetTime,
          retryAfter: Math.ceil((memoryEntry.resetTime - now) / 1000),
        };
      }
      // Start new window
      this.memoryStore.set(key, { count: 1, resetTime });

      return {
        limit: config.maxRequests,
        remaining: config.maxRequests - 1,
        reset: resetTime,
        retryAfter: Math.ceil(config.windowMs / 1000),
      };
    }
  }

  private cleanupMemoryStore(): void {
    const now = Date.now();
    for (const [key, entry] of this.memoryStore.entries()) {
      if (entry.resetTime <= now) {
        this.memoryStore.delete(key);
      }
    }
  }

  async checkRateLimit(
    req: NextRequest,
    config: Partial<RateLimitConfig> = {}
  ): Promise<{
    limited: boolean;
    info: RateLimitInfo;
    response?: NextResponse;
  }> {
    const finalConfig = { ...DEFAULT_CONFIG, ...config };
    const key = finalConfig.keyGenerator(req);

    const startTime = Date.now();

    try {
      const info = await this.incrementRateLimit(key, finalConfig);

      // Record rate limit check
      performanceMonitor.recordApiRequest(
        req.method,
        req.nextUrl?.pathname || "unknown",
        Date.now() - startTime,
        200,
        true,
        undefined,
        undefined,
        { rateLimitKey: key, rateLimitInfo: info }
      );

      if (info.remaining < 0) {
        // Rate limit exceeded
        const response = new NextResponse(
          JSON.stringify({
            error: "Rate limit exceeded",
            message: finalConfig.message,
            retryAfter: info.retryAfter,
          }),
          {
            status: finalConfig.statusCode,
            headers: {
              "Content-Type": "application/json",
              ...(finalConfig.retryAfterHeader && {
                "Retry-After": info.retryAfter.toString(),
              }),
            },
          }
        );

        if (finalConfig.headers) {
          response.headers.set("X-RateLimit-Limit", info.limit.toString());
          response.headers.set("X-RateLimit-Remaining", "0");
          response.headers.set(
            "X-RateLimit-Reset",
            new Date(info.reset).toISOString()
          );
        }

        return { limited: true, info, response };
      }

      return { limited: false, info };
    } catch (error) {
      console.error("Rate limit check error:", error);
      // On error, allow the request but log it
      return {
        limited: false,
        info: {
          limit: finalConfig.maxRequests,
          remaining: finalConfig.maxRequests,
          reset: Date.now() + finalConfig.windowMs,
          retryAfter: Math.ceil(finalConfig.windowMs / 1000),
        },
      };
    }
  }

  withRateLimiting(handler: Function, config: Partial<RateLimitConfig> = {}) {
    return async (req: NextRequest, ...args: any[]) => {
      const { limited, response } = await this.checkRateLimit(req, config);

      if (limited && response) {
        return response;
      }

      return handler(req, ...args);
    };
  }

  // Convenience methods for common rate limiting scenarios
  withStrictRateLimiting(handler: Function) {
    return this.withRateLimiting(handler, {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 10,
      message: "Too many requests. Please slow down.",
    });
  }

  withApiRateLimiting(handler: Function) {
    return this.withRateLimiting(handler, {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 1000,
      message: "API rate limit exceeded. Please try again later.",
    });
  }

  withAuthRateLimiting(handler: Function) {
    return this.withRateLimiting(handler, {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 5,
      message: "Too many authentication attempts. Please try again later.",
    });
  }
}

export const rateLimiter = RateLimiter.getInstance();
export const withRateLimiting = (
  handler: Function,
  config?: Partial<RateLimitConfig>
) => rateLimiter.withRateLimiting(handler, config);
export const withStrictRateLimiting = (handler: Function) =>
  rateLimiter.withStrictRateLimiting(handler);
export const withApiRateLimiting = (handler: Function) =>
  rateLimiter.withApiRateLimiting(handler);
export const withAuthRateLimiting = (handler: Function) =>
  rateLimiter.withAuthRateLimiting(handler);
