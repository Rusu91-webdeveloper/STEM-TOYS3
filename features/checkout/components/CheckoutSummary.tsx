"use client";

import { BadgeCheck, RotateCcw, Shield } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";

import { useCart } from "@/features/cart";
import CouponInput from "@/features/cart/components/CouponInput";
import {
  checkoutCardClass,
  checkoutPromoPanelClass,
} from "@/features/checkout/lib/checkoutTheme";
import { useCurrency } from "@/lib/currency";
import { useTranslation } from "@/lib/i18n";
import { calculateCODFee } from "@/lib/pricing/cod-fee-calculator";
import { checkFreeShipping } from "@/lib/shipping/shipping-price-resolver";

import { fetchCODSettings, fetchTaxSettings, fetchShippingSettings } from "../lib/checkoutApi";
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

  const [localAppliedCoupon, setLocalAppliedCoupon] = useState(appliedCoupon);
  const [discountAmount, setDiscountAmount] = useState(0);

  useEffect(() => {
    setLocalAppliedCoupon(appliedCoupon);
    if (appliedCoupon) {
      setDiscountAmount(appliedCoupon.discountAmount || 0);
    } else {
      setDiscountAmount(0);
    }
  }, [appliedCoupon]);

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

  const handleCouponApplied = (coupon: any, discountAmount: number) => {
    setLocalAppliedCoupon(coupon);
    setDiscountAmount(discountAmount);

    if (onCouponApplied) {
      onCouponApplied(coupon, discountAmount);
    }
  };

  const handleCouponRemoved = () => {
    setLocalAppliedCoupon(null);
    setDiscountAmount(0);

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

  const isStripePayment = selectedPaymentMethod === "stripe_new";
  const isDiscountDisabled = isStripePayment && Boolean(stripePaymentIntentId) && currentStep !== "shipping-address";

  const isTaxEnabled = taxSettings?.active === true;
  const taxRate = isTaxEnabled && taxSettings?.rate
    ? parseFloat(taxSettings.rate) / 100
    : 0;
  const includeInPrice = taxSettings?.includeInPrice !== false;

  let subtotal: number;
  let tax: number;

  if (isTaxEnabled && includeInPrice) {
    subtotal = cartTotalIncludingVAT / (1 + taxRate);
    tax = cartTotalIncludingVAT - subtotal;
  } else if (isTaxEnabled && !includeInPrice) {
    subtotal = cartTotalIncludingVAT;
    tax = subtotal * taxRate;
  } else {
    subtotal = cartTotalIncludingVAT;
    tax = 0;
  }

  const isFreeShippingEligible = checkFreeShipping(cartTotalIncludingVAT, shippingSettings);

  const finalShippingCost = hasPhysicalItems
    ? (isFreeShippingEligible ? 0 : shippingCost)
    : 0;

  const originalShippingCost = hasPhysicalItems ? shippingCost : 0;

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

  if (isLoading) {
    return (
      <div
        className={`${checkoutCardClass} space-y-4 p-6 text-slate-900 animate-pulse`}
      >
        <div className="h-6 w-1/2 rounded bg-slate-200"></div>
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex gap-4">
              <div className="h-16 w-16 rounded bg-slate-200"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 rounded bg-slate-200"></div>
                <div className="h-4 w-1/4 rounded bg-slate-200"></div>
              </div>
            </div>
          ))}
        </div>
        <div className="space-y-2 border-t border-slate-200 pt-4">
          <div className="flex justify-between">
            <div className="h-4 w-1/4 rounded bg-slate-200"></div>
            <div className="h-4 w-1/4 rounded bg-slate-200"></div>
          </div>
          <div className="flex justify-between">
            <div className="h-4 w-1/4 rounded bg-slate-200"></div>
            <div className="h-4 w-1/4 rounded bg-slate-200"></div>
          </div>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className={`${checkoutCardClass} space-y-4 p-6 text-slate-900`}>
        <h2 className="text-xl font-semibold">
          {t("orderSummary", "Order Summary")}
        </h2>
        <p className="text-slate-500">{t("emptyCart", "Your cart is empty")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 lg:sticky lg:top-6">
      <div className={`${checkoutCardClass} space-y-4 p-4 sm:p-6`}>
        <h2 className="text-lg font-bold text-slate-900 sm:text-xl">
          {t("orderSummary", "Sumar comandă")}
        </h2>

        <div className="max-h-60 space-y-3 overflow-y-auto sm:max-h-80">
          {cartItems.map(item => (
            <div key={item.id} className="flex gap-3 sm:gap-4">
              {item.image ? (
                // eslint-disable-next-line @next/next/no-img-element -- cart URLs may be external; avoid layout shift
                <img
                  src={item.image}
                  alt={item.name}
                  className="h-12 w-12 flex-shrink-0 rounded-md border border-slate-100 object-cover sm:h-16 sm:w-16"
                />
              ) : (
                <div className="h-12 w-12 flex-shrink-0 rounded-md border border-slate-200 bg-slate-100 sm:h-16 sm:w-16" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-900 sm:text-base">
                  {item.name}
                </p>
                <p className="text-xs text-slate-500 sm:text-sm">
                  {t("qty", "Cantitate")}: {item.quantity}
                </p>
                <p className="text-sm font-medium text-slate-800 sm:text-base">
                  {formatPrice(item.price)}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-2 border-t border-slate-200 pt-4">
          <div className="flex justify-between text-sm text-slate-600 sm:text-base">
            <span>{t("subtotal", "Subtotal")}</span>
            <span>{formatPrice(cartTotalIncludingVAT)}</span>
          </div>

          {discountAmount > 0 && (
            <div className="flex justify-between text-sm text-emerald-700 sm:text-base">
              <span className="truncate font-medium">
                {t("discount", "Reducere")} ({localAppliedCoupon?.code})
              </span>
              <span className="flex-shrink-0 font-medium">
                -{formatPrice(discountAmount)}
              </span>
            </div>
          )}

          {isTaxEnabled && tax > 0 && (
            <div className="flex justify-between text-sm text-slate-600 sm:text-base">
              <span>
                {t("taxVat", "TVA")} ({taxSettings?.rate}%)
              </span>
              <span>{formatPrice(tax)}</span>
            </div>
          )}

          <div className="flex justify-between text-sm text-slate-600 sm:text-base">
            <span>
              {t("shipping", "Livrare")}
              {isFreeShippingEligible && (
                <span className="ml-2 text-xs font-medium text-emerald-600">
                  ({t("freeShippingShort", "gratuit")})
                </span>
              )}
            </span>
            <span>
              {isFreeShippingEligible && originalShippingCost > 0 ? (
                <>
                  <span className="mr-2 line-through text-slate-400">
                    {formatPrice(originalShippingCost)}
                  </span>
                  <span className="font-medium text-emerald-600">
                    {t("free", "GRATUIT")}
                  </span>
                </>
              ) : (
                formatPrice(finalShippingCost)
              )}
            </span>
          </div>

          {isCOD && (
            <div className="flex justify-between text-sm text-slate-600 sm:text-base">
              <span>
                {isLockerShippingMethod
                  ? t("codLockerFee", "Taxă plată la FANbox")
                  : t("codFee", "Cash on delivery fee")}
              </span>
              <span>{formatPrice(codFee)}</span>
            </div>
          )}

          <div className="flex justify-between border-t border-slate-200 pt-3 text-base font-bold sm:text-lg">
            <span className="text-slate-900">{t("totalToPay", "Total de plată")}</span>
            <span className="text-primary">{formatPrice(total)}</span>
          </div>

          {discountAmount > 0 && (
            <p className="text-center text-sm font-medium text-emerald-700">
              {t("youSavedPrefix", "Ai economisit")}{" "}
              {formatPrice(discountAmount)}!
            </p>
          )}
        </div>
      </div>

      {currentStep !== "review" && (
        <div className={`${checkoutPromoPanelClass} p-4 sm:p-5`}>
          <p className="mb-3 text-sm font-medium text-slate-700">
            {t("havePromoCode", "Ai un cod promoțional?")}
          </p>
          <CouponInput
            cartTotal={cartTotalIncludingVAT}
            appliedCoupon={localAppliedCoupon}
            onCouponApplied={handleCouponApplied}
            onCouponRemoved={handleCouponRemoved}
            disabled={isDiscountDisabled}
          />
        </div>
      )}

      <div className="grid grid-cols-3 gap-2 border-t border-slate-200/80 pt-4 sm:gap-3">
        <div className="flex flex-col items-center gap-1.5 text-center">
          <Shield className="h-6 w-6 text-primary" aria-hidden />
          <span className="text-[10px] font-medium leading-tight text-slate-600 sm:text-xs">
            {t("trustSsl", "Plată securizată SSL")}
          </span>
        </div>
        <div className="flex flex-col items-center gap-1.5 text-center">
          <RotateCcw className="h-6 w-6 text-primary" aria-hidden />
          <span className="text-[10px] font-medium leading-tight text-slate-600 sm:text-xs">
            {t("trustReturns", "Retur simplu")}
          </span>
        </div>
        <div className="flex flex-col items-center gap-1.5 text-center">
          <BadgeCheck className="h-6 w-6 text-primary" aria-hidden />
          <span className="text-[10px] font-medium leading-tight text-slate-600 sm:text-xs">
            {t("trustAuthentic", "Produse originale")}
          </span>
        </div>
      </div>
    </div>
  );
}
