/**
 * Specialized rate limiter for session endpoints
 * Allows more frequent checks since these are necessary for auth state
 */

import { redis, isRedisConfigured } from "@/lib/redis";

interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

// In-memory fallback for development
const memoryStore = new Map<string, { count: number; reset: number }>();

export async function sessionRateLimit(
  identifier: string,
  limit: number = 60, // 60 requests per window (much higher for session checks)
  window: number = 60 // 60 second window
): Promise<RateLimitResult> {
  const now = Date.now();
  const key = `session_ratelimit:${identifier}`;
  const reset = now + window * 1000;

  // Use Redis if available and configured
  if (isRedisConfigured) {
    try {
      // Use atomic increment with expiry. If key is new, set expiry too.
      const count = await redis.incr(key);
      if (count === 1) {
        // Set expiry on first increment
        await redis.expire(key, window);
      }

      return {
        success: count <= limit,
        limit,
        remaining: Math.max(0, limit - count),
        reset,
      };
    } catch (error) {
      console.error("Redis rate limit error:", error);
      // Fall through to memory store
    }
  }

  // In-memory fallback
  const stored = memoryStore.get(key);

  if (!stored || stored.reset < now) {
    memoryStore.set(key, { count: 1, reset });
    return {
      success: true,
      limit,
      remaining: limit - 1,
      reset,
    };
  }

  stored.count++;

  return {
    success: stored.count <= limit,
    limit,
    remaining: Math.max(0, limit - stored.count),
    reset: stored.reset,
  };
}

// Clean up old entries periodically in memory store
if (!isRedisConfigured) {
  setInterval(() => {
    const now = Date.now();
    for (const [key, value] of memoryStore.entries()) {
      if (value.reset < now) {
        memoryStore.delete(key);
      }
    }
  }, 60000); // Clean up every minute
}
