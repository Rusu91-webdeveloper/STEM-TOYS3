/**
 * CDN configuration and static asset optimization for STEM-TOYS2
 */

import { logger } from "./logger";

// CDN Configuration
export interface CDNConfig {
  enabled: boolean;
  baseUrl: string;
  fallbackUrl: string;
  domains: {
    images: string;
    assets: string;
    uploads: string;
    static: string;
  };
  optimization: {
    enableWebP: boolean;
    enableAVIF: boolean;
    enableImageResize: boolean;
    defaultQuality: number;
    cacheControl: string;
  };
  security: {
    enableSignedUrls: boolean;
    tokenSecret?: string;
    tokenExpiry: number;
  };
}

// Default CDN configuration
const defaultConfig: CDNConfig = {
  enabled: process.env.CDN_ENABLED === 'true' || process.env.NODE_ENV === 'production',
  baseUrl: process.env.CDN_BASE_URL || '',
  fallbackUrl: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
  domains: {
    images: process.env.CDN_IMAGES_DOMAIN || '',
    assets: process.env.CDN_ASSETS_DOMAIN || '',
    uploads: process.env.CDN_UPLOADS_DOMAIN || '',
    static: process.env.CDN_STATIC_DOMAIN || ''
  },
  optimization: {
    enableWebP: true,
    enableAVIF: false, // Enable when more widely supported
    enableImageResize: true,
    defaultQuality: 85,
    cacheControl: 'public, max-age=31536000, immutable' // 1 year for static assets
  },
  security: {
    enableSignedUrls: process.env.CDN_SIGNED_URLS === 'true',
    tokenSecret: process.env.CDN_TOKEN_SECRET,
    tokenExpiry: 3600 // 1 hour
  }
};

// Asset types and their CDN configurations
export const AssetTypes = {
  image: {
    extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif', 'svg'],
    domain: 'images',
    cacheControl: 'public, max-age=2592000', // 30 days
    optimization: true
  },
  document: {
    extensions: ['pdf', 'doc', 'docx', 'txt'],
    domain: 'uploads',
    cacheControl: 'public, max-age=86400', // 1 day
    optimization: false
  },
  video: {
    extensions: ['mp4', 'webm', 'ogg'],
    domain: 'uploads',
    cacheControl: 'public, max-age=604800', // 7 days
    optimization: false
  },
  font: {
    extensions: ['woff', 'woff2', 'ttf', 'eot'],
    domain: 'static',
    cacheControl: 'public, max-age=31536000, immutable', // 1 year
    optimization: false
  },
  css: {
    extensions: ['css'],
    domain: 'static',
    cacheControl: 'public, max-age=86400', // 1 day
    optimization: false
  },
  js: {
    extensions: ['js', 'mjs'],
    domain: 'static',
    cacheControl: 'public, max-age=86400', // 1 day
    optimization: false
  }
};

// CDN Manager Class
export class CDNManager {
  private config: CDNConfig;
  private stats = {
    urlsGenerated: 0,
    cacheHits: 0,
    errors: 0
  };

  constructor(config: Partial<CDNConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
    
    if (this.config.enabled) {
      logger.info('CDN enabled', { 
        baseUrl: this.config.baseUrl,
        domains: this.config.domains 
      });
    } else {
      logger.info('CDN disabled, using local assets');
    }
  }

