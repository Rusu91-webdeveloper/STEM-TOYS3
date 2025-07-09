"use client";

import {
  CheckCircle,
  Circle,
  MapPin,
  Truck,
  CreditCard,
  Eye,
  Clock,
  Check,
  ChevronRight,
  Mail,
} from "lucide-react";
import React from "react";

import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";

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
  const IconComponent = step.icon;

  return (
    <div className="flex flex-col items-center relative group">
      {/* Connection Line */}
      {stepNumber < totalSteps && (
        <div className="absolute top-6 left-1/2 w-full h-0.5 bg-gray-200 z-0">
          <div
            className={cn(
              "h-full bg-primary transition-all duration-500 ease-in-out",
              isCompleted ? "w-full" : "w-0"
            )}
          />
        </div>
      )}

      {/* Step Button */}
      <button
        className={cn(
          "relative z-10 flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300",
          "focus:outline-none focus:ring-4 focus:ring-primary/20",
          isActive && "scale-110 shadow-lg",
          isCompleted && "bg-primary border-primary text-primary-foreground",
          isActive &&
            !isCompleted &&
            "border-primary bg-primary/10 text-primary",
          !isActive && !isCompleted && "border-gray-300 bg-white text-gray-400",
          isClickable && "hover:scale-105 hover:shadow-md cursor-pointer",
          !isClickable && "cursor-not-allowed opacity-60"
        )}
        onClick={isClickable ? onClick : undefined}
        disabled={!isClickable}
        type="button"
        aria-label={`Step ${stepNumber}: ${step.label}`}
      >
        {isCompleted ? (
          <Check className="w-5 h-5" />
        ) : isActive ? (
          <IconComponent className="w-5 h-5" />
        ) : (
          <span className="text-sm font-medium">{stepNumber}</span>
        )}
      </button>

      {/* Step Content */}
      <div className="mt-3 text-center max-w-32">
        <div
          className={cn(
            "text-sm font-medium transition-colors",
            isActive && "text-primary",
            isCompleted && "text-gray-900",
            !isActive && !isCompleted && "text-gray-500"
          )}
        >
          {step.label}
        </div>
        <div className="text-xs text-gray-500 mt-1 leading-tight">
          {step.description}
        </div>

        {/* Completion Info */}
        {isCompleted && completionInfo && (
          <Badge variant="secondary" className="mt-2 text-xs">
            {completionInfo}
          </Badge>
        )}

        {/* Active Indicator */}
        {isActive && !isCompleted && (
          <div className="flex items-center justify-center mt-2">
            <Clock className="w-3 h-3 text-primary mr-1" />
            <span className="text-xs text-primary">In Progress</span>
          </div>
        )}
      </div>
    </div>
  );
}

interface ProgressBarProps {
  currentStep: CheckoutStep;
  completedSteps: number;
  totalSteps: number;
}

function ProgressBar({
  currentStep,
  completedSteps,
  totalSteps,
}: ProgressBarProps) {
  const progressPercentage = (completedSteps / totalSteps) * 100;

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-700">
          Checkout Progress
        </span>
        <span className="text-sm text-gray-500">
          {completedSteps} of {totalSteps} completed
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-primary h-2 rounded-full transition-all duration-500 ease-in-out"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
    </div>
  );
}

interface EnhancedCheckoutStepperProps {
  currentStep: CheckoutStep;
  onStepClick: (step: CheckoutStep) => void;
  checkoutData: CheckoutData;
}

export function EnhancedCheckoutStepper({
  currentStep,
  onStepClick,
  checkoutData,
}: EnhancedCheckoutStepperProps) {
  const { t } = useTranslation();

  const stepDefinitions: StepDefinition[] = [
    {
      id: "guest-info",
      label: "Contact Info",
      description: "Email and account options",
      icon: Mail,
    },
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
      case "guest-info":
        return !!checkoutData.guestInformation?.email;
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

  const getCompletionInfo = (step: CheckoutStep): string | undefined => {
    switch (step) {
      case "guest-info":
        if (checkoutData.guestInformation?.email) {
          return checkoutData.guestInformation.createAccount
            ? "Creating account"
            : "Guest checkout";
        }
        return undefined;
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
        if (checkoutData.paymentDetails) {
          return "Card selected";
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
      "guest-info",
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
    <div className="bg-white border rounded-lg p-6 mb-8">
      {/* Progress Bar */}
      <ProgressBar
        currentStep={currentStep}
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
            onClick={() => onStepClick(step.id)}
            stepNumber={index + 1}
            totalSteps={stepDefinitions.length}
            completionInfo={getCompletionInfo(step.id)}
          />
        ))}
      </div>

      {/* Mobile Stepper */}
      <div className="md:hidden space-y-3">
        {stepDefinitions.map((step, index) => {
          const isActive = currentStep === step.id;
          const isComplete = isCompleted(step.id);
          const IconComponent = step.icon;

          return (
            <button
              key={step.id}
              className={cn(
                "w-full flex items-center p-3 rounded-lg border transition-all",
                isActive && "border-primary bg-primary/5",
                isComplete && "border-green-200 bg-green-50",
                !isActive && !isComplete && "border-gray-200",
                isClickable(step.id) && "hover:bg-gray-50 cursor-pointer",
                !isClickable(step.id) && "cursor-not-allowed opacity-60"
              )}
              onClick={
                isClickable(step.id) ? () => onStepClick(step.id) : undefined
              }
              disabled={!isClickable(step.id)}
              type="button"
            >
              {/* Step Icon/Number */}
              <div
                className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-full mr-3",
                  isComplete && "bg-green-100 text-green-600",
                  isActive && !isComplete && "bg-primary/10 text-primary",
                  !isActive && !isComplete && "bg-gray-100 text-gray-400"
                )}
              >
                {isComplete ? (
                  <Check className="w-4 h-4" />
                ) : isActive ? (
                  <IconComponent className="w-4 h-4" />
                ) : (
                  <span className="text-sm font-medium">{index + 1}</span>
                )}
              </div>

              {/* Step Content */}
              <div className="flex-1 text-left">
                <div
                  className={cn(
                    "font-medium text-sm",
                    isActive && "text-primary",
                    isComplete && "text-green-900",
                    !isActive && !isComplete && "text-gray-600"
                  )}
                >
                  {step.label}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  {isComplete && getCompletionInfo(step.id)
                    ? getCompletionInfo(step.id)
                    : step.description}
                </div>
              </div>

              {/* Status Indicator */}
              <div className="ml-2">
                {isComplete ? (
                  <Badge
                    variant="secondary"
                    className="text-xs bg-green-100 text-green-700"
                  >
                    Complete
                  </Badge>
                ) : isActive ? (
                  <Badge variant="default" className="text-xs">
                    Active
                  </Badge>
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Current Step Summary */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center">
          <div className="w-2 h-2 bg-primary rounded-full mr-2 animate-pulse" />
          <span className="text-sm font-medium text-gray-700">
            Current Step:{" "}
            {stepDefinitions.find(s => s.id === currentStep)?.label}
          </span>
        </div>
        <p className="text-xs text-gray-600 mt-1 ml-4">
          {stepDefinitions.find(s => s.id === currentStep)?.description}
        </p>
      </div>
    </div>
  );
}
