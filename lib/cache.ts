/**
 * Redis Cache Integration
 * Provides caching functionality for email marketing platform
 */

import { Redis } from "@upstash/redis";

// Redis client instance
let redis: Redis | null = null;

/**
 * Initialize Redis connection
 */
export function initializeRedis(): Redis {
  if (!redis) {
    redis = new Redis({
      url: process.env.REDIS_URL || "",
      token: process.env.REDIS_TOKEN || "",
      automaticDeserialization: true,
    });

    console.log("✅ Redis initialized successfully");
  }

  return redis;
}

/**
 * Get Redis client instance
 */
export function getRedisClient(): Redis {
  if (!redis) {
    return initializeRedis();
  }
  return redis;
}

/**
 * Cache interface for type safety
 */
export interface Cache {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttl?: number): Promise<void>;
  del(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
  expire(key: string, ttl: number): Promise<void>;
  ttl(key: string): Promise<number>;
  keys(pattern: string): Promise<string[]>;
  flush(): Promise<void>;
}

/**
 * Redis cache implementation
 */
export class RedisCache implements Cache {
  private client: Redis;

  constructor() {
    this.client = getRedisClient();
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.client.get(key);
      return value as T | null;
    } catch (error) {
      console.error("Redis get error:", error);
      return null;
    }
  }

  /**
   * Set value in cache
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      if (ttl) {
        await this.client.set(key, value, { ex: ttl });
      } else {
        await this.client.set(key, value);
      }
    } catch (error) {
      console.error("Redis set error:", error);
    }
  }

  /**
   * Delete key from cache
   */
  async del(key: string): Promise<void> {
    try {
      await this.client.del(key);
    } catch (error) {
      console.error("Redis del error:", error);
    }
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      console.error("Redis exists error:", error);
      return false;
    }
  }

  /**
   * Set expiration for key
   */
  async expire(key: string, ttl: number): Promise<void> {
    try {
      await this.client.expire(key, ttl);
    } catch (error) {
      console.error("Redis expire error:", error);
    }
  }

  /**
   * Get time to live for key
   */
  async ttl(key: string): Promise<number> {
    try {
      return await this.client.ttl(key);
    } catch (error) {
      console.error("Redis ttl error:", error);
      return -1;
    }
  }

  /**
   * Get keys matching pattern
   */
  async keys(pattern: string): Promise<string[]> {
    try {
      return await this.client.keys(pattern);
    } catch (error) {
      console.error("Redis keys error:", error);
      return [];
    }
  }

  /**
   * Flush all keys
   */
  async flush(): Promise<void> {
    try {
      await this.client.flushall();
    } catch (error) {
      console.error("Redis flush error:", error);
    }
  }

  /**
   * Get multiple values
   */
  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    try {
      const values = await this.client.mget(...keys);
      return values.map(value => value as T | null);
    } catch (error) {
      console.error("Redis mget error:", error);
      return keys.map(() => null);
    }
  }

  /**
   * Set multiple values
   */
  async mset<T>(
    entries: Array<{ key: string; value: T; ttl?: number }>
  ): Promise<void> {
    try {
      for (const { key, value, ttl } of entries) {
        if (ttl) {
          await this.client.set(key, value, { ex: ttl });
        } else {
          await this.client.set(key, value);
        }
      }
    } catch (error) {
      console.error("Redis mset error:", error);
    }
  }

  /**
   * Increment counter
   */
  async incr(key: string, ttl?: number): Promise<number> {
    try {
      const result = await this.client.incr(key);

      if (ttl) {
        await this.client.expire(key, ttl);
      }

      return result;
    } catch (error) {
      console.error("Redis incr error:", error);
      return 0;
    }
  }

  /**
   * Add to set
   */
  async sadd(key: string, ...members: string[]): Promise<number> {
    try {
      return await this.client.sadd(key, ...members);
    } catch (error) {
      console.error("Redis sadd error:", error);
      return 0;
    }
  }

  /**
   * Get set members
   */
  async smembers(key: string): Promise<string[]> {
    try {
      return await this.client.smembers(key);
    } catch (error) {
      console.error("Redis smembers error:", error);
      return [];
    }
  }

  /**
   * Remove from set
   */
  async srem(key: string, ...members: string[]): Promise<number> {
    try {
      return await this.client.srem(key, ...members);
    } catch (error) {
      console.error("Redis srem error:", error);
      return 0;
    }
  }

  /**
   * Add to sorted set
   */
  async zadd(key: string, score: number, member: string): Promise<number> {
    try {
      return await this.client.zadd(key, score, member);
    } catch (error) {
      console.error("Redis zadd error:", error);
      return 0;
    }
  }

  /**
   * Get sorted set range
   */
  async zrange(
    key: string,
    start: number,
    stop: number,
    withScores = false
  ): Promise<string[]> {
    try {
      const options = withScores ? "WITHSCORES" : undefined;
      return await this.client.zrange(key, start, stop, options);
    } catch (error) {
      console.error("Redis zrange error:", error);
      return [];
    }
  }

  /**
   * Get sorted set score
   */
  async zscore(key: string, member: string): Promise<number | null> {
    try {
      const score = await this.client.zscore(key, member);
      return score ? parseFloat(score) : null;
    } catch (error) {
      console.error("Redis zscore error:", error);
      return null;
    }
  }

  /**
   * Hash operations
   */
  async hset(key: string, field: string, value: string): Promise<number> {
    try {
      return await this.client.hset(key, field, value);
    } catch (error) {
      console.error("Redis hset error:", error);
      return 0;
    }
  }

  async hget(key: string, field: string): Promise<string | null> {
    try {
      return await this.client.hget(key, field);
    } catch (error) {
      console.error("Redis hget error:", error);
      return null;
    }
  }

  async hgetall(key: string): Promise<Record<string, string>> {
    try {
      return await this.client.hgetall(key);
    } catch (error) {
      console.error("Redis hgetall error:", error);
      return {};
    }
  }

  async hdel(key: string, ...fields: string[]): Promise<number> {
    try {
      return await this.client.hdel(key, ...fields);
    } catch (error) {
      console.error("Redis hdel error:", error);
      return 0;
    }
  }

  /**
   * List operations
   */
  async lpush(key: string, ...values: string[]): Promise<number> {
    try {
      return await this.client.lpush(key, ...values);
    } catch (error) {
      console.error("Redis lpush error:", error);
      return 0;
    }
  }

  async rpush(key: string, ...values: string[]): Promise<number> {
    try {
      return await this.client.rpush(key, ...values);
    } catch (error) {
      console.error("Redis rpush error:", error);
      return 0;
    }
  }

  async lpop(key: string): Promise<string | null> {
    try {
      return await this.client.lpop(key);
    } catch (error) {
      console.error("Redis lpop error:", error);
      return null;
    }
  }

  async rpop(key: string): Promise<string | null> {
    try {
      return await this.client.rpop(key);
    } catch (error) {
      console.error("Redis rpop error:", error);
      return null;
    }
  }

  async lrange(key: string, start: number, stop: number): Promise<string[]> {
    try {
      return await this.client.lrange(key, start, stop);
    } catch (error) {
      console.error("Redis lrange error:", error);
      return [];
    }
  }

  async llen(key: string): Promise<number> {
    try {
      return await this.client.llen(key);
    } catch (error) {
      console.error("Redis llen error:", error);
      return 0;
    }
  }

  /**
   * Health check
   */
  async ping(): Promise<string> {
    try {
      return await this.client.ping();
    } catch (error) {
      console.error("Redis ping error:", error);
      throw error;
    }
  }

  /**
   * Get Redis info
   */
  async info(): Promise<string> {
    try {
      return await this.client.info();
    } catch (error) {
      console.error("Redis info error:", error);
      return "";
    }
  }

  /**
   * Close Redis connection
   */
  async close(): Promise<void> {
    try {
      await this.client.quit();
      redis = null;
    } catch (error) {
      console.error("Redis close error:", error);
    }
  }
}

