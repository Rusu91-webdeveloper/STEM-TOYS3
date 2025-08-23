import { Redis } from "@upstash/redis";
import { createClient } from "ioredis";

// Enhanced Redis configuration with multiple clients for different use cases
export interface RedisConfig {
  url: string;
  token: string;
  timeout?: number;
  maxRetries?: number;
  retryDelay?: number;
}

// Configuration
const REDIS_CONFIG: RedisConfig = {
  url: process.env.REDIS_URL ?? "",
  token: process.env.REDIS_TOKEN ?? "",
  timeout: parseInt(process.env.REDIS_TIMEOUT ?? "5000", 10),
  maxRetries: parseInt(process.env.REDIS_MAX_RETRIES ?? "3", 10),
  retryDelay: parseInt(process.env.REDIS_RETRY_DELAY ?? "1000", 10),
};

// Check if Redis is properly configured
export const isRedisConfigured = !!(REDIS_CONFIG.url && REDIS_CONFIG.token);

// Create Upstash Redis client for simple operations
export const upstashRedis = new Redis({
  url: REDIS_CONFIG.url,
  token: REDIS_CONFIG.token,
  automaticDeserialization: true,
});

// Create IORedis client for advanced operations and connection pooling
export const ioredisClient = isRedisConfigured
  ? createClient({
      host: new URL(REDIS_CONFIG.url).hostname,
      port: parseInt(new URL(REDIS_CONFIG.url).port),
      password: REDIS_CONFIG.token,
      retryDelayOnFailover: REDIS_CONFIG.retryDelay,
      maxRetriesPerRequest: REDIS_CONFIG.maxRetries,
      lazyConnect: true,
      keepAlive: 30000,
      connectTimeout: REDIS_CONFIG.timeout,
      commandTimeout: REDIS_CONFIG.timeout,
      // Connection pool settings
      maxRetriesPerRequest: 3,
      retryDelayOnFailover: 100,
      enableReadyCheck: true,
      maxLoadingTimeout: 10000,
    })
  : null;

// Memory cache fallback
const memoryCache = new Map<string, { value: any; expiry: number }>();

// Enhanced timeout wrapper with retry logic
async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = REDIS_CONFIG.maxRetries!,
  retryDelay: number = REDIS_CONFIG.retryDelay!
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await Promise.race([
        operation(),
        new Promise<never>((_, reject) => {
          setTimeout(() => {
            reject(
              new Error(
                `Redis operation timed out after ${REDIS_CONFIG.timeout}ms`
              )
            );
          }, REDIS_CONFIG.timeout);
        }),
      ]);
    } catch (error) {
      lastError = error as Error;

      if (attempt < maxRetries) {
        console.warn(
          `Redis operation failed (attempt ${attempt + 1}/${maxRetries + 1}):`,
          error
        );
        await new Promise(resolve =>
          setTimeout(resolve, retryDelay * (attempt + 1))
        );
      }
    }
  }

  throw lastError!;
}

// Enhanced cache operations with better error handling
export class EnhancedRedisCache {
  private static instance: EnhancedRedisCache;

  static getInstance(): EnhancedRedisCache {
    if (!EnhancedRedisCache.instance) {
      EnhancedRedisCache.instance = new EnhancedRedisCache();
    }
    return EnhancedRedisCache.instance;
  }

  async get<T>(key: string): Promise<T | null> {
    if (!isRedisConfigured) {
      return this.getFromMemory<T>(key);
    }

    try {
      return await withRetry(async () => {
        const result = await upstashRedis.get(key);
        return result as T;
      });
    } catch (error) {
      console.error("Redis get error, falling back to memory:", error);
      return this.getFromMemory<T>(key);
    }
  }

  async set<T>(
    key: string,
    value: T,
    expirationSeconds: number = 3600
  ): Promise<boolean> {
    if (!isRedisConfigured) {
      return this.setInMemory(key, value, expirationSeconds);
    }

    try {
      return await withRetry(async () => {
        await upstashRedis.set(key, value, { ex: expirationSeconds });
        return true;
      });
    } catch (error) {
      console.error("Redis set error, falling back to memory:", error);
      return this.setInMemory(key, value, expirationSeconds);
    }
  }

