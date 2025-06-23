/**
 * Performance optimization utilities for the STEM-TOYS2 application
 */

import { logger } from "./logger";
import { monitor } from "./monitoring";

// In-memory cache for frequently accessed data
class PerformanceCache {
  private cache = new Map<string, { data: any; expiry: number }>();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes

  set(key: string, data: any, ttl?: number): void {
    const expiry = Date.now() + (ttl || this.defaultTTL);
    this.cache.set(key, { data, expiry });
  }

  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // Clean up expired entries
  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        this.cache.delete(key);
      }
    }
  }

  // Get cache stats
  getStats(): { size: number; hitRate?: number } {
    return {
      size: this.cache.size,
      // Could track hit rate if needed
    };
  }
}

export const performanceCache = new PerformanceCache();

// Clean up cache every 10 minutes
setInterval(
  () => {
    performanceCache.cleanup();
  },
  10 * 60 * 1000
);

/**
 * Performance monitoring decorator for database operations
 */
export function withPerformanceMonitoring<
  T extends (...args: any[]) => Promise<any>,
>(operation: string, fn: T): T {
  return (async (...args: any[]) => {
    const startTime = Date.now();
    try {
      const result = await fn(...args);
      const duration = Date.now() - startTime;

      monitor.trackPerformance(operation, duration, {
        success: true,
        resultSize: Array.isArray(result) ? result.length : 1,
      });

      // Log slow queries
      if (duration > 1000) {
        logger.warn(`Slow database operation detected`, {
          operation,
          duration,
          args: JSON.stringify(args).slice(0, 200), // Limit log size
        });
      }

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      monitor.trackPerformance(operation, duration, {
        success: false,
        error: (error as Error).message,
      });
      throw error;
    }
  }) as T;
}

/**
 * Cache decorator for expensive operations
 */
export function withCache<T extends (...args: any[]) => Promise<any>>(
  keyGenerator: (...args: any[]) => string,
  ttl?: number
) {
  return function (
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor
  ) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const cacheKey = keyGenerator(...args);

      // Try to get from cache first
      const cached = performanceCache.get(cacheKey);
      if (cached !== null) {
        logger.debug(`Cache hit for ${propertyName}`, { cacheKey });
        return cached;
      }

      // Execute the method and cache result
      const result = await method.apply(this, args);
      performanceCache.set(cacheKey, result, ttl);

      logger.debug(`Cache miss for ${propertyName}`, { cacheKey });
      return result;
    };

    return descriptor;
  };
}

/**
 * Optimized pagination helper
 */
export interface PaginationOptions {
  page: number;
  limit: number;
  cursor?: string; // For cursor-based pagination
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    nextCursor?: string;
    previousCursor?: string;
  };
}

export function createPaginationQuery(options: PaginationOptions) {
  const { page, limit, cursor } = options;

  // Ensure reasonable limits
  const safeLimit = Math.min(Math.max(limit, 1), 100);
  const safePage = Math.max(page, 1);

  const skip = cursor ? undefined : (safePage - 1) * safeLimit;

  return {
    take: safeLimit,
    skip,
    cursor: cursor ? { id: cursor } : undefined,
  };
}

/**
 * Database query optimization utilities
 */
