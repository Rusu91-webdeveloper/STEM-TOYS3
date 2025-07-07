import { NextResponse } from "next/server";

/**
 * Shared response headers utility for Next.js API routes.
 *
 * - Use exported helpers to get standard Cache-Control, CORS, and security headers.
 * - Use `mergeHeaders` to combine with custom headers as needed.
 * - Use `applyStandardHeaders` to add all standard headers to a NextResponse.
 *
 * Usage:
 *   import { getPublicCacheHeaders, getPrivateCacheHeaders, getCORSHeaders, getSecurityHeaders, applyStandardHeaders } from "@/lib/response-headers";
 *
 *   // For a public, cacheable endpoint:
 *   return applyStandardHeaders(NextResponse.json(data), { cache: 'public' });
 *
 *   // For a private, user-specific endpoint:
 *   return applyStandardHeaders(NextResponse.json(data), { cache: 'private' });
 */

export function getPublicCacheHeaders(maxAge = 60, staleWhileRevalidate = 300) {
  return {
    "Cache-Control": `public, max-age=${maxAge}, stale-while-revalidate=${staleWhileRevalidate}`,
  };
}

export function getPrivateCacheHeaders() {
  return {
    "Cache-Control": "private, no-store",
  };
}

export function getCORSHeaders(origin: string = "*") {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Credentials": "true",
  };
}

export function getSecurityHeaders() {
  return {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "X-XSS-Protection": "1; mode=block",
    "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
  };
}

export function mergeHeaders(...headerObjects: Array<Record<string, string>>) {
  return Object.assign({}, ...headerObjects);
}

export function applyStandardHeaders(
  response: NextResponse,
  opts: { cache?: "public" | "private"; corsOrigin?: string } = {}
): NextResponse {
  const cacheHeaders =
    opts.cache === "public"
      ? getPublicCacheHeaders()
      : getPrivateCacheHeaders();
  const corsHeaders = getCORSHeaders(opts.corsOrigin);
  const securityHeaders = getSecurityHeaders();
  const merged = mergeHeaders(cacheHeaders, corsHeaders, securityHeaders);
  Object.entries(merged).forEach(([key, value]) => {
    response.headers.set(String(key), String(value));
  });
  return response;
}
