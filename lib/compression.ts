/**
 * Response compression middleware with gzip/brotli support for STEM-TOYS2
 */

import { NextRequest, NextResponse } from "next/server";
import { logger } from "./logger";

// Compression configuration
export interface CompressionConfig {
  enabled: boolean;
  enableBrotli: boolean;
  enableGzip: boolean;
  threshold: number; // Minimum size to compress (bytes)
  level: {
    brotli: number; // 0-11
    gzip: number;   // 1-9
  };
  mimeTypes: string[];
  exclude: {
    paths: string[];
    extensions: string[];
    userAgents: string[];
  };
}

// Default compression configuration
const defaultConfig: CompressionConfig = {
  enabled: process.env.NODE_ENV === 'production',
  enableBrotli: true,
  enableGzip: true,
  threshold: 1024, // 1KB minimum
  level: {
    brotli: 6,  // Good balance of compression and speed
    gzip: 6     // Good balance of compression and speed
  },
  mimeTypes: [
    'text/html',
    'text/css',
    'text/javascript',
    'text/xml',
    'text/plain',
    'application/javascript',
    'application/json',
    'application/xml',
    'application/rss+xml',
    'application/atom+xml',
    'image/svg+xml',
    'application/x-font-ttf',
    'application/font-woff',
    'application/font-woff2'
  ],
  exclude: {
    paths: [
      '/api/uploadthing',
      '/api/stripe/webhook',
      '/api/download'
    ],
    extensions: [
      '.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif',
      '.mp4', '.webm', '.ogg',
      '.pdf', '.zip', '.gz', '.br',
      '.woff', '.woff2', '.ttf', '.eot'
    ],
    userAgents: [
      'bot', 'crawler', 'spider'
    ]
  }
};

// Compression statistics
interface CompressionStats {
  totalRequests: number;
  compressedRequests: number;
  brotliRequests: number;
  gzipRequests: number;
  bytesOriginal: number;
  bytesCompressed: number;
  averageRatio: number;
  errors: number;
}

class CompressionManager {
  private config: CompressionConfig;
  private stats: CompressionStats = {
    totalRequests: 0,
    compressedRequests: 0,
    brotliRequests: 0,
    gzipRequests: 0,
    bytesOriginal: 0,
    bytesCompressed: 0,
    averageRatio: 0,
    errors: 0
  };

  constructor(config: Partial<CompressionConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
    
    if (this.config.enabled) {
      logger.info('Response compression enabled', {
        brotli: this.config.enableBrotli,
        gzip: this.config.enableGzip,
        threshold: this.config.threshold
      });
    }
  }

  /**
   * Middleware function to compress responses
   */
  middleware() {
    return async (request: NextRequest, response: NextResponse) => {
      this.stats.totalRequests++;

      try {
        // Skip compression if disabled
        if (!this.config.enabled) {
          return response;
        }

        // Check if request should be excluded
        if (this.shouldExclude(request)) {
          logger.debug('Request excluded from compression', { 
            path: request.nextUrl.pathname 
          });
          return response;
        }

        // Get the response body
        const body = await response.text();
        
        // Skip compression for small responses
        if (body.length < this.config.threshold) {
          logger.debug('Response too small for compression', { 
            size: body.length,
            threshold: this.config.threshold 
          });
          return new NextResponse(body, {
            status: response.status,
            statusText: response.statusText,
            headers: response.headers
          });
        }

        // Check content type
        const contentType = response.headers.get('content-type') || '';
        if (!this.shouldCompress(contentType)) {
          logger.debug('Content type not eligible for compression', { contentType });
          return new NextResponse(body, {
            status: response.status,
            statusText: response.statusText,
            headers: response.headers
          });
        }

        // Determine best compression method
        const acceptEncoding = request.headers.get('accept-encoding') || '';
        const compressionMethod = this.getBestCompressionMethod(acceptEncoding);

        if (!compressionMethod) {
          logger.debug('No suitable compression method found', { acceptEncoding });
          return new NextResponse(body, {
            status: response.status,
            statusText: response.statusText,
            headers: response.headers
          });
        }

        // Compress the response
        const compressedBody = await this.compressData(body, compressionMethod);
        
        if (!compressedBody) {
          logger.warn('Compression failed, returning uncompressed response');
          return new NextResponse(body, {
            status: response.status,
            statusText: response.statusText,
            headers: response.headers
          });
        }

        // Update statistics
        this.updateStats(body.length, compressedBody.length, compressionMethod);

        // Create compressed response
        const compressedResponse = new NextResponse(new Uint8Array(compressedBody), {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers
        });

        // Set compression headers
        compressedResponse.headers.set('content-encoding', compressionMethod);
        compressedResponse.headers.set('content-length', compressedBody.length.toString());
        compressedResponse.headers.set('vary', 'Accept-Encoding');

        logger.debug('Response compressed', {
          method: compressionMethod,
          originalSize: body.length,
          compressedSize: compressedBody.length,
          ratio: ((1 - compressedBody.length / body.length) * 100).toFixed(2) + '%'
        });

        return compressedResponse;

      } catch (error) {
        this.stats.errors++;
        logger.error('Compression middleware error', { error });
        return response;
      }
    };
  }

