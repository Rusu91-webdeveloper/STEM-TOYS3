"use client";

import { CreditCard, ShieldCheck } from "lucide-react";
import React, { useMemo } from "react";

import { checkoutCardClass } from "@/features/checkout/lib/checkoutTheme";
import { formatStorefrontPrice } from "@/lib/format/storefront-price";
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

const PaymentSummaryComponent = ({
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
}: PaymentSummaryProps) => {
  const { t } = useTranslation();
  const isNetopia = selectedPaymentMethod.startsWith("netopia_");
  const isCOD = selectedPaymentMethod === "cash_on_delivery";
  const isStripeNewCard = !isNetopia && !isCOD && useNewCard;
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
        <div className="my-3 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-3.5 sm:my-4 sm:p-4">
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
              -{formatStorefrontPrice(discountAmount)}
            </span>
          </div>
          <p className="mt-2 text-sm text-emerald-800">
            {t(
              "discountAppliedBody",
              `Economisești ${formatStorefrontPrice(discountAmount)} la această comandă.`
            )}
          </p>
        </div>
      )}

      {isNetopia && (
        <div className="my-4 sm:my-6">
          <div className={`${checkoutCardClass} p-3.5 sm:p-4`}>
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-sky-100 text-sky-700 sm:h-10 sm:w-10">
                <CreditCard className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-[13px] font-semibold text-slate-900 sm:text-sm">
                    {t("netopiaSummaryTitle", "Plată online securizată")}
                  </p>
                  <span className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-[11px] font-medium text-sky-800">
                    Netopia
                  </span>
                </div>
                <p className="mt-1 text-[13px] leading-5 text-slate-600 sm:text-sm">
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
        <div className="my-4 sm:my-6">
          <div className={`${checkoutCardClass} p-3.5 sm:p-4`}>
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-violet-700 sm:h-10 sm:w-10">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[13px] font-semibold text-slate-900 sm:text-sm">
                    {t("stripeSummaryTitle", "Card securizat prin Stripe")}
                  </p>
                  {!isCalculatingTotal && totalAmount > 0 && (
                    <span className="inline-flex items-center rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-800">
                      {formatStorefrontPrice(totalAmount)}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-[13px] leading-5 text-slate-600 sm:text-sm">
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
        <div className="my-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
          <dl className="space-y-2 text-sm">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-slate-600">
              <dt>
                {isLockerCodFlow
                  ? t("codLockerFee", "Taxă plată la FANbox")
                  : t("codFee", "Taxă ramburs")}
              </dt>
              <dd>+{formatStorefrontPrice(codFeeResult.fee)}</dd>
            </div>
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 font-semibold text-slate-900">
              <dt>
                {isLockerCodFlow
                  ? t("totalWithLockerCOD", "Total cu plată la FANbox")
                  : t("codPayOnDeliveryTotal", "Total de plată la livrare")}
              </dt>
              <dd className="text-lg">
                {formatStorefrontPrice(codFeeResult.orderTotalWithFee)}
              </dd>
            </div>
          </dl>
        </div>
      )}
    </>
  );
};

PaymentSummaryComponent.displayName = "PaymentSummary";

export const PaymentSummary = React.memo(PaymentSummaryComponent);
