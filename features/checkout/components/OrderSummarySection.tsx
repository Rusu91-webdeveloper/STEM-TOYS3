"use client";

import React from "react";

import { useCurrency } from "@/lib/currency";
import { useTranslation } from "@/lib/i18n";

interface OrderSummarySectionProps {
  subtotal: number;
  tax: number;
  shippingCost: number;
  total: number;
  discountAmount?: number;
  appliedCoupon?: any;
}

export const OrderSummarySection = React.memo(function OrderSummarySection({
  subtotal,
  tax,
  shippingCost,
  total,
  discountAmount = 0,
  appliedCoupon,
}: OrderSummarySectionProps) {
  const { formatPrice } = useCurrency();
  const { t } = useTranslation();

  return (
    <div className="bg-white rounded-lg border p-4 sm:p-6">
      <h3 className="text-base sm:text-lg font-semibold mb-4">
        {t("orderSummary", "Order Summary")}
      </h3>

      <div className="space-y-3">
        <div className="flex justify-between text-sm sm:text-base">
          <span>{t("subtotal", "Subtotal")}</span>
          <span>{formatPrice(subtotal)}</span>
        </div>

        {/* **DISCOUNT LINE** */}
        {discountAmount > 0 && appliedCoupon && (
          <div className="flex justify-between text-green-600 text-sm sm:text-base">
            <span className="font-medium truncate">
              {t("discount", "Discount")} ({appliedCoupon.code})
            </span>
            <span className="font-medium flex-shrink-0">
              -{formatPrice(discountAmount)}
            </span>
          </div>
        )}

        <div className="flex justify-between text-sm sm:text-base">
          <span>{t("tax", "Tax")}</span>
          <span>{formatPrice(tax)}</span>
        </div>

        <div className="flex justify-between text-sm sm:text-base">
          <span>{t("shipping", "Shipping")}</span>
          <span>{formatPrice(shippingCost)}</span>
        </div>

        <div className="border-t pt-3 flex justify-between font-semibold text-base sm:text-lg">
          <span>{t("total", "Total")}</span>
          <span>{formatPrice(total)}</span>
        </div>

        {/* **SAVINGS HIGHLIGHT** */}
        {discountAmount > 0 && (
          <div className="text-center pt-2">
            <p className="text-xs sm:text-sm text-green-600 font-medium">
              🎉 {t("youSaved", "You saved")} {formatPrice(discountAmount)}!
            </p>
          </div>
        )}
      </div>
    </div>
  );
});
