import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import {
  isRedisConfigured,
  rateLimitRedis,
  rateLimitRedisTimeoutMs,
} from "@/lib/redis";

import { RATE_LIMITS } from "./constants";

interface RateLimitConfig {
  limit: number;
  windowMs: number;
  identifierFn?: (req: NextRequest) => string;
}

const RATE_LIMIT_PROVIDER = (
  process.env.RATE_LIMIT_PROVIDER || "auto"
).toLowerCase();
const CIRCUIT_WINDOW_MS = 60_000;
const CIRCUIT_OPEN_MS = 30_000;
let circuitOpen = false;
let circuitOpenedAt = 0;
let windowStartedAt = Date.now();
let rollingCalls = 0;
let rollingTimeouts = 0;
let consecutiveFailures = 0;
let probeInFlight = false;
let fallbackRequests = 0;
let lastFailureLogAt = -Infinity;

// INCR and expiry must be atomic. A missing key starts at one, and successful
// requests must not extend the window. Three separate REST calls did neither.
export const RATE_LIMIT_SCRIPT = `
local count = redis.call('INCR', KEYS[1])
local ttl = redis.call('PTTL', KEYS[1])
if count == 1 or ttl < 0 then
  redis.call('PEXPIRE', KEYS[1], ARGV[1])
  ttl = tonumber(ARGV[1])
end
return {count, ttl}
`;

function recordRedisAttempt(failed: boolean) {
  const now = Date.now();
  if (now - windowStartedAt >= CIRCUIT_WINDOW_MS) {
    windowStartedAt = now;
    rollingCalls = 0;
    rollingTimeouts = 0;
  }
  rollingCalls++;
  if (failed) {
    rollingTimeouts++;
    consecutiveFailures++;
    if (
      probeInFlight ||
      consecutiveFailures >= 3 ||
      (rollingCalls >= 10 && rollingTimeouts / rollingCalls > 0.2)
    ) {
      circuitOpen = true;
      circuitOpenedAt = now;
    }
    if (now - lastFailureLogAt >= CIRCUIT_OPEN_MS) {
      console.warn("[ratelimit] Redis unavailable; using local limits", {
        circuitOpen,
        timeoutMs: rateLimitRedisTimeoutMs,
      });
      lastFailureLogAt = now;
    }
  } else {
    consecutiveFailures = 0;
    circuitOpen = false;
  }
  probeInFlight = false;
}

function circuitAllowsRedis() {
  if (!circuitOpen) return true;
  if (Date.now() - circuitOpenedAt < CIRCUIT_OPEN_MS || probeInFlight)
    return false;
  probeInFlight = true;
  return true;
}

async function redisCounter(
  key: string,
  windowMs: number
): Promise<[number, number]> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(
        () => reject(new Error("Redis rate limit timeout")),
        rateLimitRedisTimeoutMs
      );
    });
    const result = await Promise.race([
      rateLimitRedis!.eval<[number, number]>(
        RATE_LIMIT_SCRIPT,
        [key],
        [windowMs]
      ),
      timeout,
    ]);
    if (
      !Array.isArray(result) ||
      result.length !== 2 ||
      !Number.isSafeInteger(result[0]) ||
      result[0] < 1 ||
      !Number.isFinite(result[1]) ||
      result[1] < 0 ||
      result[1] > windowMs
    ) {
      throw new Error("Invalid Redis rate limit counter");
    }
    return result;
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}

const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function memoryCounter(key: string, windowMs: number) {
  const now = Date.now();
  const existing = rateLimitStore.get(key);
  const entry =
    existing && now < existing.resetTime
      ? existing
      : { count: 0, resetTime: now + windowMs };
  entry.count++;
  rateLimitStore.set(key, entry);
  return entry;
}

function blockedResponse(count: number, resetTime: number, limit: number) {
  if (count <= limit) return null;
  const retryAfter = Math.max(1, Math.ceil((resetTime - Date.now()) / 1000));
  return new NextResponse(
    JSON.stringify({
      success: false,
      message: "Too many requests, please try again later.",
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "X-RateLimit-Limit": String(limit),
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": String(Math.ceil(resetTime / 1000)),
        "Retry-After": String(retryAfter),
      },
    }
  );
}

