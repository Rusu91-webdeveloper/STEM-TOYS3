/**
 * Image optimization utilities for Next.js Image component
 */

import { logger } from "./logger";

// Image optimization configuration
export interface ImageOptimizationConfig {
  enabled: boolean;
  formats: string[];
  sizes: number[];
  quality: number;
  priority: boolean;
  lazy: boolean;
  blur: boolean;
  remotePatterns: Array<{
    protocol: string;
    hostname: string;
    port?: string;
    pathname?: string;
  }>;
  deviceSizes: number[];
  imageSizes: number[];
  domains: string[];
}

// Default Next.js image configuration
const defaultConfig: ImageOptimizationConfig = {
  enabled: true,
  formats: ["image/webp", "image/avif"],
  sizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
  quality: 75,
  priority: false,
  lazy: true,
  blur: true,
  remotePatterns: [
    {
      protocol: "https",
      hostname: "cdn.stemtoys.com",
    },
    {
      protocol: "https",
      hostname: "images.unsplash.com",
    },
    {
      protocol: "https",
      hostname: "s3.amazonaws.com",
    },
  ],
  deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
  imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  domains: [], // Deprecated in favor of remotePatterns
};

// Responsive image sizes for different contexts
export const ResponsiveSizes = {
  hero: "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw",
  product: "(max-width: 640px) 100vw, (max-width: 768px) 50vw, 25vw",
  thumbnail: "(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw",
  avatar: "(max-width: 640px) 96px, 128px",
  gallery: "(max-width: 768px) 100vw, (max-width: 1200px) 75vw, 50vw",
  banner: "100vw",
  card: "(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw",
};

// Image optimization utility class
export class ImageOptimizer {
  private config: ImageOptimizationConfig;

  constructor(config: Partial<ImageOptimizationConfig> = {}) {
    this.config = { ...defaultConfig, ...config };

    if (this.config.enabled) {
      logger.info("Image optimization enabled", {
        formats: this.config.formats,
        quality: this.config.quality,
        sizes: this.config.sizes.length,
      });
    }
  }

  /**
   * Generate optimized image props for Next.js Image component
   */
  getImageProps(options: {
    src: string;
    alt: string;
    width?: number;
    height?: number;
    priority?: boolean;
    sizes?: string;
    quality?: number;
    fill?: boolean;
    placeholder?: "blur" | "empty";
    blurDataURL?: string;
    className?: string;
  }) {
    const {
      src,
      alt,
      width,
      height,
      priority = false,
      sizes = ResponsiveSizes.product,
      quality = this.config.quality,
      fill = false,
      placeholder = this.config.blur ? "blur" : "empty",
      blurDataURL,
      className = "",
    } = options;

    const props: any = {
      src,
      alt,
      quality,
      sizes,
      className,
      priority: priority || this.config.priority,
      placeholder,
    };

    // Add dimensions if not using fill
    if (!fill) {
      if (width) props.width = width;
      if (height) props.height = height;
    } else {
      props.fill = true;
    }

    // Add blur data URL if available
    if (placeholder === "blur" && blurDataURL) {
      props.blurDataURL = blurDataURL;
    } else if (placeholder === "blur" && !blurDataURL) {
      props.blurDataURL = this.generateBlurDataURL();
    }

    return props;
  }

  /**
   * Generate blur placeholder data URL
   */
  private generateBlurDataURL(): string {
    // Simple base64 encoded 1x1 transparent image
    return "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91jkqmhezSuTgfeBPNdkgL5xZXLwz7p6LvPVl7vkA9QH0aqLNzZl+WVPjZnvSynTkFJllg==";
  }

  /**
   * Optimize image URL with query parameters
   */
  optimizeImageUrl(
    url: string,
    options: {
      width?: number;
      height?: number;
      quality?: number;
      format?: string;
    } = {}
  ): string {
    try {
      const urlObj = new URL(url);

      if (options.width) {
        urlObj.searchParams.set("w", options.width.toString());
      }

      if (options.height) {
        urlObj.searchParams.set("h", options.height.toString());
      }

      if (options.quality) {
        urlObj.searchParams.set("q", options.quality.toString());
      }

      if (options.format) {
        urlObj.searchParams.set("fm", options.format);
      }

      return urlObj.toString();
    } catch (error) {
      logger.warn("Failed to optimize image URL", { url, error });
      return url;
    }
  }

  /**
   * Generate srcSet for responsive images
   */
  generateSrcSet(baseSrc: string, sizes: number[] = this.config.sizes): string {
    return sizes
      .map(
        size => `${this.optimizeImageUrl(baseSrc, { width: size })} ${size}w`
      )
      .join(", ");
  }

  /**
   * Get optimal image dimensions based on container size
   */
  getOptimalDimensions(
    containerWidth: number,
    aspectRatio: number = 1
  ): {
    width: number;
    height: number;
  } {
    // Find the closest size from our predefined sizes
    const optimalWidth = this.config.sizes.reduce((prev, curr) =>
      Math.abs(curr - containerWidth) < Math.abs(prev - containerWidth)
        ? curr
        : prev
    );

    return {
      width: optimalWidth,
      height: Math.round(optimalWidth / aspectRatio),
    };
  }

