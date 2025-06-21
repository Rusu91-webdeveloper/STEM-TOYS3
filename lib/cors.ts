/**
 * CORS (Cross-Origin Resource Sharing) configuration and middleware
 * Implements secure CORS policies for different types of requests
 */

import { NextRequest, NextResponse } from "next/server";

/**
 * CORS policy type definition
 */
interface CorsPolicy {
  origins: string[] | "*";
  credentials: boolean;
  methods: string[];
  headers: string[];
  maxAge: number;
}

/**
 * CORS configuration for different environments and route types
 */
export const corsConfig = {
  // Development origins - more permissive for local development
  development: {
    origins: [
      "http://localhost:3000",
      "http://localhost:3001",
      "http://127.0.0.1:3000",
      "http://127.0.0.1:3001",
      "https://localhost:3000",
      "https://localhost:3001",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    headers: [
      "Accept",
      "Authorization",
      "Content-Type",
      "X-Requested-With",
      "X-CSRF-Token",
      "X-XSRF-Token",
      "CSRF-Token",
      "X-Auth-Token",
      "X-Client-Navigation",
      "X-Rate-Limit-Limit",
      "X-Rate-Limit-Remaining",
      "X-Rate-Limit-Reset",
    ],
    maxAge: 86400, // 24 hours
  },

  // Production origins - restrictive, only allow specific domains
  production: {
    origins: [
      // Add your production domains here
      "https://your-domain.com",
      "https://www.your-domain.com",
      // Add any CDN or subdomain origins
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    headers: [
      "Accept",
      "Authorization",
      "Content-Type",
      "X-Requested-With",
      "X-CSRF-Token",
      "X-XSRF-Token",
      "CSRF-Token",
      "X-Auth-Token",
      "X-Rate-Limit-Limit",
      "X-Rate-Limit-Remaining",
      "X-Rate-Limit-Reset",
    ],
    maxAge: 86400, // 24 hours
  },

  // Public API endpoints - more permissive for public content
  publicApi: {
    origins: "*" as const, // Allow all origins for public content
    credentials: false, // No credentials needed for public endpoints
    methods: ["GET", "OPTIONS"],
    headers: [
      "Accept",
      "Content-Type",
      "X-Requested-With",
      "X-Rate-Limit-Limit",
      "X-Rate-Limit-Remaining",
      "X-Rate-Limit-Reset",
    ],
    maxAge: 3600, // 1 hour
  },

  // Admin API endpoints - very restrictive
  adminApi: {
    origins: [], // Will be set to same-origin only
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    headers: [
      "Accept",
      "Authorization",
      "Content-Type",
      "X-Requested-With",
      "X-CSRF-Token",
      "X-Auth-Token",
    ],
    maxAge: 300, // 5 minutes
  },
};

/**
 * Determine CORS policy based on request path
 */
function getCorsPolicy(pathname: string): CorsPolicy {
  const isDev = process.env.NODE_ENV === "development";

  // Admin routes - most restrictive
  if (pathname.startsWith("/api/admin/")) {
    return corsConfig.adminApi;
  }

  // Public content routes - more permissive
  if (
    pathname.startsWith("/api/products") ||
    pathname.startsWith("/api/categories") ||
    pathname.startsWith("/api/blog") ||
    pathname.startsWith("/api/books") ||
    pathname.startsWith("/api/health")
  ) {
    return corsConfig.publicApi;
  }

  // Default to environment-specific policy
  return isDev ? corsConfig.development : corsConfig.production;
}

/**
 * Check if origin is allowed based on CORS policy
 */
function isOriginAllowed(
  origin: string | null,
  allowedOrigins: string[] | "*"
): boolean {
  if (!origin) return false;

  // Allow all origins
  if (allowedOrigins === "*") return true;

  // Check against allowed origins list
  if (Array.isArray(allowedOrigins)) {
    return allowedOrigins.includes(origin);
  }

  return false;
}

/**
 * Get the request origin with fallbacks
 */
function getOrigin(request: NextRequest): string | null {
  return (
    request.headers.get("origin") ||
    request.headers.get("referer")?.split("/").slice(0, 3).join("/") ||
    null
  );
}

/**
 * Apply CORS headers to a response
 */
export function applyCorsHeaders(
  response: NextResponse,
  request: NextRequest,
  policy: CorsPolicy
): NextResponse {
  const origin = getOrigin(request);

  // Set Access-Control-Allow-Origin
  if (policy.origins === "*") {
    response.headers.set("Access-Control-Allow-Origin", "*");
  } else if (origin && isOriginAllowed(origin, policy.origins)) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Vary", "Origin");
  }

  // Set Access-Control-Allow-Credentials
  if (policy.credentials) {
    response.headers.set("Access-Control-Allow-Credentials", "true");
  }

  // Set Access-Control-Allow-Methods
  response.headers.set(
    "Access-Control-Allow-Methods",
    policy.methods.join(", ")
  );

  // Set Access-Control-Allow-Headers
  response.headers.set(
    "Access-Control-Allow-Headers",
    policy.headers.join(", ")
  );

  // Set Access-Control-Max-Age
  response.headers.set("Access-Control-Max-Age", policy.maxAge.toString());

  return response;
}

/**
 * Handle preflight OPTIONS requests
 */
export function handlePreflight(request: NextRequest): NextResponse | null {
  if (request.method !== "OPTIONS") {
    return null;
  }

  const { pathname } = request.nextUrl;
  const policy = getCorsPolicy(pathname);
  const origin = getOrigin(request);

  // Check if origin is allowed
  if (policy.origins !== "*" && !isOriginAllowed(origin, policy.origins)) {
    return new NextResponse(null, {
      status: 403,
      headers: {
        "Content-Type": "text/plain",
      },
    });
  }

  // Create preflight response
  const response = new NextResponse(null, { status: 200 });

  // Apply CORS headers
  applyCorsHeaders(response, request, policy);

  return response;
}

/**
 * Main CORS middleware function
 */
export function applyCors(
  request: NextRequest,
  response: NextResponse
): NextResponse {
  const { pathname } = request.nextUrl;
  const policy = getCorsPolicy(pathname);
  const origin = getOrigin(request);

  // For non-OPTIONS requests, check if origin is allowed
  if (
    policy.origins !== "*" &&
    origin &&
    !isOriginAllowed(origin, policy.origins)
  ) {
    // Log the blocked request for security monitoring
    console.warn(
      `CORS: Blocked request from unauthorized origin: ${origin} to ${pathname}`
    );

    // For API routes, return 403
    if (pathname.startsWith("/api/")) {
      return new NextResponse(
        JSON.stringify({
          error: "CORS policy violation",
          message: "Origin not allowed",
        }),
        {
          status: 403,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }
  }

  // Apply CORS headers to the response
  return applyCorsHeaders(response, request, policy);
}

/**
 * Utility to create CORS-enabled API response
 */
export function createCorsResponse(
  data: any,
  request: NextRequest,
  options: ResponseInit = {}
): NextResponse {
  const response = NextResponse.json(data, options);
  return applyCors(request, response);
}

/**
 * Higher-order function to wrap API handlers with CORS
 */
export function withCors<T extends (...args: any[]) => Promise<NextResponse>>(
  handler: T
): T {
  return (async (...args: any[]) => {
    const request = args[0] as NextRequest;

    // Handle preflight requests
    const preflightResponse = handlePreflight(request);
    if (preflightResponse) {
      return preflightResponse;
    }

    // Execute the handler
    const response = await handler(...args);

    // Apply CORS headers
    return applyCors(request, response);
  }) as T;
}

/**
 * Development helper to log CORS configuration
 */
export function logCorsConfig() {
  if (process.env.NODE_ENV === "development") {
    console.log("🔒 CORS Configuration:");
    console.log("  Development origins:", corsConfig.development.origins);
    console.log("  Public API origins:", corsConfig.publicApi.origins);
    console.log("  Admin API origins:", corsConfig.adminApi.origins);
  }
}
