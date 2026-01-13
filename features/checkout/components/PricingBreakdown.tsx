"use client";

import React, { useState, useEffect } from "react";

import { useCart } from "@/features/cart";
import { useCurrency } from "@/lib/currency";
import { calculateCODFee } from "@/lib/pricing/cod-fee-calculator";

import { CheckoutData } from "../types";
import { useCheckoutSettings } from "../hooks/useCheckoutSettings";
import { fetchCODSettings } from "../lib/checkoutApi";

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
  const { getCartTotal, items: cartItems } = useCart();
  const { settings, isLoading: settingsLoading } = useCheckoutSettings();
  const [codConfig, setCodConfig] = useState<{ percentage: number; fixedFee: number } | null>(null);

  // Fetch COD settings
  useEffect(() => {
    async function loadCODSettings() {
      try {
        const codSettings = await fetchCODSettings();
        if (codSettings?.active) {
          setCodConfig({
            percentage: parseFloat(codSettings.percentage || "3") / 100,
            fixedFee: parseFloat(codSettings.fixedFee || "5.00"),
          });
        } else {
          // Default config if COD is not active
          setCodConfig({
            percentage: 0.03,
            fixedFee: 5.00,
          });
        }
      } catch (error) {
        console.error("Error loading COD settings:", error);
        // Default config on error
        setCodConfig({
          percentage: 0.03,
          fixedFee: 5.00,
        });
      }
    }
    loadCODSettings();
  }, []);

  // Extract settings with defaults
  // No VAT calculation - prices are final (non-VAT registered SRL)
  const deliveryPrice = settings?.shippingSettings?.deliveryPrice?.active
    ? parseFloat(settings.shippingSettings.deliveryPrice.price || "15.00")
    : 15.00;
  const freeShippingThreshold = settings?.shippingSettings?.freeThreshold
    ?.active
    ? parseFloat(settings.shippingSettings.freeThreshold.price)
    : 199; // Updated to 199 lei

  const isFreeShippingActive =
    settings?.shippingSettings?.freeThreshold?.active !== false;

  // Calculate totals WITH DISCOUNT (prices are final, no VAT)
  const cartSubtotal = getCartTotal();
  const hasPhysicalItems = cartItems.some(item => item.isBook !== true);
  const isCOD = checkoutData.paymentMethod === "cash_on_delivery";
  let shippingCost = 0;

  if (hasPhysicalItems) {
    // Use the price from selected shipping method, or fallback to delivery price
    const baseShippingPrice =
      checkoutData.shippingMethod?.price ?? deliveryPrice;

    shippingCost = baseShippingPrice;
  }

  // Apply free shipping if threshold is met (applies to both home and easybox)
  if (
    isFreeShippingActive &&
    freeShippingThreshold !== null &&
    cartSubtotal >= freeShippingThreshold &&
    hasPhysicalItems
  ) {
    shippingCost = 0;
  }

  // Calculate tax based on taxSettings.active flag
  const isTaxEnabled = settings?.taxSettings?.active === true;
  const taxRate = isTaxEnabled && settings?.taxSettings?.rate
    ? parseFloat(settings.taxSettings.rate) / 100
    : 0;
  const includeInPrice = settings?.taxSettings?.includeInPrice !== false;

  // Calculate subtotal and tax
  let subtotal: number;
  let tax: number;

  if (isTaxEnabled && includeInPrice) {
    // Tax is included in prices - calculate backwards
    subtotal = cartSubtotal / (1 + taxRate);
    tax = cartSubtotal - subtotal;
  } else if (isTaxEnabled && !includeInPrice) {
    // Tax is not included - add it to subtotal
    subtotal = cartSubtotal;
    tax = subtotal * taxRate;
  } else {
    // Tax is disabled - no VAT calculation
    subtotal = cartSubtotal;
    tax = 0;
  }

  // **UPDATED TOTAL CALCULATION WITH DISCOUNT**
  const totalBeforeDiscount = isTaxEnabled && !includeInPrice
    ? cartSubtotal + shippingCost + tax
    : cartSubtotal + shippingCost;
  const baseTotal = Math.max(0, totalBeforeDiscount - discountAmount);
  let codFee = 0;
  if (isCOD) {
    try {
      const config = codConfig ? {
        percentage: codConfig.percentage,
        fixedFee: codConfig.fixedFee,
      } : undefined;
      codFee = calculateCODFee(baseTotal, config).fee;
    } catch (error) {
      console.error("Error calculating COD fee:", error);
    }
  }
  const total = baseTotal + codFee;

  return {
    subtotal: subtotal,
    tax: tax,
    shippingCost,
    total,
    codFee,
    discountAmount,
    appliedCoupon,
  };
}