  /**
   * Check if image should be prioritized for loading
   */
  shouldPrioritize(
    imageContext: "hero" | "above-fold" | "below-fold" | "lazy"
  ): boolean {
    return imageContext === "hero" || imageContext === "above-fold";
  }

  /**
   * Get Next.js image loader configuration
   */
  getLoaderConfig() {
    return {
      domains: this.config.domains,
      remotePatterns: this.config.remotePatterns,
      deviceSizes: this.config.deviceSizes,
      imageSizes: this.config.imageSizes,
      formats: this.config.formats,
    };
  }

  /**
   * Validate image URL against allowed patterns
   */
  isValidImageUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);

      // Check against remote patterns
      return this.config.remotePatterns.some(pattern => {
        const protocolMatch = pattern.protocol === urlObj.protocol.slice(0, -1);
        const hostnameMatch = pattern.hostname === urlObj.hostname;
        const portMatch = !pattern.port || pattern.port === urlObj.port;
        const pathnameMatch =
          !pattern.pathname || urlObj.pathname.startsWith(pattern.pathname);

        return protocolMatch && hostnameMatch && portMatch && pathnameMatch;
      });
    } catch {
      return false;
    }
  }

  /**
   * Generate image statistics
   */
  getImageStats(
    images: Array<{ src: string; width?: number; height?: number }>
  ): {
    totalImages: number;
    averageSize: number;
    formats: Record<string, number>;
    potentialSavings: string;
  } {
    const stats = {
      totalImages: images.length,
      averageSize: 0,
      formats: {} as Record<string, number>,
      potentialSavings: "0%",
    };

    images.forEach(img => {
      // Estimate size based on dimensions (rough calculation)
      const estimatedSize = (img.width || 800) * (img.height || 600) * 0.3; // rough bytes per pixel
      stats.averageSize += estimatedSize;

      // Extract format from URL
      const format = this.extractImageFormat(img.src);
      stats.formats[format] = (stats.formats[format] || 0) + 1;
    });

    stats.averageSize = Math.round(stats.averageSize / images.length);

    // Calculate potential savings with modern formats
    const modernFormatRatio =
      (stats.formats["webp"] || 0) + (stats.formats["avif"] || 0);
    const totalModernRatio = modernFormatRatio / stats.totalImages;
    const potentialSavings = Math.round((1 - totalModernRatio) * 30); // ~30% savings with modern formats

    stats.potentialSavings = `${potentialSavings}%`;

    return stats;
  }

  /**
   * Extract image format from URL
   */
  private extractImageFormat(url: string): string {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname.toLowerCase();

      if (pathname.includes(".webp")) return "webp";
      if (pathname.includes(".avif")) return "avif";
      if (pathname.includes(".jpg") || pathname.includes(".jpeg"))
        return "jpeg";
      if (pathname.includes(".png")) return "png";
      if (pathname.includes(".gif")) return "gif";
      if (pathname.includes(".svg")) return "svg";

      return "unknown";
    } catch {
      return "unknown";
    }
  }
}

// Pre-configured image components for common use cases
export const ImageComponents = {
  hero: (props: any) => ({
    ...props,
    priority: true,
    sizes: ResponsiveSizes.hero,
    quality: 85,
  }),

  product: (props: any) => ({
    ...props,
    sizes: ResponsiveSizes.product,
    quality: 80,
    placeholder: "blur" as const,
  }),

  thumbnail: (props: any) => ({
    ...props,
    sizes: ResponsiveSizes.thumbnail,
    quality: 70,
  }),

  avatar: (props: any) => ({
    ...props,
    sizes: ResponsiveSizes.avatar,
    quality: 75,
  }),
};

// Create singleton instance
export const imageOptimizer = new ImageOptimizer();

// Convenience functions
export function getOptimizedImageProps(
  options: Parameters<ImageOptimizer["getImageProps"]>[0]
) {
  return imageOptimizer.getImageProps(options);
}

export function generateImageSrcSet(src: string, sizes?: number[]) {
  return imageOptimizer.generateSrcSet(src, sizes);
}

export function isValidImageSource(url: string): boolean {
  return imageOptimizer.isValidImageUrl(url);
}

// Image performance monitoring
export function monitorImagePerformance(): void {
  if (typeof window !== "undefined") {
    // Monitor LCP (Largest Contentful Paint) for image loading
    const observer = new PerformanceObserver(list => {
      const entries = list.getEntries();
      entries.forEach(entry => {
        if (entry.entryType === "largest-contentful-paint") {
          logger.info("LCP detected", {
            loadTime: entry.startTime,
            element: (entry as any).element?.tagName,
            url: (entry as any).url,
          });
        }
      });
    });

    try {
      observer.observe({ entryTypes: ["largest-contentful-paint"] });
    } catch (error) {
      logger.warn("Failed to observe LCP", { error });
    }

    // Monitor image load times
    const imageLoadObserver = new PerformanceObserver(list => {
      const entries = list.getEntries();
      entries.forEach(entry => {
        if (entry.name.match(/\.(jpg|jpeg|png|webp|avif|gif)$/i)) {
          logger.debug("Image loaded", {
            url: entry.name,
            loadTime: entry.duration,
            size: (entry as any).transferSize,
          });
        }
      });
    });

    try {
      imageLoadObserver.observe({ entryTypes: ["resource"] });
    } catch (error) {
      logger.warn("Failed to observe image loads", { error });
    }
  }
}
