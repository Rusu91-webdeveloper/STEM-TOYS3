import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { redis } from "@/lib/redis";

import { RATE_LIMITS } from "./constants";

interface RateLimitConfig {
  /**
   * Maximum number of requests allowed in the windowMs timeframe
   */
  limit: number;

  /**
   * Time window in milliseconds
   */
  windowMs: number;

  /**
   * Optional identifier function (defaults to IP address)
   */
  identifierFn?: (req: NextRequest) => string;
}

// Timeout for Redis operations (2 seconds)
const REDIS_TIMEOUT = 2000;

/**
 * Execute a Redis operation with a timeout to prevent hanging
 */
async function withRedisTimeout<T>(
  operation: Promise<T>,
  fallbackFn: () => T
): Promise<T> {
  try {
    // Create a promise that rejects after the timeout
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(
          new Error(
            `Redis rate limit operation timed out after ${REDIS_TIMEOUT}ms`
          )
        );
      }, REDIS_TIMEOUT);
    });

    // Race the operation against the timeout
    return await Promise.race([operation, timeoutPromise]);
  } catch (error) {
    console.error("Redis rate limit operation failed or timed out:", error);
    // Execute fallback function if operation fails or times out
    return fallbackFn();
  }
}

/**
 * Redis-based rate limiting middleware for Next.js API routes
 * @param config Rate limiting configuration
 * @returns A function that can be used to rate limit requests
 */
export function rateLimit(config: RateLimitConfig) {
  const { limit, windowMs, identifierFn } = config;

  // Convert windowMs to seconds for Redis expiry
  const windowSeconds = Math.ceil(windowMs / 1000);

  return async function rateLimitMiddleware(req: NextRequest) {
    // Get identifier (default to IP from headers)
    const identifier = identifierFn
      ? identifierFn(req)
      : req.headers.get("x-forwarded-for") ||
        req.headers.get("x-real-ip") ||
        "unknown";

    // Create a unique Redis key for this rate limit
    const rateLimitKey = `ratelimit:${identifier}`;

    let currentCount = 0;
    let resetTime = 0;

    try {
      // Check if Redis is configured and available
      const isRedisConfigured = !!(
        process.env.REDIS_URL && process.env.REDIS_TOKEN
      );

      if (isRedisConfigured) {
        console.log("Using Redis for rate limiting");
        // Use Redis for distributed rate limiting with timeout protection

        // First, get the current count with timeout
        const result = await withRedisTimeout(redis.get(rateLimitKey), () => {
          console.log("Redis get timeout in rate limiting, using fallback");
          return null;
        });

        if (result === null) {
          // If Redis timed out or failed, fall back to in-memory
          return fallbackInMemoryRateLimit(req, identifier, limit, windowMs);
        }

        currentCount = result ? parseInt(result as string, 10) : 0;

        // Get TTL to calculate reset time with timeout
        const ttl = await withRedisTimeout(redis.ttl(rateLimitKey), () => {
          console.log("Redis TTL timeout in rate limiting, using fallback");
          return -1;
        });

        if (ttl === -1) {
          // If TTL operation failed, fall back to in-memory
          return fallbackInMemoryRateLimit(req, identifier, limit, windowMs);
        }

        resetTime = Date.now() + (ttl > 0 ? ttl * 1000 : windowMs);

        // Increment the counter
        currentCount++;

        // Update Redis with new count and set/reset expiry with timeout
        const setResult = await withRedisTimeout(
          redis.set(rateLimitKey, currentCount.toString(), {
            ex: windowSeconds,
          }),
          () => {
            console.log("Redis set timeout in rate limiting, using fallback");
            return "OK"; // Redis set returns "OK" on success
          }
        );

        if (setResult !== "OK") {
          // If set operation failed, fall back to in-memory for this request
          return fallbackInMemoryRateLimit(req, identifier, limit, windowMs);
        }
      } else {
        console.log("Redis not configured, using in-memory rate limiting");
        // Fallback to in-memory rate limiting if Redis is not available
        return fallbackInMemoryRateLimit(req, identifier, limit, windowMs);
      }
    } catch (error) {
      // If Redis fails, fall back to in-memory rate limiting
      console.error("Redis rate limiting error, using fallback:", error);
      return fallbackInMemoryRateLimit(req, identifier, limit, windowMs);
    }

    // Calculate remaining requests and reset time
    const remaining = Math.max(0, limit - currentCount);
    const reset = Math.ceil((resetTime - Date.now()) / 1000); // in seconds

    // Set rate limit headers
    const headers = {
      "X-RateLimit-Limit": limit.toString(),
      "X-RateLimit-Remaining": remaining.toString(),
      "X-RateLimit-Reset": reset.toString(),
    };

    // If limit exceeded, return 429 Too Many Requests
    if (currentCount > limit) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          message: "Too many requests, please try again later.",
        }),
        {
          status: 429,
          headers: {
            ...headers,
            "Retry-After": reset.toString(),
          },
        }
      );
    }

    // Request allowed, pass through with rate limit headers
    return null;
  };
}

