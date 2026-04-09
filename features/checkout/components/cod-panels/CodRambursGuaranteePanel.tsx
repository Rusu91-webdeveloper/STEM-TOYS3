"use client";

import { CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import React from "react";

import { StripePaymentForm } from "@/features/checkout/components/StripePaymentForm";
import { StripeProvider } from "@/features/checkout/components/StripeProvider";
import { useCurrency } from "@/lib/currency";
import { useTranslation } from "@/lib/i18n";

import type { PaymentDetails } from "../../types";

interface BillingDetails {
  name: string;
  email: string;
  address: {
    line1: string;
    line2: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
}

interface CodRambursGuaranteePanelProps {
  stripeEnabled: boolean;
  isResolvingCodGuaranteePolicy: boolean;
  codGuaranteeRequired: boolean;
  codGuaranteeAmount: number;
  codGuaranteeAuthorized: boolean;
  codGuaranteePaymentIntentId?: string;
  codGuaranteeIntentError: string | null;
  isCreatingCodGuaranteeIntent: boolean;
  codGuaranteeClientSecret: string | null;
  codGuaranteeIntentAmount: number | null;
  isCalculatingTotal: boolean;
  getBillingDetails: () => BillingDetails;
  onCODGuaranteeSuccess: (paymentDetails: PaymentDetails) => void;
  onCODGuaranteeError: (error: string) => void;
}

export function CodRambursGuaranteePanel({
  stripeEnabled,
  isResolvingCodGuaranteePolicy,
  codGuaranteeRequired,
  codGuaranteeAmount,
  codGuaranteeAuthorized,
  codGuaranteePaymentIntentId,
  codGuaranteeIntentError,
  isCreatingCodGuaranteeIntent,
  codGuaranteeClientSecret,
  codGuaranteeIntentAmount,
  isCalculatingTotal,
  getBillingDetails,
  onCODGuaranteeSuccess,
  onCODGuaranteeError,
}: CodRambursGuaranteePanelProps) {
  const { t } = useTranslation();
  const { formatPrice } = useCurrency();

  if (isResolvingCodGuaranteePolicy) {
    return (
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex items-center gap-3 text-sm font-medium text-slate-900">
          <Loader2 className="h-5 w-5 shrink-0 animate-spin text-slate-500" />
          {t(
            "codGuaranteePolicyResolving",
            "Verificăm dacă pentru această comandă este necesară garanția COD..."
          )}
        </div>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          {t(
            "codGuaranteePolicyResolvingBody",
            "Analizăm ruta de livrare și costul logistic pentru a decide dacă este necesară o pre-autorizare temporară."
          )}
        </p>
      </div>
    );
  }

  if (!codGuaranteeRequired) {
    return (
      <div className="overflow-hidden rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50/80 to-white p-4 shadow-sm sm:p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-950">
              {t(
                "codGuaranteeNotRequiredTitle",
                "Nu este necesară garanția pe card"
              )}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-slate-600">
              {t(
                "codGuaranteeNotRequired",
                "Pentru această comandă nu este necesară garanția COD pe card. Plătești doar la livrare."
              )}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!stripeEnabled) {
    return null;
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-sky-200/90 bg-white shadow-[0_4px_24px_-12px_rgba(14,165,233,0.15)]">
      <div className="h-1 bg-gradient-to-r from-sky-400 via-sky-500 to-indigo-500" />
      <div className="p-4 sm:p-6">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(240px,320px)] lg:items-start">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              <span className="rounded-md bg-sky-50 px-2 py-0.5 text-sky-800 ring-1 ring-sky-100">
                {t("codStepTwo", "Pasul 2")}
              </span>
              <span className="text-slate-400">·</span>
              <span className="text-slate-600">
                {t("temporaryAuthorizationLabel", "Autorizare temporară")}
              </span>
            </div>
            <div className="mt-3 flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-sky-100 text-sky-800 ring-1 ring-sky-200/60">
                <ShieldCheck className="h-5 w-5" aria-hidden />
              </div>
              <div className="min-w-0">
                <p className="text-base font-semibold text-slate-950 sm:text-lg">
                  {t(
                    "codGuaranteeTitle",
                    "Autorizare temporară pentru costul logistic"
                  )}
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
                  {t(
                    "codGuaranteeDescription",
                    "Pentru această comandă este necesară o pre-autorizare pe card. Suma nu este încasată acum și servește doar ca garanție operațională pentru costul logistic estimat."
                  )}
                </p>
              </div>
            </div>

            <ul className="mt-5 space-y-2.5 text-sm text-slate-600">
              <li className="flex gap-2.5">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-500" />
                {t(
                  "codGuaranteePointOne",
                  "Autorizarea este temporară și nu înseamnă încasare imediată."
                )}
              </li>
              <li className="flex gap-2.5">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-500" />
                {t(
                  "codGuaranteePointTwo",
                  "O cerem doar când comanda are cost logistic estimat care trebuie acoperit în caz de refuz."
                )}
              </li>
              <li className="flex gap-2.5">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-500" />
                {t(
                  "codGuaranteePostRefusalNotice",
                  "Dacă există diferențe peste garanția COD autorizată, acestea se gestionează prin fluxuri legale și contabile aplicabile în România."
                )}
              </li>
            </ul>
          </div>

          <aside className="rounded-2xl border border-sky-100 bg-gradient-to-b from-sky-50/90 to-white p-4 ring-1 ring-sky-100/80">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-sky-800">
              {t("codGuaranteeAmountLabel", "Valoare autorizată")}
            </p>
            <p className="mt-1 text-2xl font-bold tracking-tight text-slate-950">
              {formatPrice(codGuaranteeAmount)}
            </p>
            <div className="mt-4 rounded-xl border border-white/80 bg-white/90 px-3 py-3 shadow-sm">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                {t("codGuaranteeStatusLabel", "Status")}
              </p>
              <p className="mt-1 text-sm font-medium text-slate-900">
                {codGuaranteeAuthorized && codGuaranteePaymentIntentId
                  ? t(
                      "codGuaranteeAuthorized",
                      "Garanție autorizată. Poți continua la pasul următor."
                    )
                  : t(
                      "codGuaranteePending",
                      "Este necesară autorizarea cardului pentru a continua."
                    )}
              </p>
            </div>
          </aside>
        </div>

        {codGuaranteeIntentError && (
          <div className="mt-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            {codGuaranteeIntentError}
          </div>
        )}

        {isCreatingCodGuaranteeIntent && !codGuaranteeClientSecret && (
          <div className="mt-5 flex items-center justify-center gap-2 rounded-xl border border-sky-100 bg-sky-50/50 py-4 text-sm text-slate-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t(
              "initializingCodGuarantee",
              "Pregătim autorizarea garanției COD..."
            )}
          </div>
        )}

        {codGuaranteeClientSecret && !codGuaranteeAuthorized && (
          <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50/50 p-4">
            <StripeProvider
              options={{
                clientSecret: codGuaranteeClientSecret,
                appearance: { theme: "stripe" },
              }}
            >
              <StripePaymentForm
                clientSecret={codGuaranteeClientSecret}
                paymentIntentId={codGuaranteePaymentIntentId}
                onSuccess={onCODGuaranteeSuccess}
                onError={onCODGuaranteeError}
                billingDetails={getBillingDetails()}
                amount={
                  codGuaranteeIntentAmount ??
                  Math.round(codGuaranteeAmount * 100)
                }
                isCalculatingTotal={isCalculatingTotal}
                submitButtonClassName="cod-guarantee-submit-button"
                submitLabel={t(
                  "authorizeCodGuarantee",
                  `Autorizează ${formatPrice(
                    (codGuaranteeIntentAmount ??
                      Math.round(codGuaranteeAmount * 100)) / 100
                  )}`
                )}
              />
            </StripeProvider>
          </div>
        )}
      </div>
    </div>
  );
}
