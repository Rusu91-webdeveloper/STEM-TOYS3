/** Editorial selection; order is not a sales or popularity claim. */
export const GIFT_SLUGS = [
  "kit-stem-racheta-cu-propulsie-pe-apa-topbright-tb-160142",
] as const;
export const ROCKET_SLUG = GIFT_SLUGS[0];
type BrowseProduct = {
  slug: string;
  name: string;
  stockQuantity: number;
  isBook?: boolean;
  metadata?: any;
  attributes?: any;
  featured?: boolean;
};
export function giftOrder(product: BrowseProduct): number {
  const index = GIFT_SLUGS.indexOf(product.slug as (typeof GIFT_SLUGS)[number]);
  return index < 0 ? 100 : index;
}
export function visibleInBrowse(product: BrowseProduct): boolean {
  if (product.isBook) return false;
  const editorial = product.metadata?.merchandising;
  if (editorial?.browseHidden) return false;
  
  // Capacity model (Kidstory): stockQuantity=1 means "available", hide only at 0
  // Quantity model (Boribon, others): hide at stockQuantity <= 1 (running low or out)
  const isCapacityModel = product.attributes?.inventoryMode === "supplier-availability";
  const stockThreshold = isCapacityModel ? 0 : 1;
  
  if (product.stockQuantity <= stockThreshold && editorial?.keepLowStock !== true)
    return false;
    
  return !/air.toobz|aqua.*(?:reumplere|refill)|fridge.rover|E tiintific|miE care|Ã|�/i.test(
    product.name
  );
}
export function selectHomepageGifts<T extends BrowseProduct>(
  products: T[]
): T[] {
  return products
    .filter(
      p => giftOrder(p) < 100 && p.stockQuantity > 1 && visibleInBrowse(p)
    )
    .sort((a, b) => giftOrder(a) - giftOrder(b))
    .slice(0, 4);
}

export const HOMEPAGE_PRODUCT_LIMIT = 8;

export interface HomepageCandidate extends BrowseProduct {
  featured?: boolean;
  images?: string[] | null;
  tags?: string[] | null;
}

/** Hidden add-ons and upsell attachments are not homepage products. */
export function isCatalogAddOn(product: HomepageCandidate): boolean {
  const tags = product.tags ?? [];
  if (tags.some(tag => /upsell|add-?on|addon/i.test(tag))) return true;
  const metadata = product.metadata;
  if (!metadata || typeof metadata !== "object") return false;
  const record = metadata as Record<string, unknown>;
  if (record.upsellFor) return true;
  const merchandising = record.merchandising;
  if (
    merchandising &&
    typeof merchandising === "object" &&
    (merchandising as { browseHidden?: boolean }).browseHidden === true
  ) {
    return true;
  }
  return false;
}

function hasDisplayImage(product: HomepageCandidate): boolean {
  return (product.images ?? []).some(
    src => typeof src === "string" && src.trim().length > 0
  );
}

/**
 * Homepage grid: featured products first, then other browseable products.
 * Order is slug-stable. It is not a sales ranking.
 */
export function selectHomepageProducts<T extends HomepageCandidate>(
  products: T[]
): T[] {
  const eligible = products.filter(
    product => visibleInBrowse(product) && !isCatalogAddOn(product)
  );
  return eligible
    .slice()
    .sort((a, b) => {
      const rank = (product: HomepageCandidate) =>
        (product.featured ? 0 : 2) + (hasDisplayImage(product) ? 0 : 1);
      const byRank = rank(a) - rank(b);
      if (byRank !== 0) return byRank;
      return a.slug.localeCompare(b.slug, "ro");
    })
    .slice(0, HOMEPAGE_PRODUCT_LIMIT);
}