// In-memory storage for fallback rate limiting
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Fallback in-memory rate limiting when Redis is unavailable
 */
function fallbackInMemoryRateLimit(
  req: NextRequest,
  identifier: string,
  limit: number,
  windowMs: number
) {
  // Get current time
  const now = Date.now();

  // Get or initialize rate limit entry
  let rateLimit = rateLimitStore.get(identifier);

  if (!rateLimit || now > rateLimit.resetTime) {
    // Initialize or reset rate limit
    rateLimit = {
      count: 0,
      resetTime: now + windowMs,
    };
  }

  // Increment count
  rateLimit.count += 1;

  // Update store
  rateLimitStore.set(identifier, rateLimit);

  // Calculate remaining requests and reset time
  const remaining = Math.max(0, limit - rateLimit.count);
  const reset = Math.ceil((rateLimit.resetTime - now) / 1000); // in seconds

  // Set rate limit headers
  const headers = {
    "X-RateLimit-Limit": limit.toString(),
    "X-RateLimit-Remaining": remaining.toString(),
    "X-RateLimit-Reset": reset.toString(),
  };

  // If limit exceeded, return 429 Too Many Requests
  if (rateLimit.count > limit) {
    return new NextResponse(
      JSON.stringify({
        success: false,
        message: "Too many requests, please try again later.",
      }),
      {
        status: 429,
        headers: {
          ...headers,
          "Retry-After": reset.toString(),
        },
      }
    );
  }

  // Request allowed, pass through with rate limit headers
  return null;
}

/**
 * Clean up expired rate limit entries from in-memory store
 */
function cleanupRateLimitStore() {
  const now = Date.now();

  for (const [key, value] of rateLimitStore.entries()) {
    if (now > value.resetTime) {
      rateLimitStore.delete(key);
    }
  }

  // Run cleanup every minute
  setTimeout(cleanupRateLimitStore, 60 * 1000);
}

// Initialize cleanup for the in-memory fallback
cleanupRateLimitStore();

/**
 * Helper function to apply rate limiting to an API route
 * @param handler The API route handler
 * @param config Rate limiting configuration
 * @returns The rate-limited API route handler
 */
export function withRateLimit(
  handler: (req: NextRequest) => Promise<NextResponse> | NextResponse,
  config: RateLimitConfig
) {
  const rateLimiter = rateLimit(config);

  return async function rateLimitedHandler(req: NextRequest) {
    // Apply rate limiting
    const rateLimitResponse = await rateLimiter(req);

    // If rate limit exceeded, return 429 response
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // Otherwise, call original handler
    return handler(req);
  };
}

/**
 * Rate limiting utility for API endpoints
 * Uses in-memory storage for now, can be upgraded to Redis later
 */

interface RateLimitOptions {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  keyGenerator?: (identifier: string) => string; // Custom key generator
  skipSuccessfulRequests?: boolean; // Don't count successful requests
  skipFailedRequests?: boolean; // Don't count failed requests
  message?: string; // Custom error message
}

