"use client";

import React from "react";

import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n";

import { getErrorInfo } from "../lib/errorHandling";

import { ErrorDisplay } from "./ErrorDisplay";

interface OrderActionsProps {
  onBack: () => void;
  onPlaceOrder: () => void;
  onGoToCart?: () => void;
  isProcessingOrder?: boolean;
  orderError?: unknown;
}

export function OrderActions({
  onBack,
  onPlaceOrder,
  onGoToCart,
  isProcessingOrder = false,
  orderError = null,
}: OrderActionsProps) {
  const { t } = useTranslation();
  const errorInfo = orderError ? getErrorInfo(orderError, t) : null;

  return (
    <>
      {/* Enhanced Error Display */}
      {errorInfo && (
        <div className="mb-4 space-y-3">
          <ErrorDisplay
            error={errorInfo}
            onRetry={onPlaceOrder}
            onDismiss={() => {
              // Intentionally no-op; error state is managed in parent.
            }}
          />
          {errorInfo.code === "INVENTORY_ERROR" && onGoToCart && (
            <Button
              type="button"
              variant="outline"
              onClick={onGoToCart}
              className="text-sm"
            >
              {t("goToCart", "Mergi la coș")}
            </Button>
          )}
        </div>
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
