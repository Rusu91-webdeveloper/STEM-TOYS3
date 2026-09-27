import {
  isCatalogAddOn,
  visibleInBrowse,
  type HomepageCandidate,
} from "@/lib/products/merchandising";

const QUALITY_NAME =
  /air.toobz|aqua.*(?:reumplere|refill)|fridge.rover|spider|păianjen|paianjen|E tiintific|miE care|Ã|�/i;

export interface CatalogAccessProduct extends HomepageCandidate {
  isActive?: boolean;
  status?: string | null;
}

export type PdpVisibility = "public" | "noindex" | "not-found";

function metadataRecord(
  metadata: CatalogAccessProduct["metadata"]
): Record<string, unknown> | null {
  if (!metadata || typeof metadata !== "object") return null;
  return metadata as Record<string, unknown>;
}

/** Purchasable attachment linked from another product's add-on block. */
export function isUpsellAttachment(product: CatalogAccessProduct): boolean {
  const tags = product.tags ?? [];
  if (tags.some(tag => /upsell|add-?on|addon/i.test(tag))) return true;
  const upsell = metadataRecord(product.metadata)?.upsellFor;
  if (typeof upsell === "string" && upsell.trim().length > 0) return true;
  if (Array.isArray(upsell) && upsell.length > 0) return true;
  return false;
}

export function isQualityHidden(product: CatalogAccessProduct): boolean {
  const merchandising = metadataRecord(product.metadata)?.merchandising;
  if (
    merchandising &&
    typeof merchandising === "object" &&
    (merchandising as { browseHidden?: boolean }).browseHidden === true &&
    !isUpsellAttachment(product)
  ) {
    return true;
  }
  return QUALITY_NAME.test(product.name);
}

/**
 * Public PDP: indexable.
 * Hidden add-on: reachable, noindex.
 * Hidden for quality and not an add-on: 404.
 * Low stock stays reachable.
 */
export function resolvePdpVisibility(
  product: CatalogAccessProduct
): PdpVisibility {
  if (product.isActive === false) return "not-found";
  if (
    product.status &&
    product.status !== "APPROVED" &&
    product.status !== "IN_PENDING"
  ) {
    return "not-found";
  }

  if (visibleInBrowse(product)) return "public";
  if (isUpsellAttachment(product)) return "noindex";
  if (isQualityHidden(product)) return "not-found";
  return "public";
}

/** Same browse rules as /products, plus inactive and add-on exclusion. */
export function includeInProductSitemap(
  product: CatalogAccessProduct
): boolean {
  if (product.isActive === false) return false;
  if (product.status !== "APPROVED") return false;
  if (isCatalogAddOn(product) || isUpsellAttachment(product)) return false;
  return visibleInBrowse(product);
}