// Export singleton cache instance
export const cache = new RedisCache();

/**
 * Generic caching function that wraps async operations with Redis caching
 * @param key - Cache key
 * @param fetchFn - Async function that fetches the data
 * @param ttl - Time to live in milliseconds
 * @returns Cached data or fresh data from fetchFn
 */
export async function getCached<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttl: number = 300000 // Default 5 minutes
): Promise<T> {
  try {
    // Check if Redis is configured
    const isRedisConfigured = !!(
      process.env.REDIS_URL && process.env.REDIS_TOKEN
    );

    if (!isRedisConfigured) {
      // Redis not configured, just fetch fresh data
      console.warn(`Redis not configured, skipping cache for key: ${key}`);
      return await fetchFn();
    }

    // Try to get from cache first
    const cached = await cache.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // If not in cache, fetch fresh data
    const freshData = await fetchFn();

    // Store in cache
    await cache.set(key, freshData, Math.floor(ttl / 1000)); // Convert ms to seconds

    return freshData;
  } catch (error) {
    console.error(`Cache error for key ${key}:`, error);

    // If cache fails, still try to fetch fresh data
    try {
      return await fetchFn();
    } catch (fetchError) {
      console.error(`Fetch error for key ${key}:`, fetchError);
      throw fetchError;
    }
  }
}