interface RateLimitRecord {
  count: number;
  resetTime: number;
  lastRequest: number;
}

class RateLimiter {
  private store = new Map<string, RateLimitRecord>();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Clean up expired entries every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000);
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, record] of this.store.entries()) {
      if (record.resetTime < now) {
        this.store.delete(key);
      }
    }
  }

  private getKey(identifier: string, endpoint: string): string {
    return `${identifier}:${endpoint}`;
  }

  async checkLimit(
    identifier: string,
    endpoint: string,
    options: RateLimitOptions
  ): Promise<{
    success: boolean;
    limit: number;
    remaining: number;
    reset: number;
    retryAfter?: number;
  }> {
    const key = options.keyGenerator
      ? options.keyGenerator(identifier)
      : this.getKey(identifier, endpoint);

    const now = Date.now();
    const windowStart = now - options.windowMs;

    let record = this.store.get(key);

    // Create new record if doesn't exist or window has passed
    if (!record || record.resetTime < now) {
      record = {
        count: 0,
        resetTime: now + options.windowMs,
        lastRequest: now,
      };
    }

    // Check if we're within the rate limit
    if (record.count >= options.maxRequests) {
      const retryAfter = Math.ceil((record.resetTime - now) / 1000);
      return {
        success: false,
        limit: options.maxRequests,
        remaining: 0,
        reset: record.resetTime,
        retryAfter,
      };
    }

    // Increment counter and update record
    record.count++;
    record.lastRequest = now;
    this.store.set(key, record);

    return {
      success: true,
      limit: options.maxRequests,
      remaining: options.maxRequests - record.count,
      reset: record.resetTime,
    };
  }

  // Clean up when shutting down
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.store.clear();
  }
}

// Global rate limiter instance
const rateLimiter = new RateLimiter();

// Rate limit configurations for different endpoint types
export const rateLimitConfig = {
  // Authentication endpoints - strict limits
  auth: {
    windowMs: RATE_LIMITS.AUTH.WINDOW_MS,
    maxRequests: RATE_LIMITS.AUTH.MAX_REQUESTS,
    message: "Too many authentication attempts. Please try again later.",
  },

  // Password reset - very strict
  passwordReset: {
    windowMs: RATE_LIMITS.PASSWORD_RESET.WINDOW_MS,
    maxRequests: RATE_LIMITS.PASSWORD_RESET.MAX_REQUESTS,
    message: "Too many password reset attempts. Please try again later.",
  },

  // Contact form - prevent spam
  contact: {
    windowMs: RATE_LIMITS.CONTACT.WINDOW_MS,
    maxRequests: RATE_LIMITS.CONTACT.MAX_REQUESTS,
    message: "Please wait before submitting another message.",
  },

  // General API endpoints
  api: {
    windowMs: RATE_LIMITS.API.WINDOW_MS,
    maxRequests: RATE_LIMITS.API.MAX_REQUESTS,
    message: "Too many requests. Please slow down.",
  },

  // Admin endpoints - more restrictive
  admin: {
    windowMs: RATE_LIMITS.ADMIN.WINDOW_MS,
    maxRequests: RATE_LIMITS.ADMIN.MAX_REQUESTS,
    message: "Admin rate limit exceeded.",
  },

  // Public content - more lenient
  public: {
    windowMs: RATE_LIMITS.PUBLIC.WINDOW_MS,
    maxRequests: RATE_LIMITS.PUBLIC.MAX_REQUESTS,
    message: "Rate limit exceeded for public content.",
  },

  // Search endpoints
  search: {
    windowMs: RATE_LIMITS.SEARCH.WINDOW_MS,
    maxRequests: RATE_LIMITS.SEARCH.MAX_REQUESTS,
    message: "Too many search requests. Please wait.",
  },

  // Cart/checkout operations
  cart: {
    windowMs: RATE_LIMITS.CART.WINDOW_MS,
    maxRequests: RATE_LIMITS.CART.MAX_REQUESTS,
    message: "Too many cart operations. Please wait.",
  },
} as const;

