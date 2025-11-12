"use client";

import React from "react";

import { StripeBypassProvider } from "@/components/checkout/StripeBypassProvider";
import { CheckoutFlow } from "@/features/checkout/components/CheckoutFlow";
import { useTranslation } from "@/lib/i18n";
import {
  glassPanelClass,
  homeBackgroundClass,
  homeContentWrapperClass,
  homeOverlayBottomClass,
  homeOverlayTopClass,
} from "@/features/home/components/homeTheme";

export function CheckoutContent() {
  const { t } = useTranslation();

  return (
    <div className={homeBackgroundClass}>
      <div className={homeOverlayTopClass} aria-hidden />
      <div className={homeOverlayBottomClass} aria-hidden />
      <div
        className={`${homeContentWrapperClass} min-h-screen py-10 sm:py-14 lg:py-16`}
      >
        <div className="container relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Hormozi-Style Checkout Header */}
          <div
            className={`${glassPanelClass} mx-auto w-full max-w-5xl overflow-hidden px-5 py-8 sm:px-8 sm:py-10 lg:px-12 lg:py-12 text-slate-100`}
          >
            <div className="mx-auto max-w-3xl text-center">
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-semibold sm:font-bold tracking-tight mb-4 bg-gradient-to-r from-emerald-400 via-sky-400 to-indigo-400 bg-clip-text text-transparent">
                {t("checkoutPageH1", "Completează Transformarea Copilului Tău")}
              </h1>
              <p className="text-base sm:text-lg md:text-xl text-slate-200/80 leading-relaxed mb-6">
                {t(
                  "checkoutPageSubtitle",
                  "Ești la 30 de secunde distanță să-ți schimbi copilul pentru totdeauna. Alătură-te miilor de părinți care au văzut deja transformarea."
                )}
              </p>
            </div>

            {/* Trust Indicators Row */}
            <div className="flex flex-wrap justify-center gap-3 sm:gap-4 md:gap-5">
              <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 backdrop-blur">
                <svg
                  className="h-5 w-5 text-emerald-300"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-sm font-medium text-slate-100">
                  {t("secureCheckout", "Finalizare Sigură")}
                </span>
              </div>

              <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 backdrop-blur">
                <svg
                  className="h-5 w-5 text-sky-300"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-sm font-medium text-slate-100">
                  {t("transformationGuarantee", "Garanție de Transformare")}
                </span>
              </div>

              <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 backdrop-blur">
                <svg
                  className="h-5 w-5 text-purple-300"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm font-medium text-slate-100">
                  {t(
                    "tenThousandParentsTrust",
                    "Încredere de Familii din Întreaga Lume"
                  )}
                </span>
              </div>
            </div>
          </div>

          <div
            className={`${glassPanelClass} mt-8 sm:mt-10 lg:mt-12 px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10 text-slate-100`}
          >
            <StripeBypassProvider>
              <CheckoutFlow />
            </StripeBypassProvider>
          </div>
        </div>
      </div>
    </div>
  );
}
