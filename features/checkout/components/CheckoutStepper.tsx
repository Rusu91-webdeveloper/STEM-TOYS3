"use client";

import { CheckCircle, Circle } from "lucide-react";
import React from "react";

import { useTranslation } from "@/lib/i18n";

import { CheckoutStep, CheckoutData } from "../types";

interface StepProps {
  label: string;
  isActive: boolean;
  isCompleted: boolean;
  onClick: () => void;
  isClickable: boolean;
}

function Step({
  label,
  isActive,
  isCompleted,
  onClick,
  isClickable,
}: StepProps) {
  return (
    <button
      className={`flex items-center ${
        isActive ? "text-primary font-medium" : "text-gray-500"
      } ${isClickable ? "cursor-pointer" : "cursor-not-allowed"}`}
      onClick={isClickable ? onClick : undefined}
      disabled={!isClickable}
      type="button"
    >
      {isCompleted ? (
        <CheckCircle className="h-5 w-5 text-primary mr-2" />
      ) : (
        <Circle
          className={`h-5 w-5 mr-2 ${
            isActive ? "text-primary" : "text-gray-400"
          }`}
        />
      )}
      {label}
    </button>
  );
}

interface CheckoutStepperProps {
  currentStep: CheckoutStep;
  onStepClick: (step: CheckoutStep) => void;
  checkoutData: CheckoutData;
}

export function CheckoutStepper({
  currentStep,
  onStepClick,
  checkoutData,
}: CheckoutStepperProps) {
  const { t } = useTranslation();

  const isCompleted = (step: CheckoutStep): boolean => {
    switch (step) {
      case "shipping-address":
        return !!checkoutData.shippingAddress;
      case "shipping-method":
        return !!checkoutData.shippingMethod;
      case "payment":
        return !!checkoutData.paymentDetails;
      case "review":
        return false;
      default:
        return false;
    }
  };

  const isClickable = (step: CheckoutStep): boolean => {
    // Always allow clicking on completed steps or the current step
    if (step === currentStep || isCompleted(step)) return true;

    // Otherwise, only allow clicking on the next step if the current one is completed
    const stepOrder: CheckoutStep[] = [
      "shipping-address",
      "shipping-method",
      "payment",
      "review",
    ];
    const currentStepIndex = stepOrder.indexOf(currentStep);
    const stepIndex = stepOrder.indexOf(step);

    return stepIndex > currentStepIndex ? false : true;
  };

  return (
    <div className="pb-6 border-b">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Step
          label={t("shippingAddress", "Shipping Address")}
          isActive={currentStep === "shipping-address"}
          isCompleted={isCompleted("shipping-address")}
          onClick={() => onStepClick("shipping-address")}
          isClickable={isClickable("shipping-address")}
        />

        <div className="hidden sm:block text-gray-300">→</div>

        <Step
          label={t("shippingMethod", "Shipping Method")}
          isActive={currentStep === "shipping-method"}
          isCompleted={isCompleted("shipping-method")}
          onClick={() => onStepClick("shipping-method")}
          isClickable={isClickable("shipping-method")}
        />

        <div className="hidden sm:block text-gray-300">→</div>

        <Step
          label={t("payment", "Payment")}
          isActive={currentStep === "payment"}
          isCompleted={isCompleted("payment")}
          onClick={() => onStepClick("payment")}
          isClickable={isClickable("payment")}
        />

        <div className="hidden sm:block text-gray-300">→</div>

        <Step
          label={t("review", "Review")}
          isActive={currentStep === "review"}
          isCompleted={isCompleted("review")}
          onClick={() => onStepClick("review")}
          isClickable={isClickable("review")}
        />
      </div>
    </div>
  );
}
