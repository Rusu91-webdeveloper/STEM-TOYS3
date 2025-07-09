"use client";

import React, { useEffect, useState } from "react";

import { useCart } from "@/features/cart";
import CouponInput from "@/features/cart/components/CouponInput";
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
    rate: "19",
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
        if (
          shippingSettings.freeThreshold?.active
        ) {
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

  const subtotal = getCartTotal();

  // Calculate tax based on settings
  const taxRate = parseFloat(taxSettings.rate) / 100; // Convert percentage to decimal
  const tax = taxSettings.active ? subtotal * taxRate : 0;

  // Apply free shipping if threshold is met
  let finalShippingCost = shippingCost;
  if (
    isFreeShippingActive &&
    freeShippingThreshold !== null &&
    subtotal >= freeShippingThreshold
  ) {
    finalShippingCost = 0;
  }

  // **CALCULATE FINAL TOTAL WITH DISCOUNT**
  const totalBeforeDiscount = subtotal + tax + finalShippingCost;
  const total = Math.max(0, totalBeforeDiscount - discountAmount);

  // Calculate how much more needed for free shipping
  const renderFreeShippingMessage = () => {
    if (!isFreeShippingActive || freeShippingThreshold === null) return null;

    if (subtotal >= freeShippingThreshold) {
      return (
        <div className="mt-2 p-2 bg-green-50 text-green-700 rounded-md text-sm">
          {t("freeShippingApplied", "Free shipping applied!")}
        </div>
      );
    } 
      const amountNeeded = freeShippingThreshold - subtotal;
      return (
        <div className="mt-2 p-2 bg-blue-50 text-blue-700 rounded-md text-sm">
          {t("addMoreForFreeShipping", "Add")} {formatPrice(amountNeeded)}{" "}
          {t("moreForFreeShipping", "more for free shipping")}
        </div>
      );
    
  };

  if (isLoading) {
    return (
      <div className="border rounded-lg p-6 space-y-4 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/2"></div>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex gap-4">
              <div className="h-16 w-16 bg-gray-200 rounded"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              </div>
            </div>
          ))}
        </div>
        <div className="space-y-2 pt-4 border-t">
          <div className="flex justify-between">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          </div>
          <div className="flex justify-between">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          </div>
          <div className="flex justify-between">
            <div className="h-5 bg-gray-200 rounded w-1/3"></div>
            <div className="h-5 bg-gray-200 rounded w-1/4"></div>
          </div>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="border rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">
          {t("orderSummary", "Order Summary")}
        </h2>
        <p className="text-gray-500">{t("emptyCart", "Your cart is empty")}</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg p-6 space-y-4 sticky top-4">
      <h2 className="text-xl font-semibold">
        {t("orderSummary", "Order Summary")}
      </h2>

      <div className="space-y-4 max-h-80 overflow-y-auto">
        {cartItems.map((item) => (
          <div
            key={item.id}
            className="flex gap-4">
            {item.image ? (
              <img
                src={item.image}
                alt={item.name}
                className="h-16 w-16 object-cover rounded"
              />
            ) : (
              <div className="h-16 w-16 bg-gray-200 rounded"></div>
            )}
            <div>
              <p className="font-medium">{item.name}</p>
              <p className="text-sm text-gray-500">
                {t("qty", "Qty")}: {item.quantity}
              </p>
              <p className="text-sm">{formatPrice(item.price)}</p>
            </div>
          </div>
        ))}
      </div>

      {/* **COUPON INPUT SECTION** */}
      <div className="border-t pt-4">
        <CouponInput
          cartTotal={subtotal}
          appliedCoupon={localAppliedCoupon}
          onCouponApplied={handleCouponApplied}
          onCouponRemoved={handleCouponRemoved}
        />
      </div>

      <div className="space-y-2 pt-4 border-t">
        <div className="flex justify-between">
          <span className="text-gray-600">{t("subtotal", "Subtotal")}</span>
          <span>{formatPrice(subtotal)}</span>
        </div>

        {/* **DISCOUNT LINE** */}
        {discountAmount > 0 && (
          <div className="flex justify-between text-green-600">
            <span className="font-medium">
              Discount ({localAppliedCoupon?.code})
            </span>
            <span className="font-medium">-{formatPrice(discountAmount)}</span>
          </div>
        )}

        {taxSettings.active && (
          <div className="flex justify-between">
            <span className="text-gray-600">
              {t("tax", "TVA")} ({taxSettings.rate}%)
            </span>
            <span>{formatPrice(tax)}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-gray-600">{t("shipping", "Shipping")}</span>
          <span>
            {finalShippingCost === 0 && shippingCost > 0 ? (
              <span className="line-through text-gray-400 mr-2">
                {formatPrice(shippingCost)}
              </span>
            ) : null}
            {formatPrice(finalShippingCost)}
          </span>
        </div>

        {renderFreeShippingMessage()}

        <div className="flex justify-between font-semibold text-lg pt-2 border-t">
          <span>{t("total", "Total")}</span>
          <span>{formatPrice(total)}</span>
        </div>

        {/* **SAVINGS HIGHLIGHT** */}
        {discountAmount > 0 && (
          <div className="text-center">
            <p className="text-sm text-green-600 font-medium">
              🎉 You saved {formatPrice(discountAmount)}!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
