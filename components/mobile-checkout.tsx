"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useTouchGestures } from "@/lib/touch-interactions";
import {
  ChevronLeft,
  ChevronRight,
  Check,
  CreditCard,
  MapPin,
  Package,
  Shield,
  AlertCircle,
  Eye,
  EyeOff,
} from "lucide-react";

// Checkout step types
type CheckoutStep = "cart" | "shipping" | "payment" | "review" | "confirmation";

interface CheckoutStepData {
  id: CheckoutStep;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  completed: boolean;
}

interface MobileCheckoutProps {
  initialStep?: CheckoutStep;
  onStepChange?: (step: CheckoutStep) => void;
  onComplete?: () => void;
}

// Step definitions
const checkoutSteps: CheckoutStepData[] = [
  { id: "cart", title: "Cart", icon: Package, completed: false },
  { id: "shipping", title: "Shipping", icon: MapPin, completed: false },
  { id: "payment", title: "Payment", icon: CreditCard, completed: false },
  { id: "review", title: "Review", icon: Eye, completed: false },
  { id: "confirmation", title: "Complete", icon: Check, completed: false },
];

// Mobile Checkout Progress Bar
function MobileCheckoutProgress({
  currentStep,
  steps,
}: {
  currentStep: CheckoutStep;
  steps: CheckoutStepData[];
}) {
  const currentIndex = steps.findIndex(step => step.id === currentStep);
  const progress = ((currentIndex + 1) / steps.length) * 100;

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-3">
      {/* Progress bar */}
      <div className="mb-3">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>
            Step {currentIndex + 1} of {steps.length}
          </span>
          <span>{Math.round(progress)}% Complete</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Current step info */}
      <div className="flex items-center">
        <div className="flex items-center justify-center w-8 h-8 bg-primary text-primary-foreground rounded-full mr-3">
          {React.createElement(steps[currentIndex].icon, {
            className: "w-4 h-4",
          })}
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            {steps[currentIndex].title}
          </h2>
          <p className="text-sm text-gray-500">
            Complete your information below
          </p>
        </div>
      </div>
    </div>
  );
}

// Mobile Checkout Navigation
function MobileCheckoutNavigation({
  currentStep,
  onPrevious,
  onNext,
  canGoNext = false,
  isLoading = false,
}: {
  currentStep: CheckoutStep;
  onPrevious: () => void;
  onNext: () => void;
  canGoNext?: boolean;
  isLoading?: boolean;
}) {
  const isFirstStep = currentStep === "cart";
  const isLastStep = currentStep === "confirmation";

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-50">
      <div className="flex gap-3">
        {!isFirstStep && (
          <button
            onClick={onPrevious}
            className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium min-h-[48px] hover:bg-gray-50 transition-colors"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back
          </button>
        )}

        <button
          onClick={onNext}
          disabled={!canGoNext || isLoading}
          className={cn(
            "flex-1 flex items-center justify-center px-4 py-3 rounded-lg font-medium min-h-[48px] transition-all",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            canGoNext && !isLoading
              ? "bg-primary text-primary-foreground hover:bg-primary/90 active:scale-98"
              : "bg-gray-300 text-gray-500"
          )}
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              {isLastStep ? "Complete Order" : "Continue"}
              {!isLastStep && <ChevronRight className="w-4 h-4 ml-1" />}
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// Mobile Form Input Component
function MobileInput({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  required = false,
  error,
  icon: Icon,
  showPasswordToggle = false,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  icon?: React.ComponentType<{ className?: string }>;
  showPasswordToggle?: boolean;
}) {
  const [showPassword, setShowPassword] = useState(false);
  const inputType = showPasswordToggle
    ? showPassword
      ? "text"
      : "password"
    : type;

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        )}

        <input
          type={inputType}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className={cn(
            "w-full px-4 py-3 border rounded-lg text-base",
            "min-h-[48px] transition-colors",
            Icon ? "pl-12" : "pl-4",
            showPasswordToggle ? "pr-12" : "pr-4",
            error
              ? "border-red-300 focus:border-red-500 focus:ring-red-500"
              : "border-gray-300 focus:border-primary focus:ring-primary",
            "focus:ring-2 focus:ring-offset-0"
          )}
        />

        {showPasswordToggle && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showPassword ? (
              <EyeOff className="w-5 h-5" />
            ) : (
              <Eye className="w-5 h-5" />
            )}
          </button>
        )}
      </div>

      {error && (
        <p className="mt-2 text-sm text-red-600 flex items-center">
          <AlertCircle className="w-4 h-4 mr-1" />
          {error}
        </p>
      )}
    </div>
  );
}

