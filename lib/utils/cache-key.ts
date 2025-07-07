/**
 * Cache key utility for API endpoints.
 *
 * Usage:
 *   import { getCacheKey } from "@/lib/utils/cache-key";
 *   const cacheKey = getCacheKey("products", { category: "books", page: 2, limit: 10 });
 *   // => 'products:category=books&limit=10&page=2'
 */

export function getCacheKey(
  resource: string,
  params?: Record<string, any>
): string {
  if (!params || Object.keys(params).length === 0) return resource;
  // Sort keys for consistency
  const sortedKeys = Object.keys(params).sort();
  const paramString = sortedKeys
    .map(key => `${key}=${encodeURIComponent(JSON.stringify(params[key]))}`)
    .join("&");
  return `${resource}:${paramString}`;
}
