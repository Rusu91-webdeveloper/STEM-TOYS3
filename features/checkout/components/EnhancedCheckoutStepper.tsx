"use client";

import { CreditCard, Eye, MapPin, Truck } from "lucide-react";
import React from "react";

import { useTranslation } from "@/lib/i18n";
import { glassCardClass } from "@/features/home/components/homeTheme";

import { CheckoutStep, CheckoutData } from "../types";

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
    <div className="relative flex flex-1 flex-col items-center">
      {/* Step Circle */}
      <button
        onClick={onClick}
        disabled={!isClickable}
        className={`relative flex h-12 w-12 items-center justify-center rounded-full border-2 transition-all duration-200 ${
          isActive
            ? "border-sky-400 bg-sky-500/80 text-white shadow-lg shadow-sky-500/20"
            : isCompleted
              ? "border-emerald-400 bg-emerald-500/80 text-white shadow-lg shadow-emerald-500/20"
              : "border-white/25 bg-white/10 text-slate-300"
        } ${isClickable ? "hover:border-sky-400/80 hover:bg-sky-400/20" : "cursor-not-allowed"}`}
      >
        {isCompleted ? (
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        ) : (
          <step.icon className="w-6 h-6" />
        )}
      </button>

      {/* Step Label */}
      <div className="mt-3 text-center">
        <h3
          className={`text-sm font-medium ${
            isActive
              ? "text-sky-400"
              : isCompleted
                ? "text-emerald-300"
                : "text-slate-300"
          }`}
        >
          {t(step.label.toLowerCase().replace(/\s+/g, ""), step.label)}
        </h3>
        <p className="mt-1 text-xs text-slate-400">{step.description}</p>
        {completionInfo && (
          <p className="mt-1 text-xs font-medium text-emerald-300">
            {completionInfo}
          </p>
        )}
      </div>

      {/* Connector Line */}
      {stepNumber < totalSteps && (
        <div
          className={`absolute top-6 left-full h-0.5 w-full transition-colors duration-200 ${
            isCompleted ? "bg-emerald-400" : "bg-white/15"
          }`}
          style={{ width: "calc(100% - 3rem)" }}
        />
      )}
    </div>
  );
}

interface ProgressBarProps {
  completedSteps: number;
  totalSteps: number;
}

function ProgressBar({ completedSteps, totalSteps }: ProgressBarProps) {
  const progressPercentage = (completedSteps / totalSteps) * 100;

  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-slate-200">
          Step {completedSteps} of {totalSteps}
        </span>
        <span className="text-sm text-slate-400">
          {Math.round(progressPercentage)}% complete
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-white/10">
        <div
          className="h-2 rounded-full bg-gradient-to-r from-emerald-400 via-sky-400 to-indigo-400 transition-all duration-300 ease-out"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
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
      label: t("shippingAddress", "Shipping Address"),
      description: "Where to send your order",
      icon: MapPin,
    },
    {
      id: "shipping-method",
      label: t("shippingMethod", "Delivery"),
      description: "How fast you need it",
      icon: Truck,
    },
    {
      id: "payment",
      label: t("payment", "Payment"),
      description: "Secure payment details",
      icon: CreditCard,
    },
    {
      id: "review",
      label: t("review", "Review"),
      description: "Confirm your order",
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
          return `${checkoutData.shippingAddress.city}, ${checkoutData.shippingAddress.country}`;
        }
        return undefined;
      case "shipping-method":
        if (checkoutData.shippingMethod) {
          return checkoutData.shippingMethod.name;
        }
        return undefined;
      case "payment":
        if (checkoutData.paymentMethod) {
          return "Payment method selected";
        }
        return undefined;
      default:
        return undefined;
    }
  };

  const isClickable = (step: CheckoutStep): boolean => {
    // Always allow clicking on completed steps or the current step
    if (step === currentStep || isCompleted(step)) return true;

    // Only allow clicking on the next step if all previous steps are completed
    const stepOrder: CheckoutStep[] = [
      "shipping-address",
      "shipping-method",
      "payment",
      "review",
    ];
    const currentStepIndex = stepOrder.indexOf(currentStep);
    const stepIndex = stepOrder.indexOf(step);

    // Can only go forward if current step is completed
    if (stepIndex > currentStepIndex) {
      return isCompleted(currentStep);
    }

    // Can always go back to previous steps
    return true;
  };

  const completedStepsCount = stepDefinitions.filter(step =>
    isCompleted(step.id)
  ).length;

  return (
    <div
      className={`${glassCardClass} mb-6 border-white/10 bg-slate-900/70 p-4 text-slate-100 shadow-lg shadow-black/20 sm:mb-8 sm:p-6`}
    >
      {/* Progress Bar */}
      <ProgressBar
        completedSteps={completedStepsCount}
        totalSteps={stepDefinitions.length}
      />

      {/* Desktop Stepper */}
      <div className="relative hidden items-start justify-between md:flex">
        {stepDefinitions.map((step, index) => (
          <EnhancedStep
            key={step.id}
            step={step}
            isActive={currentStep === step.id}
            isCompleted={isCompleted(step.id)}
            isClickable={isClickable(step.id)}
            onClick={() => {}} // No step clicking in simplified flow
            stepNumber={index + 1}
            totalSteps={stepDefinitions.length}
            completionInfo={getCompletionInfo(step.id)}
          />
        ))}
      </div>

      {/* Mobile Stepper */}
      <div className="md:hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                currentStep === "shipping-address"
                  ? "bg-sky-500 text-white shadow shadow-sky-500/40"
                  : isCompleted("shipping-address")
                    ? "bg-emerald-500 text-white shadow shadow-emerald-500/40"
                    : "bg-white/10 text-slate-300"
              }`}
            >
              {isCompleted("shipping-address") ? "✓" : "1"}
            </div>
            <div
              className={`mx-2 h-1 flex-1 ${
                isCompleted("shipping-address") ? "bg-emerald-400" : "bg-white/15"
              }`}
            />
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                currentStep === "shipping-method"
                  ? "bg-sky-500 text-white shadow shadow-sky-500/40"
                  : isCompleted("shipping-method")
                    ? "bg-emerald-500 text-white shadow shadow-emerald-500/40"
                    : "bg-white/10 text-slate-300"
              }`}
            >
              {isCompleted("shipping-method") ? "✓" : "2"}
            </div>
            <div
              className={`mx-2 h-1 flex-1 ${
                isCompleted("shipping-method") ? "bg-emerald-400" : "bg-white/15"
              }`}
            />
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                currentStep === "payment"
                  ? "bg-sky-500 text-white shadow shadow-sky-500/40"
                  : isCompleted("payment")
                    ? "bg-emerald-500 text-white shadow shadow-emerald-500/40"
                    : "bg-white/10 text-slate-300"
              }`}
            >
              {isCompleted("payment") ? "✓" : "3"}
            </div>
            <div
              className={`mx-2 h-1 flex-1 ${
                isCompleted("payment") ? "bg-emerald-400" : "bg-white/15"
              }`}
            />
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                currentStep === "review"
                  ? "bg-sky-500 text-white shadow shadow-sky-500/40"
                  : "bg-white/10 text-slate-300"
              }`}
            >
              4
            </div>
          </div>
        </div>
        <div className="mt-3 text-center">
          <span className="text-sm font-medium text-slate-200">
            {stepDefinitions.find(step => step.id === currentStep)?.label}
          </span>
        </div>
      </div>
    </div>
  );
}
