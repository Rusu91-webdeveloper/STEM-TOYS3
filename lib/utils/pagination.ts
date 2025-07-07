/**
 * Pagination utility for API endpoints.
 *
 * Usage:
 *   import { getPaginationParams } from "@/lib/utils/pagination";
 *   const { page, limit, skip } = getPaginationParams(searchParams, { defaultLimit: 10, maxLimit: 100 });
 */

export function getPaginationParams(
  searchParams: URLSearchParams,
  opts: { defaultLimit?: number; maxLimit?: number } = {}
) {
  const defaultLimit = opts.defaultLimit ?? 10;
  const maxLimit = opts.maxLimit ?? 100;
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  let limit = parseInt(searchParams.get("limit") || String(defaultLimit), 10);
  if (isNaN(limit) || limit < 1) limit = defaultLimit;
  if (limit > maxLimit) limit = maxLimit;
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}
