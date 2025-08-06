"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";

import { useCart } from "@/features/cart/context/CartContext";
import { useOptimizedSession } from "@/lib/auth/SessionContext";
import { useTranslation } from "@/lib/i18n";

import { createOrder } from "../lib/checkoutApi";
import { CheckoutSummary } from "./CheckoutSummary";
import { EnhancedCheckoutStepper } from "./EnhancedCheckoutStepper";
import { OrderReview } from "./OrderReview";
import { PaymentForm } from "./PaymentForm";
import { ShippingAddressForm } from "./ShippingAddressForm";
import { ShippingMethodSelector } from "./ShippingMethodSelector";
import { CheckoutData, CheckoutStep } from "../types";

export function CheckoutFlow() {
  const router = useRouter();
  const { data: session, status } = useOptimizedSession();
  const { cartItems, getCartTotal, clearCart } = useCart();
  const { t } = useTranslation();

  // Removed the forceSyncWithServer call that was causing excessive API requests
  // The cart should already be properly synced when the user reaches checkout
  // If there are any sync issues, they should be handled at the cart level, not during checkout

  const [currentStep, setCurrentStep] = useState<CheckoutStep>("loading");
  const [checkoutData, setCheckoutData] = useState<CheckoutData>({
    billingAddressSameAsShipping: true,
    isGuestCheckout: false, // Authentication is required, so never guest checkout
  });
  const [isProcessingOrder, setIsProcessingOrder] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);

  // **COUPON STATE MANAGEMENT**
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    type: string;
    value: number;
  } | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);

  const updateCheckoutData = (data: Partial<CheckoutData>) => {
    setCheckoutData(prev => ({ ...prev, ...data }));
  };

  // **COUPON HANDLERS**
  const handleCouponApplied = (
    coupon: { code: string; type: string; value: number },
    discountAmount: number
  ) => {
    setAppliedCoupon(coupon);
    setDiscountAmount(discountAmount);
  };

  const handleCouponRemoved = () => {
    setAppliedCoupon(null);
    setDiscountAmount(0);
  };

  const goToStep = (step: CheckoutStep) => {
    setCurrentStep(step);
  };

  // Initialize checkout step based on cart state
  useEffect(() => {
    if (status === "loading") {
      setCurrentStep("loading");
      return;
    }

    if (!session?.user) {
      setCurrentStep("loading");
      return;
    }

    if (cartItems.length === 0) {
      // Redirect to products if cart is empty
      router.push("/products");
      return;
    }

    // Start with shipping-address step
    setCurrentStep("shipping-address");
  }, [status, session, cartItems.length, router]);

  const handlePlaceOrder = async () => {
    if (cartItems.length === 0) {
      setOrderError(t("cartEmpty", "Your cart is empty"));
      return;
    }

    setIsProcessingOrder(true);
    setOrderError(null);

    try {
      // Get tax settings from database
      let taxRate = 0.21; // Default 21% VAT
      try {
        const response = await fetch("/api/checkout/tax-settings");
        if (response.ok) {
          const taxSettings = await response.json();
          if (taxSettings.active) {
            taxRate = parseFloat(taxSettings.rate) / 100;
          }
        }
      } catch (error) {
        console.warn("Failed to fetch tax settings, using default:", error);
      }

      // Calculate proper total including tax and shipping
      const subtotal = getCartTotal();
      const shippingCost = checkoutData.shippingMethod?.price ?? 0;
      const tax = subtotal * taxRate;
      const total = subtotal + tax + shippingCost - discountAmount;

      const orderData = {
        items: cartItems,
        shippingAddress: checkoutData.shippingAddress!,
        billingAddress: checkoutData.billingAddressSameAsShipping
          ? checkoutData.shippingAddress!
          : checkoutData.billingAddress!,
        shippingMethod: checkoutData.shippingMethod!,
        paymentMethod: checkoutData.paymentMethod!,
        coupon: appliedCoupon,
        discountAmount,
        subtotal,
        tax,
        shippingCost,
        total,
      };

      const order = await createOrder(orderData);

      if (order) {
        // Clear cart after successful order
        await clearCart();

        // Redirect to confirmation page
        router.push(`/checkout/confirmation?orderId=${order.id}`);
      }
    } catch (error) {
      console.error("Order creation failed:", error);
      setOrderError(
        error instanceof Error
          ? error.message
          : t("orderError", "Failed to create order. Please try again.")
      );
    } finally {
      setIsProcessingOrder(false);
    }
  };

  // Show loading state
  if (currentStep === "loading" || status === "loading") {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mb-4" />
        <p className="text-indigo-600 text-lg font-medium">
          {t("loading", "Loading checkout...")}
        </p>
      </div>
    );
  }

  // Show error if no session
  if (!session?.user) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-red-600 text-lg font-medium">
          {t("loginRequired", "Please log in to continue with checkout")}
        </p>
      </div>
    );
  }

  // Show error if cart is empty
  if (cartItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-red-600 text-lg font-medium">
          {t("cartEmpty", "Your cart is empty")}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Main Checkout Flow */}
      <div className="lg:col-span-2">
        <EnhancedCheckoutStepper
          currentStep={currentStep}
          checkoutData={checkoutData}
        />

        {/* Step Content */}
        <div className="mt-8">
          {currentStep === "shipping-address" && (
            <div className="space-y-6">
              <ShippingAddressForm
                initialData={checkoutData.shippingAddress}
                onSubmit={address => {
                  updateCheckoutData({ shippingAddress: address });
                  setCurrentStep("shipping-method");
                }}
              />
            </div>
          )}

          {currentStep === "shipping-method" && (
            <div className="space-y-6">
              <ShippingMethodSelector
                initialMethod={checkoutData.shippingMethod}
                onSubmit={method => {
                  updateCheckoutData({ shippingMethod: method });
                  setCurrentStep("payment");
                }}
                onBack={() => setCurrentStep("shipping-address")}
              />
            </div>
          )}

          {currentStep === "payment" && (
            <div className="space-y-6">
              <PaymentForm
                initialData={checkoutData.paymentDetails}
                billingAddressSameAsShipping={
                  checkoutData.billingAddressSameAsShipping
                }
                shippingAddress={checkoutData.shippingAddress}
                billingAddress={checkoutData.billingAddress}
                shippingMethod={checkoutData.shippingMethod}
                appliedCoupon={appliedCoupon}
                discountAmount={discountAmount}
                onSubmit={data => {
                  updateCheckoutData(data);
                  setCurrentStep("review");
                }}
                onBack={() => setCurrentStep("shipping-method")}
              />
            </div>
          )}

          {currentStep === "review" && (
            <OrderReview
              checkoutData={checkoutData}
              onEditStep={goToStep}
              onBack={() => setCurrentStep("payment")}
              onPlaceOrder={handlePlaceOrder}
              isProcessingOrder={isProcessingOrder}
              orderError={orderError}
              appliedCoupon={appliedCoupon}
              discountAmount={discountAmount}
            />
          )}
        </div>
      </div>

      {/* Checkout Summary Sidebar */}
      <div className="lg:col-span-1">
        <CheckoutSummary
          onCouponApplied={handleCouponApplied}
          shippingCost={checkoutData.shippingMethod?.price ?? 0}
          appliedCoupon={appliedCoupon}
          onCouponRemoved={handleCouponRemoved}
        />
      </div>
    </div>
  );
}