export const QueryOptimizer = {
  /**
   * Generate optimized include statement for product queries
   */
  getProductIncludes: (
    options: {
      includeCategory?: boolean;
      includeImages?: boolean;
      includeReviews?: boolean;
      includeVariants?: boolean;
    } = {}
  ) => {
    const includes: any = {};

    if (options.includeCategory) {
      includes.category = true;
    }

    if (options.includeImages) {
      includes.images = {
        take: 5, // Limit images to prevent large queries
        orderBy: { order: "asc" },
      };
    }

    if (options.includeReviews) {
      includes.reviews = {
        take: 10, // Limit reviews
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: { name: true, id: true }, // Only include necessary fields
          },
        },
      };
    }

    if (options.includeVariants) {
      includes.variants = {
        where: { isActive: true },
        orderBy: { price: "asc" },
      };
    }

    return includes;
  },

  /**
   * Generate optimized select statement to reduce data transfer
   */
  getProductSelect: (fields?: string[]) => {
    const defaultFields = [
      "id",
      "name",
      "slug",
      "description",
      "price",
      "compareAtPrice",
      "images",
      "isActive",
      "featured",
      "categoryId",
      "tags",
      "attributes",
      "ageRange",
      "stemCategory",
      "rating",
      "reviewCount",
      "stockQuantity",
      "createdAt",
      "updatedAt",
    ];

    const selectFields = fields || defaultFields;
    const select: any = {};

    selectFields.forEach(field => {
      select[field] = true;
    });

    return select;
  },

  /**
   * Generate optimized where clause for product search
   */
  getProductSearchWhere: (
    searchTerm?: string,
    filters?: {
      categoryId?: string;
      stemCategory?: string;
      priceRange?: { min: number; max: number };
      ageRange?: string;
      inStock?: boolean;
    }
  ) => {
    const where: any = { isActive: true };

    if (searchTerm) {
      where.OR = [
        { name: { contains: searchTerm, mode: "insensitive" } },
        { description: { contains: searchTerm, mode: "insensitive" } },
        { tags: { hasSome: [searchTerm] } },
      ];
    }

    if (filters?.categoryId) {
      where.categoryId = filters.categoryId;
    }

    if (filters?.stemCategory) {
      where.stemCategory = filters.stemCategory;
    }

    if (filters?.priceRange) {
      where.price = {
        gte: filters.priceRange.min,
        lte: filters.priceRange.max,
      };
    }

    if (filters?.ageRange) {
      where.ageRange = filters.ageRange;
    }

    if (filters?.inStock) {
      where.stockQuantity = { gt: 0 };
    }

    return where;
  },
};

/**
 * Bundle analyzer utility for client-side performance
 */
export const BundleAnalyzer = {
  /**
   * Lazy load components with performance monitoring
   */
  lazyLoad: <T>(
    importFn: () => Promise<{ default: T }>,
    componentName: string
  ) => {
    return new Promise<{ default: T }>((resolve, reject) => {
      const startTime = Date.now();

      importFn()
        .then(module => {
          const loadTime = Date.now() - startTime;

          monitor.trackPerformance(`lazy_load_${componentName}`, loadTime, {
            componentName,
          });

          if (loadTime > 2000) {
            logger.warn(`Slow component load detected`, {
              componentName,
              loadTime,
            });
          }

          resolve(module);
        })
        .catch(reject);
    });
  },
};

/**
 * Memory optimization utilities
 */
export const MemoryOptimizer = {
  /**
   * Clean up references and force garbage collection in development
   */
  cleanup: () => {
    performanceCache.clear();

    if (process.env.NODE_ENV === "development" && global.gc) {
      global.gc();
      logger.debug("Manual garbage collection triggered");
    }
  },

  /**
   * Monitor memory usage and warn if approaching limits
   */
  checkMemoryUsage: () => {
    const usage = process.memoryUsage();
    const warningThreshold = 800 * 1024 * 1024; // 800MB
    const criticalThreshold = 1200 * 1024 * 1024; // 1.2GB

    if (usage.heapUsed > criticalThreshold) {
      logger.error("Critical memory usage detected", {
        heapUsed: Math.round(usage.heapUsed / 1024 / 1024) + "MB",
        heapTotal: Math.round(usage.heapTotal / 1024 / 1024) + "MB",
      });
    } else if (usage.heapUsed > warningThreshold) {
      logger.warn("High memory usage detected", {
        heapUsed: Math.round(usage.heapUsed / 1024 / 1024) + "MB",
        heapTotal: Math.round(usage.heapTotal / 1024 / 1024) + "MB",
      });
    }

    return {
      status:
        usage.heapUsed > criticalThreshold
          ? "critical"
          : usage.heapUsed > warningThreshold
            ? "warning"
            : "normal",
      usage: {
        heapUsed: Math.round(usage.heapUsed / 1024 / 1024),
        heapTotal: Math.round(usage.heapTotal / 1024 / 1024),
        rss: Math.round(usage.rss / 1024 / 1024),
        external: Math.round(usage.external / 1024 / 1024),
      },
    };
  },
};

// Monitor memory usage every 5 minutes
setInterval(
  () => {
    MemoryOptimizer.checkMemoryUsage();
  },
  5 * 60 * 1000
);
