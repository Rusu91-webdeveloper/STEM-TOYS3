"use client";

import { useEffect, useState } from "react";

import { fetchShippingSettings } from "@/features/checkout/lib/checkoutApi";
import {
  merchantShippingRate,
  type MerchantShippingSettings,
} from "@/lib/seo/merchant-policy";

export function useCartShippingEstimate(
  subtotal: number,
  hasPhysicalItems: boolean,
  active = true
) {
  const [settings, setSettings] = useState<MerchantShippingSettings | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!active || !hasPhysicalItems) return undefined;
    let current = true;
    setSettings(null);
    setIsLoading(true);
    fetchShippingSettings()
      .then(value => {
        if (current) setSettings(value);
      })
      .catch(() => {
        if (current) setSettings(null);
      })
      .finally(() => {
        if (current) setIsLoading(false);
      });
    return () => {
      current = false;
    };
  }, [active, hasPhysicalItems]);

  const rawThreshold = settings?.freeThreshold;
  const threshold = Number(rawThreshold?.price);
  const freeThreshold =
    hasPhysicalItems &&
    rawThreshold?.active &&
    Number.isFinite(threshold) &&
    threshold > 0
      ? threshold
      : null;
  const shippingCost = hasPhysicalItems
    ? settings
      ? merchantShippingRate(subtotal, settings)
      : null
    : 0;

  return {
    shippingCost,
    freeThreshold,
    isLoading: hasPhysicalItems && isLoading,
  };
}
