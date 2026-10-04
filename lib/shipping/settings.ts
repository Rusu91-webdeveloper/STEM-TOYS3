import { DEFAULT_COURIERS } from "./couriers";

// Fallback policy follows the owner's published delivery terms. Configured
// settings still take precedence; these values do not replace a failed quote.
export const DEFAULT_DELIVERY_PRICE = "19.99";
export const DEFAULT_FREE_SHIPPING_THRESHOLD = "500.00";

export function defaultShippingSettings() {
  return {
    deliveryPrice: { price: DEFAULT_DELIVERY_PRICE, active: true },
    freeThreshold: { price: DEFAULT_FREE_SHIPPING_THRESHOLD, active: true },
    insuranceThreshold: "500",
    fanCourierPickup: {
      enabled: false,
      windowStart: "09:00",
      windowEnd: "16:00",
      offsetDays: 0,
      observations: "",
    },
    couriers: DEFAULT_COURIERS,
    __source: "default" as const,
  };
}

export function publicShippingSettings<T extends Record<string, unknown>>(
  settings: T
) {
  const { onlinePaymentPrice, rambursPrice, __source, ...publicSettings } =
    settings;
  return publicSettings;
}
