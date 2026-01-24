/**
 * Declared Value Calculator
 *
 * Calculates insurance declared value for shipments.
 *
 * Rules:
 * 1. If cart contains at least one bundle → declaredValue = cart total
 * 2. If any single product price ≥ threshold → declaredValue = cart total
 * 3. If cart TOTAL ≥ threshold → declaredValue = cart total
 * 4. Otherwise → no declared value (null)
 *
 * The threshold is configurable in Admin → Settings → Shipping → Insurance Threshold
 */

export interface DeclaredValueInput {
    cartTotal: number;
    items: Array<{
        productId: string;
        price: number;
        quantity: number;
        isBundle?: boolean;
    }>;
    /** Optional: Override default threshold (from admin settings) */
    threshold?: number;
}

export interface DeclaredValueResult {
    declaredValue: number | null;
    reason: "bundle" | "high_value_item" | "high_value_cart" | "none";
    triggerProducts: string[];
    thresholdUsed: number;
}

// Default threshold (used if not specified or settings unavailable)
const DEFAULT_THRESHOLD = 500; // RON

/**
 * Calculate declared value for shipment insurance
 * 
 * @param input - Cart total, items, and optional threshold override
 * @returns Result with declared value and reason
 */
export function calculateDeclaredValue(
    input: DeclaredValueInput
): DeclaredValueResult {
    const { cartTotal, items, threshold = DEFAULT_THRESHOLD } = input;

    // Check for bundles (always trigger insurance)
    const bundleItems = items.filter((item) => item.isBundle === true);
    if (bundleItems.length > 0) {
        return {
            declaredValue: cartTotal,
            reason: "bundle",
            triggerProducts: bundleItems.map((b) => b.productId),
            thresholdUsed: threshold,
        };
    }

    // Check for high-value products (single item price ≥ threshold)
    const highValueItems = items.filter(
        (item) => item.price >= threshold
    );
    if (highValueItems.length > 0) {
        return {
            declaredValue: cartTotal,
            reason: "high_value_item",
            triggerProducts: highValueItems.map((h) => h.productId),
            thresholdUsed: threshold,
        };
    }

    // Check if cart TOTAL exceeds threshold (many cheap items = still valuable!)
    if (cartTotal >= threshold) {
        return {
            declaredValue: cartTotal,
            reason: "high_value_cart",
            triggerProducts: [], // No specific product triggered this
            thresholdUsed: threshold,
        };
    }

    // No insurance needed
    return {
        declaredValue: null,
        reason: "none",
        triggerProducts: [],
        thresholdUsed: threshold,
    };
}

/**
 * Get default declared value threshold
 */
export function getDefaultDeclaredValueThreshold(): number {
    return DEFAULT_THRESHOLD;
}

/**
 * Fetch insurance threshold from store settings (async)
 */
export async function getInsuranceThreshold(): Promise<number> {
    try {
        // Dynamic import to avoid circular dependencies
        const { getShippingSettings } = await import("@/lib/utils/store-settings");
        const settings = await getShippingSettings();

        if (settings?.insuranceThreshold) {
            const threshold = parseFloat(settings.insuranceThreshold);
            if (!isNaN(threshold) && threshold > 0) {
                return threshold;
            }
        }
    } catch (error) {
        console.error("[DeclaredValue] Failed to fetch insurance threshold:", error);
    }

    return DEFAULT_THRESHOLD;
}

/**
 * Calculate declared value from order items (database format)
 * Uses the configured threshold from admin settings
 */
export async function calculateDeclaredValueFromOrderItemsAsync(
    cartTotal: number,
    orderItems: Array<{
        productId: string | null;
        price: number;
    }>,
    productBundleMap: Map<string, boolean>
): Promise<DeclaredValueResult> {
    // Fetch threshold from admin settings
    const threshold = await getInsuranceThreshold();

    const items = orderItems
        .filter((item) => item.productId !== null)
        .map((item) => ({
            productId: item.productId as string,
            price: item.price,
            quantity: 1,
            isBundle: productBundleMap.get(item.productId as string) || false,
        }));

    return calculateDeclaredValue({ cartTotal, items, threshold });
}

/**
 * Calculate declared value from order items (sync version with explicit threshold)
 */
export function calculateDeclaredValueFromOrderItems(
    cartTotal: number,
    orderItems: Array<{
        productId: string | null;
        price: number;
    }>,
    productBundleMap: Map<string, boolean>,
    threshold: number = DEFAULT_THRESHOLD
): DeclaredValueResult {
    const items = orderItems
        .filter((item) => item.productId !== null)
        .map((item) => ({
            productId: item.productId as string,
            price: item.price,
            quantity: 1,
            isBundle: productBundleMap.get(item.productId as string) || false,
        }));

    return calculateDeclaredValue({ cartTotal, items, threshold });
}
