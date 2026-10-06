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
  // Editorial low-stock exceptions must never advertise an unavailable item.
  if (!Number.isFinite(product.stockQuantity) || product.stockQuantity <= 0)
    return false;
  const editorial = product.metadata?.merchandising;
  if (editorial?.browseHidden) return false;

  // Capacity model (Kidstory): stockQuantity=1 means "available", hide only at 0
  // Quantity model (Boribon, others): hide at stockQuantity <= 1 (running low or out)
  const isCapacityModel =
    product.attributes?.inventoryMode === "supplier-availability";
  const stockThreshold = isCapacityModel ? 0 : 1;

  if (
    product.stockQuantity <= stockThreshold &&
    editorial?.keepLowStock !== true
  )
    return false;

  return !/air.toobz|aqua.*(?:reumplere|refill)|fridge.rover|spider|păianjen|paianjen|E tiintific|miE care|Ã|�/i.test(
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

export const HOMEPAGE_HERO_COUNT = 3;

type FeaturedCandidate = HomepageCandidate & { featuredOrder?: number | null };

/** Editorial rank. The water rocket lead is 1 even without a stored field. */
export function readFeaturedOrder(product: FeaturedCandidate): number | null {
  if (
    typeof product.featuredOrder === "number" &&
    Number.isFinite(product.featuredOrder) &&
    product.featuredOrder > 0
  ) {
    return product.featuredOrder;
  }
  const merchandising = product.metadata?.merchandising;
  const fromMeta = merchandising?.featuredOrder;
  if (
    typeof fromMeta === "number" &&
    Number.isFinite(fromMeta) &&
    fromMeta > 0
  ) {
    return fromMeta;
  }
  const giftIndex = GIFT_SLUGS.indexOf(
    product.slug as (typeof GIFT_SLUGS)[number]
  );
  if (giftIndex >= 0) return giftIndex + 1;
  return null;
}

function inHomepagePool(product: HomepageCandidate): boolean {
  return (
    product.stockQuantity > 1 &&
    visibleInBrowse(product) &&
    !isCatalogAddOn(product) &&
    hasDisplayImage(product)
  );
}

/**
 * Featured products ordered by featuredOrder, then in-stock visible
 * non-add-on products with images, capped at 8. The hero uses the first 3.
 */
export function selectHomepageProducts<T extends FeaturedCandidate>(
  products: T[]
): T[] {
  const pool = products.filter(inHomepagePool);
  const featured = pool
    .filter(product => readFeaturedOrder(product) !== null)
    .sort((a, b) => {
      if (a.slug === ROCKET_SLUG) return -1;
      if (b.slug === ROCKET_SLUG) return 1;
      const order = (readFeaturedOrder(a) ?? 0) - (readFeaturedOrder(b) ?? 0);
      if (order !== 0) return order;
      return a.slug.localeCompare(b.slug, "ro");
    });
  const featuredSlugs = new Set(featured.map(product => product.slug));
  const fill = pool
    .filter(product => !featuredSlugs.has(product.slug))
    .sort((a, b) => a.slug.localeCompare(b.slug, "ro"));
  return [...featured, ...fill].slice(0, HOMEPAGE_PRODUCT_LIMIT);
}

export function selectHomepageHero<T>(products: T[]): T[] {
  return products.slice(0, HOMEPAGE_HERO_COUNT);
}
