"use client";

import React from "react";

import { CheckoutFlow } from "@/features/checkout/components/CheckoutFlow";
import { useTranslation } from "@/lib/i18n";
import { StripeBypassProvider } from "@/components/checkout/StripeBypassProvider";

export function CheckoutContent() {
  const { t } = useTranslation();

  return (
    <div className="container py-6 sm:py-10 px-3 sm:px-4">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8">
        {t("checkout", "Finalizare comandă")}
      </h1>

      <StripeBypassProvider>
        <CheckoutFlow />
      </StripeBypassProvider>
    </div>
  );
}
