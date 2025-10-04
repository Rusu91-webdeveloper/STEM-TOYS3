import { Redis } from "@upstash/redis";
import { logger } from "@/lib/logger";

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  tags?: string[]; // Cache tags for bulk invalidation
  compress?: boolean; // Enable compression for large objects
}

export interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
  tags: string[];
  compressed: boolean;
}

/**
 * Enterprise Redis Cache with advanced features
 */
export class RedisCache {
  private redis: Redis;
  private defaultTtl: number;
  private compressionThreshold: number;

  constructor(options: {
    redis: Redis;
    defaultTtl?: number;
    compressionThreshold?: number; // Compress if size > threshold bytes
  }) {
    this.redis = options.redis;
    this.defaultTtl = options.defaultTtl || 300; // 5 minutes default
    this.compressionThreshold = options.compressionThreshold || 1024; // 1KB
  }

  /**
   * Get cached value with type safety
   */
  async get<T = any>(key: string): Promise<T | null> {
    try {
      const cached = await this.redis.get(key);

      if (!cached) {
        return null;
      }

      const entry: CacheEntry<T> =
        typeof cached === "string"
          ? JSON.parse(cached)
          : (cached as CacheEntry<T>);

      // Check if entry has expired
      if (this.isExpired(entry)) {
        await this.delete(key);
        return null;
      }

      // Decompress if needed
      if (entry.compressed) {
        // In a real implementation, you'd decompress here
        // For now, we'll assume compression is handled at a higher level
      }

      return entry.data;
    } catch (error) {
      logger.error("Cache get error:", { key, error });
      return null;
    }
  }

  /**
   * Set cached value with advanced options
   */
  async set<T = any>(
    key: string,
    value: T,
    options: CacheOptions = {}
  ): Promise<boolean> {
    try {
      const { ttl = this.defaultTtl, tags = [], compress = false } = options;

      // Compress if enabled and data is large
      let finalValue = value;
      let isCompressed = false;

      if (compress && this.shouldCompress(value)) {
        // In a real implementation, you'd compress here
        // For now, we'll just mark it as compressed
        isCompressed = true;
      }

      const entry: CacheEntry<T> = {
        data: finalValue,
        timestamp: Date.now(),
        ttl,
        tags,
        compressed: isCompressed,
      };

      // Store in Redis with TTL
      const success = await this.redis.setex(key, ttl, JSON.stringify(entry));

      // Add to tag sets for bulk invalidation
      if (tags.length > 0) {
        const tagPromises = tags.map(tag =>
          this.redis.sadd(`cache:tag:${tag}`, key)
        );
        await Promise.all(tagPromises);
      }

      return success === "OK";
    } catch (error) {
      logger.error("Cache set error:", { key, error });
      return false;
    }
  }

  /**
   * Delete cached value
   */
  async delete(key: string): Promise<boolean> {
    try {
      // Get entry to clean up tags
      const cached = await this.redis.get(key);
      if (cached) {
        const entry: CacheEntry =
          typeof cached === "string" ? JSON.parse(cached) : cached;

        // Remove from tag sets
        if (entry.tags.length > 0) {
          const tagPromises = entry.tags.map(tag =>
            this.redis.srem(`cache:tag:${tag}`, key)
          );
          await Promise.all(tagPromises);
        }
      }

      return (await this.redis.del(key)) > 0;
    } catch (error) {
      logger.error("Cache delete error:", { key, error });
      return false;
    }
  }

  /**
   * Check if key exists and is not expired
   */
  async exists(key: string): Promise<boolean> {
    try {
      const cached = await this.redis.get(key);

      if (!cached) {
        return false;
      }

      const entry: CacheEntry =
        typeof cached === "string" ? JSON.parse(cached) : cached;

      return !this.isExpired(entry);
    } catch (error) {
      logger.error("Cache exists error:", { key, error });
      return false;
    }
  }

  /**
   * Get cache TTL for key
   */
  async getTtl(key: string): Promise<number> {
    try {
      return await this.redis.ttl(key);
    } catch (error) {
      logger.error("Cache TTL error:", { key, error });
      return -1;
    }
  }

