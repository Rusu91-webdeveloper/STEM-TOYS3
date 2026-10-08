import type { Product } from "@/types/product";

import { DEFAULT_COURIERS, type CourierConfig } from "./couriers";
import {
  checkFreeShipping,
  resolveShippingPrice,
} from "./shipping-price-resolver";
import {
  calculateShippingQuote,
  resolveShippingService,
} from "./shipping-pricing";

export interface ProductDelivery {
  methods: Array<{ name: string; price: number; prepaid: boolean }>;
  freeThreshold: number | null;
  isDigital: boolean;
}

/** One-product estimate from checkout's configured service/admin/tariff precedence.
 * Address surcharges, discounts and additional parcels are confirmed in checkout. */
export function productDeliveryEstimate(
  product: Product,
  rawSettings: unknown
): ProductDelivery {
  const settings = rawSettings as {
    couriers?: CourierConfig[];
    freeThreshold?: { active?: boolean; price?: string };
  } | null;
  const threshold = Number(settings?.freeThreshold?.price);
  const freeThreshold =
    settings?.freeThreshold?.active &&
    Number.isFinite(threshold) &&
    threshold > 0
      ? threshold
      : null;
  const result: ProductDelivery = {
    methods: [],
    freeThreshold,
    isDigital: product.isBook === true,
  };
  if (result.isDigital || product.isBundle || product.stockQuantity <= 0)
    return result;
  const adminPrice = resolveShippingPrice(settings).price;
  for (const courier of settings?.couriers ?? DEFAULT_COURIERS) {
    if (!courier.enabled) continue;
    for (const service of courier.services) {
      if (service.enabled === false) continue;
      const pricingService = resolveShippingService(service.methodType);
      if (!pricingService) continue;
      const quote = calculateShippingQuote(pricingService, [
        {
          quantity: 1,
          weightKg: product.weight,
          dimensions: product.dimensions,
        },
      ]);
      if (
        service.methodType === "easybox" &&
        quote.weights.chargeableWeightKg > 20
      )
        continue;
      const override =
        service.priceOverride !== undefined && service.priceOverride !== ""
          ? Number(service.priceOverride)
          : null;
      // Invalid explicit overrides cannot be presented as a different price.
      if (override !== null && (!Number.isFinite(override) || override < 0))
        continue;
      const price = override ?? adminPrice ?? quote.totalPrice;
      if (!Number.isFinite(price) || price < 0) continue;
      result.methods.push({
        name: service.name,
        price: checkFreeShipping(product.price, settings) ? 0 : price,
        prepaid: service.methodType === "easybox",
      });
    }
  }
  return result;
}
