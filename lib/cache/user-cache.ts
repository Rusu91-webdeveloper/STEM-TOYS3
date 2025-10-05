import { getCache, RedisCache, CacheOptions } from "./redis-cache";
import { logger } from "@/lib/logger";
import { User, UserSegment, LifecycleStage } from "@prisma/client";

export interface UserCacheConfig {
  profileTtl: number; // User profile cache TTL
  searchTtl: number; // User search results TTL
  segmentTtl: number; // User segment data TTL
  statsTtl: number; // User statistics TTL
  analyticsTtl: number; // User analytics TTL
}

/**
 * User-specific caching service for Phase 5 performance optimization
 */
export class UserCacheService {
  private cache: RedisCache;
  private config: UserCacheConfig;

  constructor(config: Partial<UserCacheConfig> = {}) {
    this.cache = getCache();
    this.config = {
      profileTtl: config.profileTtl || 300, // 5 minutes
      searchTtl: config.searchTtl || 180, // 3 minutes
      segmentTtl: config.segmentTtl || 600, // 10 minutes
      statsTtl: config.statsTtl || 900, // 15 minutes
      analyticsTtl: config.analyticsTtl || 1800, // 30 minutes
    };
  }

  /**
   * Cache user profile data with smart invalidation
   */
  async cacheUserProfile(
    userId: string,
    userData: Partial<User>
  ): Promise<boolean> {
    const cacheKey = `user:profile:${userId}`;
    const tags = [
      `user:${userId}`,
      `tenant:${userData.tenantId}`,
      `segment:${userData.segment}`,
      `lifecycle:${userData.lifecycleStage}`,
      `shard:${userData.shardId}`,
    ].filter(Boolean);

    return await this.cache.set(cacheKey, userData, {
      ttl: this.config.profileTtl,
      tags,
    });
  }

  /**
   * Get cached user profile with fallback
   */
  async getUserProfile(userId: string): Promise<Partial<User> | null> {
    const cacheKey = `user:profile:${userId}`;
    return await this.cache.get<Partial<User>>(cacheKey);
  }

  /**
   * Cache user search results with query-based keys
   */
  async cacheUserSearch(
    query: string,
    filters: Record<string, any>,
    results: any[],
    total: number,
    page: number,
    limit: number
  ): Promise<boolean> {
    const cacheKey = this.buildSearchCacheKey(query, filters, page, limit);

    const searchData = {
      results,
      total,
      page,
      limit,
      timestamp: Date.now(),
    };

    // Extract tenant and segment tags for invalidation
    const tags = this.extractSearchTags(filters);

    return await this.cache.set(cacheKey, searchData, {
      ttl: this.config.searchTtl,
      tags,
    });
  }

  /**
   * Get cached user search results
   */
  async getUserSearch(
    query: string,
    filters: Record<string, any>,
    page: number,
    limit: number
  ): Promise<{
    results: any[];
    total: number;
    page: number;
    limit: number;
  } | null> {
    const cacheKey = this.buildSearchCacheKey(query, filters, page, limit);
    return await this.cache.get(cacheKey);
  }

  /**
   * Cache user segment statistics
   */
  async cacheSegmentStats(
    tenantId: string | null,
    segment: UserSegment,
    stats: {
      count: number;
      avgLifetimeValue: number;
      churnRisk: number;
      engagementScore: number;
    }
  ): Promise<boolean> {
    const cacheKey = `user:segment:stats:${tenantId || "global"}:${segment}`;

    const tags = [
      `segment:${segment}`,
      tenantId ? `tenant:${tenantId}` : "global",
      "segment-stats",
    ];

    return await this.cache.set(cacheKey, stats, {
      ttl: this.config.segmentTtl,
      tags,
    });
  }

  /**
   * Get cached segment statistics
   */
  async getSegmentStats(
    tenantId: string | null,
    segment: UserSegment
  ): Promise<{
    count: number;
    avgLifetimeValue: number;
    churnRisk: number;
    engagementScore: number;
  } | null> {
    const cacheKey = `user:segment:stats:${tenantId || "global"}:${segment}`;
    return await this.cache.get(cacheKey);
  }

  /**
   * Cache user analytics data
   */
  async cacheUserAnalytics(
    userId: string,
    analytics: {
      pageViews: number;
      sessionDuration: number;
      purchaseFrequency: number;
      lastActivity: Date;
      recommendations: any[];
    }
  ): Promise<boolean> {
    const cacheKey = `user:analytics:${userId}`;

    return await this.cache.set(cacheKey, analytics, {
      ttl: this.config.analyticsTtl,
      tags: [`user:${userId}`, "user-analytics"],
    });
  }

