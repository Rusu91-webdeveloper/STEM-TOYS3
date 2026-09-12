/** Editorial selection; order is not a sales or popularity claim. */
export const GIFT_SLUGS = [
  "kit-stem-racheta-cu-propulsie-pe-apa-topbright-tb-160142",
  "kit-stem-manusa-robotica-genius-toy-G_7080",
  "kit-stem-energia-eoliana-cu-turbina-si-masinuta-electrica-genius-toy-G_7087",
  "instrument-optic-3-in-1-telescop-periscop-microscop-navir-N_8097",
] as const;
export const ROCKET_SLUG = GIFT_SLUGS[0];
export const GLOVE_SLUG = GIFT_SLUGS[1];
type BrowseProduct = {
  slug: string;
  name: string;
  stockQuantity: number;
  isBook?: boolean;
  metadata?: any;
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
  if (product.stockQuantity <= 1 && editorial?.keepLowStock !== true)
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