  /**
   * Generate optimized CDN URL for an asset
   */
  getAssetUrl(
    path: string, 
    options: {
      type?: keyof typeof AssetTypes;
      width?: number;
      height?: number;
      quality?: number;
      format?: 'auto' | 'webp' | 'avif' | 'png' | 'jpg';
      fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
    } = {}
  ): string {
    try {
      // If CDN is disabled, return local URL
      if (!this.config.enabled) {
        return this.getLocalUrl(path);
      }

      // Determine asset type
      const assetType = options.type || this.detectAssetType(path);
      const assetConfig = AssetTypes[assetType];

      if (!assetConfig) {
        logger.warn(`Unknown asset type for path: ${path}`);
        return this.getLocalUrl(path);
      }

      // Get appropriate CDN domain
      const domain = this.config.domains[assetConfig.domain as keyof typeof this.config.domains];
      if (!domain) {
        logger.warn(`No CDN domain configured for asset type: ${assetType}`);
        return this.getLocalUrl(path);
      }

      // Build base URL
      let url = `${domain}${path.startsWith('/') ? '' : '/'}${path}`;

      // Add optimization parameters for images
      if (assetConfig.optimization && this.config.optimization.enableImageResize) {
        const params = new URLSearchParams();

        if (options.width) params.set('w', options.width.toString());
        if (options.height) params.set('h', options.height.toString());
        if (options.quality) params.set('q', options.quality.toString());
        else params.set('q', this.config.optimization.defaultQuality.toString());
        
        if (options.format && options.format !== 'auto') {
          params.set('f', options.format);
        } else if (this.config.optimization.enableWebP) {
          params.set('f', 'webp');
        }

        if (options.fit) params.set('fit', options.fit);

        if (params.toString()) {
          url += `?${params.toString()}`;
        }
      }

      // Add signed URL if enabled
      if (this.config.security.enableSignedUrls) {
        url = this.signUrl(url);
      }

      this.stats.urlsGenerated++;
      logger.debug('CDN URL generated', { originalPath: path, cdnUrl: url, assetType });

      return url;

    } catch (error) {
      this.stats.errors++;
      logger.error('Failed to generate CDN URL', { path, error });
      return this.getLocalUrl(path);
    }
  }

  /**
   * Generate responsive image srcset for CDN
   */
  getResponsiveImageSrcSet(
    path: string,
    widths: number[] = [320, 640, 768, 1024, 1280, 1920],
    options: {
      quality?: number;
      format?: 'auto' | 'webp' | 'avif' | 'png' | 'jpg';
    } = {}
  ): string {
    return widths
      .map(width => {
        const url = this.getAssetUrl(path, {
          type: 'image',
          width,
          quality: options.quality,
          format: options.format
        });
        return `${url} ${width}w`;
      })
      .join(', ');
  }

  /**
   * Generate picture element with multiple formats
   */
  getPictureElement(
    path: string,
    alt: string,
    options: {
      widths?: number[];
      quality?: number;
      className?: string;
      loading?: 'lazy' | 'eager';
    } = {}
  ): string {
    const { widths = [320, 640, 768, 1024, 1280, 1920], quality, className, loading = 'lazy' } = options;

    const sources = [];

    // AVIF source (most efficient)
    if (this.config.optimization.enableAVIF) {
      const avifSrcSet = this.getResponsiveImageSrcSet(path, widths, { quality, format: 'avif' });
      sources.push(`<source srcset="${avifSrcSet}" type="image/avif">`);
    }

    // WebP source (good compression)
    if (this.config.optimization.enableWebP) {
      const webpSrcSet = this.getResponsiveImageSrcSet(path, widths, { quality, format: 'webp' });
      sources.push(`<source srcset="${webpSrcSet}" type="image/webp">`);
    }

    // Fallback JPEG/PNG
    const fallbackSrcSet = this.getResponsiveImageSrcSet(path, widths, { quality, format: 'auto' });
    const fallbackSrc = this.getAssetUrl(path, { type: 'image', width: widths[Math.floor(widths.length / 2)], quality });

    return `
      <picture>
        ${sources.join('\n        ')}
        <img 
          src="${fallbackSrc}" 
          srcset="${fallbackSrcSet}"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          alt="${alt}"
          ${className ? `class="${className}"` : ''}
          loading="${loading}"
        >
      </picture>
    `.trim();
  }

