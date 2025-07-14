"use client";

import { Shield, Award, ShieldCheck, Loader2 } from "lucide-react";
import { useRouter, useRouter as useNextRouter } from "next/navigation";
import React, { useState, useEffect } from "react";

import { useCart } from "@/features/cart";
import { useOptimizedSession } from "@/lib/auth/SessionContext";
import { useTranslation } from "@/lib/i18n";

import { createOrder } from "../lib/checkoutApi";
import { CheckoutStep, CheckoutData } from "../types";

import { CheckoutSummary } from "./CheckoutSummary";
import { EnhancedCheckoutStepper } from "./EnhancedCheckoutStepper";
import { OrderReview } from "./OrderReview";
import { PaymentForm } from "./PaymentForm";
import { ShippingAddressForm } from "./ShippingAddressForm";
import { ShippingMethodSelector } from "./ShippingMethodSelector";

export function CheckoutFlow() {
  const router = useRouter();
  const nextRouter = useNextRouter();
  const { data: session, status } = useOptimizedSession();
  const { cartItems, getCartTotal, clearCart, forceSyncWithServer } = useCart();
  const { t } = useTranslation();

  // Force sync cart data when checkout component mounts
  useEffect(() => {
    let isMounted = true;

    const syncCartData = async () => {
      try {
        console.warn("🔄 [CHECKOUT] Force syncing cart data on mount...");
        console.warn(
          `🔄 [CHECKOUT] Current cart items before sync: ${cartItems.length} items`
        );
        cartItems.forEach((item, index) => {
          console.warn(
            `   ${index + 1}. ${item.name} (qty: ${item.quantity}, id: ${item.id})`
          );
        });

        await forceSyncWithServer();

        if (isMounted) {
          console.warn("✅ [CHECKOUT] Cart data synced successfully");
          // Log final cart state after sync
          console.warn(
            `✅ [CHECKOUT] Final cart items after sync: ${cartItems.length} items`
          );
        }
      } catch (error) {
        console.error("❌ [CHECKOUT] Failed to sync cart data:", error);
        // Still show the error but don't block checkout if sync fails
        console.warn(
          "⚠️ [CHECKOUT] Continuing with checkout despite sync error"
        );
      }
    };

    // Only sync if we're not already loading and have session info
    // Also only sync once when component mounts or status changes, not when cartItems changes
    if (status !== "loading") {
      syncCartData();
    }

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, forceSyncWithServer]); // Don't include cartItems to prevent sync loops

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

  // **CART SYNCHRONIZATION** - Removed automatic sync to prevent infinite loops
  // The cart will sync naturally through normal user interactions

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
    console.warn("Coupon applied in checkout:", coupon.code, discountAmount);
  };

  const handleCouponRemoved = () => {
    setAppliedCoupon(null);
    setDiscountAmount(0);
    console.warn("Coupon removed from checkout");
  };

  const goToNextStep = () => {
    if (currentStep === "shipping-address") setCurrentStep("shipping-method");
    else if (currentStep === "shipping-method") setCurrentStep("payment");
    else if (currentStep === "payment") setCurrentStep("review");
  };

  const goToPreviousStep = () => {
    if (currentStep === "shipping-method") {
      setCurrentStep("shipping-address");
    } else if (currentStep === "payment") {
      setCurrentStep("shipping-method");
    } else if (currentStep === "review") {
      setCurrentStep("payment");
    }
    // Note: shipping-address is now the first step since authentication is required
  };

  const goToStep = (step: CheckoutStep) => {
    // Only allow navigating to steps that come before the current step
    // or the next step if the current step is complete
    // Authentication is required, so start from shipping-address
    if (
      (step === "shipping-address" && session?.user) ||
      (step === "shipping-method" && checkoutData.shippingAddress) ||
      (step === "payment" &&
        checkoutData.shippingAddress &&
        checkoutData.shippingMethod) ||
      (step === "review" &&
        checkoutData.shippingAddress &&
        checkoutData.shippingMethod &&
        checkoutData.paymentDetails)
    ) {
      setCurrentStep(step);
    }
  };

  // Update step based on session status - REQUIRE AUTHENTICATION FOR CHECKOUT
  useEffect(() => {
    if (status === "authenticated") {
      setCurrentStep("shipping-address");
      updateCheckoutData({ isGuestCheckout: false });
    } else if (status === "unauthenticated") {
      // Redirect unauthenticated users to login with checkout callback
      console.warn(
        "🚫 [CHECKOUT] User not authenticated, redirecting to login"
      );
      nextRouter.push("/auth/login?callbackUrl=/checkout");
    }
  }, [status, nextRouter]);

  const handlePlaceOrder = async () => {
    setIsProcessingOrder(true);
    setOrderError(null);

    try {
      // Calculate amounts
      const subtotal = getCartTotal();

      // Get tax settings from the store
      let taxRate = 0.1; // Default to 10%
      try {
        const taxSettings = await fetch("/api/checkout/tax-settings");
        if (taxSettings.ok) {
          const taxData = await taxSettings.json();
          if (taxData.taxSettings?.active) {
            taxRate = parseFloat(taxData.taxSettings.rate) / 100;
          }
        }
      } catch (error) {
        console.error("Error fetching tax settings:", error);
        // Continue with default tax rate
      }

      // Get initial shipping cost
      let shippingCost = checkoutData.shippingMethod?.price ?? 0;

      // Check for free shipping threshold
      try {
        const shippingSettings = await fetch("/api/checkout/shipping-settings");
        if (shippingSettings.ok) {
          const shippingData = await shippingSettings.json();
          if (shippingData.freeThreshold?.active) {
            const freeShippingThreshold = parseFloat(
              shippingData.freeThreshold.price
            );
            // Apply free shipping if subtotal meets threshold
            if (subtotal >= freeShippingThreshold) {
              shippingCost = 0;
            }
          }
        }
      } catch (error) {
        console.error("Error fetching shipping settings:", error);
        // Continue with original shipping cost
      }

      const tax = subtotal * taxRate;

      // **INCLUDE COUPON DATA IN ORDER**
      const totalBeforeDiscount = subtotal + tax + shippingCost;
      const total = Math.max(0, totalBeforeDiscount - discountAmount);

      // Create order data with financial information INCLUDING COUPON
      const orderData = {
        ...checkoutData,
        orderDate: new Date().toISOString(),
        status: "pending",
        subtotal,
        tax,
        shippingCost,
        total,
        // **COUPON FIELDS**
        couponCode: appliedCoupon?.code ?? null,
        discountAmount: discountAmount ?? 0,
        items: cartItems.map(item => ({
          productId: item.productId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          isBook: item.isBook,
          selectedLanguage: item.selectedLanguage,
        })),
      };

      console.warn("Creating order with coupon data:", {
        couponCode: orderData.couponCode,
        discountAmount: orderData.discountAmount,
        subtotal: orderData.subtotal,
        total: orderData.total,
      });

      // Create order in the database
      const result = await createOrder(orderData);

      if (!result) {
        throw new Error(t("failedToCreateOrder", "Failed to create order"));
      }

      // Clear the cart and coupon
      clearCart();
      setAppliedCoupon(null);
      setDiscountAmount(0);

      // Redirect to order confirmation page
      router.push(`/checkout/confirmation?orderId=${result.orderId}`);
    } catch (error) {
      setOrderError(
        (error as Error).message ??
          t(
            "orderProcessingError",
            "An error occurred while placing your order"
          )
      );
      setIsProcessingOrder(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="md:col-span-2 space-y-8">
        <EnhancedCheckoutStepper
          currentStep={currentStep}
          onStepClick={goToStep}
          checkoutData={checkoutData}
        />

        {currentStep === "loading" && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />
          </div>
        )}

        {currentStep === "shipping-address" && (
          <ShippingAddressForm
            initialData={checkoutData.shippingAddress}
            onSubmit={address => {
              updateCheckoutData({ shippingAddress: address });
              goToNextStep();
            }}
          />
        )}

        {currentStep === "shipping-method" && (
          <ShippingMethodSelector
            initialMethod={checkoutData.shippingMethod}
            onSubmit={method => {
              updateCheckoutData({ shippingMethod: method });
              goToNextStep();
            }}
            onBack={goToPreviousStep}
          />
        )}

        {currentStep === "payment" && (
          <div>
            <div className="trust-badges flex justify-center space-x-6 mb-6 py-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border">
              <div className="flex items-center space-x-2 text-green-700">
                <Shield className="h-6 w-6" />
                <span className="text-sm font-medium">Secure Payment</span>
              </div>
              <div className="flex items-center space-x-2 text-blue-700">
                <Award className="h-6 w-6" />
                <span className="text-sm font-medium">
                  Money-Back Guarantee
                </span>
              </div>
              <div className="flex items-center space-x-2 text-indigo-700">
                <ShieldCheck className="h-6 w-6" />
                <span className="text-sm font-medium">Trusted Seller</span>
              </div>
            </div>
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
              onSubmit={paymentData => {
                updateCheckoutData(paymentData);
                goToNextStep();
              }}
              onBack={goToPreviousStep}
            />
          </div>
        )}

        {currentStep === "review" && (
          <OrderReview
            checkoutData={checkoutData}
            appliedCoupon={appliedCoupon}
            discountAmount={discountAmount}
            onEditStep={goToStep}
            onBack={goToPreviousStep}
            onPlaceOrder={handlePlaceOrder}
            isProcessingOrder={isProcessingOrder}
            orderError={orderError}
          />
        )}
      </div>

      <div className="md:col-span-1">
        <CheckoutSummary
          shippingCost={checkoutData.shippingMethod?.price ?? 0}
          appliedCoupon={appliedCoupon}
          onCouponApplied={handleCouponApplied}
          onCouponRemoved={handleCouponRemoved}
        />
      </div>
    </div>
  );
}