// Shipping Step Component
function ShippingStep({
  onNext,
  canProceed,
}: {
  onNext: () => void;
  canProceed: (valid: boolean) => void;
}) {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    zipCode: "",
    country: "US",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim())
      newErrors.firstName = "First name is required";
    if (!formData.lastName.trim()) newErrors.lastName = "Last name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    if (!formData.phone.trim()) newErrors.phone = "Phone number is required";
    if (!formData.address.trim()) newErrors.address = "Address is required";
    if (!formData.city.trim()) newErrors.city = "City is required";
    if (!formData.zipCode.trim()) newErrors.zipCode = "ZIP code is required";

    setErrors(newErrors);
    const isValid = Object.keys(newErrors).length === 0;
    canProceed(isValid);
    return isValid;
  };

  useEffect(() => {
    validateForm();
  }, [formData]);

  return (
    <div className="p-4 pb-24">
      <div className="space-y-1">
        <div className="grid grid-cols-2 gap-3">
          <MobileInput
            label="First Name"
            value={formData.firstName}
            onChange={value =>
              setFormData(prev => ({ ...prev, firstName: value }))
            }
            required
            error={errors.firstName}
          />
          <MobileInput
            label="Last Name"
            value={formData.lastName}
            onChange={value =>
              setFormData(prev => ({ ...prev, lastName: value }))
            }
            required
            error={errors.lastName}
          />
        </div>

        <MobileInput
          label="Email"
          type="email"
          value={formData.email}
          onChange={value => setFormData(prev => ({ ...prev, email: value }))}
          required
          error={errors.email}
        />

        <MobileInput
          label="Phone"
          type="tel"
          value={formData.phone}
          onChange={value => setFormData(prev => ({ ...prev, phone: value }))}
          required
          error={errors.phone}
        />

        <MobileInput
          label="Address"
          value={formData.address}
          onChange={value => setFormData(prev => ({ ...prev, address: value }))}
          required
          error={errors.address}
          icon={MapPin}
        />

        <div className="grid grid-cols-2 gap-3">
          <MobileInput
            label="City"
            value={formData.city}
            onChange={value => setFormData(prev => ({ ...prev, city: value }))}
            required
            error={errors.city}
          />
          <MobileInput
            label="ZIP Code"
            value={formData.zipCode}
            onChange={value =>
              setFormData(prev => ({ ...prev, zipCode: value }))
            }
            required
            error={errors.zipCode}
          />
        </div>
      </div>
    </div>
  );
}

