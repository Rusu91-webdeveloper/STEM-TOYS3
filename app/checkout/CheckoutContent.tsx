"use client";

import React from "react";

import { StripeBypassProvider } from "@/components/checkout/StripeBypassProvider";
import { CheckoutFlow } from "@/features/checkout/components/CheckoutFlow";
import { useTranslation } from "@/lib/i18n";

export function CheckoutContent() {
  const { t } = useTranslation();

  return (
    <div className="relative min-h-screen overflow-hidden bg-[linear-gradient(160deg,#0f172a_0%,#0c1a2e_45%,#0f172a_100%)] text-slate-100">
      {/* Subtle color overlays */}
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(56,189,248,0.07),transparent_55%),radial-gradient(ellipse_at_bottom-right,rgba(139,92,246,0.06),transparent_50%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(16,185,129,0.05),transparent_40%)]"
        aria-hidden
      />

      <div className="relative z-10 flex min-h-screen flex-col gap-4 py-10 sm:gap-8 sm:py-14 lg:py-16">
        <div className="container mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">

          {/* Checkout Header */}
          <div className="mx-auto mb-8 w-full max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-slate-800/60 px-5 py-8 shadow-xl shadow-black/40 backdrop-blur sm:mb-10 sm:px-8 sm:py-10 lg:px-12 lg:py-12">
            <div className="mx-auto max-w-3xl text-center">
              <h1 className="mb-4 text-2xl font-bold tracking-tight text-white sm:text-3xl md:text-4xl lg:text-5xl">
                {t("checkoutPageH1", "Completează Transformarea Copilului Tău")}
              </h1>
              <p className="mb-6 text-base leading-relaxed text-slate-300 sm:text-lg md:text-xl">
                {t(
                  "checkoutPageSubtitle",
                  "Ești la 30 de secunde distanță să-ți schimbi copilul pentru totdeauna. Alătură-te miilor de părinți care au văzut deja transformarea."
                )}
              </p>
            </div>

            {/* Trust Indicators Row */}
            <div className="flex flex-wrap justify-center gap-3 sm:gap-4 md:gap-5">
              <div className="flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-500/10 px-3 py-2">
                <svg className="h-5 w-5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-semibold text-emerald-100">
                  {t("secureCheckout", "Finalizare Sigură")}
                </span>
              </div>

              <div className="flex items-center gap-2 rounded-full border border-sky-400/25 bg-sky-500/10 px-3 py-2">
                <svg className="h-5 w-5 text-sky-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-semibold text-sky-100">
                  {t("transformationGuarantee", "Garanție de Transformare")}
                </span>
              </div>

              <div className="flex items-center gap-2 rounded-full border border-purple-400/25 bg-purple-500/10 px-3 py-2">
                <svg className="h-5 w-5 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-semibold text-purple-100">
                  {t("tenThousandParentsTrust", "Încredere de Familii din Întreaga Lume")}
                </span>
              </div>
            </div>
          </div>

          {/* Checkout Flow */}
          <div className="rounded-3xl border border-white/10 bg-slate-800/50 px-4 py-6 shadow-xl shadow-black/30 backdrop-blur sm:px-6 sm:py-8 lg:px-10 lg:py-10">
            <StripeBypassProvider>
              <CheckoutFlow />
            </StripeBypassProvider>
          </div>
        </div>
      </div>
    </div>
  );
}
