"use client";

import React from "react";

import { useCart } from "@/features/cart";
import { useCurrency } from "@/lib/currency";

import { CheckoutData } from "../types";
import { useCheckoutSettings } from "../hooks/useCheckoutSettings";

interface PricingBreakdownProps {
  checkoutData: CheckoutData;
  discountAmount?: number;
  appliedCoupon?: any;
}

export function usePricingBreakdown({
  checkoutData,
  discountAmount = 0,
  appliedCoupon,
}: PricingBreakdownProps) {
  const { getCartTotal } = useCart();
  const { settings, isLoading: settingsLoading } = useCheckoutSettings();

  // Extract settings with defaults
  const taxRate = settings?.taxSettings?.active
    ? parseFloat(settings.taxSettings.rate) / 100
    : 0.21; // Default 21%

  const freeShippingThreshold = settings?.shippingSettings?.freeThreshold
    ?.active
    ? parseFloat(settings.shippingSettings.freeThreshold.price)
    : null;

  const isFreeShippingActive =
    settings?.shippingSettings?.freeThreshold?.active || false;

  // Calculate totals WITH DISCOUNT (prices include VAT for EU compliance)
  const cartTotalIncludingVAT = getCartTotal();
  let shippingCost = checkoutData.shippingMethod?.price || 0;

  // Apply free shipping if threshold is met and it's standard shipping
  if (
    isFreeShippingActive &&
    freeShippingThreshold !== null &&
    cartTotalIncludingVAT >= freeShippingThreshold &&
    checkoutData.shippingMethod?.id === "standard"
  ) {
    shippingCost = 0;
  }

  // For VAT-inclusive pricing, calculate VAT backwards for breakdown display
  const subtotalExcludingVAT = cartTotalIncludingVAT / (1 + taxRate);
  const tax = cartTotalIncludingVAT - subtotalExcludingVAT;
  // **UPDATED TOTAL CALCULATION WITH DISCOUNT**
  const totalBeforeDiscount = cartTotalIncludingVAT + shippingCost;
  const total = Math.max(0, totalBeforeDiscount - discountAmount);

  return {
    subtotal: subtotalExcludingVAT,
    tax,
    shippingCost,
    total,
    discountAmount,
    appliedCoupon,
  };
}
