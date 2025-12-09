"use client";

import React, { useEffect, useState } from "react";

import { useCart } from "@/features/cart";
import CouponInput from "@/features/cart/components/CouponInput";
import { glassCardClass } from "@/features/home/components/homeTheme";
import { useCurrency } from "@/lib/currency";
import { useTranslation } from "@/lib/i18n";

import { fetchShippingSettings, fetchTaxSettings } from "../lib/checkoutApi";

interface TaxSettings {
  rate: string;
  active: boolean;
  includeInPrice: boolean;
}

interface CheckoutSummaryProps {
  shippingCost?: number;
  onCouponApplied?: (coupon: any, discountAmount: number) => void;
  appliedCoupon?: any;
  onCouponRemoved?: () => void;
}

export function CheckoutSummary({
  shippingCost = 0,
  onCouponApplied,
  appliedCoupon,
  onCouponRemoved,
}: CheckoutSummaryProps) {
  const { cartItems, getCartTotal, isLoading } = useCart();
  const { formatPrice } = useCurrency();
  const { t } = useTranslation();
  const [freeShippingThreshold, setFreeShippingThreshold] = useState<
    number | null
  >(null);
  const [isFreeShippingActive, setIsFreeShippingActive] = useState(false);
  const [taxSettings, setTaxSettings] = useState<TaxSettings>({
    rate: "21",
    active: true,
    includeInPrice: false,
  });

  // **COUPON STATE** - Local coupon management for checkout summary
  const [localAppliedCoupon, setLocalAppliedCoupon] = useState(appliedCoupon);
  const [discountAmount, setDiscountAmount] = useState(0);

  // Update local coupon when parent prop changes
  useEffect(() => {
    setLocalAppliedCoupon(appliedCoupon);
    if (appliedCoupon) {
      setDiscountAmount(appliedCoupon.discountAmount || 0);
    } else {
      setDiscountAmount(0);
    }
  }, [appliedCoupon]);

  // Fetch free shipping threshold and tax settings
  useEffect(() => {
    async function loadSettings() {
      try {
        // Load shipping settings
        const shippingSettings = await fetchShippingSettings();
        if (shippingSettings.freeThreshold?.active) {
          setFreeShippingThreshold(
            parseFloat(shippingSettings.freeThreshold.price)
          );
          setIsFreeShippingActive(true);
        } else {
          setFreeShippingThreshold(null);
          setIsFreeShippingActive(false);
        }

        // Load tax settings
        try {
          const taxSettings = await fetchTaxSettings();
          setTaxSettings(taxSettings);
        } catch (taxError) {
          console.error("Error loading tax settings:", taxError);
          // Keep default tax settings
        }
      } catch (error) {
        console.error("Error loading settings:", error);
        // Don't enable free shipping by default if there's an error
        setFreeShippingThreshold(null);
        setIsFreeShippingActive(false);
      }
    }

    loadSettings();
  }, []);

  // **COUPON HANDLERS**
  const handleCouponApplied = (coupon: any, discountAmount: number) => {
    setLocalAppliedCoupon(coupon);
    setDiscountAmount(discountAmount);

    // Notify parent component if handler provided
    if (onCouponApplied) {
      onCouponApplied(coupon, discountAmount);
    }
  };

  const handleCouponRemoved = () => {
    setLocalAppliedCoupon(null);
    setDiscountAmount(0);

    // Notify parent component if handler provided
    if (onCouponRemoved) {
      onCouponRemoved();
    }
  };

  const cartTotalIncludingVAT = getCartTotal();
  const hasPhysicalItems = cartItems.some(item => item.isBook !== true);

  // Calculate tax based on settings (prices already include VAT for EU compliance)
  const taxRate = parseFloat(taxSettings.rate) / 100; // Convert percentage to decimal
  const includeInPrice = taxSettings.includeInPrice !== false;

  // For VAT-inclusive pricing, calculate VAT backwards for breakdown display
  const subtotalExcludingVAT = includeInPrice
    ? cartTotalIncludingVAT / (1 + taxRate)
    : cartTotalIncludingVAT;
  const tax = taxSettings.active
    ? includeInPrice
      ? cartTotalIncludingVAT - subtotalExcludingVAT
      : cartTotalIncludingVAT * taxRate
    : 0;

  // Apply free shipping if threshold is met (only for standard shipping)
  let finalShippingCost = hasPhysicalItems ? shippingCost : 0;
  // Note: We can't check shipping method here since CheckoutSummary doesn't have access to it
  // The free shipping logic is handled in the shipping method selector
  if (
    isFreeShippingActive &&
    freeShippingThreshold !== null &&
    cartTotalIncludingVAT >= freeShippingThreshold &&
    shippingCost === 0 && // Only show as free if shipping cost is already 0 from method selector
    hasPhysicalItems
  ) {
    finalShippingCost = 0;
  }

  // **CALCULATE FINAL TOTAL WITH DISCOUNT**
  const totalBeforeDiscount = cartTotalIncludingVAT + finalShippingCost;
  const total = Math.max(0, totalBeforeDiscount - discountAmount);

  // Calculate how much more needed for free shipping
  const renderFreeShippingMessage = () => {
    if (
      !isFreeShippingActive ||
      freeShippingThreshold === null ||
      !hasPhysicalItems
    )
      return null;

    if (cartTotalIncludingVAT >= freeShippingThreshold) {
      return (
        <div className="mt-2 rounded-md bg-emerald-500/10 p-2 text-sm text-emerald-200">
          {t(
            "freeStandardShippingApplied",
            "Free standard shipping available!"
          )}
        </div>
      );
    }
    const amountNeeded = freeShippingThreshold - cartTotalIncludingVAT;
    return (
      <div className="mt-2 rounded-md bg-sky-500/10 p-2 text-sm text-sky-200">
        {t("addMoreForFreeShipping", "Add")} {formatPrice(amountNeeded)}{" "}
        {t("moreForFreeStandardShipping", "more for free standard shipping")}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div
        className={`${glassCardClass} space-y-4 bg-slate-900/60 p-6 text-slate-100 animate-pulse`}
      >
        <div className="h-6 w-1/2 rounded bg-white/10"></div>
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex gap-4">
              <div className="h-16 w-16 rounded bg-white/10"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 rounded bg-white/10"></div>
                <div className="h-4 w-1/4 rounded bg-white/10"></div>
              </div>
            </div>
          ))}
        </div>
        <div className="space-y-2 border-t border-white/10 pt-4">
          <div className="flex justify-between">
            <div className="h-4 w-1/4 rounded bg-white/10"></div>
            <div className="h-4 w-1/4 rounded bg-white/10"></div>
          </div>
          <div className="flex justify-between">
            <div className="h-4 w-1/4 rounded bg-white/10"></div>
            <div className="h-4 w-1/4 rounded bg-white/10"></div>
          </div>
          <div className="flex justify-between">
            <div className="h-5 w-1/3 rounded bg-white/10"></div>
            <div className="h-5 w-1/4 rounded bg-white/10"></div>
          </div>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div
        className={`${glassCardClass} space-y-4 bg-slate-900/60 p-6 text-slate-100`}
      >
        <h2 className="text-xl font-semibold">
          {t("orderSummary", "Order Summary")}
        </h2>
        <p className="text-slate-300">{t("emptyCart", "Your cart is empty")}</p>
      </div>
    );
  }

  return (
    <div
      className={`${glassCardClass} space-y-4 border-white/10 bg-slate-900/70 p-4 text-slate-100 shadow-xl shadow-black/30 sm:p-6 lg:sticky lg:top-4`}
    >
      <h2 className="text-xl font-semibold text-slate-100">
        {t("orderSummary", "Order Summary")}
      </h2>

      <div className="max-h-60 space-y-3 overflow-y-auto sm:max-h-80">
        {cartItems.map(item => (
          <div key={item.id} className="flex gap-3 sm:gap-4">
            {item.image ? (
              <img
                src={item.image}
                alt={item.name}
                className="h-12 w-12 flex-shrink-0 rounded object-cover sm:h-16 sm:w-16"
              />
            ) : (
              <div className="h-12 w-12 flex-shrink-0 rounded bg-white/10 sm:h-16 sm:w-16"></div>
            )}
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium sm:text-base">
                {item.name}
              </p>
              <p className="text-xs text-slate-300 sm:text-sm">
                {t("qty", "Qty")}: {item.quantity}
              </p>
              <p className="text-xs text-slate-200 sm:text-sm">
                {formatPrice(item.price)}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* **COUPON INPUT SECTION** */}
      <div className="border-t border-white/10 pt-4">
        <CouponInput
          cartTotal={cartTotalIncludingVAT}
          appliedCoupon={localAppliedCoupon}
          onCouponApplied={handleCouponApplied}
          onCouponRemoved={handleCouponRemoved}
        />
      </div>

      <div className="space-y-2 border-t border-white/10 pt-4">
        <div className="flex justify-between text-sm text-slate-300 sm:text-base">
          <span>{t("subtotal", "Subtotal")}</span>
          <span>{formatPrice(cartTotalIncludingVAT)}</span>
        </div>

        {/* **DISCOUNT LINE** */}
        {discountAmount > 0 && (
          <div className="flex justify-between text-sm text-emerald-300 sm:text-base">
            <span className="truncate font-medium">
              Discount ({localAppliedCoupon?.code})
            </span>
            <span className="flex-shrink-0 font-medium">
              -{formatPrice(discountAmount)}
            </span>
          </div>
        )}

        {/* VAT line removed - prices already include VAT for EU compliance */}
        <div className="flex justify-between text-sm text-slate-300 sm:text-base">
          <span>{t("shipping", "Shipping")}</span>
          <span>
            {finalShippingCost === 0 && shippingCost > 0 ? (
              <span className="mr-2 line-through text-slate-400/80">
                {formatPrice(shippingCost)}
              </span>
            ) : null}
            {formatPrice(finalShippingCost)}
          </span>
        </div>

        {renderFreeShippingMessage()}

        <div className="flex justify-between border-t border-white/10 pt-2 text-base font-semibold sm:text-lg">
          <span className="text-slate-100">{t("total", "Total")}</span>
          <span>{formatPrice(total)}</span>
        </div>

        {/* **SAVINGS HIGHLIGHT** */}
        {discountAmount > 0 && (
          <div className="text-center">
            <p className="text-sm font-medium text-emerald-300">
              🎉 You saved {formatPrice(discountAmount)}!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
