/**
 * Advanced caching system with Redis support and in-memory fallback
 */

import { TIME, CACHE_LIMITS } from "./constants";
import { logger } from "./logger";

// Cache configuration
interface CacheConfig {
  defaultTTL: number;
  maxInMemoryItems: number;
  keyPrefix: string;
}

const config: CacheConfig = {
  defaultTTL: TIME.CACHE_DURATION.MEDIUM,
  maxInMemoryItems: CACHE_LIMITS.MAX_IN_MEMORY_ITEMS,
  keyPrefix: "stemtoys:cache:",
};

// In-memory cache fallback
class InMemoryCache {
  private cache = new Map<
    string,
    { data: any; expiry: number; hits: number }
  >();
  private stats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
  };

  set(key: string, data: any, ttl?: number): void {
    const expiry = Date.now() + (ttl || config.defaultTTL);

    // Prevent memory overflow
    if (this.cache.size >= config.maxInMemoryItems) {
      this.evictLeastUsed();
    }

    this.cache.set(key, { data, expiry, hits: 0 });
    this.stats.sets++;

    logger.debug("Cache SET (memory)", { key, ttl: ttl || config.defaultTTL });
  }

  get(key: string): any | null {
    const item = this.cache.get(key);

    if (!item) {
      this.stats.misses++;
      return null;
    }

    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    item.hits++;
    this.stats.hits++;
    logger.debug("Cache HIT (memory)", { key, hits: item.hits });
    return item.data;
  }

  delete(key: string): void {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.stats.deletes++;
      logger.debug("Cache DELETE (memory)", { key });
    }
  }

  clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    this.stats = { hits: 0, misses: 0, sets: 0, deletes: 0 };
    logger.info("Cache CLEAR (memory)", { itemsCleared: size });
  }

  private evictLeastUsed(): void {
    let leastUsedKey = "";
    let leastHits = Infinity;
    let oldestExpiry = Infinity;

    for (const [key, item] of this.cache.entries()) {
      // Prioritize expired items
      if (Date.now() > item.expiry) {
        this.cache.delete(key);
        return;
      }

      // Then least used items
      if (
        item.hits < leastHits ||
        (item.hits === leastHits && item.expiry < oldestExpiry)
      ) {
        leastUsedKey = key;
        leastHits = item.hits;
        oldestExpiry = item.expiry;
      }
    }

    if (leastUsedKey) {
      this.cache.delete(leastUsedKey);
      logger.debug("Cache EVICT (memory)", {
        key: leastUsedKey,
        hits: leastHits,
      });
    }
  }

  getStats() {
    const hitRate =
      this.stats.hits + this.stats.misses > 0
        ? (this.stats.hits / (this.stats.hits + this.stats.misses)) * 100
        : 0;

    return {
      ...this.stats,
      size: this.cache.size,
      hitRate: Math.round(hitRate * 100) / 100,
      type: "memory",
    };
  }

  cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.debug("Cache CLEANUP (memory)", { itemsRemoved: cleaned });
    }
  }
}

