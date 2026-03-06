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
  const isStripeNewCard = !isNetopia && !isCOD && useNewCard;
  const codPercentageLabel = codConfig?.percentage
    ? Math.round(codConfig.percentage * 10000) / 100
    : 3;

  // Calculate COD fee if COD is selected
  const codFeeResult = useMemo(() => {
    if (!isCOD) return null;
    const orderTotal = getCartTotal() + shippingCost - discountAmount;
    try {
      const config = codConfig
        ? {
            percentage: codConfig.percentage,
            fixedFee: isLockerCodFlow ? 0 : codConfig.fixedFee,
          }
        : isLockerCodFlow
          ? { fixedFee: 0 }
          : undefined;
      return calculateCODFee(orderTotal, config);
    } catch (error) {
      console.error("Error calculating COD fee:", error);
      return null;
    }
  }, [
    isCOD,
    getCartTotal,
    shippingCost,
    discountAmount,
    codConfig,
    isLockerCodFlow,
  ]);

  return (
    <>
      {appliedCoupon && discountAmount > 0 && (
        <div className="my-4 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-emerald-900">
                {t("discountAppliedTitle", "Reducere aplicată")}
              </p>
              <div className="mt-1 inline-flex items-center rounded-full border border-emerald-200 bg-white px-2.5 py-1 text-xs font-semibold text-emerald-800">
                {appliedCoupon.code}
              </div>
            </div>
            <span className="text-sm font-bold text-emerald-700">
              -{discountAmount.toFixed(2)} RON
            </span>
          </div>
          <p className="mt-2 text-sm text-emerald-800">
            {t(
              "discountAppliedBody",
              "Economisești {amount} la această comandă.",
              { amount: `${discountAmount.toFixed(2)} RON` }
            )}
          </p>
        </div>
      )}

      {isNetopia && (
        <div className="my-6">
          <div className="rounded-2xl border border-blue-200 bg-blue-50/80 p-4">
            <p className="text-sm font-semibold text-blue-950">
              {t("netopiaSummaryTitle", "Plată online securizată")}
            </p>
            <p className="mt-1 text-sm text-blue-800">
              {t(
                "netopiaRedirectNotice",
                "Plata va fi finalizată pe pagina securizată Netopia după ce confirmi comanda."
              )}
            </p>
            <p className="mt-3 text-xs uppercase tracking-wide text-blue-700">
              {t(
                "netopiaMethods",
                "Card Visa sau Mastercard"
              )}
            </p>
          </div>
        </div>
      )}

      {isStripeNewCard && (
        <div className="my-6">
          <div className="rounded-2xl border border-violet-200 bg-violet-50/80 p-4">
            <p className="text-sm font-semibold text-violet-950">
              {t("stripeSummaryTitle", "Card securizat prin Stripe")}
            </p>
            <p className="mt-1 text-sm text-violet-800">
              {t(
                "paymentProcessing",
                "Procesarea plății se va face în siguranță prin Stripe."
              )}
            </p>
            {isCalculatingTotal && (
              <p className="mt-2 text-xs text-violet-700">
                {t("calculatingTotal", "Se calculează totalul...")}
              </p>
            )}
            {!isCalculatingTotal && totalAmount > 0 && (
              <div className="mt-3 flex items-center justify-between rounded-xl border border-violet-200 bg-white px-3 py-2 text-sm">
                <span className="text-violet-900">
                  {t("amountToAuthorize", "Total de autorizat")}
                </span>
                <span className="font-semibold text-violet-950">
                  {totalAmount.toFixed(2)} RON
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {isCOD && codFeeResult && (
        <div className="my-6">
          <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-amber-950">
                  {isLockerCodFlow
                    ? t("codLockerSummaryTitle", "Plată la ridicare")
                    : t("codSummaryTitle", "Plată ramburs")}
                </p>
                <p className="mt-1 text-sm text-amber-800">
                  {isLockerCodFlow
                    ? t(
                        "codLockerSummaryBody",
                        "Plata se face la terminalul FANbox în momentul ridicării."
                      )
                    : t(
                        "codSummaryBody",
                        "Plătești curierului la livrare. Taxa ramburs este inclusă mai jos."
                      )}
                </p>
              </div>
              <span className="inline-flex items-center rounded-full border border-amber-200 bg-white px-2.5 py-1 text-xs font-semibold text-amber-800">
                {isLockerCodFlow
                  ? t("codLockerBadge", "Ridicare FANbox")
                  : t("cashOnDelivery", "Ramburs")}
              </span>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-amber-200 bg-white px-3 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-700">
                  {isLockerCodFlow
                    ? t("codLockerFee", "Taxă plată la FANbox")
                    : t("codFee", "Taxă ramburs")}
                </p>
                <p className="mt-1 text-lg font-semibold text-amber-950">
                  +{codFeeResult.fee.toFixed(2)} RON
                </p>
              </div>
              <div className="rounded-xl border border-amber-200 bg-white px-3 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-700">
                  {t("feeBreakdown", "Structură taxă")}
                </p>
                <p className="mt-1 text-sm text-amber-950">
                  {codPercentageLabel}% ({codFeeResult.breakdown.percentageFee.toFixed(2)} RON) +{" "}
                  {codFeeResult.breakdown.fixedFee.toFixed(2)} RON {t("fixed", "fix")}
                </p>
              </div>
              <div className="rounded-xl border border-amber-200 bg-white px-3 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-700">
                  {isLockerCodFlow
                    ? t("totalWithLockerCOD", "Total cu plată la FANbox")
                    : t("totalWithCOD", "Total cu ramburs")}
                </p>
                <p className="mt-1 text-lg font-semibold text-amber-950">
                  {codFeeResult.orderTotalWithFee.toFixed(2)} RON
                </p>
              </div>
            </div>

            <p className="mt-3 text-xs leading-relaxed text-amber-900/90">
              {t(
                "codSummaryFinePrint",
                "În pasul următor confirmi condițiile COD, iar dacă este necesar, autorizezi o garanție logistică temporară pe card."
              )}
            </p>
          </div>
        </div>
      )}
    </>
  );
});
