"use client";

import React from "react";

import { useCurrency } from "@/lib/currency";
import { useTranslation } from "@/lib/i18n";
import { checkoutCardClass } from "@/features/checkout/lib/checkoutTheme";

interface OrderSummarySectionProps {
  subtotal: number;
  tax: number;
  shippingCost: number;
  total: number;
  codFee?: number;
  discountAmount?: number;
  appliedCoupon?: any;
}

export const OrderSummarySection = React.memo(function OrderSummarySection({
  subtotal,
  tax,
  shippingCost,
  total,
  codFee = 0,
  discountAmount = 0,
  appliedCoupon,
}: OrderSummarySectionProps) {
  const { formatPrice } = useCurrency();
  const { t } = useTranslation();

  return (
    <div className={`${checkoutCardClass} p-4 text-slate-900 sm:p-6`}>
      <h3 className="mb-4 text-base font-semibold sm:text-lg">
        {t("orderSummary", "Order Summary")}
      </h3>

      <div className="space-y-3">
        <div className="flex justify-between text-sm sm:text-base">
          <span>{t("subtotal", "Subtotal")}</span>
          <span>{formatPrice(subtotal)}</span>
        </div>

        {/* **DISCOUNT LINE** */}
        {discountAmount > 0 && appliedCoupon && (
          <div className="flex justify-between text-sm text-emerald-700 sm:text-base">
            <span className="font-medium truncate">
              {t("discount", "Discount")} ({appliedCoupon.code})
            </span>
            <span className="font-medium flex-shrink-0">
              -{formatPrice(discountAmount)}
            </span>
          </div>
        )}

        {tax > 0 && (
          <div className="flex justify-between text-sm sm:text-base">
            <span>{t("tax", "Tax")}</span>
            <span>{formatPrice(tax)}</span>
          </div>
        )}

        <div className="flex justify-between text-sm sm:text-base">
          <span>
            {t("shipping", "Shipping")}
            {shippingCost === 0 && (
              <span className="ml-2 text-xs font-medium text-emerald-600">
                (Transport gratuit!)
              </span>
            )}
          </span>
          <span
            className={shippingCost === 0 ? "font-medium text-emerald-600" : ""}
          >
            {shippingCost === 0 ? "GRATUIT" : formatPrice(shippingCost)}
          </span>
        </div>

        {codFee > 0 && (
          <div className="flex justify-between text-sm sm:text-base">
            <span>{t("codFee", "Cash on delivery fee")}</span>
            <span>{formatPrice(codFee)}</span>
          </div>
        )}

        <div className="border-t pt-3 flex justify-between font-semibold text-base sm:text-lg">
          <span>{t("total", "Total")}</span>
          <span>{formatPrice(total)}</span>
        </div>

        {/* **SAVINGS HIGHLIGHT** */}
        {discountAmount > 0 && (
          <div className="text-center pt-2">
            <p className="text-xs sm:text-sm text-emerald-400 font-medium">
              🎉 {t("youSaved", "You saved")} {formatPrice(discountAmount)}!
            </p>
          </div>
        )}
      </div>
    </div>
  );
});
