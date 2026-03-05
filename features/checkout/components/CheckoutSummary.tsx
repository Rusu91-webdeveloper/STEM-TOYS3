"use client";

import React, { useEffect, useMemo, useState } from "react";

import { useCart } from "@/features/cart";
import CouponInput from "@/features/cart/components/CouponInput";
import { glassCardClass } from "@/features/home/components/homeTheme";
import { useCurrency } from "@/lib/currency";
import { useTranslation } from "@/lib/i18n";
import { calculateCODFee } from "@/lib/pricing/cod-fee-calculator";

import { fetchCODSettings, fetchTaxSettings, fetchShippingSettings } from "../lib/checkoutApi";
import { checkFreeShipping } from "@/lib/shipping/shipping-price-resolver";
import { ShippingMethod } from "../types";

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
  selectedPaymentMethod?: string;
  stripePaymentIntentId?: string;
  currentStep?: string;
  shippingMethod?: ShippingMethod;
}

export function CheckoutSummary({
  shippingCost = 0,
  onCouponApplied,
  appliedCoupon,
  onCouponRemoved,
  selectedPaymentMethod,
  stripePaymentIntentId,
  currentStep,
  shippingMethod,
}: CheckoutSummaryProps) {
  const { cartItems, getCartTotal, isLoading } = useCart();
  const { formatPrice } = useCurrency();
  const { t } = useTranslation();
  const [codConfig, setCodConfig] = useState<{ percentage: number; fixedFee: number } | null>(null);
  const [taxSettings, setTaxSettings] = useState<TaxSettings | null>(null);
  const [shippingSettings, setShippingSettings] = useState<any>(null);

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

  // Fetch tax, COD, and shipping settings (dynamic from admin)
  useEffect(() => {
    let isActive = true;

    async function loadSettings() {
      try {
        const [tax, cod, shipping] = await Promise.all([
          fetchTaxSettings(),
          fetchCODSettings().catch(() => null),
          fetchShippingSettings().catch(() => null),
        ]);
        if (!isActive) return;
        setTaxSettings(tax);
        setShippingSettings(shipping);
        if (cod?.active) {
          setCodConfig({
            percentage: parseFloat(cod.percentage || "0") / 100,
            fixedFee: parseFloat(cod.fixedFee || "0") || 0,
          });
        }
      } catch (error) {
        console.error("Error loading checkout settings:", error);
      }
    }

    loadSettings();
    return () => {
      isActive = false;
    };
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
  const isCOD = selectedPaymentMethod === "cash_on_delivery";
  const isLockerShippingMethod = useMemo(() => {
    if (!shippingMethod) return false;
    if (shippingMethod.requiresLocker) return true;
    if (shippingMethod.methodType === "easybox") return true;
    const methodId = (shippingMethod.id || "").toLowerCase();
    return methodId.includes("fanbox") || methodId.includes("easybox");
  }, [shippingMethod]);
  
  // Disable discount code input if a Stripe payment intent has been created (payment amount is locked)
  // Note: We also hide the discount field completely on the review step
  const isStripePayment = selectedPaymentMethod === "stripe_new";
  const isDiscountDisabled = isStripePayment && Boolean(stripePaymentIntentId) && currentStep !== "shipping-address";

  // Calculate tax based on taxSettings.active flag
  const isTaxEnabled = taxSettings?.active === true;
  const taxRate = isTaxEnabled && taxSettings?.rate
    ? parseFloat(taxSettings.rate) / 100
    : 0;
  const includeInPrice = taxSettings?.includeInPrice !== false;

  // Calculate subtotal and tax
  let subtotal: number;
  let tax: number;

  if (isTaxEnabled && includeInPrice) {
    // Tax is included in prices - calculate backwards
    subtotal = cartTotalIncludingVAT / (1 + taxRate);
    tax = cartTotalIncludingVAT - subtotal;
  } else if (isTaxEnabled && !includeInPrice) {
    // Tax is not included - add it to subtotal
    subtotal = cartTotalIncludingVAT;
    tax = subtotal * taxRate;
  } else {
    // Tax is disabled - no VAT calculation
    subtotal = cartTotalIncludingVAT;
    tax = 0;
  }

  // Check free shipping threshold - defensive check to ensure consistency
  const isFreeShippingEligible = checkFreeShipping(cartTotalIncludingVAT, shippingSettings);
  
  // Use provided shipping cost (tariff-based) but override to 0 if free shipping applies
  const finalShippingCost = hasPhysicalItems 
    ? (isFreeShippingEligible ? 0 : shippingCost) 
    : 0;
  
  // Store original cost for strikethrough display
  const originalShippingCost = hasPhysicalItems ? shippingCost : 0;

  // **CALCULATE FINAL TOTAL WITH DISCOUNT**
  const totalBeforeDiscount = isTaxEnabled && !includeInPrice
    ? cartTotalIncludingVAT + finalShippingCost + tax
    : cartTotalIncludingVAT + finalShippingCost;
  const baseTotal = Math.max(0, totalBeforeDiscount - discountAmount);
  const codFee = useMemo(() => {
    if (!isCOD) return 0;
    try {
      const config = codConfig
        ? {
            percentage: codConfig.percentage,
            fixedFee: isLockerShippingMethod ? 0 : codConfig.fixedFee,
          }
        : isLockerShippingMethod
          ? { fixedFee: 0 }
          : undefined;
      return calculateCODFee(baseTotal, config).fee;
    } catch (error) {
      console.error("Error calculating COD fee:", error);
      return 0;
    }
  }, [baseTotal, isCOD, codConfig, isLockerShippingMethod]);
  const total = baseTotal + codFee;

  // Calculate how much more needed for free shipping

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

      {/* **COUPON INPUT SECTION** - Show prominently on first step, hide on review step */}
      {currentStep !== "review" && (
        <div
          className={
            currentStep === "shipping-address"
              ? "bg-gradient-to-br from-emerald-500/20 via-green-500/15 to-emerald-400/10 rounded-lg p-4 border-2 border-emerald-400/40 shadow-lg shadow-emerald-500/10 mb-4"
              : "border-t border-white/10 pt-4"
          }
        >
          {currentStep === "shipping-address" && (
            <div className="mb-3 text-center">
              <h3 className="text-lg font-bold text-emerald-300 mb-1.5 flex items-center justify-center gap-2">
                <span className="text-2xl">🎁</span>
                {t("haveDiscountCode", "Have a Discount Code?")}
              </h3>
              <p className="text-sm text-emerald-200/90 font-medium">
                {t("applyDiscountEarly", "Apply your discount code now to save on your order!")}
              </p>
            </div>
          )}
          <CouponInput
            cartTotal={cartTotalIncludingVAT}
            appliedCoupon={localAppliedCoupon}
            onCouponApplied={handleCouponApplied}
            onCouponRemoved={handleCouponRemoved}
            disabled={isDiscountDisabled}
          />
        </div>
      )}

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

        {/* Tax line - only show if tax is enabled */}
        {isTaxEnabled && tax > 0 && (
          <div className="flex justify-between text-sm text-slate-300 sm:text-base">
            <span>{t("tax", "Tax")} ({taxSettings.rate}%)</span>
            <span>{formatPrice(tax)}</span>
          </div>
        )}

        <div className="flex justify-between text-sm text-slate-300 sm:text-base">
          <span>
            {t("shipping", "Shipping")}
            {isFreeShippingEligible && (
              <span className="ml-2 text-xs text-emerald-400 font-medium">
                (Transport gratuit!)
              </span>
            )}
          </span>
          <span>
            {isFreeShippingEligible && originalShippingCost > 0 ? (
              <>
                <span className="mr-2 line-through text-slate-400/80">
                  {formatPrice(originalShippingCost)}
                </span>
                <span className="text-emerald-400 font-medium">GRATUIT</span>
              </>
            ) : (
              formatPrice(finalShippingCost)
            )}
          </span>
        </div>

        {isCOD && (
          <div className="flex justify-between text-sm text-slate-300 sm:text-base">
            <span>
              {isLockerShippingMethod
                ? t("codLockerFee", "Taxă plată la FANbox")
                : t("codFee", "Cash on delivery fee")}
            </span>
            <span>{formatPrice(codFee)}</span>
          </div>
        )}


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
