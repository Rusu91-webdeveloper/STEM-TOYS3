import { performanceMonitor } from "../monitoring/performance-monitor";
import { cdnManager } from "../cdn/static-assets";

export interface ImageOptimizationConfig {
  formats: {
    webp: boolean;
    avif: boolean;
    jpeg: boolean;
    png: boolean;
  };
  quality: {
    webp: number;
    avif: number;
    jpeg: number;
    png: number;
  };
  sizes: number[];
  lazyLoading: {
    enabled: boolean;
    threshold: number;
    placeholder: "blur" | "color" | "none";
  };
  compression: {
    enabled: boolean;
    algorithm: "mozjpeg" | "webp" | "avif";
    quality: number;
  };
  caching: {
    enabled: boolean;
    maxAge: number;
    staleWhileRevalidate: number;
  };
}

export interface OptimizedImage {
  src: string;
  srcSet: string;
  sizes: string;
  width: number;
  height: number;
  format: string;
  size: number;
  placeholder?: string;
  loading: "lazy" | "eager";
}

export interface ImageMetadata {
  width: number;
  height: number;
  format: string;
  size: number;
  aspectRatio: number;
  dominantColor?: string;
}

const DEFAULT_CONFIG: ImageOptimizationConfig = {
  formats: {
    webp: true,
    avif: true,
    jpeg: true,
    png: true,
  },
  quality: {
    webp: 85,
    avif: 80,
    jpeg: 85,
    png: 90,
  },
  sizes: [320, 640, 768, 1024, 1280, 1920],
  lazyLoading: {
    enabled: true,
    threshold: 0.1,
    placeholder: "blur",
  },
  compression: {
    enabled: true,
    algorithm: "webp",
    quality: 85,
  },
  caching: {
    enabled: true,
    maxAge: 31536000, // 1 year
    staleWhileRevalidate: 86400, // 1 day
  },
};

class ImageOptimizer {
  private static instance: ImageOptimizer;
  private config: ImageOptimizationConfig;
  private imageCache: Map<string, OptimizedImage> = new Map();
  private metadataCache: Map<string, ImageMetadata> = new Map();

