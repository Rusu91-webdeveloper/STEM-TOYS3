import { performanceMonitor } from "../monitoring/performance-monitor";

export interface CDNConfig {
  provider: "cloudflare" | "aws-cloudfront" | "vercel" | "custom";
  domain: string;
  fallbackDomain?: string;
  enableCompression: boolean;
  enableCaching: boolean;
  cacheHeaders: {
    maxAge: number;
    staleWhileRevalidate: number;
    immutable: boolean;
  };
  imageOptimization: {
    enabled: boolean;
    formats: ("webp" | "avif" | "jpeg" | "png")[];
    quality: number;
    sizes: number[];
  };
  security: {
    enableHttps: boolean;
    enableHsts: boolean;
    enableCsp: boolean;
  };
}

export interface StaticAsset {
  path: string;
  type: "image" | "font" | "script" | "style" | "document";
  size: number;
  lastModified: Date;
  etag: string;
  cacheKey: string;
}

export interface CDNResponse {
  url: string;
  headers: Record<string, string>;
  performance: {
    loadTime: number;
    cacheHit: boolean;
    compressionRatio: number;
  };
}

const DEFAULT_CONFIG: CDNConfig = {
  provider: "vercel",
  domain: process.env.NEXT_PUBLIC_CDN_DOMAIN || "",
  fallbackDomain: process.env.NEXT_PUBLIC_CDN_FALLBACK_DOMAIN,
  enableCompression: true,
  enableCaching: true,
  cacheHeaders: {
    maxAge: 31536000, // 1 year
    staleWhileRevalidate: 86400, // 1 day
    immutable: true,
  },
  imageOptimization: {
    enabled: true,
    formats: ["webp", "avif", "jpeg"],
    quality: 85,
    sizes: [320, 640, 768, 1024, 1280, 1920],
  },
  security: {
    enableHttps: true,
    enableHsts: true,
    enableCsp: true,
  },
};

class CDNManager {
  private static instance: CDNManager;
  private config: CDNConfig;
  private assetCache: Map<string, StaticAsset> = new Map();
  private performanceMetrics: Map<string, number[]> = new Map();

