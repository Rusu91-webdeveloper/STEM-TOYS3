"use client";

import React from "react";
import { CheckoutStep, CheckoutData } from "../types";
import {
  CheckCircle,
  AlertCircle,
  Info,
  Clock,
  MapPin,
  Truck,
  CreditCard,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface StepValidation {
  isValid: boolean;
  isComplete: boolean;
  messages: {
    success?: string;
    warning?: string;
    error?: string;
    info?: string;
  };
  completionPercentage: number;
}

interface StepCompletionIndicatorProps {
  currentStep: CheckoutStep;
  checkoutData: CheckoutData;
  className?: string;
}

export function StepCompletionIndicator({
  currentStep,
  checkoutData,
  className,
}: StepCompletionIndicatorProps) {
  const getStepValidation = (step: CheckoutStep): StepValidation => {
    switch (step) {
      case "guest-info":
        return validateGuestInformation(checkoutData);
      case "shipping-address":
        return validateShippingAddress(checkoutData);
      case "shipping-method":
        return validateShippingMethod(checkoutData);
      case "payment":
        return validatePayment(checkoutData);
      case "review":
        return validateReview(checkoutData);
      default:
        return {
          isValid: false,
          isComplete: false,
          messages: {},
          completionPercentage: 0,
        };
    }
  };

  const validation = getStepValidation(currentStep);

  const getStepIcon = (step: CheckoutStep) => {
    switch (step) {
      case "guest-info":
        return Info;
      case "shipping-address":
        return MapPin;
      case "shipping-method":
        return Truck;
      case "payment":
        return CreditCard;
      case "review":
        return Eye;
      default:
        return Info;
    }
  };

  const getStepTitle = (step: CheckoutStep) => {
    switch (step) {
      case "guest-info":
        return "Contact Information";
      case "shipping-address":
        return "Shipping Address";
      case "shipping-method":
        return "Delivery Method";
      case "payment":
        return "Payment Details";
      case "review":
        return "Order Review";
      default:
        return "Checkout Step";
    }
  };

  const Icon = getStepIcon(currentStep);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Step Header */}
      <div className="flex items-center justify-between p-4 bg-white border rounded-lg">
        <div className="flex items-center space-x-3">
          <div
            className={cn(
              "flex items-center justify-center w-10 h-10 rounded-full",
              validation.isComplete
                ? "bg-green-100 text-green-600"
                : validation.isValid
                  ? "bg-blue-100 text-blue-600"
                  : "bg-gray-100 text-gray-400"
            )}
          >
            {validation.isComplete ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <Icon className="w-5 h-5" />
            )}
          </div>

          <div>
            <h3 className="font-medium text-gray-900">
              {getStepTitle(currentStep)}
            </h3>
            <p className="text-sm text-gray-500">
              {validation.isComplete
                ? "Complete"
                : validation.isValid
                  ? "In Progress"
                  : "Needs Attention"}
            </p>
          </div>
        </div>

        {/* Completion Badge */}
        <div className="flex items-center space-x-2">
          {validation.completionPercentage > 0 && (
            <Badge
              variant={validation.isComplete ? "default" : "secondary"}
              className="text-xs"
            >
              {Math.round(validation.completionPercentage)}% Complete
            </Badge>
          )}

          {validation.isComplete && (
            <Badge
              variant="default"
              className="text-xs bg-green-100 text-green-700"
            >
              ✓ Ready
            </Badge>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      {validation.completionPercentage > 0 && (
        <div className="px-4">
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div
              className={cn(
                "h-1.5 rounded-full transition-all duration-500",
                validation.isComplete ? "bg-green-500" : "bg-blue-500"
              )}
              style={{ width: `${validation.completionPercentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="space-y-2">
        {validation.messages.success && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              {validation.messages.success}
            </AlertDescription>
          </Alert>
        )}

        {validation.messages.info && (
          <Alert className="border-blue-200 bg-blue-50">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              {validation.messages.info}
            </AlertDescription>
          </Alert>
        )}

        {validation.messages.warning && (
          <Alert className="border-orange-200 bg-orange-50">
            <AlertCircle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              {validation.messages.warning}
            </AlertDescription>
          </Alert>
        )}

        {validation.messages.error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {validation.messages.error}
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}

// Validation functions for each step
function validateShippingAddress(checkoutData: CheckoutData): StepValidation {
  const address = checkoutData.shippingAddress;

  if (!address) {
    return {
      isValid: false,
      isComplete: false,
      messages: {
        info: "Please provide your shipping address to continue.",
      },
      completionPercentage: 0,
    };
  }

  const requiredFields = [
    address.fullName,
    address.addressLine1,
    address.city,
    address.state,
    address.postalCode,
    address.country,
  ];

  const completedFields = requiredFields.filter(Boolean).length;
  const totalFields = requiredFields.length;
  const completionPercentage = (completedFields / totalFields) * 100;

  const missingFields = [];
  if (!address.fullName) missingFields.push("Full Name");
  if (!address.addressLine1) missingFields.push("Address");
  if (!address.city) missingFields.push("City");
  if (!address.state) missingFields.push("State/Province");
  if (!address.postalCode) missingFields.push("Postal Code");
  if (!address.country) missingFields.push("Country");

  if (missingFields.length === 0) {
    return {
      isValid: true,
      isComplete: true,
      messages: {
        success: `Shipping to ${address.fullName} at ${address.addressLine1}, ${address.city}, ${address.state} ${address.postalCode}, ${address.country}`,
      },
      completionPercentage: 100,
    };
  }

  if (completedFields > 0) {
    return {
      isValid: false,
      isComplete: false,
      messages: {
        warning: `Please complete the following fields: ${missingFields.join(", ")}`,
      },
      completionPercentage,
    };
  }

  return {
    isValid: false,
    isComplete: false,
    messages: {
      info: "Fill out your shipping address details",
    },
    completionPercentage,
  };
}

function validateShippingMethod(checkoutData: CheckoutData): StepValidation {
  if (!checkoutData.shippingAddress) {
    return {
      isValid: false,
      isComplete: false,
      messages: {
        error: "Please complete your shipping address first",
      },
      completionPercentage: 0,
    };
  }

  if (!checkoutData.shippingMethod) {
    return {
      isValid: false,
      isComplete: false,
      messages: {
        info: "Choose your preferred delivery method",
      },
      completionPercentage: 0,
    };
  }

  return {
    isValid: true,
    isComplete: true,
    messages: {
      success: `${checkoutData.shippingMethod.name} selected - ${checkoutData.shippingMethod.description}`,
    },
    completionPercentage: 100,
  };
}

function validatePayment(checkoutData: CheckoutData): StepValidation {
  if (!checkoutData.shippingMethod) {
    return {
      isValid: false,
      isComplete: false,
      messages: {
        error: "Please select a shipping method first",
      },
      completionPercentage: 0,
    };
  }

  if (!checkoutData.paymentDetails) {
    return {
      isValid: false,
      isComplete: false,
      messages: {
        info: "Enter your payment information to continue",
      },
      completionPercentage: 0,
    };
  }

  const payment = checkoutData.paymentDetails;
  const requiredFields = [
    payment.cardNumber,
    payment.expiryDate,
    payment.cvv,
    payment.cardholderName,
  ];

  const completedFields = requiredFields.filter(Boolean).length;
  const totalFields = requiredFields.length;
  const completionPercentage = (completedFields / totalFields) * 100;

  if (completedFields === totalFields) {
    const maskedCardNumber = payment.cardNumber
      ? `****-****-****-${payment.cardNumber.slice(-4)}`
      : "";

    return {
      isValid: true,
      isComplete: true,
      messages: {
        success: `Payment method added: ${maskedCardNumber} (${payment.cardholderName})`,
      },
      completionPercentage: 100,
    };
  }

  return {
    isValid: false,
    isComplete: false,
    messages: {
      info: "Complete your payment details",
    },
    completionPercentage,
  };
}

function validateReview(checkoutData: CheckoutData): StepValidation {
  const hasAddress = !!checkoutData.shippingAddress;
  const hasShipping = !!checkoutData.shippingMethod;
  const hasPayment = !!checkoutData.paymentDetails;

  if (!hasAddress || !hasShipping || !hasPayment) {
    const missing = [];
    if (!hasAddress) missing.push("shipping address");
    if (!hasShipping) missing.push("delivery method");
    if (!hasPayment) missing.push("payment details");

    return {
      isValid: false,
      isComplete: false,
      messages: {
        error: `Please complete: ${missing.join(", ")}`,
      },
      completionPercentage: 0,
    };
  }

  return {
    isValid: true,
    isComplete: true,
    messages: {
      success: "Order ready for placement! Review your details below.",
    },
    completionPercentage: 100,
  };
}

function validateGuestInformation(checkoutData: CheckoutData): StepValidation {
  const guestInfo = checkoutData.guestInformation;

  if (!guestInfo?.email) {
    return {
      isValid: false,
      isComplete: false,
      messages: {
        info: "Please provide your email address to continue",
      },
      completionPercentage: 0,
    };
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(guestInfo.email)) {
    return {
      isValid: false,
      isComplete: false,
      messages: {
        error: "Please enter a valid email address",
      },
      completionPercentage: 50,
    };
  }

  // Check if creating account and validate password
  if (guestInfo.createAccount) {
    if (!guestInfo.password || guestInfo.password.length < 6) {
      return {
        isValid: false,
        isComplete: false,
        messages: {
          warning: "Password must be at least 6 characters long",
        },
        completionPercentage: 75,
      };
    }

    return {
      isValid: true,
      isComplete: true,
      messages: {
        success: `Account will be created for ${guestInfo.email}`,
      },
      completionPercentage: 100,
    };
  }

  return {
    isValid: true,
    isComplete: true,
    messages: {
      success: `Continuing as guest with ${guestInfo.email}`,
    },
    completionPercentage: 100,
  };
}
