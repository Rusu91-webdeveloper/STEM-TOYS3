"use client";

import { Loader2 } from "lucide-react";
import React, { Suspense, lazy } from "react";

interface LazyCheckoutStepProps {
  step: "shipping-address" | "shipping-method" | "payment" | "review";
  [key: string]: any;
}

// Lazy load checkout step components
const ShippingAddressForm = lazy(() =>
  import("./ShippingAddressForm").then(module => ({
    default: module.ShippingAddressForm,
  }))
);

const ShippingMethodSelector = lazy(() =>
  import("./ShippingMethodSelector").then(module => ({
    default: module.ShippingMethodSelector,
  }))
);

const PaymentForm = lazy(() =>
  import("./PaymentForm").then(module => ({
    default: module.PaymentForm,
  }))
);

const OrderReview = lazy(() =>
  import("./OrderReview").then(module => ({
    default: module.OrderReview,
  }))
);

// Loading fallback component
function CheckoutStepSkeleton() {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mb-4" />
      <p className="text-indigo-600 text-sm font-medium">
        Loading checkout step...
      </p>
    </div>
  );
}

export function LazyCheckoutStep({ step, ...props }: LazyCheckoutStepProps) {
  const getStepComponent = () => {
    switch (step) {
      case "shipping-address":
        return <ShippingAddressForm {...props} />;
      case "shipping-method":
        return <ShippingMethodSelector {...props} />;
      case "payment":
        return <PaymentForm {...props} />;
      case "review":
        return <OrderReview {...props} />;
      default:
        throw new Error(`Unknown checkout step: ${step}`);
    }
  };

  return (
    <Suspense fallback={<CheckoutStepSkeleton />}>
      {getStepComponent()}
    </Suspense>
  );
}
