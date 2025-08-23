import { NextRequest, NextResponse } from "next/server";

import { performanceMonitor } from "../monitoring/performance-monitor";
import { redisCache } from "../redis-enhanced";

export interface CacheConfig {
  enabled: boolean;
  defaultTTL: number; // seconds
  maxTTL: number; // seconds
  staleWhileRevalidate: number; // seconds
  compression: boolean;
  varyByHeaders: string[];
  varyByQueryParams: string[];
}

export interface CacheKey {
  path: string;
  method: string;
  headers: Record<string, string>;
  queryParams: Record<string, string>;
  userAgent?: string;
  locale?: string;
}

export interface CachedResponse {
  body: string;
  headers: Record<string, string>;
  status: number;
  timestamp: number;
  ttl: number;
  etag: string;
  lastModified: string;
}

const DEFAULT_CACHE_CONFIG: CacheConfig = {
  enabled: process.env.API_CACHING === "true",
  defaultTTL: parseInt(process.env.API_CACHE_TTL || "300"), // 5 minutes
  maxTTL: parseInt(process.env.API_CACHE_MAX_TTL || "3600"), // 1 hour
  staleWhileRevalidate: parseInt(
    process.env.API_CACHE_STALE_WHILE_REVALIDATE || "60"
  ), // 1 minute
  compression: process.env.API_CACHE_COMPRESSION === "true",
  varyByHeaders: ["authorization", "accept-language", "user-agent"],
  varyByQueryParams: ["page", "limit", "sort", "filter", "search"],
};

class ApiCache {
  private static instance: ApiCache;
  private config: CacheConfig;

  private constructor() {
    this.config = DEFAULT_CACHE_CONFIG;
  }

  static getInstance(): ApiCache {
    if (!ApiCache.instance) {
      ApiCache.instance = new ApiCache();
    }
    return ApiCache.instance;
  }

  private generateCacheKey(cacheKey: CacheKey): string {
    const keyParts = [
      "api",
      cacheKey.method.toLowerCase(),
      cacheKey.path,
      this.hashObject(cacheKey.headers),
      this.hashObject(cacheKey.queryParams),
    ];

    if (cacheKey.userAgent) {
      keyParts.push(this.hashString(cacheKey.userAgent));
    }

    if (cacheKey.locale) {
      keyParts.push(cacheKey.locale);
    }

    return keyParts.join(":");
  }

  private hashObject(obj: Record<string, any>): string {
    const sortedKeys = Object.keys(obj).sort();
    const hashParts = sortedKeys.map(key => `${key}=${obj[key]}`);
    return this.hashString(hashParts.join("&"));
  }

  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  private extractCacheKey(req: NextRequest): CacheKey {
    const url = new URL(req.url);
    const headers: Record<string, string> = {};
    const queryParams: Record<string, string> = {};

    // Extract relevant headers
    this.config.varyByHeaders.forEach(header => {
      const value = req.headers.get(header);
      if (value) {
        headers[header] = value;
      }
    });

    // Extract relevant query parameters
    this.config.varyByQueryParams.forEach(param => {
      const value = url.searchParams.get(param);
      if (value) {
        queryParams[param] = value;
      }
    });

    return {
      path: url.pathname,
      method: req.method,
      headers,
      queryParams,
      userAgent: req.headers.get("user-agent") || undefined,
      locale: req.headers.get("accept-language")?.split(",")[0] || undefined,
    };
  }

  private async getCachedResponse(
    cacheKey: string
  ): Promise<CachedResponse | null> {
    const startTime = Date.now();

    try {
      const cached = await redisCache.get<CachedResponse>(cacheKey);

      if (cached) {
        const now = Date.now();
        const age = now - cached.timestamp;
        const isExpired = age > cached.ttl * 1000;
        const isStale =
          age > (cached.ttl - this.config.staleWhileRevalidate) * 1000;

        if (isExpired) {
          // Cache is expired, remove it
          await redisCache.del(cacheKey);
          return null;
        }

        // Record cache hit
        performanceMonitor.recordCacheOperation(
          "get",
          Date.now() - startTime,
          true,
          true,
          undefined,
          { cacheKey, age, isStale }
        );

        return cached;
      }

      // Record cache miss
      performanceMonitor.recordCacheOperation(
        "get",
        Date.now() - startTime,
        true,
        false,
        undefined,
        { cacheKey }
      );

      return null;
    } catch (error) {
      performanceMonitor.recordCacheOperation(
        "get",
        Date.now() - startTime,
        false,
        false,
        error instanceof Error ? error.message : "Unknown error",
        { cacheKey }
      );
      return null;
    }
  }

