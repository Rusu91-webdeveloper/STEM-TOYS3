"use client";

import React, { useEffect, useState } from "react";

import { CheckoutFlow } from "@/features/checkout/components/CheckoutFlow";
import { useTranslation } from "@/lib/i18n";
import { MobileLoadingState } from "@/features/checkout/components/MobileLoadingState";
import { usePerformanceMonitor } from "@/features/checkout/hooks/usePerformanceMonitor";
import { StripeDebug } from "@/components/debug/StripeDebug";
import { ProductionStripeDebug } from "@/components/debug/ProductionStripeDebug";

export function CheckoutContent() {
  const [isLoading, setIsLoading] = useState(true);
  const { t } = useTranslation();

  // Performance monitoring
  const { recordStep } = usePerformanceMonitor({
    step: "checkout-init",
    onMetricsUpdate: metrics => {
      if (process.env.NODE_ENV === "development") {
        // Performance metrics logged in development
      }
    },
  });

  // Remove artificial delay - show content immediately
  useEffect(() => {
    setIsLoading(false);
    recordStep();
  }, [recordStep]);

  return (
    <div className="container py-6 sm:py-10 px-3 sm:px-4">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8">
        {t("checkout", "Finalizare comandă")}
      </h1>

      {isLoading ? (
        <MobileLoadingState
          message={t("loading", "Se încarcă finalizarea comenzii...")}
          showDeviceIcon={true}
          size="lg"
        />
      ) : (
        <CheckoutFlow />
      )}
      
      {/* Debug components */}
      <StripeDebug />
      <ProductionStripeDebug />
    </div>
  );
}
