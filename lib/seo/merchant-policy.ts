import { RETURN_WINDOW_DAYS } from "@/lib/returns/policy";
import { DEFAULT_COURIERS, type CourierConfig } from "@/lib/shipping/couriers";
import { checkFreeShipping } from "@/lib/shipping/shipping-price-resolver";

export type MerchantShippingSettings = {
  couriers?: CourierConfig[];
  deliveryPrice?: { active?: boolean; price?: string };
  freeThreshold?: { active?: boolean; price?: string };
};

// Match checkout's service override -> active deliveryPrice precedence.
// Do not substitute the separate legacy onlinePaymentPrice setting.
export function merchantShippingRate(
  price: number,
  settings: MerchantShippingSettings
) {
  const couriers = settings.couriers || DEFAULT_COURIERS;
  const courier =
    couriers.find(c => c.enabled && c.isDefault) ||
    couriers.find(c => c.enabled);
  const service = courier?.services.find(
    s => s.enabled !== false && s.methodType === "home"
  );
  if (!service) return null;
  const raw =
    service.priceOverride !== undefined && service.priceOverride !== ""
      ? service.priceOverride
      : settings.deliveryPrice?.active
        ? settings.deliveryPrice.price
        : undefined;
  if (raw === undefined || raw === "") return null;
  const rate = Number(raw);
  if (!Number.isFinite(rate) || rate < 0) return null;
  return checkFreeShipping(price, settings) ? 0 : rate;
}

export function merchantOfferPolicies(
  price: number,
  settings?: MerchantShippingSettings
) {
  const rate = settings ? merchantShippingRate(price, settings) : null;
  return {
    hasMerchantReturnPolicy: {
      "@type": "MerchantReturnPolicy",
      applicableCountry: "RO",
      returnPolicyCategory:
        "https://schema.org/MerchantReturnFiniteReturnWindow",
      merchantReturnDays: RETURN_WINDOW_DAYS,
      returnMethod: "https://schema.org/ReturnByMail",
      returnFees: "https://schema.org/ReturnFeesCustomerResponsibility",
      merchantReturnLink: "https://www.techtots.ro/returns",
    },
    ...(rate !== null
      ? {
          shippingDetails: {
            "@type": "OfferShippingDetails",
            shippingDestination: {
              "@type": "DefinedRegion",
              addressCountry: "RO",
            },
            shippingRate: {
              "@type": "MonetaryAmount",
              value: rate,
              currency: "RON",
            },
            shippingSettingsLink: "https://www.techtots.ro/shipping",
          },
        }
      : {}),
  };
}