/**
 * Cache key functions for consistent naming
 */
export const CacheKeys = {
  // Basic key generators
  product: (id?: string) => id ? `product:${id}` : "product",
  category: (id?: string) => id ? `category:${id}` : "category",
  user: (id?: string) => id ? `user:${id}` : "user",
  order: (id?: string) => id ? `order:${id}` : "order",
  cart: (id?: string) => id ? `cart:${id}` : "cart",
  book: (id?: string) => id ? `book:${id}` : "book",
  
  // List keys
  products: (params?: Record<string, any>) => {
    if (!params || Object.keys(params).length === 0) return "products";
    const sortedKeys = Object.keys(params).sort();
    const paramString = sortedKeys
      .map(key => `${key}=${encodeURIComponent(JSON.stringify(params[key]))}`)
      .join("&");
    return `products:${paramString}`;
  },
  productList: (params?: Record<string, any>) => {
    if (!params || Object.keys(params).length === 0) return "products";
    const sortedKeys = Object.keys(params).sort();
    const paramString = sortedKeys
      .map(key => `${key}=${encodeURIComponent(JSON.stringify(params[key]))}`)
      .join("&");
    return `products:${paramString}`;
  },
  categories: (params?: Record<string, any>) => {
    if (!params || Object.keys(params).length === 0) return "categories";
    const sortedKeys = Object.keys(params).sort();
    const paramString = sortedKeys
      .map(key => `${key}=${encodeURIComponent(JSON.stringify(params[key]))}`)
      .join("&");
    return `categories:${paramString}`;
  },
  orders: (params?: Record<string, any>) => {
    if (!params || Object.keys(params).length === 0) return "orders";
    const sortedKeys = Object.keys(params).sort();
    const paramString = sortedKeys
      .map(key => `${key}=${encodeURIComponent(JSON.stringify(params[key]))}`)
      .join("&");
    return `orders:${paramString}`;
  },
  users: (params?: Record<string, any>) => {
    if (!params || Object.keys(params).length === 0) return "users";
    const sortedKeys = Object.keys(params).sort();
    const paramString = sortedKeys
      .map(key => `${key}=${encodeURIComponent(JSON.stringify(params[key]))}`)
      .join("&");
    return `users:${paramString}`;
  },
  books: (params?: Record<string, any>) => {
    if (!params || Object.keys(params).length === 0) return "books";
    const sortedKeys = Object.keys(params).sort();
    const paramString = sortedKeys
      .map(key => `${key}=${encodeURIComponent(JSON.stringify(params[key]))}`)
      .join("&");
    return `books:${paramString}`;
  },
  
  // Special keys
  health: () => "health",
  analytics: (type?: string) => type ? `analytics:${type}` : "analytics",
  dashboard: (type?: string) => type ? `dashboard:${type}` : "dashboard",
  customers: (params?: Record<string, any>) => {
    if (!params || Object.keys(params).length === 0) return "customers";
    const sortedKeys = Object.keys(params).sort();
    const paramString = sortedKeys
      .map(key => `${key}=${encodeURIComponent(JSON.stringify(params[key]))}`)
      .join("&");
    return `customers:${paramString}`;
  },
  blog: (id?: string) => id ? `blog:${id}` : "blog",
  comments: (id?: string) => id ? `comments:${id}` : "comments",
  reviews: (id?: string) => id ? `reviews:${id}` : "reviews",
  coupons: (id?: string) => id ? `coupons:${id}` : "coupons",
  settings: (type?: string) => type ? `settings:${type}` : "settings",
  tax: (type?: string) => type ? `tax:${type}` : "tax",
  shipping: (type?: string) => type ? `shipping:${type}` : "shipping",
  
  // Legacy constants for backward compatibility
  PRODUCTS: "products",
  PRODUCT: "product",
  CATEGORIES: "categories",
  CATEGORY: "category",
  USERS: "users",
  USER: "user",
  ORDERS: "orders",
  ORDER: "order",
  CART: "cart",
  BOOKS: "books",
  BOOK: "book",
  HEALTH: "health",
  ANALYTICS: "analytics",
  DASHBOARD: "dashboard",
  CUSTOMERS: "customers",
  BLOG: "blog",
  COMMENTS: "comments",
  REVIEWS: "reviews",
  COUPONS: "coupons",
  SETTINGS: "settings",
  TAX: "tax",
  SHIPPING: "shipping",
} as const;

