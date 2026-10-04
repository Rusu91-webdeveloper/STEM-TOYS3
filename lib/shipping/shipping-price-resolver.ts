/**
 * Shipping Price Resolver
 *
 * Centralized logic for resolving shipping prices from admin settings.
 * Uses deliveryPrice as the single source of truth.
 * Returns null if deliveryPrice is missing/inactive/invalid (server will charge courier quote).
 */

export interface ResolvedShippingPrice {
  price: number | null;
  source: "admin" | "missing";
}

/**
 * Resolve shipping price from admin settings
 * Returns the configured deliveryPrice or null if not configured.
 * When null, the server charges the courier quote - client must not invent a number.
 */
export function resolveShippingPrice(
  shippingSettings: unknown
): ResolvedShippingPrice {
  const settings = shippingSettings as
    | Record<string, unknown>
    | null
    | undefined;

  if (!settings) {
    return {
      price: null,
      source: "missing",
    };
  }

  const deliveryPrice = settings.deliveryPrice as
    | { price?: string; active?: boolean }
    | undefined;

  // Return null if deliveryPrice is not configured or inactive
  if (!deliveryPrice?.active || !deliveryPrice.price) {
    return {
      price: null,
      source: "missing",
    };
  }

  const price = Number(deliveryPrice.price);

  // Return null if price is invalid
  if (!Number.isFinite(price) || price < 0) {
    return {
      price: null,
      source: "missing",
    };
  }

  return {
    price,
    source: "admin",
  };
}

/**
 * Check if order qualifies for free shipping
 */
export function checkFreeShipping(
  cartTotal: number,
  shippingSettings: unknown
): boolean {
  const settings = shippingSettings as
    | Record<string, unknown>
    | null
    | undefined;
  if (!settings) return false;

  const freeThreshold = settings.freeThreshold as
    | { price?: string; active?: boolean }
    | undefined;
  if (!freeThreshold?.active) return false;

  const threshold = Number(freeThreshold.price);
  return (
    Number.isFinite(threshold) &&
    threshold > 0 &&
    Number.isFinite(cartTotal) &&
    cartTotal >= threshold
  );
}