  /**
   * Compress data using specified method
   */
  private async compressData(data: string, method: 'br' | 'gzip'): Promise<Buffer | null> {
    try {
      const buffer = Buffer.from(data, 'utf8');

      if (method === 'br' && this.config.enableBrotli) {
        // Use dynamic import for brotli compression
        const zlib = await import('zlib');
        const { promisify } = await import('util');
        const brotliCompress = promisify(zlib.brotliCompress);
        
        return await brotliCompress(buffer, {
          params: {
            [zlib.constants.BROTLI_PARAM_QUALITY]: this.config.level.brotli
          }
        });
      }

      if (method === 'gzip' && this.config.enableGzip) {
        // Use dynamic import for gzip compression
        const zlib = await import('zlib');
        const { promisify } = await import('util');
        const gzipCompress = promisify(zlib.gzip);
        
        return await gzipCompress(buffer, {
          level: this.config.level.gzip
        });
      }

      return null;
    } catch (error) {
      logger.error('Data compression failed', { method, error });
      return null;
    }
  }

  /**
   * Determine the best compression method based on Accept-Encoding header
   */
  private getBestCompressionMethod(acceptEncoding: string): 'br' | 'gzip' | null {
    const encodings = acceptEncoding.toLowerCase().split(',').map(e => e.trim());

    // Prefer Brotli if supported (better compression)
    if (this.config.enableBrotli && encodings.some(e => e.includes('br'))) {
      return 'br';
    }

    // Fall back to Gzip if supported
    if (this.config.enableGzip && encodings.some(e => e.includes('gzip'))) {
      return 'gzip';
    }

    return null;
  }

  /**
   * Check if content type should be compressed
   */
  private shouldCompress(contentType: string): boolean {
    return this.config.mimeTypes.some(type => 
      contentType.toLowerCase().includes(type.toLowerCase())
    );
  }

  /**
   * Check if request should be excluded from compression
   */
  private shouldExclude(request: NextRequest): boolean {
    const path = request.nextUrl.pathname;
    const userAgent = request.headers.get('user-agent') || '';

    // Check excluded paths
    if (this.config.exclude.paths.some(excludePath => path.startsWith(excludePath))) {
      return true;
    }

    // Check excluded extensions
    if (this.config.exclude.extensions.some(ext => path.endsWith(ext))) {
      return true;
    }

    // Check excluded user agents
    if (this.config.exclude.userAgents.some(agent => 
      userAgent.toLowerCase().includes(agent.toLowerCase())
    )) {
      return true;
    }

    return false;
  }

  /**
   * Update compression statistics
   */
  private updateStats(originalSize: number, compressedSize: number, method: 'br' | 'gzip'): void {
    this.stats.compressedRequests++;
    this.stats.bytesOriginal += originalSize;
    this.stats.bytesCompressed += compressedSize;

    if (method === 'br') {
      this.stats.brotliRequests++;
    } else if (method === 'gzip') {
      this.stats.gzipRequests++;
    }

    // Update average compression ratio
    this.stats.averageRatio = this.stats.bytesOriginal > 0 
      ? (1 - this.stats.bytesCompressed / this.stats.bytesOriginal) * 100
      : 0;
  }

  /**
   * Get compression statistics
   */
  getStats(): CompressionStats & { 
    config: CompressionConfig;
    compressionRate: number;
  } {
    const compressionRate = this.stats.totalRequests > 0 
      ? (this.stats.compressedRequests / this.stats.totalRequests) * 100
      : 0;

    return {
      ...this.stats,
      config: this.config,
      compressionRate: Math.round(compressionRate * 100) / 100
    };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = {
      totalRequests: 0,
      compressedRequests: 0,
      brotliRequests: 0,
      gzipRequests: 0,
      bytesOriginal: 0,
      bytesCompressed: 0,
      averageRatio: 0,
      errors: 0
    };
  }
}

// Create singleton instance
export const compressionManager = new CompressionManager();

// Export middleware function
export const compressionMiddleware = compressionManager.middleware();

// Utility functions
export function getCompressionStats() {
  return compressionManager.getStats();
}

export function resetCompressionStats() {
  compressionManager.resetStats();
}

// Helper function to check if content should be compressed
export function shouldCompressContent(contentType: string, size: number): boolean {
  const manager = new CompressionManager();
  return size >= manager['config'].threshold && 
         manager['shouldCompress'](contentType);
}

// Response compression utility for API routes
export async function compressApiResponse(
  data: any,
  request: NextRequest,
  options: {
    contentType?: string;
    status?: number;
  } = {}
): Promise<NextResponse> {
  const { contentType = 'application/json', status = 200 } = options;
  
  // Serialize data
  const body = typeof data === 'string' ? data : JSON.stringify(data);
  
  // Create initial response
  const response = new NextResponse(body, {
    status,
    headers: {
      'content-type': contentType,
    }
  });

  // Apply compression middleware
  return compressionManager.middleware()(request, response);
}

// Express-style middleware for custom server
export function expressCompressionMiddleware() {
  return async (req: any, res: any, next: any) => {
    // Store original end method
    const originalEnd = res.end;
    let responseBody = '';

    // Override res.end to capture response body
    res.end = function(chunk: any, encoding?: any) {
      if (chunk) {
        responseBody += chunk;
      }

      // Apply compression if appropriate
      const shouldCompress = shouldCompressContent(
        res.getHeader('content-type') || '',
        Buffer.byteLength(responseBody)
      );

      if (shouldCompress) {
        const acceptEncoding = req.headers['accept-encoding'] || '';
        const method = compressionManager['getBestCompressionMethod'](acceptEncoding);
        
        if (method) {
          compressionManager['compressData'](responseBody, method)
            .then(compressed => {
              if (compressed) {
                res.setHeader('content-encoding', method);
                res.setHeader('content-length', compressed.length);
                res.setHeader('vary', 'Accept-Encoding');
                originalEnd.call(res, compressed);
              } else {
                originalEnd.call(res, responseBody, encoding);
              }
            })
            .catch(() => {
              originalEnd.call(res, responseBody, encoding);
            });
          return;
        }
      }

      originalEnd.call(res, responseBody, encoding);
    };

    next();
  };
}

export type { CompressionStats }; 