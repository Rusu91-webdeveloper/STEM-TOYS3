"use client";

import React from "react";

import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n";

import { ErrorDisplay } from "./ErrorDisplay";
import { getErrorInfo } from "../lib/errorHandling";

interface OrderActionsProps {
  onBack: () => void;
  onPlaceOrder: () => void;
  isProcessingOrder?: boolean;
  orderError?: string | null;
}

export function OrderActions({
  onBack,
  onPlaceOrder,
  isProcessingOrder = false,
  orderError = null,
}: OrderActionsProps) {
  const { t } = useTranslation();

  return (
    <>
      {/* Enhanced Error Display */}
      {orderError && (
        <ErrorDisplay
          error={getErrorInfo(new Error(orderError), t)}
          onRetry={onPlaceOrder}
          onDismiss={() => {
            // Clear error by calling onPlaceOrder with a flag
            // This is a simple implementation - in a real app you'd want a proper error state management
          }}
          className="mb-4"
        />
      )}

      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={isProcessingOrder}
          className="text-sm sm:text-base"
        >
          {t("backToPayment", "Back to Payment")}
        </Button>
        <Button
          type="button"
          className="bg-indigo-600 hover:bg-indigo-700 text-sm sm:text-base"
          onClick={onPlaceOrder}
          disabled={isProcessingOrder}
        >
          {isProcessingOrder
            ? t("processing", "Processing...")
            : t("placeOrder", "Place Order")}
        </Button>
      </div>
    </>
  );
}