// Redis cache implementation (when available)
class RedisCache {
  private redis: any = null;
  private isConnected = false;
  private stats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    errors: 0,
  };

  constructor() {
    this.initializeRedis();
  }

  private async initializeRedis() {
    try {
      // Check if Redis is explicitly disabled
      if (process.env.DISABLE_REDIS === "true") {
        logger.info("Redis disabled via DISABLE_REDIS environment variable");
        return;
      }

      // Only initialize Redis if connection string is available
      if (!process.env.REDIS_URL && !process.env.UPSTASH_REDIS_REST_URL) {
        logger.info("No Redis configuration found, using in-memory cache only");
        return;
      }

      // Dynamic import of Redis (install when needed)
      let Redis;
      try {
        if (process.env.UPSTASH_REDIS_REST_URL) {
          const { Redis: UpstashRedis } = await import("@upstash/redis");
          this.redis = new UpstashRedis({
            url: process.env.UPSTASH_REDIS_REST_URL!,
            token: process.env.UPSTASH_REDIS_REST_TOKEN!,
          });
        } else {
          const ioredis = await import("ioredis");
          Redis = ioredis.default;
          this.redis = new Redis(process.env.REDIS_URL!, {
            enableReadyCheck: false,
            maxRetriesPerRequest: 1,
            lazyConnect: true,
            connectTimeout: 5000,
            commandTimeout: 5000,
          });
        }

        // Test connection with timeout
        const connectionTimeout = setTimeout(() => {
          throw new Error("Redis connection timeout");
        }, 5000);

        await this.redis.ping();
        clearTimeout(connectionTimeout);

        this.isConnected = true;
        logger.info("Redis cache initialized successfully");
      } catch (importError) {
        logger.warn(
          "Redis package not available, falling back to in-memory cache",
          {
            error:
              importError instanceof Error
                ? importError.message
                : "Unknown error",
          }
        );
      }
    } catch (error) {
      logger.warn("Failed to connect to Redis, using in-memory cache only", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      this.isConnected = false;
    }
  }

  async set(key: string, data: any, ttl?: number): Promise<void> {
    if (!this.isConnected || !this.redis) return;

    try {
      let serializedData: string;
      if (typeof data === "string") {
        // Check if it's already valid JSON
        try {
          JSON.parse(data);
          serializedData = data; // Already valid JSON string
        } catch {
          // Not valid JSON, wrap as JSON string
          serializedData = JSON.stringify({ value: data });
          logger.warn(
            "RedisCache.set: String data was not valid JSON, wrapping in object",
            { key, data }
          );
        }
      } else {
        try {
          serializedData = JSON.stringify(data);
        } catch (err) {
          logger.error("RedisCache.set: Failed to serialize data", {
            key,
            data,
            error: err,
          });
          return;
        }
      }
      const ttlSeconds = Math.floor((ttl || config.defaultTTL) / 1000);

      await this.redis.setex(
        config.keyPrefix + key,
        ttlSeconds,
        serializedData
      );
      this.stats.sets++;

      logger.debug("Cache SET (redis)", { key, ttl: ttlSeconds });
    } catch (error) {
      this.stats.errors++;
      logger.error("Redis SET error", { key, error });
    }
  }

  async get(key: string): Promise<any | null> {
    if (!this.isConnected || !this.redis) return null;

    try {
      const data = await this.redis.get(config.keyPrefix + key);

      if (data === null) {
        this.stats.misses++;
        return null;
      }

      this.stats.hits++;
      logger.debug("Cache HIT (redis)", { key });
      // If data is wrapped as { value: ... }, unwrap it
      let parsed;
      try {
        parsed = JSON.parse(data);
      } catch (err) {
        logger.error("RedisCache.get: Failed to parse cached data", {
          key,
          data,
          error: err,
        });
        // Auto-delete the bad cache entry to self-heal
        try {
          await this.redis.del(config.keyPrefix + key);
          logger.warn(
            "RedisCache.get: Deleted bad cache entry after parse error",
            { key }
          );
        } catch (delErr) {
          logger.error("RedisCache.get: Failed to delete bad cache entry", {
            key,
            error: delErr,
          });
        }
        return null;
      }
      if (
        parsed &&
        typeof parsed === "object" &&
        Object.keys(parsed).length === 1 &&
        parsed.value !== undefined
      ) {
        return parsed.value;
      }
      return parsed;
    } catch (error) {
      this.stats.errors++;
      logger.error("Redis GET error", { key, error });
      return null;
    }
  }

  async delete(key: string): Promise<void> {
    if (!this.isConnected || !this.redis) return;

    try {
      const deleted = await this.redis.del(config.keyPrefix + key);
      if (deleted) {
        this.stats.deletes++;
        logger.debug("Cache DELETE (redis)", { key });
      }
    } catch (error) {
      this.stats.errors++;
      logger.error("Redis DELETE error", { key, error });
    }
  }

  async clear(pattern?: string): Promise<void> {
    if (!this.isConnected || !this.redis) return;

    try {
      const searchPattern = config.keyPrefix + (pattern || "*");
      const keys = await this.redis.keys(searchPattern);

      if (keys.length > 0) {
        await this.redis.del(...keys);
        logger.info("Cache CLEAR (redis)", {
          itemsCleared: keys.length,
          pattern: searchPattern,
        });
      }
    } catch (error) {
      this.stats.errors++;
      logger.error("Redis CLEAR error", { error });
    }
  }

  getStats() {
    const hitRate =
      this.stats.hits + this.stats.misses > 0
        ? (this.stats.hits / (this.stats.hits + this.stats.misses)) * 100
        : 0;

    return {
      ...this.stats,
      hitRate: Math.round(hitRate * 100) / 100,
      isConnected: this.isConnected,
      type: "redis",
    };
  }
}

