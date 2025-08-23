import { NextRequest, NextResponse } from "next/server";

import { apiCache } from "../caching/api-cache";
import { envConfig } from "../config/environment";
import { performanceMonitor } from "../monitoring/performance-monitor";

export interface MiddlewareConfig {
  enablePerformanceMonitoring: boolean;
  enableCaching: boolean;
  enableRateLimiting: boolean;
  enableCompression: boolean;
  enableSecurityHeaders: boolean;
  maxRequestSize: number; // bytes
  timeout: number; // milliseconds
}

const DEFAULT_CONFIG: MiddlewareConfig = {
  enablePerformanceMonitoring: true,
  enableCaching: true,
  enableRateLimiting: true,
  enableCompression: true,
  enableSecurityHeaders: true,
  maxRequestSize: 10 * 1024 * 1024, // 10MB
  timeout: 30000, // 30 seconds
};

// Rate limiting store (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

class ApiMiddleware {
  private static instance: ApiMiddleware;
  private config: MiddlewareConfig;

  private constructor() {
    this.config = DEFAULT_CONFIG;
  }

  static getInstance(): ApiMiddleware {
    if (!ApiMiddleware.instance) {
      ApiMiddleware.instance = new ApiMiddleware();
    }
    return ApiMiddleware.instance;
  }

  // Performance monitoring middleware
  withPerformanceMonitoring(handler: Function) {
    return async (req: NextRequest, ...args: any[]) => {
      if (!this.config.enablePerformanceMonitoring) {
        return handler(req, ...args);
      }

      const startTime = Date.now();
      let success = false;
      let error: string | undefined;

      try {
        const response = await handler(req, ...args);
        success = response.status < 400;
        return response;
      } catch (err) {
        error = err instanceof Error ? err.message : "Unknown error";
        throw err;
      } finally {
        const duration = Date.now() - startTime;
        const path = req.nextUrl.pathname;
        const method = req.method;

        performanceMonitor.recordApiRequest(
          method,
          path,
          duration,
          0, // We don't have status code in catch block
          success,
          undefined,
          error
        );
      }
    };
  }

  // Caching middleware
  withCaching(handler: Function, ttl?: number) {
    return async (req: NextRequest, ...args: any[]) => {
      if (!this.config.enableCaching) {
        return handler(req, ...args);
      }

      // Try to get cached response
      const cachedResponse = await apiCache.get(req);
      if (cachedResponse) {
        return cachedResponse;
      }

      // Execute handler
      const response = await handler(req, ...args);

      // Cache the response
      await apiCache.set(req, response, ttl);

      return response;
    };
  }

  // Rate limiting middleware
  withRateLimiting(
    handler: Function,
    options: {
      windowMs?: number;
      maxRequests?: number;
      keyGenerator?: (req: NextRequest) => string;
    } = {}
  ) {
    const {
      windowMs = 15 * 60 * 1000, // 15 minutes
      maxRequests = 100,
      keyGenerator = (req: NextRequest) => {
        // Use IP address as default key
        const forwarded = req.headers.get("x-forwarded-for");
        const ip = forwarded ? forwarded.split(",")[0] : req.ip || "unknown";
        return `rate_limit:${ip}`;
      },
    } = options;

    return async (req: NextRequest, ...args: any[]) => {
      if (!this.config.enableRateLimiting) {
        return handler(req, ...args);
      }

      const key = keyGenerator(req);
      const now = Date.now();
      const _windowStart = now - windowMs;

      // Clean up old entries
      const entry = rateLimitStore.get(key);
      if (entry && entry.resetTime < now) {
        rateLimitStore.delete(key);
      }

      // Check current rate
      const currentEntry = rateLimitStore.get(key);
      if (currentEntry && currentEntry.count >= maxRequests) {
        return new NextResponse(
          JSON.stringify({
            error: "Too many requests",
            message: "Rate limit exceeded. Please try again later.",
            retryAfter: Math.ceil((currentEntry.resetTime - now) / 1000),
          }),
          {
            status: 429,
            headers: {
              "Content-Type": "application/json",
              "Retry-After": Math.ceil(
                (currentEntry.resetTime - now) / 1000
              ).toString(),
              "X-RateLimit-Limit": maxRequests.toString(),
              "X-RateLimit-Remaining": "0",
              "X-RateLimit-Reset": new Date(
                currentEntry.resetTime
              ).toISOString(),
            },
          }
        );
      }

      // Update rate limit
      if (currentEntry) {
        currentEntry.count++;
      } else {
        rateLimitStore.set(key, {
          count: 1,
          resetTime: now + windowMs,
        });
      }

      // Add rate limit headers to response
      const response = await handler(req, ...args);
      const currentCount = rateLimitStore.get(key)?.count || 0;

      response.headers.set("X-RateLimit-Limit", maxRequests.toString());
      response.headers.set(
        "X-RateLimit-Remaining",
        Math.max(0, maxRequests - currentCount).toString()
      );
      response.headers.set(
        "X-RateLimit-Reset",
        new Date(now + windowMs).toISOString()
      );

      return response;
    };
  }