  /**
   * Get cached user analytics
   */
  async getUserAnalytics(userId: string): Promise<{
    pageViews: number;
    sessionDuration: number;
    purchaseFrequency: number;
    lastActivity: Date;
    recommendations: any[];
  } | null> {
    const cacheKey = `user:analytics:${userId}`;
    return await this.cache.get(cacheKey);
  }

  /**
   * Invalidate user-specific cache
   */
  async invalidateUser(userId: string): Promise<number> {
    const tags = [`user:${userId}`];
    return await this.cache.invalidateByTags(tags);
  }

  /**
   * Invalidate tenant-specific cache
   */
  async invalidateTenant(tenantId: string): Promise<number> {
    const tags = [`tenant:${tenantId}`];
    return await this.cache.invalidateByTags(tags);
  }

  /**
   * Invalidate segment-specific cache
   */
  async invalidateSegment(segment: UserSegment): Promise<number> {
    const tags = [`segment:${segment}`];
    return await this.cache.invalidateByTags(tags);
  }

  /**
   * Invalidate lifecycle stage cache
   */
  async invalidateLifecycle(lifecycle: LifecycleStage): Promise<number> {
    const tags = [`lifecycle:${lifecycle}`];
    return await this.cache.invalidateByTags(tags);
  }

  /**
   * Warm up frequently accessed user data
   */
  async warmupUserCache(tenantId?: string): Promise<boolean> {
    try {
      // This would be implemented to preload frequently accessed user data
      // For now, we'll implement a basic structure
      logger.info("User cache warmup started", { tenantId });

      // Warm up logic would go here - e.g., cache top users, recent active users, etc.

      return true;
    } catch (error) {
      logger.error("User cache warmup failed", { error, tenantId });
      return false;
    }
  }

  /**
   * Get cache performance statistics
   */
  async getCacheStats(): Promise<{
    hitRate: number;
    totalRequests: number;
    cacheSize: number;
    memoryUsage: number;
  }> {
    const stats = await this.cache.getStats();

    // In a real implementation, you'd track hit/miss rates
    // For now, return basic stats
    return {
      hitRate: 0, // Would be calculated from actual usage
      totalRequests: 0,
      cacheSize: stats.totalKeys,
      memoryUsage: stats.memoryUsage,
    };
  }

  /**
   * Build search cache key from query parameters
   */
  private buildSearchCacheKey(
    query: string,
    filters: Record<string, any>,
    page: number,
    limit: number
  ): string {
    const filterHash = this.hashFilters(filters);
    return `user:search:${query}:${filterHash}:${page}:${limit}`;
  }

  /**
   * Extract tags from search filters for cache invalidation
   */
  private extractSearchTags(filters: Record<string, any>): string[] {
    const tags: string[] = ["user-search"];

    if (filters.tenantId) {
      tags.push(`tenant:${filters.tenantId}`);
    }

    if (filters.segment) {
      tags.push(`segment:${filters.segment}`);
    }

    if (filters.lifecycleStage) {
      tags.push(`lifecycle:${filters.lifecycleStage}`);
    }

    if (filters.shardId) {
      tags.push(`shard:${filters.shardId}`);
    }

    return tags;
  }

  /**
   * Create a hash of filter parameters for cache key generation
   */
  private hashFilters(filters: Record<string, any>): string {
    const sortedFilters = Object.keys(filters)
      .sort()
      .reduce(
        (result, key) => {
          result[key] = filters[key];
          return result;
        },
        {} as Record<string, any>
      );

    return Buffer.from(JSON.stringify(sortedFilters))
      .toString("base64")
      .slice(0, 16);
  }
}

// Singleton instance
let userCacheInstance: UserCacheService | null = null;

/**
 * Get the global user cache service instance
 */
export function getUserCache(): UserCacheService {
  if (!userCacheInstance) {
    userCacheInstance = new UserCacheService({
      profileTtl: parseInt(process.env.USER_CACHE_PROFILE_TTL || "300"),
      searchTtl: parseInt(process.env.USER_CACHE_SEARCH_TTL || "180"),
      segmentTtl: parseInt(process.env.USER_CACHE_SEGMENT_TTL || "600"),
      statsTtl: parseInt(process.env.USER_CACHE_STATS_TTL || "900"),
      analyticsTtl: parseInt(process.env.USER_CACHE_ANALYTICS_TTL || "1800"),
    });
  }

  return userCacheInstance;
}