export function rateLimit({ limit, windowMs, identifierFn }: RateLimitConfig) {
  if (
    !Number.isSafeInteger(limit) ||
    limit < 1 ||
    !Number.isSafeInteger(windowMs) ||
    windowMs < 1
  ) {
    throw new Error("Rate limit and window must be positive integers");
  }
  return async function rateLimitMiddleware(req: NextRequest) {
    const identifier = identifierFn
      ? identifierFn(req)
      : req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
        req.headers.get("x-real-ip") ||
        "unknown";
    // Different configured quotas must not consume one another's counters.
    const key = `ratelimit:v2:${limit}:${windowMs}:${identifier}`;
    // Count every request locally as well, so switching providers does not give
    // this process a fresh allowance after a timeout or during recovery.
    const localAttempt = memoryCounter(key, windowMs);
    const preferMemory =
      RATE_LIMIT_PROVIDER === "memory" ||
      (RATE_LIMIT_PROVIDER === "auto" && process.env.NODE_ENV !== "production");

    if (
      !preferMemory &&
      isRedisConfigured &&
      rateLimitRedis &&
      circuitAllowsRedis()
    ) {
      try {
        const [count, ttl] = await redisCounter(key, windowMs);
        recordRedisAttempt(false);
        const resetTime = Date.now() + Math.max(1, ttl);
        const local = rateLimitStore.get(key);
        // Preserve known usage if a previous request used the local fallback.
        const effectiveCount = Math.max(
          count,
          local?.count ?? localAttempt.count
        );
        rateLimitStore.set(key, { count: effectiveCount, resetTime });
        return blockedResponse(effectiveCount, resetTime, limit);
      } catch {
        recordRedisAttempt(true);
      }
    }
    fallbackRequests++;
    const { count, resetTime } = localAttempt;
    return blockedResponse(count, resetTime, limit);
  };
}

const cleanupTimer = setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitStore) {
    if (now >= value.resetTime) rateLimitStore.delete(key);
  }
}, 60_000);
cleanupTimer.unref?.();

export function withRateLimit<TArgs extends unknown[]>(
  handler: (
    req: NextRequest,
    ...args: TArgs
  ) => Promise<NextResponse> | NextResponse,
  config: RateLimitConfig
) {
  const limiter = rateLimit(config);
  return async (req: NextRequest, ...args: TArgs) => {
    const blocked = await limiter(req);
    return blocked ?? handler(req, ...args);
  };
}

export const rateLimitHealth = {
  get status() {
    return {
      provider: RATE_LIMIT_PROVIDER,
      redisConfigured: isRedisConfigured,
      circuitOpen,
      rollingCalls,
      rollingTimeouts,
      fallbackRequests,
      redisTimeoutMs: rateLimitRedisTimeoutMs,
    };
  },
};

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

    // Prefer Redis for distributed rate limiting when configured
    if (isRedisConfigured) {
      try {
        const windowSeconds = Math.ceil(options.windowMs / 1000);
        const count = await redis.incr(key);
        if (count === 1) {
          await redis.expire(key, windowSeconds);
        }
        const ttl = await redis.ttl(key);
        const resetTime = now + (ttl > 0 ? ttl * 1000 : options.windowMs);

        if (count > options.maxRequests) {
          const retryAfter = Math.ceil((resetTime - now) / 1000);
          return {
            success: false,
            limit: options.maxRequests,
            remaining: 0,
            reset: resetTime,
            retryAfter,
          };
        }

        return {
          success: true,
          limit: options.maxRequests,
          remaining: Math.max(0, options.maxRequests - count),
          reset: resetTime,
        };
      } catch {
        // Fall through to in-memory store on Redis error

        console.error("Redis rate limiter error, using in-memory fallback");
      }
    }

    // In-memory fallback
    let record = this.store.get(key);
    if (!record || record.resetTime < now) {
      record = {
        count: 0,
        resetTime: now + options.windowMs,
        lastRequest: now,
      };
    }
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
  const userAgent = request.headers.get("user-agent") ?? "unknown";
  const acceptLanguage = request.headers.get("accept-language") ?? "unknown";

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
  } catch {
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

  // Payment provider webhooks (must accept all retries; no rate limit)
  if (
    pathname === "/api/payments/netopia/webhook" ||
    pathname.startsWith("/api/stripe/webhook")
  ) {
    return null;
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