  /**
   * Preload critical assets
   */
  generatePreloadTags(assets: Array<{
    path: string;
    type: 'image' | 'font' | 'css' | 'js';
    media?: string;
    crossorigin?: boolean;
  }>): string[] {
    return assets.map(asset => {
      const url = this.getAssetUrl(asset.path, { type: asset.type });
      const rel = asset.type === 'font' ? 'preload' : 'prefetch';
      const asValue = asset.type === 'font' ? 'font' : asset.type === 'css' ? 'style' : 'script';
      
      let tag = `<link rel="${rel}" href="${url}" as="${asValue}"`;
      
      if (asset.type === 'font') {
        tag += ' crossorigin';
      }
      
      if (asset.media) {
        tag += ` media="${asset.media}"`;
      }
      
      tag += '>';
      
      return tag;
    });
  }

  /**
   * Get CDN statistics
   */
  getStats() {
    return {
      ...this.stats,
      config: {
        enabled: this.config.enabled,
        domains: this.config.domains,
        optimization: this.config.optimization
      }
    };
  }

  /**
   * Clear CDN cache for specific path or pattern
   */
  async purgeCache(pathOrPattern: string): Promise<boolean> {
    try {
      // This would integrate with your CDN provider's purge API
      // For now, just log the purge request
      logger.info('CDN cache purge requested', { pathOrPattern });
      
      // TODO: Implement actual CDN purge based on provider
      // Examples:
      // - Cloudflare: use Cloudflare API
      // - AWS CloudFront: create invalidation
      // - Fastly: use Fastly purge API
      
      return true;
    } catch (error) {
      logger.error('CDN cache purge failed', { pathOrPattern, error });
      return false;
    }
  }

  private detectAssetType(path: string): keyof typeof AssetTypes {
    const extension = path.split('.').pop()?.toLowerCase() || '';
    
    for (const [type, config] of Object.entries(AssetTypes)) {
      if (config.extensions.includes(extension)) {
        return type as keyof typeof AssetTypes;
      }
    }
    
    return 'image'; // Default fallback
  }

  private getLocalUrl(path: string): string {
    const baseUrl = this.config.fallbackUrl;
    return `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
  }

  private signUrl(url: string): string {
    if (!this.config.security.tokenSecret) {
      logger.warn('CDN token secret not configured, skipping URL signing');
      return url;
    }

    try {
      // Simple implementation - in production, use proper HMAC signing
      const expiry = Math.floor(Date.now() / 1000) + this.config.security.tokenExpiry;
      const token = Buffer.from(`${url}:${expiry}`).toString('base64').substring(0, 16);
      
      const separator = url.includes('?') ? '&' : '?';
      return `${url}${separator}token=${token}&expires=${expiry}`;
    } catch (error) {
      logger.error('Failed to sign CDN URL', { url, error });
      return url;
    }
  }
}

// Create singleton instance
export const cdn = new CDNManager();

// Convenience functions
export function getImageUrl(path: string, options?: Parameters<CDNManager['getAssetUrl']>[1]): string {
  return cdn.getAssetUrl(path, { ...options, type: 'image' });
}

export function getFontUrl(path: string): string {
  return cdn.getAssetUrl(path, { type: 'font' });
}

export function getStaticAssetUrl(path: string): string {
  return cdn.getAssetUrl(path, { type: 'css' }); // Generic static asset
}

export function getResponsiveImageSrcSet(path: string, widths?: number[], options?: Parameters<CDNManager['getResponsiveImageSrcSet']>[2]): string {
  return cdn.getResponsiveImageSrcSet(path, widths, options);
}

export function generatePictureElement(path: string, alt: string, options?: Parameters<CDNManager['getPictureElement']>[2]): string {
  return cdn.getPictureElement(path, alt, options);
}

export async function purgeCDNCache(pathOrPattern: string): Promise<boolean> {
  return cdn.purgeCache(pathOrPattern);
}

export function getCDNStats() {
  return cdn.getStats();
}

// Next.js Image component helper
export function getNextImageProps(src: string, options: {
  width?: number;
  height?: number;
  quality?: number;
} = {}) {
  return {
    src: getImageUrl(src, options),
    loader: ({ src, width, quality }: { src: string; width: number; quality?: number }) => getImageUrl(src, { width, quality })
  };
} 