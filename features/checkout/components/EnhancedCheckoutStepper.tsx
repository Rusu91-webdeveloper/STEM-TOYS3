"use client";

import { CreditCard, Eye, MapPin, Truck } from "lucide-react";
import React from "react";

import { useTranslation } from "@/lib/i18n";

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
    <div className="flex flex-col items-center flex-1 relative">
      {/* Step Circle */}
      <button
        onClick={onClick}
        disabled={!isClickable}
        className={`relative w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
          isActive
            ? "border-indigo-600 bg-indigo-600 text-white"
            : isCompleted
              ? "border-green-500 bg-green-500 text-white"
              : "border-gray-300 bg-white text-gray-400"
        } ${
          isClickable
            ? "hover:border-indigo-500 hover:bg-indigo-50 cursor-pointer"
            : "cursor-not-allowed"
        }`}
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
              ? "text-indigo-600"
              : isCompleted
                ? "text-green-600"
                : "text-gray-500"
          }`}
        >
          {t(step.label.toLowerCase().replace(/\s+/g, ""), step.label)}
        </h3>
        <p className="text-xs text-gray-400 mt-1">{step.description}</p>
        {completionInfo && (
          <p className="text-xs text-green-600 mt-1 font-medium">
            {completionInfo}
          </p>
        )}
      </div>

      {/* Connector Line */}
      {stepNumber < totalSteps && (
        <div
          className={`absolute top-6 left-full w-full h-0.5 transition-colors duration-200 ${
            isCompleted ? "bg-green-500" : "bg-gray-300"
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
        <span className="text-sm font-medium text-gray-700">
          Step {completedSteps} of {totalSteps}
        </span>
        <span className="text-sm text-gray-500">
          {Math.round(progressPercentage)}% complete
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-indigo-600 h-2 rounded-full transition-all duration-300 ease-out"
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
    <div className="bg-white border rounded-lg p-4 sm:p-6 mb-6 sm:mb-8">
      {/* Progress Bar */}
      <ProgressBar
        completedSteps={completedStepsCount}
        totalSteps={stepDefinitions.length}
      />

      {/* Desktop Stepper */}
      <div className="hidden md:flex justify-between items-start relative">
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
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep === "shipping-address"
                  ? "bg-indigo-600 text-white"
                  : isCompleted("shipping-address")
                    ? "bg-green-500 text-white"
                    : "bg-gray-200 text-gray-600"
              }`}
            >
              {isCompleted("shipping-address") ? "✓" : "1"}
            </div>
            <div
              className={`flex-1 h-1 mx-2 ${
                isCompleted("shipping-address") ? "bg-green-500" : "bg-gray-200"
              }`}
            />
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep === "shipping-method"
                  ? "bg-indigo-600 text-white"
                  : isCompleted("shipping-method")
                    ? "bg-green-500 text-white"
                    : "bg-gray-200 text-gray-600"
              }`}
            >
              {isCompleted("shipping-method") ? "✓" : "2"}
            </div>
            <div
              className={`flex-1 h-1 mx-2 ${
                isCompleted("shipping-method") ? "bg-green-500" : "bg-gray-200"
              }`}
            />
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep === "payment"
                  ? "bg-indigo-600 text-white"
                  : isCompleted("payment")
                    ? "bg-green-500 text-white"
                    : "bg-gray-200 text-gray-600"
              }`}
            >
              {isCompleted("payment") ? "✓" : "3"}
            </div>
            <div
              className={`flex-1 h-1 mx-2 ${
                isCompleted("payment") ? "bg-green-500" : "bg-gray-200"
              }`}
            />
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep === "review"
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-200 text-gray-600"
              }`}
            >
              4
            </div>
          </div>
        </div>
        <div className="mt-3 text-center">
          <span className="text-sm font-medium text-gray-700">
            {stepDefinitions.find(step => step.id === currentStep)?.label}
          </span>
        </div>
      </div>
    </div>
  );
}
