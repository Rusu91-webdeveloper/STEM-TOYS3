"use client";

import React from "react";

import { StripeBypassProvider } from "@/components/checkout/StripeBypassProvider";
import { CheckoutFlow } from "@/features/checkout/components/CheckoutFlow";
import { useTranslation } from "@/lib/i18n";

export function CheckoutContent() {
  const { t } = useTranslation();

  return (
    <div className="container py-6 sm:py-10 px-3 sm:px-4">
      {/* Hormozi-Style Checkout Header */}
      <div className="text-center mb-8 sm:mb-12">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
          {t("checkoutPageH1", "Completează Transformarea Copilului Tău")}
        </h1>
        <p className="text-lg sm:text-xl text-muted-foreground mb-6 max-w-3xl mx-auto">
          {t(
            "checkoutPageSubtitle",
            "Ești la 30 de secunde distanță să-ți schimbi copilul pentru totdeauna. Alătură-te miilor de părinți care au văzut deja transformarea."
          )}
        </p>

        {/* Trust Indicators Row */}
        <div className="flex flex-wrap justify-center gap-4 sm:gap-6 mb-6">
          <div className="flex items-center gap-2 bg-green-50 px-3 py-2 rounded-full">
            <svg
              className="w-5 h-5 text-green-600"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-sm font-medium text-green-700">
              {t("secureCheckout", "Finalizare Sigură")}
            </span>
          </div>

          <div className="flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-full">
            <svg
              className="w-5 h-5 text-blue-600"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-sm font-medium text-blue-700">
              {t("transformationGuarantee", "Garanție de Transformare")}
            </span>
          </div>

          <div className="flex items-center gap-2 bg-purple-50 px-3 py-2 rounded-full">
            <svg
              className="w-5 h-5 text-purple-600"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-medium text-purple-700">
              {t("tenThousandParentsTrust", "10,000+ Părinți Ne Încredințează")}
            </span>
          </div>
        </div>
      </div>

      <StripeBypassProvider>
        <CheckoutFlow />
      </StripeBypassProvider>
    </div>
  );
}
