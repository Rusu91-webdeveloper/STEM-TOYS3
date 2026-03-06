"use client";

import { Banknote, CreditCard, ShieldCheck } from "lucide-react";
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
    codConfig,
    discountAmount,
    getCartTotal,
    isCOD,
    isLockerCodFlow,
    shippingCost,
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
          <div className="rounded-3xl border border-blue-200 bg-white/95 p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                <CreditCard className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-slate-950">
                    {t("netopiaSummaryTitle", "Plată online securizată")}
                  </p>
                  <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700">
                    Netopia
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-600">
                  {t(
                    "netopiaRedirectNotice",
                    "După confirmare vei fi redirecționat pe pagina securizată Netopia pentru finalizarea plății."
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {isStripeNewCard && (
        <div className="my-6">
          <div className="rounded-3xl border border-violet-200 bg-white/95 p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-violet-50 text-violet-700">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-950">
                    {t("stripeSummaryTitle", "Card securizat prin Stripe")}
                  </p>
                  {!isCalculatingTotal && totalAmount > 0 && (
                    <span className="inline-flex items-center rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700">
                      {totalAmount.toFixed(2)} RON
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-slate-600">
                  {t(
                    "paymentProcessing",
                    "Introduci cardul o singură dată, iar procesarea plății se face în siguranță prin Stripe."
                  )}
                </p>
                {isCalculatingTotal && (
                  <p className="mt-2 text-xs text-slate-500">
                    {t("calculatingTotal", "Se calculează totalul...")}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {isCOD && codFeeResult && (
        <div className="my-6">
          <div className="rounded-3xl border border-amber-200 bg-white/95 p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
                <Banknote className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-950">
                    {isLockerCodFlow
                      ? t("codLockerSummaryTitle", "Plată la ridicare")
                      : t("codSummaryTitle", "Estimare pentru plata ramburs")}
                  </p>
                  <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">
                    {isLockerCodFlow
                      ? t("codLockerBadge", "Ridicare FANbox")
                      : t("cashOnDelivery", "Ramburs")}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-600">
                  {isLockerCodFlow
                    ? t(
                        "codLockerSummaryBody",
                        "Plata se face la terminalul FANbox în momentul ridicării."
                      )
                    : t(
                        "codSummaryBody",
                        "Mai jos vezi taxa ramburs și totalul estimat înainte să confirmi condițiile COD."
                      )}
                </p>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-3 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  {isLockerCodFlow
                    ? t("codLockerFee", "Taxă plată la FANbox")
                    : t("codFee", "Taxă ramburs")}
                </p>
                <p className="mt-1 text-lg font-semibold text-slate-950">
                  +{codFeeResult.fee.toFixed(2)} RON
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-3 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  {t("feeBreakdown", "Structură taxă")}
                </p>
                <p className="mt-1 text-sm text-slate-700">
                  {codPercentageLabel}% ({codFeeResult.breakdown.percentageFee.toFixed(2)} RON) +{" "}
                  {codFeeResult.breakdown.fixedFee.toFixed(2)} RON {t("fixed", "fix")}
                </p>
              </div>
              <div className="rounded-2xl border border-amber-200 bg-amber-50/70 px-3 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-700">
                  {isLockerCodFlow
                    ? t("totalWithLockerCOD", "Total cu plată la FANbox")
                    : t("totalWithCOD", "Total cu ramburs")}
                </p>
                <p className="mt-1 text-lg font-semibold text-slate-950">
                  {codFeeResult.orderTotalWithFee.toFixed(2)} RON
                </p>
              </div>
            </div>

            <p className="mt-3 text-xs leading-relaxed text-slate-500">
              {t(
                "codSummaryFinePrint",
                "După acest rezumat, confirmi condițiile COD și doar dacă este necesar autorizezi o garanție logistică temporară pe card."
              )}
            </p>
          </div>
        </div>
      )}
    </>
  );
});