  // Request size validation middleware
  withRequestSizeValidation(handler: Function) {
    return (req: NextRequest, ...args: any[]) => {
      const contentLength = req.headers.get("content-length");
      if (contentLength) {
        const size = parseInt(contentLength, 10);
        if (size > this.config.maxRequestSize) {
          return new NextResponse(
            JSON.stringify({
              error: "Request too large",
              message: `Request size exceeds maximum allowed size of ${this.config.maxRequestSize / 1024 / 1024}MB`,
            }),
            {
              status: 413,
              headers: { "Content-Type": "application/json" },
            }
          );
        }
      }

      return handler(req, ...args);
    };
  }

  // Timeout middleware
  withTimeout(handler: Function) {
    return async (req: NextRequest, ...args: any[]) => {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error("Request timeout"));
        }, this.config.timeout);
      });

      try {
        return await Promise.race([handler(req, ...args), timeoutPromise]);
      } catch (error) {
        if (error instanceof Error && error.message.includes("timeout")) {
          return new NextResponse(
            JSON.stringify({
              error: "Request timeout",
              message:
                "The request took too long to process. Please try again.",
            }),
            {
              status: 408,
              headers: { "Content-Type": "application/json" },
            }
          );
        }
        throw error;
      }
    };
  }

  // Security headers middleware
  withSecurityHeaders(handler: Function) {
    return async (req: NextRequest, ...args: any[]) => {
      const response = await handler(req, ...args);

      if (this.config.enableSecurityHeaders) {
        // Add security headers
        response.headers.set("X-Content-Type-Options", "nosniff");
        response.headers.set("X-Frame-Options", "DENY");
        response.headers.set("X-XSS-Protection", "1; mode=block");
        response.headers.set(
          "Referrer-Policy",
          "strict-origin-when-cross-origin"
        );
        response.headers.set(
          "Permissions-Policy",
          "camera=(), microphone=(), geolocation=(), interest-cohort=()"
        );

        // Add CSP header for API responses
        response.headers.set(
          "Content-Security-Policy",
          "default-src 'self'; script-src 'none'; object-src 'none';"
        );
      }

      return response;
    };
  }

  // Error handling middleware
  withErrorHandling(handler: Function) {
    return async (req: NextRequest, ...args: any[]) => {
      try {
        return await handler(req, ...args);
      } catch (error) {
        console.error("API Error:", error);

        // Log error for monitoring
        if (this.config.enablePerformanceMonitoring) {
          performanceMonitor.recordApiRequest(
            req.method,
            req.nextUrl.pathname,
            0,
            500,
            false,
            undefined,
            error instanceof Error ? error.message : "Unknown error"
          );
        }

        // Return appropriate error response
        const statusCode =
          error instanceof Error && "statusCode" in error
            ? (error as any).statusCode
            : 500;

        const message =
          error instanceof Error ? error.message : "Internal server error";

        return new NextResponse(
          JSON.stringify({
            error: "Internal server error",
            message: envConfig.environment.isDevelopment
              ? message
              : "Something went wrong",
            ...(envConfig.environment.isDevelopment && {
              stack: error instanceof Error ? error.stack : undefined,
            }),
          }),
          {
            status: statusCode,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    };
  }

  // Compression middleware
  withCompression(handler: Function) {
    return async (req: NextRequest, ...args: any[]) => {
      const response = await handler(req, ...args);

      if (this.config.enableCompression) {
        const acceptEncoding = req.headers.get("accept-encoding") || "";

        if (acceptEncoding.includes("gzip")) {
          // In a real implementation, you would compress the response
          // For now, we'll just add the header
          response.headers.set("Content-Encoding", "gzip");
        } else if (acceptEncoding.includes("deflate")) {
          response.headers.set("Content-Encoding", "deflate");
        }
      }

      return response;
    };
  }

  // Combined middleware with all features
  withAllMiddleware(
    handler: Function,
    options: {
      enableCaching?: boolean;
      cacheTTL?: number;
      enableRateLimiting?: boolean;
      rateLimitOptions?: {
        windowMs?: number;
        maxRequests?: number;
        keyGenerator?: (req: NextRequest) => string;
      };
    } = {}
  ) {
    let wrappedHandler = handler;

    // Apply middleware in order
    wrappedHandler = this.withErrorHandling(wrappedHandler);
    wrappedHandler = this.withTimeout(wrappedHandler);
    wrappedHandler = this.withRequestSizeValidation(wrappedHandler);

    if (options.enableRateLimiting !== false) {
      wrappedHandler = this.withRateLimiting(
        wrappedHandler,
        options.rateLimitOptions
      );
    }

    if (options.enableCaching !== false) {
      wrappedHandler = this.withCaching(wrappedHandler, options.cacheTTL);
    }

    wrappedHandler = this.withCompression(wrappedHandler);
    wrappedHandler = this.withSecurityHeaders(wrappedHandler);
    wrappedHandler = this.withPerformanceMonitoring(wrappedHandler);

    return wrappedHandler;
  }

  // Health check endpoint
  async healthCheck(_req: NextRequest): Promise<NextResponse> {
    try {
      const checks = {
        redis: await redisCache.healthCheck(),
        performance: performanceMonitor.getMetrics(),
      };

      const isHealthy =
        checks.redis && Object.keys(checks.performance).length > 0;

      return NextResponse.json(
        {
          status: isHealthy ? "healthy" : "degraded",
          timestamp: new Date().toISOString(),
          checks,
        },
        { status: isHealthy ? 200 : 503 }
      );
    } catch (error) {
      return NextResponse.json(
        {
          status: "unhealthy",
          timestamp: new Date().toISOString(),
          error: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 503 }
      );
    }
  }

  // Metrics endpoint
  async getMetrics(_req: NextRequest): Promise<NextResponse> {
    try {
      const metrics = {
        performance: performanceMonitor.getMetrics(),
        cache: await redisCache.getCacheStats(),
        timestamp: new Date().toISOString(),
      };

      return NextResponse.json(metrics);
    } catch (error) {
      return NextResponse.json(
        {
          error: error instanceof Error ? error.message : "Unknown error",
          timestamp: new Date().toISOString(),
        },
        { status: 500 }
      );
    }
  }
}

// Export singleton instance
export const apiMiddleware = ApiMiddleware.getInstance();

// Convenience functions
export const withPerformanceMonitoring = (handler: Function) =>
  apiMiddleware.withPerformanceMonitoring(handler);
export const withCaching = (handler: Function, ttl?: number) =>
  apiMiddleware.withCaching(handler, ttl);
export const withRateLimiting = (handler: Function, options?: any) =>
  apiMiddleware.withRateLimiting(handler, options);
export const withRequestSizeValidation = (handler: Function) =>
  apiMiddleware.withRequestSizeValidation(handler);
export const withTimeout = (handler: Function) =>
  apiMiddleware.withTimeout(handler);
export const withSecurityHeaders = (handler: Function) =>
  apiMiddleware.withSecurityHeaders(handler);
export const withErrorHandling = (handler: Function) =>
  apiMiddleware.withErrorHandling(handler);
export const withCompression = (handler: Function) =>
  apiMiddleware.withCompression(handler);
export const withAllMiddleware = (handler: Function, options?: any) =>
  apiMiddleware.withAllMiddleware(handler, options);