/**
 * Get client identifier for rate limiting
 * Uses IP address as primary identifier, with fallbacks
 */
export function getClientIdentifier(request: Request): string {
  // Try to get real IP from various headers (in order of preference)
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIP = request.headers.get("x-real-ip");
  const cfConnectingIP = request.headers.get("cf-connecting-ip");

  // Parse forwarded-for header (may contain multiple IPs)
  if (forwardedFor) {
    const ips = forwardedFor.split(",").map(ip => ip.trim());
    return ips[0]; // First IP is the original client
  }

  if (realIP) return realIP;
  if (cfConnectingIP) return cfConnectingIP;

  // Fallback to user agent + other headers for identification
  const userAgent = request.headers.get("user-agent") || "unknown";
  const acceptLanguage = request.headers.get("accept-language") || "unknown";

  // Create a hash of identifying information using Web Crypto API (Edge Runtime compatible)
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(`${userAgent}:${acceptLanguage}`);

    // Use a simple hash function for Edge Runtime compatibility
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data[i];
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    const identifier = Math.abs(hash).toString(16).substring(0, 16);
    return `fallback:${identifier}`;
  } catch (error) {
    // Final fallback - use timestamp + random
    return `fallback:${Date.now().toString(16)}${Math.random().toString(16).substr(2, 8)}`;
  }
}

/**
 * Determine rate limit configuration based on request path
 */
export function getRateLimitConfig(pathname: string): RateLimitOptions | null {
  // Authentication routes
  if (pathname.startsWith("/api/auth/")) {
    if (
      pathname.includes("forgot-password") ||
      pathname.includes("reset-password")
    ) {
      return rateLimitConfig.passwordReset;
    }
    return rateLimitConfig.auth;
  }

  // Admin routes
  if (pathname.startsWith("/api/admin/")) {
    return rateLimitConfig.admin;
  }

  // Contact form
  if (pathname.startsWith("/api/contact")) {
    return rateLimitConfig.contact;
  }

  // Search endpoints
  if (
    pathname.includes("/search") ||
    pathname.includes("/api/products/search")
  ) {
    return rateLimitConfig.search;
  }

  // Cart operations
  if (
    pathname.startsWith("/api/cart/") ||
    pathname.startsWith("/api/checkout/")
  ) {
    return rateLimitConfig.cart;
  }

  // Public content (products, categories, blog)
  if (
    pathname.startsWith("/api/products") ||
    pathname.startsWith("/api/categories") ||
    pathname.startsWith("/api/blog") ||
    pathname.startsWith("/api/books")
  ) {
    return rateLimitConfig.public;
  }

  // General API endpoints
  if (pathname.startsWith("/api/")) {
    return rateLimitConfig.api;
  }

  // Don't rate limit non-API routes by default
  return null;
}

/**
 * Apply rate limiting to a request
 */
export async function applyRateLimit(
  request: Request,
  pathname: string
): Promise<{
  success: boolean;
  response?: Response;
  headers: Record<string, string>;
}> {
  const config = getRateLimitConfig(pathname);

  // No rate limiting configured for this path
  if (!config) {
    return { success: true, headers: {} };
  }

  const clientId = getClientIdentifier(request);
  const result = await rateLimiter.checkLimit(clientId, pathname, config);

  const headers: Record<string, string> = {
    "X-RateLimit-Limit": result.limit.toString(),
    "X-RateLimit-Remaining": result.remaining.toString(),
    "X-RateLimit-Reset": result.reset.toString(),
  };

  if (!result.success) {
    headers["Retry-After"] = result.retryAfter!.toString();

    const errorResponse = new Response(
      JSON.stringify({
        error: "Rate limit exceeded",
        message: config.message || "Too many requests",
        retryAfter: result.retryAfter,
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
      }
    );

    return {
      success: false,
      response: errorResponse,
      headers,
    };
  }

  return {
    success: true,
    headers,
  };
}

export { rateLimiter };