// Unified cache interface
class CacheManager {
  private redisCache: RedisCache;
  private memoryCache: InMemoryCache;

  constructor() {
    this.redisCache = new RedisCache();
    this.memoryCache = new InMemoryCache();

    // Cleanup memory cache every 10 minutes
    setInterval(
      () => {
        this.memoryCache.cleanup();
      },
      10 * 60 * 1000
    );
  }

  async set(key: string, data: any, ttl?: number): Promise<void> {
    // Always set in memory cache for immediate access
    this.memoryCache.set(key, data, ttl);

    // Also set in Redis if available
    await this.redisCache.set(key, data, ttl);
  }

  async get(key: string): Promise<any | null> {
    // Try memory cache first (fastest)
    let data = this.memoryCache.get(key);
    if (data !== null) {
      return data;
    }

    // Fall back to Redis
    data = await this.redisCache.get(key);
    if (data !== null) {
      // Cache in memory for next time
      this.memoryCache.set(key, data);
      return data;
    }

    return null;
  }

  async delete(key: string): Promise<void> {
    this.memoryCache.delete(key);
    await this.redisCache.delete(key);
  }

  async clear(pattern?: string): Promise<void> {
    this.memoryCache.clear();
    await this.redisCache.clear(pattern);
  }

  getStats() {
    return {
      memory: this.memoryCache.getStats(),
      redis: this.redisCache.getStats(),
    };
  }

  async invalidateByPattern(pattern: string): Promise<void> {
    // For memory cache, we need to iterate and check keys
    // For Redis, we can use the clear method with pattern
    await this.redisCache.clear(pattern);

    // Memory cache pattern invalidation would need custom implementation
    logger.info("Cache invalidation by pattern", { pattern });
  }
}

// Create singleton instance
export const cache = new CacheManager();

// Utility functions
export async function getCached<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl?: number
): Promise<T> {
  // Try to get from cache first
  const cached = await cache.get(key);
  if (cached !== null) {
    return cached;
  }

  // Fetch fresh data
  const data = await fetcher();

  // Cache the result
  await cache.set(key, data, ttl);

  return data;
}

export async function invalidateCache(key: string): Promise<void> {
  await cache.delete(key);
}

export async function invalidateCachePattern(pattern: string): Promise<void> {
  await cache.invalidateByPattern(pattern);
}

export function getCacheStats() {
  return cache.getStats();
}

// Cache key builders for common patterns
export const CacheKeys = {
  product: (id: string) => `product:${id}`,
  productList: (filters: Record<string, any>) =>
    `products:${JSON.stringify(filters)}`,
  category: (id: string) => `category:${id}`,
  user: (id: string) => `user:${id}`,
  cart: (userId: string) => `cart:${userId}`,
  order: (id: string) => `order:${id}`,
  book: (id: string) => `book:${id}`,
  health: () => "health:status",
};

// Export types
export type { CacheConfig };
