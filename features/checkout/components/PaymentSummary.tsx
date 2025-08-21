"use client";

import React from "react";

import { useTranslation } from "@/lib/i18n";

interface PaymentSummaryProps {
  appliedCoupon?: any;
  discountAmount?: number;
  useNewCard: boolean;
  selectedPaymentMethod: string;
  isCalculatingTotal: boolean;
  totalAmount: number;
  getCartTotal: () => number;
}

export const PaymentSummary = React.memo(function PaymentSummary({
  appliedCoupon,
  discountAmount = 0,
  useNewCard,
  selectedPaymentMethod,
  isCalculatingTotal,
  totalAmount,
  getCartTotal,
}: PaymentSummaryProps) {
  const { t } = useTranslation();

  return (
    <>
      {/* Discount Information Display */}
      {appliedCoupon && discountAmount > 0 && (
        <div className="my-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-green-600 font-medium">
                🎉 Discount Applied:
              </span>
              <span className="font-mono text-sm bg-green-100 px-2 py-1 rounded text-green-800">
                {appliedCoupon.code}
              </span>
            </div>
            <span className="text-green-600 font-bold">
              -{discountAmount.toFixed(2)} LEI
            </span>
          </div>
          <p className="text-sm text-green-700 mt-2">
            You&apos;re saving {discountAmount.toFixed(2)} LEI on this order!
          </p>
        </div>
      )}

      {/* Show the saved card or Stripe form */}
      {!useNewCard && selectedPaymentMethod !== "new" ? (
        <div className="my-6">
          <div className="bg-gray-50 rounded-lg p-4 border">
            <p className="text-gray-700">
              {t("proceedToReview", "Poți continua la verificarea comenzii.")}
            </p>
          </div>
        </div>
      ) : (
        <div className="my-6">
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <p className="text-blue-700 text-sm">
              {t(
                "paymentProcessing",
                "Procesarea plății se va face în siguranță prin Stripe."
              )}
            </p>
            {isCalculatingTotal && (
              <p className="text-blue-600 text-xs mt-1">
                {t("calculatingTotal", "Se calculează totalul...")}
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
});