  private constructor(config: Partial<ImageOptimizationConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  static getInstance(config?: Partial<ImageOptimizationConfig>): ImageOptimizer {
    if (!ImageOptimizer.instance) {
      ImageOptimizer.instance = new ImageOptimizer(config);
    }
    return ImageOptimizer.instance;
  }

  /**
   * Optimize image with multiple formats and sizes
   */
  async optimizeImage(
    src: string,
    options?: {
      width?: number;
      height?: number;
      quality?: number;
      format?: string;
      lazy?: boolean;
      priority?: boolean;
      sizes?: string;
    }
  ): Promise<OptimizedImage> {
    const startTime = Date.now();
    
    try {
      // Generate cache key
      const cacheKey = this.generateCacheKey(src, options);
      
      // Check cache first
      const cached = this.imageCache.get(cacheKey);
      if (cached) {
        this.recordPerformance("cache_hit", Date.now() - startTime);
        return cached;
      }

      // Get image metadata
      const metadata = await this.getImageMetadata(src);
      
      // Generate optimized image
      const optimized = await this.generateOptimizedImage(src, metadata, options);
      
      // Cache the result
      this.imageCache.set(cacheKey, optimized);
      
      // Record performance
      this.recordPerformance("optimization", Date.now() - startTime);
      
      return optimized;
    } catch (error) {
      console.error("Error optimizing image:", error);
      // Return fallback
      return this.createFallbackImage(src, options);
    }
  }

  /**
   * Generate responsive image with multiple sizes
   */
  async generateResponsiveImage(
    src: string,
    options?: {
      aspectRatio?: number;
      maxWidth?: number;
      lazy?: boolean;
      priority?: boolean;
    }
  ): Promise<OptimizedImage> {
    const startTime = Date.now();
    
    try {
      // Get metadata
      const metadata = await this.getImageMetadata(src);
      
      // Calculate sizes based on aspect ratio and max width
      const sizes = this.calculateResponsiveSizes(metadata, options);
      
      // Generate srcSet
      const srcSetParts: string[] = [];
      const formats = this.getEnabledFormats();
      
      for (const size of sizes) {
        for (const format of formats) {
          const url = cdnManager.getAssetUrl(src, {
            width: size,
            format,
            quality: this.config.quality[format as keyof typeof this.config.quality],
            optimize: true,
          });
          srcSetParts.push(`${url} ${size}w`);
        }
      }
      
      const optimized: OptimizedImage = {
        src: cdnManager.getAssetUrl(src),
        srcSet: srcSetParts.join(", "),
        sizes: options?.maxWidth ? `(max-width: ${options.maxWidth}px) 100vw, ${options.maxWidth}px` : "100vw",
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
        size: metadata.size,
        loading: options?.priority ? "eager" : (options?.lazy !== false && this.config.lazyLoading.enabled ? "lazy" : "eager"),
      };
      
      // Add placeholder if lazy loading is enabled
      if (optimized.loading === "lazy" && this.config.lazyLoading.placeholder !== "none") {
        optimized.placeholder = await this.generatePlaceholder(src, metadata);
      }
      
      this.recordPerformance("responsive_generation", Date.now() - startTime);
      
      return optimized;
    } catch (error) {
      console.error("Error generating responsive image:", error);
      return this.createFallbackImage(src, options);
    }
  }

  /**
   * Get image metadata (width, height, format, size)
   */
  async getImageMetadata(src: string): Promise<ImageMetadata> {
    // Check cache first
    const cached = this.metadataCache.get(src);
    if (cached) {
      return cached;
    }

    try {
      // In a real implementation, this would analyze the actual image
      // For now, we'll return mock data based on the URL
      const metadata: ImageMetadata = {
        width: 1920,
        height: 1080,
        format: this.getFormatFromUrl(src),
        size: 1024 * 1024, // 1MB mock
        aspectRatio: 16 / 9,
        dominantColor: "#000000",
      };
      
      // Cache metadata
      this.metadataCache.set(src, metadata);
      
      return metadata;
    } catch (error) {
      console.error("Error getting image metadata:", error);
      // Return default metadata
      return {
        width: 800,
        height: 600,
        format: "jpeg",
        size: 0,
        aspectRatio: 4 / 3,
      };
    }
  }

  /**
   * Generate optimized image URL
   */
  private async generateOptimizedImage(
    src: string,
    metadata: ImageMetadata,
    options?: any
  ): Promise<OptimizedImage> {
    const format = options?.format || this.getBestFormat(metadata.format);
    const quality = options?.quality || this.config.quality[format as keyof typeof this.config.quality];
    
    const optimizedSrc = cdnManager.getAssetUrl(src, {
      width: options?.width,
      height: options?.height,
      format,
      quality,
      optimize: true,
    });
    
    return {
      src: optimizedSrc,
      srcSet: optimizedSrc,
      sizes: "100vw",
      width: options?.width || metadata.width,
      height: options?.height || metadata.height,
      format,
      size: metadata.size,
      loading: options?.priority ? "eager" : "lazy",
    };
  }

  /**
   * Calculate responsive sizes based on metadata and options
   */
  private calculateResponsiveSizes(
    metadata: ImageMetadata,
    options?: { aspectRatio?: number; maxWidth?: number }
  ): number[] {
    const maxWidth = options?.maxWidth || metadata.width;
    const aspectRatio = options?.aspectRatio || metadata.aspectRatio;
    
    // Filter sizes that are smaller than max width
    const sizes = this.config.sizes.filter(size => size <= maxWidth);
    
    // Add the original size if it's not already included
    if (!sizes.includes(maxWidth)) {
      sizes.push(maxWidth);
    }
    
    return sizes.sort((a, b) => a - b);
  }

  /**
   * Get enabled formats based on configuration
   */
  private getEnabledFormats(): string[] {
    const formats: string[] = [];
    
    if (this.config.formats.webp) formats.push("webp");
    if (this.config.formats.avif) formats.push("avif");
    if (this.config.formats.jpeg) formats.push("jpeg");
    if (this.config.formats.png) formats.push("png");
    
    return formats;
  }

  /**
   * Get best format for the image
   */
  private getBestFormat(originalFormat: string): string {
    // Prefer modern formats
    if (this.config.formats.avif) return "avif";
    if (this.config.formats.webp) return "webp";
    
    // Fall back to original format
    if (this.config.formats[originalFormat as keyof typeof this.config.formats]) {
      return originalFormat;
    }
    
    // Default to JPEG
    return "jpeg";
  }

  /**
   * Get format from URL
   */
  private getFormatFromUrl(url: string): string {
    const ext = url.split(".").pop()?.toLowerCase();
    
    switch (ext) {
      case "jpg":
      case "jpeg":
        return "jpeg";
      case "png":
        return "png";
      case "webp":
        return "webp";
      case "avif":
        return "avif";
      default:
        return "jpeg";
    }
  }

  /**
   * Generate placeholder for lazy loading
   */
  private async generatePlaceholder(
    src: string,
    metadata: ImageMetadata
  ): Promise<string> {
    if (this.config.lazyLoading.placeholder === "blur") {
      // Generate a tiny blurred version
      return cdnManager.getAssetUrl(src, {
        width: 20,
        height: Math.round(20 / metadata.aspectRatio),
        quality: 10,
        optimize: true,
      });
    } else if (this.config.lazyLoading.placeholder === "color") {
      // Return dominant color as data URL
      return `data:image/svg+xml;base64,${Buffer.from(
        `<svg width="${metadata.width}" height="${metadata.height}" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="${metadata.dominantColor || "#f0f0f0"}"/></svg>`
      ).toString("base64")}`;
    }
    
    return "";
  }

  /**
   * Create fallback image when optimization fails
   */
  private createFallbackImage(src: string, options?: any): OptimizedImage {
    return {
      src,
      srcSet: src,
      sizes: "100vw",
      width: options?.width || 800,
      height: options?.height || 600,
      format: "jpeg",
      size: 0,
      loading: "eager",
    };
  }

  /**
   * Generate cache key
   */
  private generateCacheKey(src: string, options?: any): string {
    const optionsStr = options ? JSON.stringify(options) : "";
    return `${src}:${optionsStr}`;
  }

  /**
   * Record performance metrics
   */
  private recordPerformance(operation: string, duration: number): void {
    performanceMonitor.recordMetric("image_optimization", operation, Date.now(), {
      duration,
      operation,
    });
  }

  /**
   * Preload critical images
   */
  async preloadImages(images: string[]): Promise<void> {
    const startTime = Date.now();
    
    try {
      await Promise.allSettled(
        images.map(async (src) => {
          const optimized = await this.optimizeImage(src, { priority: true });
          await this.preloadImage(optimized.src);
        })
      );
      
      this.recordPerformance("preload", Date.now() - startTime);
    } catch (error) {
      console.error("Error preloading images:", error);
    }
  }

  /**
   * Preload single image
   */
  private async preloadImage(src: string): Promise<void> {
    try {
      const response = await fetch(src, { method: "HEAD" });
      if (!response.ok) {
        throw new Error(`Failed to preload: ${response.status}`);
      }
    } catch (error) {
      console.warn(`Failed to preload image ${src}:`, error);
    }
  }

  /**
   * Get optimization statistics
   */
  getOptimizationStats(): {
    cacheSize: number;
    cacheHitRate: number;
    averageOptimizationTime: number;
    totalOptimizations: number;
  } {
    const cacheSize = this.imageCache.size;
    const metadataSize = this.metadataCache.size;
    
    // Calculate hit rate from performance metrics
    const totalRequests = performanceMonitor.getMetrics("image_optimization", "optimization")?.length || 0;
    const cacheHits = performanceMonitor.getMetrics("image_optimization", "cache_hit")?.length || 0;
    const hitRate = totalRequests > 0 ? (cacheHits / totalRequests) * 100 : 0;
    
    // Calculate average optimization time
    const optimizationTimes = performanceMonitor.getMetrics("image_optimization", "optimization") || [];
    const avgTime = optimizationTimes.length > 0 
      ? optimizationTimes.reduce((a, b) => a + b.duration, 0) / optimizationTimes.length 
      : 0;
    
    return {
      cacheSize: cacheSize + metadataSize,
      cacheHitRate: hitRate,
      averageOptimizationTime: avgTime,
      totalOptimizations: totalRequests,
    };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<ImageOptimizationConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  getConfig(): ImageOptimizationConfig {
    return { ...this.config };
  }

  /**
   * Clear caches
   */
  clearCache(): void {
    this.imageCache.clear();
    this.metadataCache.clear();
  }
}

// Export singleton instance
export const imageOptimizer = ImageOptimizer.getInstance();

// Convenience functions
export const optimizeImage = (src: string, options?: any) =>
  imageOptimizer.optimizeImage(src, options);

export const generateResponsiveImage = (src: string, options?: any) =>
  imageOptimizer.generateResponsiveImage(src, options);

export const preloadImages = (images: string[]) =>
  imageOptimizer.preloadImages(images);

export const getImageMetadata = (src: string) =>
  imageOptimizer.getImageMetadata(src);

export type { ImageOptimizationConfig, OptimizedImage, ImageMetadata };
