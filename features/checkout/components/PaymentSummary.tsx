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
  codConfig?: { percentage: number; fixedFee: number } | null;
  isLockerCodFlow?: boolean;
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
  codConfig = null,
  isLockerCodFlow = false,
}: PaymentSummaryProps) {
  const { t } = useTranslation();
  const isNetopia = selectedPaymentMethod.startsWith("netopia_");
  const isCOD = selectedPaymentMethod === "cash_on_delivery";
  const isStripeSavedCard =
    !isNetopia && !isCOD && !useNewCard && selectedPaymentMethod !== "new";
  const isStripeNewCard = !isNetopia && !isCOD && useNewCard;
  const codPercentageLabel = codConfig?.percentage
    ? Math.round(codConfig.percentage * 10000) / 100
    : 3;

  // Calculate COD fee if COD is selected
  const codFeeResult = useMemo(() => {
    if (!isCOD) return null;
    const orderTotal = getCartTotal() + shippingCost - discountAmount;
    try {
      return calculateCODFee(orderTotal, codConfig || undefined);
    } catch (error) {
      console.error("Error calculating COD fee:", error);
      return null;
    }
  }, [isCOD, getCartTotal, shippingCost, discountAmount, codConfig]);

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
          <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-orange-800">
                  {isLockerCodFlow
                    ? t("codLockerFee", "Taxă plată la FANbox")
                    : t("codFee", "Taxă ramburs")}
                </span>
                <span className="rounded-full border border-orange-300 bg-white px-2 py-0.5 text-[11px] font-semibold text-orange-600">
                  {isLockerCodFlow
                    ? t("codLockerBadge", "Card la FANbox")
                    : t("cashOnDelivery", "Ramburs")}
                </span>
              </div>
              <span className="text-sm font-bold text-orange-700">
                +{codFeeResult.fee.toFixed(2)} RON
              </span>
            </div>
            <div className="mt-2 grid gap-1 text-xs text-orange-700 sm:grid-cols-2">
              <div>
                <span className="font-medium">
                  {t("feeBreakdown", "Structură taxă")}:
                </span>{" "}
                <span>
                  {codPercentageLabel}% (
                  {codFeeResult.breakdown.percentageFee.toFixed(2)} RON) +{" "}
                  {codFeeResult.breakdown.fixedFee.toFixed(2)} RON{" "}
                  {t("fixed", "fix")}
                </span>
              </div>
              <div className="sm:text-right">
                <span className="font-medium">
                  {isLockerCodFlow
                    ? t("totalWithLockerCOD", "Total cu plată la FANbox")
                    : t("totalWithCOD", "Total cu ramburs")}
                </span>{" "}
                <span>{codFeeResult.orderTotalWithFee.toFixed(2)} RON</span>
              </div>
            </div>
            <p className="mt-2 text-xs font-medium text-orange-700">
              {isLockerCodFlow
                ? t(
                    "codLockerNotice",
                    "💡 Pentru FANbox, plata se face la ridicare, cu cardul la terminalul locker-ului."
                  )
                : t(
                    "codNotice",
                    "💡 Plătești cash la primirea coletului. Curierul va colecta suma totală."
                  )}
            </p>
            <p className="mt-1 text-xs text-orange-800/90">
              În caz de refuz la livrare sau nepreluare colet (RTO), se pot
              aplica costurile logistice efective tur + retur, conform
              politicilor afișate înainte de comandă.
            </p>
            <p className="mt-1 text-xs text-orange-800/90">
              Dacă există diferențe peste garanția COD autorizată, acestea se
              gestionează prin procedurile legale și contabile aplicabile în
              România.
            </p>
          </div>
        </div>
      )}
    </>
  );
});
