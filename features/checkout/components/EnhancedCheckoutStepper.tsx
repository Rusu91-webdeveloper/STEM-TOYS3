"use client";

import { Check, CreditCard, Eye, MapPin, Truck } from "lucide-react";
import React from "react";

import { checkoutStepperSurfaceClass } from "@/features/checkout/lib/checkoutTheme";
import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";

import { CheckoutData, CheckoutStep } from "../types";

interface StepDefinition {
  id: CheckoutStep;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface EnhancedStepProps {
  step: StepDefinition;
  isActive: boolean;
  isCompleted: boolean;
  isClickable: boolean;
  onClick: () => void;
  stepNumber: number;
  totalSteps: number;
  completionInfo?: string;
}

function EnhancedStep({
  step,
  isActive,
  isCompleted,
  isClickable,
  onClick,
  stepNumber,
  totalSteps,
  completionInfo,
}: EnhancedStepProps) {
  const { t } = useTranslation();

  return (
    <div className="relative flex min-w-0 flex-1 flex-col items-center">
      <button
        type="button"
        onClick={onClick}
        disabled={!isClickable}
        className={cn(
          "relative z-[1] flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200 sm:h-12 sm:w-12",
          isActive &&
            "border-primary bg-primary text-primary-foreground shadow-md shadow-primary/25",
          isCompleted &&
            !isActive &&
            "border-emerald-500 bg-emerald-500 text-white shadow-md shadow-emerald-500/20",
          !isActive &&
            !isCompleted &&
            "border-slate-200 bg-white text-slate-400",
          isClickable && !isActive && "hover:border-primary/50 hover:bg-primary/5"
        )}
      >
        {isCompleted && !isActive ? (
          <Check className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={2.5} />
        ) : (
          <step.icon className="h-5 w-5 sm:h-6 sm:w-6" />
        )}
      </button>

      <div className="mt-2 max-w-[5.5rem] text-center sm:mt-3 sm:max-w-none">
        <h3
          className={cn(
            "text-xs font-semibold sm:text-sm",
            isActive && "text-primary",
            isCompleted && !isActive && "text-emerald-700",
            !isActive && !isCompleted && "text-slate-500"
          )}
        >
          {t(step.label.toLowerCase().replace(/\s+/g, ""), step.label)}
        </h3>
        <p className="mt-0.5 hidden text-[10px] text-slate-500 sm:block sm:text-xs">
          {t(
            `checkoutStepDesc_${step.id}`,
            step.description
          )}
        </p>
        {completionInfo && (
          <p className="mt-1 line-clamp-2 text-[10px] font-medium text-emerald-700 sm:text-xs">
            {completionInfo}
          </p>
        )}
      </div>

      {stepNumber < totalSteps && (
        <div
          className={cn(
            "absolute top-5 left-full z-0 h-0.5 sm:top-6",
            isCompleted ? "bg-emerald-400" : "bg-slate-200"
          )}
          style={{ width: "calc(100% - 2.75rem)" }}
          aria-hidden
        />
      )}
    </div>
  );
}

interface EnhancedCheckoutStepperProps {
  currentStep: CheckoutStep;
  checkoutData: CheckoutData;
}

export function EnhancedCheckoutStepper({
  currentStep,
  checkoutData,
}: EnhancedCheckoutStepperProps) {
  const { t } = useTranslation();

  const stepDefinitions: StepDefinition[] = [
    {
      id: "shipping-address",
      label: t("checkoutStepAddress", "Adresă livrare"),
      description: t(
        "checkoutStepDescAddress",
        "Detalii destinatar"
      ),
      icon: MapPin,
    },
    {
      id: "shipping-method",
      label: t("checkoutStepCourier", "Curier"),
      description: t(
        "checkoutStepDescCourier",
        "Metodă de livrare"
      ),
      icon: Truck,
    },
    {
      id: "payment",
      label: t("payment", "Plată"),
      description: t(
        "checkoutStepDescPayment",
        "Metodă de plată"
      ),
      icon: CreditCard,
    },
    {
      id: "review",
      label: t("checkoutStepConfirm", "Confirmare"),
      description: t(
        "checkoutStepDescReview",
        "Verificare comandă"
      ),
      icon: Eye,
    },
  ];

  const isCompleted = (step: CheckoutStep): boolean => {
    switch (step) {
      case "shipping-address":
        return !!checkoutData.shippingAddress;
      case "shipping-method":
        return !!checkoutData.shippingMethod;
      case "payment":
        return !!checkoutData.paymentMethod;
      case "review":
        return false;
      default:
        return false;
    }
  };

  const getCompletionInfo = (step: CheckoutStep): string | undefined => {
    switch (step) {
      case "shipping-address":
        if (checkoutData.shippingAddress) {
          return `${checkoutData.shippingAddress.city}`;
        }
        return undefined;
      case "shipping-method":
        if (checkoutData.shippingMethod) {
          return checkoutData.shippingMethod.name;
        }
        return undefined;
      case "payment":
        if (checkoutData.paymentMethod) {
          return t("paymentMethodSelected", "Metodă selectată");
        }
        return undefined;
      default:
        return undefined;
    }
  };

  const isClickable = (step: CheckoutStep): boolean => {
    if (step === currentStep || isCompleted(step)) return true;

    const stepOrder: CheckoutStep[] = [
      "shipping-address",
      "shipping-method",
      "payment",
      "review",
    ];
    const currentStepIndex = stepOrder.indexOf(currentStep);
    const stepIndex = stepOrder.indexOf(step);

    if (stepIndex > currentStepIndex) {
      return isCompleted(currentStep);
    }

    return true;
  };

  return (
    <div
      className={`${checkoutStepperSurfaceClass} mb-6 p-4 sm:mb-8 sm:p-6`}
    >
      <div className="relative hidden items-start justify-between gap-1 md:flex">
        {stepDefinitions.map((step, index) => (
          <EnhancedStep
            key={step.id}
            step={step}
            isActive={currentStep === step.id}
            isCompleted={isCompleted(step.id)}
            isClickable={isClickable(step.id)}
            onClick={() => {}}
            stepNumber={index + 1}
            totalSteps={stepDefinitions.length}
            completionInfo={getCompletionInfo(step.id)}
          />
        ))}
      </div>

      <div className="md:hidden">
        <div className="flex items-center">
          <div
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold",
              currentStep === "shipping-address" &&
                "bg-primary text-primary-foreground shadow-sm",
              isCompleted("shipping-address") &&
                currentStep !== "shipping-address" &&
                "bg-emerald-500 text-white",
              !isCompleted("shipping-address") &&
                currentStep !== "shipping-address" &&
                "border border-slate-200 bg-white text-slate-400"
            )}
          >
            {isCompleted("shipping-address") &&
            currentStep !== "shipping-address" ? (
              <Check className="h-4 w-4" />
            ) : (
              "1"
            )}
          </div>
          <div
            className={cn(
              "mx-1.5 h-0.5 min-w-[8px] flex-1",
              isCompleted("shipping-address") ? "bg-emerald-400" : "bg-slate-200"
            )}
          />
          <div
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold",
              currentStep === "shipping-method" &&
                "bg-primary text-primary-foreground shadow-sm",
              isCompleted("shipping-method") &&
                currentStep !== "shipping-method" &&
                "bg-emerald-500 text-white",
              !isCompleted("shipping-method") &&
                currentStep !== "shipping-method" &&
                "border border-slate-200 bg-white text-slate-400"
            )}
          >
            {isCompleted("shipping-method") &&
            currentStep !== "shipping-method" ? (
              <Check className="h-4 w-4" />
            ) : (
              "2"
            )}
          </div>
          <div
            className={cn(
              "mx-1.5 h-0.5 min-w-[8px] flex-1",
              isCompleted("shipping-method") ? "bg-emerald-400" : "bg-slate-200"
            )}
          />
          <div
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold",
              currentStep === "payment" &&
                "bg-primary text-primary-foreground shadow-sm",
              isCompleted("payment") &&
                currentStep !== "payment" &&
                "bg-emerald-500 text-white",
              !isCompleted("payment") &&
                currentStep !== "payment" &&
                "border border-slate-200 bg-white text-slate-400"
            )}
          >
            {isCompleted("payment") && currentStep !== "payment" ? (
              <Check className="h-4 w-4" />
            ) : (
              "3"
            )}
          </div>
          <div
            className={cn(
              "mx-1.5 h-0.5 min-w-[8px] flex-1",
              isCompleted("payment") ? "bg-emerald-400" : "bg-slate-200"
            )}
          />
          <div
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold",
              currentStep === "review" &&
                "bg-primary text-primary-foreground shadow-sm",
              currentStep !== "review" &&
                "border border-slate-200 bg-white text-slate-400"
            )}
          >
            4
          </div>
        </div>
        <p className="mt-3 text-center text-sm font-semibold text-slate-800">
          {stepDefinitions.find(s => s.id === currentStep)?.label}
        </p>
        <p className="mt-0.5 text-center text-xs text-slate-500">
          {stepDefinitions.find(s => s.id === currentStep)?.description}
        </p>
      </div>
    </div>
  );
}