  private constructor(config: Partial<CDNConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  static getInstance(config?: Partial<CDNConfig>): CDNManager {
    if (!CDNManager.instance) {
      CDNManager.instance = new CDNManager(config);
    }
    return CDNManager.instance;
  }

  /**
   * Generate CDN URL for static assets
   */
  getAssetUrl(path: string, options?: {
    width?: number;
    height?: number;
    format?: string;
    quality?: number;
    optimize?: boolean;
  }): string {
    const startTime = Date.now();
    
    try {
      // Normalize path
      const normalizedPath = path.startsWith("/") ? path.slice(1) : path;
      
      // Generate cache key
      const cacheKey = this.generateCacheKey(normalizedPath, options);
      
      // Check if we have a cached URL
      const cachedAsset = this.assetCache.get(cacheKey);
      if (cachedAsset) {
        this.recordPerformance("cache_hit", Date.now() - startTime);
        return this.buildUrl(cachedAsset.path, options);
      }

      // Build CDN URL based on provider
      let cdnUrl = this.buildUrl(normalizedPath, options);
      
      // Add performance tracking
      this.recordPerformance("url_generation", Date.now() - startTime);
      
      // Cache the asset info
      this.cacheAsset(normalizedPath, cacheKey, options);
      
      return cdnUrl;
    } catch (error) {
      console.error("Error generating CDN URL:", error);
      // Fallback to original path
      return path;
    }
  }

  /**
   * Build URL based on CDN provider
   */
  private buildUrl(path: string, options?: {
    width?: number;
    height?: number;
    format?: string;
    quality?: number;
    optimize?: boolean;
  }): string {
    const baseUrl = this.config.domain || "";
    
    if (!baseUrl) {
      return `/${path}`;
    }

    let url = `${baseUrl}/${path}`;
    
    // Add image optimization parameters
    if (options && this.config.imageOptimization.enabled) {
      const params = new URLSearchParams();
      
      if (options.width) params.append("w", options.width.toString());
      if (options.height) params.append("h", options.height.toString());
      if (options.format) params.append("f", options.format);
      if (options.quality) params.append("q", options.quality.toString());
      if (options.optimize) params.append("o", "1");
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
    }
    
    return url;
  }

  /**
   * Generate cache key for asset
   */
  private generateCacheKey(path: string, options?: any): string {
    const optionsStr = options ? JSON.stringify(options) : "";
    return `${path}:${optionsStr}`;
  }

  /**
   * Cache asset information
   */
  private cacheAsset(path: string, cacheKey: string, options?: any): void {
    const asset: StaticAsset = {
      path,
      type: this.getAssetType(path),
      size: 0, // Would be populated from actual file
      lastModified: new Date(),
      etag: this.generateEtag(path),
      cacheKey,
    };
    
    this.assetCache.set(cacheKey, asset);
  }

  /**
   * Determine asset type from path
   */
  private getAssetType(path: string): StaticAsset["type"] {
    const ext = path.split(".").pop()?.toLowerCase();
    
    if (["jpg", "jpeg", "png", "gif", "webp", "avif", "svg"].includes(ext || "")) {
      return "image";
    }
    if (["woff", "woff2", "ttf", "otf", "eot"].includes(ext || "")) {
      return "font";
    }
    if (["js", "mjs"].includes(ext || "")) {
      return "script";
    }
    if (["css"].includes(ext || "")) {
      return "style";
    }
    return "document";
  }

  /**
   * Generate ETag for asset
   */
  private generateEtag(path: string): string {
    return `"${Buffer.from(path).toString("base64").slice(0, 8)}"`;
  }

  /**
   * Get optimized image URL with responsive sizes
   */
  getResponsiveImageUrl(
    path: string,
    sizes: number[] = this.config.imageOptimization.sizes,
    formats: string[] = this.config.imageOptimization.formats
  ): {
    src: string;
    srcSet: string;
    sizes: string;
  } {
    const baseUrl = this.getAssetUrl(path);
    const srcSetParts: string[] = [];
    
    // Generate srcSet for each size and format
    for (const size of sizes) {
      for (const format of formats) {
        const url = this.getAssetUrl(path, {
          width: size,
          format: format as any,
          quality: this.config.imageOptimization.quality,
          optimize: true,
        });
        srcSetParts.push(`${url} ${size}w`);
      }
    }
    
    return {
      src: baseUrl,
      srcSet: srcSetParts.join(", "),
      sizes: "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw",
    };
  }

  /**
   * Preload critical assets
   */
  async preloadAssets(assets: string[]): Promise<void> {
    const startTime = Date.now();
    
    try {
      await Promise.allSettled(
        assets.map(async (asset) => {
          const url = this.getAssetUrl(asset);
          await this.preloadAsset(url);
        })
      );
      
      this.recordPerformance("preload", Date.now() - startTime);
    } catch (error) {
      console.error("Error preloading assets:", error);
    }
  }

  /**
   * Preload single asset
   */
  private async preloadAsset(url: string): Promise<void> {
    try {
      const response = await fetch(url, { method: "HEAD" });
      if (!response.ok) {
        throw new Error(`Failed to preload: ${response.status}`);
      }
    } catch (error) {
      console.warn(`Failed to preload asset ${url}:`, error);
    }
  }

  /**
   * Get CDN headers for optimal caching
   */
  getCacheHeaders(assetType: StaticAsset["type"]): Record<string, string> {
    const headers: Record<string, string> = {};
    
    if (!this.config.enableCaching) {
      return headers;
    }
    
    const { maxAge, staleWhileRevalidate, immutable } = this.config.cacheHeaders;
    
    // Set cache control headers
    headers["Cache-Control"] = `public, max-age=${maxAge}, stale-while-revalidate=${staleWhileRevalidate}${immutable ? ", immutable" : ""}`;
    
    // Set content type headers
    const contentTypeMap: Record<StaticAsset["type"], string> = {
      image: "image/webp, image/avif, image/jpeg, image/png, image/*",
      font: "font/woff2, font/woff, font/ttf, font/*",
      script: "application/javascript",
      style: "text/css",
      document: "application/octet-stream",
    };
    
    headers["Accept"] = contentTypeMap[assetType];
    
    // Security headers
    if (this.config.security.enableHttps) {
      headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains";
    }
    
    return headers;
  }

  /**
   * Record performance metrics
   */
  private recordPerformance(operation: string, duration: number): void {
    if (!this.performanceMetrics.has(operation)) {
      this.performanceMetrics.set(operation, []);
    }
    
    this.performanceMetrics.get(operation)!.push(duration);
    
    // Keep only last 100 measurements
    const metrics = this.performanceMetrics.get(operation)!;
    if (metrics.length > 100) {
      metrics.splice(0, metrics.length - 100);
    }
    
    // Record to performance monitor
    performanceMonitor.recordMetric("cdn", operation, Date.now(), {
      duration,
      operation,
      provider: this.config.provider,
    });
  }

  /**
   * Get performance statistics
   */
  getPerformanceStats(): Record<string, {
    avg: number;
    min: number;
    max: number;
    count: number;
  }> {
    const stats: Record<string, any> = {};
    
    for (const [operation, metrics] of this.performanceMetrics.entries()) {
      if (metrics.length === 0) continue;
      
      const avg = metrics.reduce((a, b) => a + b, 0) / metrics.length;
      const min = Math.min(...metrics);
      const max = Math.max(...metrics);
      
      stats[operation] = { avg, min, max, count: metrics.length };
    }
    
    return stats;
  }

  /**
   * Update CDN configuration
   */
  updateConfig(newConfig: Partial<CDNConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  getConfig(): CDNConfig {
    return { ...this.config };
  }

  /**
   * Clear asset cache
   */
  clearCache(): void {
    this.assetCache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    size: number;
    hitRate: number;
    assets: StaticAsset[];
  } {
    const assets = Array.from(this.assetCache.values());
    const totalRequests = this.performanceMetrics.get("url_generation")?.length || 0;
    const cacheHits = this.performanceMetrics.get("cache_hit")?.length || 0;
    const hitRate = totalRequests > 0 ? (cacheHits / totalRequests) * 100 : 0;
    
    return {
      size: this.assetCache.size,
      hitRate,
      assets,
    };
  }
}

// Export singleton instance
export const cdnManager = CDNManager.getInstance();

// Convenience functions
export const getAssetUrl = (path: string, options?: any) => 
  cdnManager.getAssetUrl(path, options);

export const getResponsiveImageUrl = (path: string, sizes?: number[], formats?: string[]) =>
  cdnManager.getResponsiveImageUrl(path, sizes, formats);

export const preloadAssets = (assets: string[]) => 
  cdnManager.preloadAssets(assets);

export const getCacheHeaders = (assetType: StaticAsset["type"]) =>
  cdnManager.getCacheHeaders(assetType);

export type { CDNConfig, StaticAsset, CDNResponse };
