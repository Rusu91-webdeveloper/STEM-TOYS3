/**
 * Shipping Price Resolver
 *
 * Centralized logic for resolving shipping prices from admin settings.
 * Uses deliveryPrice as the single source of truth.
 * Fail-closed if deliveryPrice is missing (consistent with server pricing).
 */

export interface ResolvedShippingPrice {
    price: number;
    source: "admin" | "missing";
}

/**
 * Resolve shipping price from admin settings
 * Returns the configured deliveryPrice or fails closed with 0 if not configured
 */
export function resolveShippingPrice(
    shippingSettings: unknown
): ResolvedShippingPrice {
    const settings = shippingSettings as Record<string, unknown> | null | undefined;

    if (!settings) {
        return {
            price: 0,
            source: "missing",
        };
    }

    const deliveryPrice = settings.deliveryPrice as
        | { price?: string; active?: boolean }
        | undefined;

    // Fail closed if deliveryPrice is not configured or inactive
    if (!deliveryPrice?.active || !deliveryPrice.price) {
        return {
            price: 0,
            source: "missing",
        };
    }

    const price = parseFloat(deliveryPrice.price || "0");
    
    // Fail closed if price is invalid
    if (!Number.isFinite(price) || price < 0) {
        return {
            price: 0,
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
    const settings = shippingSettings as Record<string, unknown> | null | undefined;
    if (!settings) return false;

    const freeThreshold = settings.freeThreshold as
        | { price?: string; active?: boolean }
        | undefined;
    if (!freeThreshold?.active) return false;

    const threshold = parseFloat(freeThreshold.price || "0");
    return threshold > 0 && cartTotal >= threshold;
}