// Payment Step Component
function PaymentStep({
  onNext,
  canProceed,
}: {
  onNext: () => void;
  canProceed: (valid: boolean) => void;
}) {
  const [formData, setFormData] = useState({
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    cardholderName: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.cardNumber.trim())
      newErrors.cardNumber = "Card number is required";
    if (!formData.expiryDate.trim())
      newErrors.expiryDate = "Expiry date is required";
    if (!formData.cvv.trim()) newErrors.cvv = "CVV is required";
    if (!formData.cardholderName.trim())
      newErrors.cardholderName = "Cardholder name is required";

    setErrors(newErrors);
    const isValid = Object.keys(newErrors).length === 0;
    canProceed(isValid);
    return isValid;
  };

  useEffect(() => {
    validateForm();
  }, [formData]);

  return (
    <div className="p-4 pb-24">
      <div className="space-y-1">
        <MobileInput
          label="Card Number"
          value={formData.cardNumber}
          onChange={value =>
            setFormData(prev => ({ ...prev, cardNumber: value }))
          }
          placeholder="1234 5678 9012 3456"
          required
          error={errors.cardNumber}
          icon={CreditCard}
        />

        <div className="grid grid-cols-2 gap-3">
          <MobileInput
            label="Expiry Date"
            value={formData.expiryDate}
            onChange={value =>
              setFormData(prev => ({ ...prev, expiryDate: value }))
            }
            placeholder="MM/YY"
            required
            error={errors.expiryDate}
          />
          <MobileInput
            label="CVV"
            value={formData.cvv}
            onChange={value => setFormData(prev => ({ ...prev, cvv: value }))}
            placeholder="123"
            required
            error={errors.cvv}
            showPasswordToggle
          />
        </div>

        <MobileInput
          label="Cardholder Name"
          value={formData.cardholderName}
          onChange={value =>
            setFormData(prev => ({ ...prev, cardholderName: value }))
          }
          required
          error={errors.cardholderName}
        />

        {/* Security notice */}
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start">
            <Shield className="w-5 h-5 text-green-600 mr-2 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-green-800">
                Secure Payment
              </h4>
              <p className="text-sm text-green-700 mt-1">
                Your payment information is encrypted and secure. We never store
                your card details.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main Mobile Checkout Component
export function MobileCheckout({
  initialStep = "cart",
  onStepChange,
  onComplete,
}: MobileCheckoutProps) {
  const [currentStep, setCurrentStep] = useState<CheckoutStep>(initialStep);
  const [canProceed, setCanProceed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<Set<CheckoutStep>>(
    new Set()
  );

  const steps = checkoutSteps.map(step => ({
    ...step,
    completed: completedSteps.has(step.id),
  }));

  const currentStepIndex = steps.findIndex(step => step.id === currentStep);

  const handleNext = async () => {
    setIsLoading(true);

    // Mark current step as completed
    setCompletedSteps(prev => new Set([...prev, currentStep]));

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      const nextStep = steps[nextIndex].id;
      setCurrentStep(nextStep);
      onStepChange?.(nextStep);
      setCanProceed(false);
    } else {
      onComplete?.();
    }

    setIsLoading(false);
  };

  const handlePrevious = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      const prevStep = steps[prevIndex].id;
      setCurrentStep(prevStep);
      onStepChange?.(prevStep);
      setCanProceed(true);
    }
  };

  // Handle swipe gestures
  const swipeRef = useTouchGestures({
    onSwipe: direction => {
      if (direction === "right" && currentStepIndex > 0) {
        handlePrevious();
      } else if (
        direction === "left" &&
        canProceed &&
        currentStepIndex < steps.length - 1
      ) {
        handleNext();
      }
    },
  }) as React.RefObject<HTMLDivElement>;

  const renderStepContent = () => {
    switch (currentStep) {
      case "shipping":
        return <ShippingStep onNext={handleNext} canProceed={setCanProceed} />;
      case "payment":
        return <PaymentStep onNext={handleNext} canProceed={setCanProceed} />;
      default:
        return (
          <div className="p-4 pb-24">
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {steps[currentStepIndex].title} Step
              </h3>
              <p className="text-gray-600">
                Step content for {steps[currentStepIndex].title.toLowerCase()}{" "}
                goes here.
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <div ref={swipeRef} className="min-h-screen bg-gray-50">
      {/* Progress Bar */}
      <MobileCheckoutProgress currentStep={currentStep} steps={steps} />

      {/* Step Content */}
      <div className="flex-1">{renderStepContent()}</div>

      {/* Navigation */}
      <MobileCheckoutNavigation
        currentStep={currentStep}
        onPrevious={handlePrevious}
        onNext={handleNext}
        canGoNext={canProceed}
        isLoading={isLoading}
      />
    </div>
  );
}

export default MobileCheckout;
