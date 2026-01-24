/**
 * Shipping Price Resolver
 *
 * Centralized logic for payment-method-based shipping pricing.
 * - Online payment: 19.99 RON (default)
 * - Ramburs (COD): 24.99 RON (default)
 *
 * Prices are admin-configurable via StoreSettings.shippingSettings
 */

export interface ShippingPrices {
    onlinePaymentPrice: number;
    rambursPrice: number;
    isConfigured: boolean;
}

export interface ResolvedShippingPrice {
    price: number;
    paymentMethod: "online" | "ramburs";
    source: "admin" | "default";
}

// Default shipping prices (fallback if admin hasn't configured)
const DEFAULT_ONLINE_PRICE = 19.99;
const DEFAULT_RAMBURS_PRICE = 24.99;

/**
 * Parse shipping settings from StoreSettings JSON
 */
export function parseShippingPrices(shippingSettings: unknown): ShippingPrices {
    const settings = shippingSettings as Record<string, unknown> | null | undefined;

    if (!settings) {
        return {
            onlinePaymentPrice: DEFAULT_ONLINE_PRICE,
            rambursPrice: DEFAULT_RAMBURS_PRICE,
            isConfigured: false,
        };
    }

    // Check for new payment-method specific prices first
    const onlinePrice = parseFloat(
        (settings.onlinePaymentPrice as string) || "0"
    );
    const rambursPrice = parseFloat((settings.rambursPrice as string) || "0");

    // Fallback to legacy deliveryPrice for online if new fields not set
    const deliveryPrice = settings.deliveryPrice as
        | { price?: string; active?: boolean }
        | undefined;
    const legacyPrice = parseFloat(deliveryPrice?.price || "0");

    const finalOnlinePrice =
        onlinePrice > 0 ? onlinePrice : legacyPrice > 0 ? legacyPrice : DEFAULT_ONLINE_PRICE;
    const finalRambursPrice =
        rambursPrice > 0 ? rambursPrice : DEFAULT_RAMBURS_PRICE;

    return {
        onlinePaymentPrice: finalOnlinePrice,
        rambursPrice: finalRambursPrice,
        isConfigured: onlinePrice > 0 || rambursPrice > 0 || legacyPrice > 0,
    };
}

/**
 * Resolve shipping price based on payment method
 */
export function resolveShippingPrice(
    paymentMethod: string,
    shippingSettings: unknown
): ResolvedShippingPrice {
    const prices = parseShippingPrices(shippingSettings);
    const isRamburs =
        paymentMethod === "cash_on_delivery" || paymentMethod === "cod";

    return {
        price: isRamburs ? prices.rambursPrice : prices.onlinePaymentPrice,
        paymentMethod: isRamburs ? "ramburs" : "online",
        source: prices.isConfigured ? "admin" : "default",
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

/**
 * Get default shipping prices for configuration
 */
export function getDefaultShippingPrices(): {
    onlinePaymentPrice: number;
    rambursPrice: number;
} {
    return {
        onlinePaymentPrice: DEFAULT_ONLINE_PRICE,
        rambursPrice: DEFAULT_RAMBURS_PRICE,
    };
}
