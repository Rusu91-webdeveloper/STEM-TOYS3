export const PRODUCTS_PAGE_SIZE = 12;

export function parseProductsPage(
  value: string | string[] | null | undefined
): number {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw == null || raw === "") return 1;
  const page = Number.parseInt(raw, 10);
  if (!Number.isFinite(page) || page < 1) return 1;
  return page;
}

type ListingParams = Record<string, string | string[] | undefined>;

function firstParam(
  value: string | string[] | undefined
): string | undefined {
  if (Array.isArray(value)) return value.find(item => item.length > 0);
  return value && value.length > 0 ? value : undefined;
}

/** Shareable /products path. Page 1 omits `page`. Other filters stay. */
export function buildProductsListingPath(
  params: ListingParams,
  page: number
): string {
  const search = new URLSearchParams();
  const keys = Object.keys(params)
    .filter(key => key !== "page")
    .sort((a, b) => a.localeCompare(b));

  for (const key of keys) {
    const value = firstParam(params[key]);
    if (value) search.set(key, value);
  }

  const safePage = parseProductsPage(String(page));
  if (safePage > 1) search.set("page", String(safePage));

  const query = search.toString();
  return query ? `/products?${query}` : "/products";
}

export function listingTotalPages(totalItems: number, pageSize = PRODUCTS_PAGE_SIZE): number {
  if (!Number.isFinite(totalItems) || totalItems <= 0) return 1;
  return Math.ceil(totalItems / pageSize);
}