  async del(key: string): Promise<boolean> {
    if (!isRedisConfigured) {
      return this.deleteFromMemory(key);
    }

    try {
      return await withRetry(async () => {
        const result = await upstashRedis.del(key);
        return result > 0;
      });
    } catch (error) {
      console.error("Redis del error, falling back to memory:", error);
      return this.deleteFromMemory(key);
    }
  }

  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    if (!isRedisConfigured) {
      return Promise.all(keys.map(key => this.getFromMemory<T>(key)));
    }

    try {
      return await withRetry(async () => {
        const results = await upstashRedis.mget(...keys);
        return results as (T | null)[];
      });
    } catch (error) {
      console.error("Redis mget error, falling back to memory:", error);
      return Promise.all(keys.map(key => this.getFromMemory<T>(key)));
    }
  }

  async mset<T>(
    entries: Array<{ key: string; value: T; expirationSeconds?: number }>
  ): Promise<boolean> {
    if (!isRedisConfigured) {
      return Promise.all(
        entries.map(({ key, value, expirationSeconds }) =>
          this.setInMemory(key, value, expirationSeconds || 3600)
        )
      ).then(() => true);
    }

    try {
      return await withRetry(async () => {
        // For Upstash, we need to set each key individually with expiration
        await Promise.all(
          entries.map(({ key, value, expirationSeconds }) =>
            upstashRedis.set(key, value, { ex: expirationSeconds || 3600 })
          )
        );
        return true;
      });
    } catch (error) {
      console.error("Redis mset error, falling back to memory:", error);
      return Promise.all(
        entries.map(({ key, value, expirationSeconds }) =>
          this.setInMemory(key, value, expirationSeconds || 3600)
        )
      ).then(() => true);
    }
  }

  // Memory cache fallback methods
  private getFromMemory<T>(key: string): T | null {
    const item = memoryCache.get(key);
    if (item && item.expiry > Date.now()) {
      return item.value;
    }
    if (item) {
      memoryCache.delete(key); // Clean up expired item
    }
    return null;
  }

  private setInMemory<T>(
    key: string,
    value: T,
    expirationSeconds: number
  ): boolean {
    memoryCache.set(key, {
      value,
      expiry: Date.now() + expirationSeconds * 1000,
    });
    return true;
  }

  private deleteFromMemory(key: string): boolean {
    return memoryCache.delete(key);
  }

  // Health check method
  async healthCheck(): Promise<{
    status: "healthy" | "unhealthy";
    error?: string;
  }> {
    if (!isRedisConfigured) {
      return { status: "healthy" }; // Memory cache is always available
    }

    try {
      await withRetry(async () => {
        await upstashRedis.ping();
      });
      return { status: "healthy" };
    } catch (error) {
      return {
        status: "unhealthy",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  // Cleanup expired memory cache entries
  cleanupMemoryCache(): void {
    const now = Date.now();
    for (const [key, item] of memoryCache.entries()) {
      if (item.expiry <= now) {
        memoryCache.delete(key);
      }
    }
  }
}

// Export singleton instance
export const redisCache = EnhancedRedisCache.getInstance();

// Legacy compatibility exports
export const getCartFromCache = (userId: string): Promise<string | null> =>
  redisCache.get<string>(`cart:${userId}`);

export const setCartInCache = (
  userId: string,
  cart: unknown,
  expirationSeconds = 600
): Promise<boolean> =>
  redisCache.set(`cart:${userId}`, cart, expirationSeconds);

export const invalidateCartCache = (userId: string): Promise<boolean> =>
  redisCache.del(`cart:${userId}`);

// Initialize cleanup interval for memory cache
if (typeof window === "undefined") {
  setInterval(() => {
    redisCache.cleanupMemoryCache();
  }, 60000); // Clean up every minute
}
