"use client";

import { Banknote, CreditCard, ShieldCheck } from "lucide-react";
import React, { useMemo } from "react";

import { useTranslation } from "@/lib/i18n";
import { calculateCODFee } from "@/lib/pricing/cod-fee-calculator";
import { darkGlassCardClass } from "@/features/home/components/homeTheme";

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
              `Economisești ${discountAmount.toFixed(2)} RON la această comandă.`
            )}
          </p>
        </div>
      )}

      {isNetopia && (
        <div className="my-6">
          <div className={`${darkGlassCardClass} p-4`}>
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-sky-900/40 text-sky-300">
                <CreditCard className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-slate-100">
                    {t("netopiaSummaryTitle", "Plată online securizată")}
                  </p>
                  <span className="inline-flex items-center rounded-full border border-sky-400/30 bg-sky-500/10 px-2 py-0.5 text-[11px] font-medium text-sky-300">
                    Netopia
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-300">
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
          <div className={`${darkGlassCardClass} p-4`}>
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-violet-900/40 text-violet-300">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-100">
                    {t("stripeSummaryTitle", "Card securizat prin Stripe")}
                  </p>
                  {!isCalculatingTotal && totalAmount > 0 && (
                    <span className="inline-flex items-center rounded-full border border-violet-400/30 bg-violet-500/10 px-2.5 py-1 text-xs font-semibold text-violet-300">
                      {totalAmount.toFixed(2)} RON
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-slate-300">
                  {t(
                    "paymentProcessing",
                    "Introduci cardul o singură dată, iar procesarea plății se face în siguranță prin Stripe."
                  )}
                </p>
                {isCalculatingTotal && (
                  <p className="mt-2 text-xs text-slate-400">
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
          <div className={`${darkGlassCardClass} border-amber-400/30 p-4`}>
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-900/40 text-amber-300">
                <Banknote className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-100">
                    {isLockerCodFlow
                      ? t("codLockerSummaryTitle", "Plată la ridicare")
                      : t("codSummaryTitle", "Estimare pentru plata ramburs")}
                  </p>
                  <span className="inline-flex items-center rounded-full border border-amber-400/30 bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-300">
                    {isLockerCodFlow
                      ? t("codLockerBadge", "Ridicare FANbox")
                      : t("cashOnDelivery", "Ramburs")}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-300">
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
              <div className="rounded-2xl border border-white/10 bg-slate-800 px-3 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  {isLockerCodFlow
                    ? t("codLockerFee", "Taxă plată la FANbox")
                    : t("codFee", "Taxă ramburs")}
                </p>
                <p className="mt-1 text-lg font-semibold text-slate-100">
                  +{codFeeResult.fee.toFixed(2)} RON
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-800 px-3 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  {t("feeBreakdown", "Structură taxă")}
                </p>
                <p className="mt-1 text-sm text-slate-300">
                  {codPercentageLabel}% ({codFeeResult.breakdown.percentageFee.toFixed(2)} RON) +{" "}
                  {codFeeResult.breakdown.fixedFee.toFixed(2)} RON {t("fixed", "fix")}
                </p>
              </div>
              <div className="rounded-2xl border border-amber-400/30 bg-amber-900/40 px-3 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-300">
                  {isLockerCodFlow
                    ? t("totalWithLockerCOD", "Total cu plată la FANbox")
                    : t("totalWithCOD", "Total cu ramburs")}
                </p>
                <p className="mt-1 text-lg font-semibold text-slate-100">
                  {codFeeResult.orderTotalWithFee.toFixed(2)} RON
                </p>
              </div>
            </div>

            <p className="mt-3 text-xs leading-relaxed text-slate-400">
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
