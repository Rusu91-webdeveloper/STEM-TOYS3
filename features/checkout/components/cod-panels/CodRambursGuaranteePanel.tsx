"use client";

import { CheckCircle2, Loader2, LockKeyhole, ShieldCheck } from "lucide-react";
import React from "react";

import { StripePaymentForm } from "@/features/checkout/components/StripePaymentForm";
import { StripeProvider } from "@/features/checkout/components/StripeProvider";
import {
  COD_GUARANTEE_STRIPE_COUNTRY,
  COD_GUARANTEE_STRIPE_LOCALE,
} from "@/features/checkout/lib/cod-guarantee-element";
import { displayedCodGuaranteeAmount } from "@/features/checkout/lib/cod-guarantee-intent-session";
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
  codConsentAccepted: boolean;
  isCalculatingTotal: boolean;
  onProcessingChange: (processing: boolean) => void;
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
  codConsentAccepted,
  isCalculatingTotal,
  onProcessingChange,
  getBillingDetails,
  onCODGuaranteeSuccess,
  onCODGuaranteeError,
}: CodRambursGuaranteePanelProps) {
  const { t } = useTranslation();
  const { formatPrice } = useCurrency();
  const authorizedAmount = displayedCodGuaranteeAmount(
    codGuaranteeIntentAmount
  );
  const chargeAmount = authorizedAmount ?? codGuaranteeAmount;

  if (isResolvingCodGuaranteePolicy) {
    return (
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex items-center gap-3 text-sm font-medium text-slate-900">
          <Loader2 className="h-5 w-5 shrink-0 animate-spin text-slate-500" />
          {t(
            "codGuaranteePolicyResolving",
            "Pregătim garanția pentru plata ramburs..."
          )}
        </div>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          {t(
            "codGuaranteePolicyResolvingBody",
            "Pentru fiecare comandă ramburs este necesară o autorizare temporară pe card pentru transportul tur."
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
    <section
      aria-labelledby="cod-guarantee-title"
      className="overflow-hidden rounded-xl border border-slate-200 bg-white"
    >
      <div className="p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
            <ShieldCheck className="h-5 w-5" aria-hidden />
          </div>
          <div className="min-w-0">
            <h3
              id="cod-guarantee-title"
              className="text-base font-semibold tracking-tight text-slate-900"
            >
              {t("codCardAuthorizationTitle", "Autorizează garanția pe card")}
            </h3>
            <p className="mt-1 text-sm leading-relaxed text-slate-600">
              {t(
                "codCardAuthorizationDescription",
                "O rezervare temporară pentru transportul tur, necesară pentru fiecare comandă ramburs."
              )}
            </p>
          </div>
        </div>

        <dl className="mt-4 grid grid-cols-2 divide-x divide-slate-200 rounded-lg border border-slate-200 bg-slate-50 py-4">
          <div className="min-w-0 px-4">
            <dt className="text-xs font-medium leading-relaxed text-slate-600">
              {t("codTemporaryHoldLabel", "Rezervat temporar pe card")}
            </dt>
            <dd className="mt-1 text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
              {authorizedAmount !== null
                ? formatPrice(authorizedAmount)
                : t("codGuaranteeAmountPending", "Se calculează...")}
            </dd>
          </div>
          <div className="min-w-0 px-4">
            <dt className="text-xs font-medium leading-relaxed text-slate-600">
              {t("codChargedNowLabel", "Încasat acum")}
            </dt>
            <dd className="mt-1 text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
              {formatPrice(0)}
            </dd>
          </div>
        </dl>
        <p className="mt-3 text-xs leading-relaxed text-slate-500">
          {t(
            "codHoldReleaseSummary",
            "Solicităm eliberarea rezervării încă active la livrare, anulare sau refuz. Termenul depinde de procesator și de banca emitentă."
          )}
        </p>

        {codGuaranteeAuthorized && codGuaranteePaymentIntentId && (
          <div
            role="status"
            className="mt-4 flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm text-emerald-800"
          >
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            {t(
              "codGuaranteeAuthorized",
              "Garanție autorizată. Poți continua la pasul următor."
            )}
          </div>
        )}

        {codGuaranteeIntentError && (
          <div
            role="alert"
            className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
          >
            {codGuaranteeIntentError}
          </div>
        )}

        {isCreatingCodGuaranteeIntent && !codGuaranteeClientSecret && (
          <div
            role="status"
            className="mt-4 flex items-center gap-2 py-3 text-sm text-slate-600"
          >
            <Loader2 className="h-4 w-4 animate-spin" />
            {t(
              "initializingCodGuarantee",
              "Pregătim autorizarea garanției COD..."
            )}
          </div>
        )}

        {codGuaranteeClientSecret && !codGuaranteeAuthorized && (
          <div className="mt-5 border-t border-slate-200 pt-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-medium text-slate-900">
                {t("cardDetailsTitle", "Detalii card")}
              </p>
              <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                <LockKeyhole className="h-3.5 w-3.5" aria-hidden />
                {t("codSecuredByStripe", "Securizat prin Stripe")}
              </span>
            </div>
            <StripeProvider
              options={{
                clientSecret: codGuaranteeClientSecret,
                appearance: { theme: "stripe" },
                locale: COD_GUARANTEE_STRIPE_LOCALE,
              }}
            >
              <StripePaymentForm
                clientSecret={codGuaranteeClientSecret}
                paymentIntentId={codGuaranteePaymentIntentId}
                onSuccess={onCODGuaranteeSuccess}
                onError={onCODGuaranteeError}
                billingDetails={getBillingDetails()}
                amount={Math.round(chargeAmount * 100)}
                defaultBillingCountry={COD_GUARANTEE_STRIPE_COUNTRY}
                isCalculatingTotal={isCalculatingTotal}
                submitButtonClassName="cod-guarantee-submit-button"
                hideSubmitButton
                isSubmitDisabled={!codConsentAccepted}
                onProcessingChange={onProcessingChange}
                submitLabel={t(
                  "authorizeCodGuarantee",
                  `Autorizează ${formatPrice(chargeAmount)}`
                )}
              />
            </StripeProvider>
          </div>
        )}
      </div>
    </section>
  );
}