  /**
   * Invalidate cache by tags
   */
  async invalidateByTags(tags: string[]): Promise<number> {
    try {
      let totalInvalidated = 0;

      for (const tag of tags) {
        // Get all keys for this tag
        const keys = await this.redis.smembers(`cache:tag:${tag}`);

        if (keys.length > 0) {
          // Delete all keys
          const deleted = await this.redis.del(...keys);
          totalInvalidated += deleted;

          // Clean up tag set
          await this.redis.del(`cache:tag:${tag}`);
        }
      }

      logger.info("Cache invalidated by tags", {
        tags,
        invalidated: totalInvalidated,
      });
      return totalInvalidated;
    } catch (error) {
      logger.error("Cache tag invalidation error:", { tags, error });
      return 0;
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    totalKeys: number;
    memoryUsage: number;
    hitRate?: number;
    connected: boolean;
  }> {
    try {
      const info = await this.redis.info();

      // Parse Redis INFO command output
      const lines = info.split("\n");
      const stats: Record<string, string> = {};

      lines.forEach(line => {
        if (line.includes(":")) {
          const [key, value] = line.split(":");
          stats[key] = value;
        }
      });

      return {
        totalKeys: parseInt(stats.db0_keys || "0"),
        memoryUsage: parseInt(stats.used_memory || "0"),
        connected: true,
      };
    } catch (error) {
      logger.error("Cache stats error:", error);
      return {
        totalKeys: 0,
        memoryUsage: 0,
        connected: false,
      };
    }
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<boolean> {
    try {
      // Get all keys matching our cache pattern
      const keys = await this.redis.keys("cache:*");

      if (keys.length > 0) {
        await this.redis.del(...keys);
      }

      logger.info("Cache cleared", { keysCleared: keys.length });
      return true;
    } catch (error) {
      logger.error("Cache clear error:", error);
      return false;
    }
  }

  /**
   * Atomic increment operation
   */
  async increment(key: string, amount = 1): Promise<number> {
    try {
      return await this.redis.incrby(key, amount);
    } catch (error) {
      logger.error("Cache increment error:", { key, amount, error });
      return 0;
    }
  }

  /**
   * Set multiple values atomically
   */
  async mset(
    pairs: Array<{ key: string; value: any; options?: CacheOptions }>
  ): Promise<boolean> {
    try {
      const pipeline = this.redis.pipeline();

      pairs.forEach(({ key, value, options }) => {
        const entry: CacheEntry = {
          data: value,
          timestamp: Date.now(),
          ttl: options?.ttl || this.defaultTtl,
          tags: options?.tags || [],
          compressed: false,
        };

        pipeline.setex(key, entry.ttl, JSON.stringify(entry));

        // Add to tag sets
        if (entry.tags.length > 0) {
          entry.tags.forEach(tag => {
            pipeline.sadd(`cache:tag:${tag}`, key);
          });
        }
      });

      const results = await pipeline.exec();
      const success = results.every(result => result[1] === "OK");

      logger.info("Cache mset completed", { pairs: pairs.length, success });
      return success;
    } catch (error) {
      logger.error("Cache mset error:", error);
      return false;
    }
  }

  /**
   * Warm up cache with frequently accessed data
   */
  async warmup(
    warmupFn: () => Promise<
      Array<{ key: string; value: any; options?: CacheOptions }>
    >
  ): Promise<boolean> {
    try {
      const pairs = await warmupFn();

      if (pairs.length === 0) {
        return true;
      }

      return await this.mset(pairs);
    } catch (error) {
      logger.error("Cache warmup error:", error);
      return false;
    }
  }

  /**
   * Check if cache entry has expired
   */
  private isExpired(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp > entry.ttl * 1000;
  }

  /**
   * Determine if data should be compressed
   */
  private shouldCompress(data: any): boolean {
    const serialized = JSON.stringify(data);
    return serialized.length > this.compressionThreshold;
  }
}

// Singleton instance
let cacheInstance: RedisCache | null = null;

/**
 * Get the global cache instance
 */
export function getCache(): RedisCache {
  if (!cacheInstance) {
    // Initialize with environment variables
    const redis = new Redis({
      url: process.env.REDIS_URL!,
      token: process.env.REDIS_TOKEN!,
    });

    cacheInstance = new RedisCache({
      redis,
      defaultTtl: parseInt(process.env.API_CACHE_TTL || "300"),
      compressionThreshold: parseInt(
        process.env.API_CACHE_COMPRESSION_THRESHOLD || "1024"
      ),
    });
  }

  return cacheInstance;
}
