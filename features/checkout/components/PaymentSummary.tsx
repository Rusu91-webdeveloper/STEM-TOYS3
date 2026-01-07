"use client";

import React, { useMemo } from "react";

import { useTranslation } from "@/lib/i18n";
import { calculateCODFee } from "@/lib/pricing/cod-fee-calculator";

interface PaymentSummaryProps {
  appliedCoupon?: any;
  discountAmount?: number;
  useNewCard: boolean;
  selectedPaymentMethod: string;
  isCalculatingTotal: boolean;
  totalAmount: number;
  getCartTotal: () => number;
  shippingCost?: number;
}

export const PaymentSummary = React.memo(function PaymentSummary({
  appliedCoupon,
  discountAmount = 0,
  useNewCard,
  selectedPaymentMethod,
  isCalculatingTotal,
  totalAmount,
  getCartTotal,
  shippingCost = 0,
}: PaymentSummaryProps) {
  const { t } = useTranslation();
  const isNetopia = selectedPaymentMethod.startsWith("netopia_");
  const isCOD = selectedPaymentMethod === "cash_on_delivery";
  const isStripeSavedCard =
    !isNetopia && !isCOD && !useNewCard && selectedPaymentMethod !== "new";
  const isStripeNewCard = !isNetopia && !isCOD && useNewCard;

  // Calculate COD fee if COD is selected
  const codFeeResult = useMemo(() => {
    if (!isCOD) return null;
    const orderTotal = getCartTotal() + shippingCost - discountAmount;
    try {
      return calculateCODFee(orderTotal);
    } catch (error) {
      console.error("Error calculating COD fee:", error);
      return null;
    }
  }, [isCOD, getCartTotal, shippingCost, discountAmount]);

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
      {isNetopia && (
        <div className="my-6">
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <p className="text-blue-700 text-sm">
              {t(
                "netopiaRedirectNotice",
                "Plata va fi finalizată pe pagina securizată Netopia după ce confirmi comanda."
              )}
            </p>
            <p className="text-xs text-blue-500 mt-2">
              {t(
                "netopiaMethods",
                "Sunt acceptate cardurile Visa/Mastercard, rate bancare și portofelul mobilPay."
              )}
            </p>
          </div>
        </div>
      )}

      {isStripeSavedCard && (
        <div className="my-6">
          <div className="bg-gray-50 rounded-lg p-4 border">
            <p className="text-gray-700">
              {t("proceedToReview", "Poți continua la verificarea comenzii.")}
            </p>
          </div>
        </div>
      )}

      {isStripeNewCard && (
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

      {/* COD Fee Display */}
      {isCOD && codFeeResult && (
        <div className="my-6">
          <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-orange-800 font-semibold text-sm">
                {t("codFee", "Taxă ramburs")}:
              </span>
              <span className="text-orange-700 font-bold">
                +{codFeeResult.fee.toFixed(2)} RON
              </span>
            </div>
            <div className="text-xs text-orange-600 space-y-1">
              <p>
                {t(
                  "codFeeBreakdown",
                  `Taxă: ${codFeeResult.breakdown.percentageFee.toFixed(2)} RON (3%) + ${codFeeResult.breakdown.fixedFee.toFixed(2)} RON fix`,
                  {
                    percentage: codFeeResult.breakdown.percentageFee.toFixed(2),
                    fixed: codFeeResult.breakdown.fixedFee.toFixed(2),
                  }
                )}
              </p>
              <p className="font-medium">
                {t(
                  "codTotalWithFee",
                  `Total cu ramburs: ${codFeeResult.orderTotalWithFee.toFixed(2)} RON`,
                  {
                    total: codFeeResult.orderTotalWithFee.toFixed(2),
                  }
                )}
              </p>
            </div>
            <p className="text-xs text-orange-700 mt-2 font-medium">
              {t(
                "codNotice",
                "💡 Plătești cash la primirea coletului. Curierul va colecta suma totală."
              )}
            </p>
          </div>
        </div>
      )}
    </>
  );
});