/**
 * Invalidate cache by pattern
 * @param pattern - Redis pattern to match keys for deletion
 */
export async function invalidateCachePattern(pattern: string): Promise<void> {
  try {
    const keys = await cache.keys(pattern);
    if (keys.length > 0) {
      await Promise.all(keys.map(key => cache.del(key)));
      console.log(
        `Invalidated ${keys.length} cache keys matching pattern: ${pattern}`
      );
    }
  } catch (error) {
    console.error(`Error invalidating cache pattern ${pattern}:`, error);
  }
}

/**
 * Invalidate specific cache key
 * @param key - Cache key to invalidate
 */
export async function invalidateCache(key: string): Promise<void> {
  try {
    await cache.del(key);
    console.log(`Invalidated cache key: ${key}`);
  } catch (error) {
    console.error(`Error invalidating cache key ${key}:`, error);
  }
}

// Export cache utilities
export const cacheUtils = {
  /**
   * Generate cache key with prefix
   */
  key: (prefix: string, ...parts: (string | number)[]): string => {
    return `${prefix}:${parts.join(":")}`;
  },

  /**
   * Generate cache key for user data
   */
  userKey: (userId: string, type: string): string => {
    return cacheUtils.key("user", userId, type);
  },

  /**
   * Generate cache key for email data
   */
  emailKey: (emailId: string, type: string): string => {
    return cacheUtils.key("email", emailId, type);
  },

  /**
   * Generate cache key for campaign data
   */
  campaignKey: (campaignId: string, type: string): string => {
    return cacheUtils.key("campaign", campaignId, type);
  },

  /**
   * Generate cache key for sequence data
   */
  sequenceKey: (sequenceId: string, type: string): string => {
    return cacheUtils.key("sequence", sequenceId, type);
  },

  /**
   * Generate cache key for template data
   */
  templateKey: (templateId: string, type: string): string => {
    return cacheUtils.key("template", templateId, type);
  },

  /**
   * Generate cache key for analytics data
   */
  analyticsKey: (type: string, ...parts: (string | number)[]): string => {
    return cacheUtils.key("analytics", type, ...parts);
  },

  /**
   * Default TTL values
   */
  TTL: {
    SHORT: 300, // 5 minutes
    MEDIUM: 1800, // 30 minutes
    LONG: 3600, // 1 hour
    DAY: 86400, // 24 hours
    WEEK: 604800, // 7 days
    MONTH: 2592000, // 30 days
  },
};
