import type { Product } from "@/types/product";

import { applyProductContentOverride } from "./catalog-content-overrides";
import { applyReviewedCatalogCopy } from "./catalog-editorial";
import { storefrontImage } from "./catalog-image";
import { normalizeStorefrontCopy } from "./storefront-copy";

const SUPPLIER_BUY_HOSTS = ["boribon.ro", "kidstory.ro"];
const IMAGE_PATH = /\.(avif|gif|jpe?g|png|svg|webp)(?:$|[?#])/i;
const SUPPLIER_LINK_KEYS = new Set([
  "supplier",
  "supplierUrl",
  "supplierName",
  "buyUrl",
  "sourceUrl",
  "boribon",
  "kidstory",
  "supplierSource",
  "supplierCategory",
  "sourceCategory",
]);

function isSupplierHost(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^www\./, "");
  return SUPPLIER_BUY_HOSTS.some(
    supplierHost => host === supplierHost || host.endsWith(`.${supplierHost}`)
  );
}

/** Product-page and catalog links on supplier shops. Image files stay so photos still load. */
export function isSupplierBuyUrl(value: string): boolean {
  const trimmed = value.trim();
  if (!/^https?:\/\//i.test(trimmed)) return false;

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return false;
  }

  if (!isSupplierHost(url.hostname)) return false;
  return !IMAGE_PATH.test(url.pathname);
}

function sanitizeValue(value: unknown): unknown {
  if (typeof value === "string") {
    return isSupplierBuyUrl(value) ? undefined : value;
  }

  if (value instanceof Date) return value;

  if (Array.isArray(value)) {
    return value
      .map(item => sanitizeValue(item))
      .filter(item => item !== undefined);
  }

  if (value && typeof value === "object") {
    const output: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(
      value as Record<string, unknown>
    )) {
      if (SUPPLIER_LINK_KEYS.has(key)) continue;
      const next = sanitizeValue(child);
      if (next !== undefined) output[key] = next;
    }
    return output;
  }

  return value;
}

/**
 * Shopper payload for product pages and public product APIs.
 * Drops supplier identity and direct supplier storefront URLs without
 * changing the catalog rows the supplier sync writes.
 */
export function toShopperProduct<T>(product: T): T {
  const sanitized = sanitizeValue(product);
  if (!sanitized || typeof sanitized !== "object" || Array.isArray(sanitized)) {
    return product;
  }
  const record = sanitized as Record<string, unknown>;
  for (const key of ["name", "description"] as const) {
    if (typeof record[key] === "string")
      record[key] = normalizeStorefrontCopy(record[key]);
  }
  if (Array.isArray(record.images)) {
    record.images = record.images.map(source =>
      typeof source === "string" ? storefrontImage(source) : source
    );
  }
  const corrected =
    typeof record.slug === "string"
      ? (applyProductContentOverride(sanitized as Product) as T)
      : (sanitized as T);
  return applyReviewedCatalogCopy(corrected);
}

/** Apply current presentation rules after reading a catalog cache entry. */
export function toShopperCatalog<T extends { products: unknown[] }>(
  payload: T
): T {
  return { ...payload, products: payload.products.map(toShopperProduct) };
}
