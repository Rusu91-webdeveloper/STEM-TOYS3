/**
 * Filtering utility for API endpoints.
 *
 * Usage:
 *   import { getFilterParams } from "@/lib/utils/filtering";
 *   const filters = getFilterParams(searchParams, ["category", "status", "search"]);
 */

export function getFilterParams(
  searchParams: URLSearchParams,
  allowedFilters: string[]
): Record<string, string | boolean | string[]> {
  const filters: Record<string, string | boolean | string[]> = {};
  for (const key of allowedFilters) {
    if (searchParams.has(key)) {
      const raw = searchParams.get(key);
      if (raw === null) continue;
      let value: string | boolean | string[] = raw;
      // Convert boolean-like strings
      if (raw === "true") value = true;
      else if (raw === "false") value = false;
      // Convert comma-separated lists to arrays
      else if (raw.includes(",")) value = raw.split(",").map(v => v.trim());
      filters[key] = value;
    }
  }
  return filters;
}