  private async setCachedResponse(
    cacheKey: string,
    response: NextResponse,
    ttl: number = this.config.defaultTTL
  ): Promise<void> {
    const startTime = Date.now();

    try {
      const body = await response.text();
      const headers: Record<string, string> = {};

      // Extract relevant headers
      response.headers.forEach((value, key) => {
        if (key.toLowerCase() !== "set-cookie") {
          // Don't cache cookies
          headers[key] = value;
        }
      });

      const cachedResponse: CachedResponse = {
        body,
        headers,
        status: response.status,
        timestamp: Date.now(),
        ttl: Math.min(ttl, this.config.maxTTL),
        etag: this.generateETag(body),
        lastModified: new Date().toISOString(),
      };

      await redisCache.set(cacheKey, cachedResponse, ttl);

      performanceMonitor.recordCacheOperation(
        "set",
        Date.now() - startTime,
        true,
        undefined,
        undefined,
        { cacheKey, ttl }
      );
    } catch (error) {
      performanceMonitor.recordCacheOperation(
        "set",
        Date.now() - startTime,
        false,
        undefined,
        error instanceof Error ? error.message : "Unknown error",
        { cacheKey, ttl }
      );
    }
  }

  private generateETag(body: string): string {
    // Simple ETag generation - in production, use a proper hash function
    let hash = 0;
    for (let i = 0; i < body.length; i++) {
      const char = body.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return `"${Math.abs(hash).toString(16)}"`;
  }

  private createResponseFromCache(cached: CachedResponse): NextResponse {
    const response = new NextResponse(cached.body, {
      status: cached.status,
      headers: cached.headers,
    });

    // Add cache headers
    response.headers.set("X-Cache", "HIT");
    response.headers.set("ETag", cached.etag);
    response.headers.set("Last-Modified", cached.lastModified);
    response.headers.set(
      "Cache-Control",
      `public, max-age=${cached.ttl}, stale-while-revalidate=${this.config.staleWhileRevalidate}`
    );

    return response;
  }

  async get(req: NextRequest): Promise<NextResponse | null> {
    if (!this.config.enabled) {
      return null;
    }

    // Skip caching for non-GET requests
    if (req.method !== "GET") {
      return null;
    }

    // Skip caching for authenticated requests
    const authHeader = req.headers.get("authorization");
    if (authHeader) {
      return null;
    }

    const cacheKey = this.generateCacheKey(this.extractCacheKey(req));
    const cached = await this.getCachedResponse(cacheKey);

    if (cached) {
      // Check if client has a valid cached version
      const ifNoneMatch = req.headers.get("if-none-match");
      const ifModifiedSince = req.headers.get("if-modified-since");

      if (
        ifNoneMatch === cached.etag ||
        ifModifiedSince === cached.lastModified
      ) {
        return new NextResponse(null, { status: 304 });
      }

      return this.createResponseFromCache(cached);
    }

    return null;
  }

  async set(
    req: NextRequest,
    response: NextResponse,
    ttl?: number
  ): Promise<void> {
    if (!this.config.enabled) {
      return;
    }

    // Skip caching for non-GET requests
    if (req.method !== "GET") {
      return;
    }

    // Skip caching for error responses
    if (response.status >= 400) {
      return;
    }

    // Skip caching for responses with certain headers
    const cacheControl = response.headers.get("cache-control");
    if (
      cacheControl?.includes("no-store") ||
      cacheControl?.includes("private")
    ) {
      return;
    }

    const cacheKey = this.generateCacheKey(this.extractCacheKey(req));
    await this.setCachedResponse(cacheKey, response, ttl);
  }

  async invalidate(pattern: string): Promise<void> {
    if (!this.config.enabled) {
      return;
    }

    try {
      // For Redis, we need to scan for keys matching the pattern
      // This is a simplified implementation - in production, use Redis SCAN
      const keys = await this.getKeysByPattern(pattern);

      if (keys.length > 0) {
        await Promise.all(keys.map(key => redisCache.del(key)));
        console.log(
          `Invalidated ${keys.length} cache entries matching pattern: ${pattern}`
        );
      }
    } catch (error) {
      console.error("Failed to invalidate cache:", error);
    }
  }

  private getKeysByPattern(_pattern: string): Promise<string[]> {
    // This would be implemented with Redis SCAN command
    // For now, return empty array as this is not critical
    return Promise.resolve([]);
  }

  // Middleware function for API routes
  withCaching(handler: Function, ttl?: number) {
    return async (req: NextRequest, ...args: any[]) => {
      // Try to get cached response
      const cachedResponse = await this.get(req);
      if (cachedResponse) {
        return cachedResponse;
      }

      // Execute handler
      const response = await handler(req, ...args);

      // Cache the response
      await this.set(req, response, ttl);

      return response;
    };
  }

  // Utility method to check cache status
  getCacheStats(): Promise<{
    hits: number;
    misses: number;
    keys: number;
    memory: number;
  }> {
    // This would be implemented with Redis INFO command
    // For now, return basic stats
    return Promise.resolve({
      hits: 0, // This would require additional tracking
      misses: 0, // This would require additional tracking
      keys: 0, // Would be implemented with Redis
      memory: 0, // Would be implemented with Redis
    });
  }
}

// Export singleton instance
export const apiCache = ApiCache.getInstance();

// Convenience functions
export const getCachedResponse = (req: NextRequest) => apiCache.get(req);
export const setCachedResponse = (
  req: NextRequest,
  response: NextResponse,
  ttl?: number
) => apiCache.set(req, response, ttl);
export const invalidateCache = (pattern: string) =>
  apiCache.invalidate(pattern);
export const withCaching = (handler: Function, ttl?: number) =>
  apiCache.withCaching(handler, ttl);
