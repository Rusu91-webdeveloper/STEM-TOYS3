"use client";

import React, { useState } from "react";
import { CheckoutStep, CheckoutData } from "../types";
import { ShippingAddressForm } from "./ShippingAddressForm";
import { ShippingMethodSelector } from "./ShippingMethodSelector";
import { PaymentForm } from "./PaymentForm";
import { OrderReview } from "./OrderReview";
import { CheckoutSummary } from "./CheckoutSummary";
import { EnhancedCheckoutStepper } from "./EnhancedCheckoutStepper";
import { createOrder } from "../lib/checkoutApi";
import { useRouter } from "next/navigation";
import { useCart } from "@/features/cart";
import { useTranslation } from "@/lib/i18n";
import { Shield, Award, ShieldCheck } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter as useNextRouter } from "next/navigation";
import { GuestInformationForm } from "./GuestInformationForm";

export function CheckoutFlow() {
  const router = useRouter();
  const nextRouter = useNextRouter();
  const { data: session } = useSession();
  const { cartItems, getCartTotal, clearCart } = useCart();
  const { t } = useTranslation();

  // Determine initial step based on authentication status
  const getInitialStep = (): CheckoutStep => {
    return session?.user ? "shipping-address" : "guest-info";
  };

  const [currentStep, setCurrentStep] =
    useState<CheckoutStep>(getInitialStep());
  const [checkoutData, setCheckoutData] = useState<CheckoutData>({
    billingAddressSameAsShipping: true,
    isGuestCheckout: !session?.user,
  });
  const [isProcessingOrder, setIsProcessingOrder] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);

  // **COUPON STATE MANAGEMENT**
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [discountAmount, setDiscountAmount] = useState(0);

  const updateCheckoutData = (data: Partial<CheckoutData>) => {
    setCheckoutData(prev => ({ ...prev, ...data }));
  };

  // **COUPON HANDLERS**
  const handleCouponApplied = (coupon: any, discountAmount: number) => {
    setAppliedCoupon(coupon);
    setDiscountAmount(discountAmount);
    console.log("Coupon applied in checkout:", coupon.code, discountAmount);
  };

  const handleCouponRemoved = () => {
    setAppliedCoupon(null);
    setDiscountAmount(0);
    console.log("Coupon removed from checkout");
  };

  const goToNextStep = () => {
    if (currentStep === "guest-info") setCurrentStep("shipping-address");
    else if (currentStep === "shipping-address")
      setCurrentStep("shipping-method");
    else if (currentStep === "shipping-method") setCurrentStep("payment");
    else if (currentStep === "payment") setCurrentStep("review");
  };

  const goToPreviousStep = () => {
    if (currentStep === "shipping-address") {
      setCurrentStep(session?.user ? "shipping-address" : "guest-info");
    } else if (currentStep === "shipping-method") {
      setCurrentStep("shipping-address");
    } else if (currentStep === "payment") {
      setCurrentStep("shipping-method");
    } else if (currentStep === "review") {
      setCurrentStep("payment");
    }
  };

  const goToStep = (step: CheckoutStep) => {
    // Only allow navigating to steps that come before the current step
    // or the next step if the current step is complete
    if (
      (step === "guest-info" && !session?.user) ||
      (step === "shipping-address" &&
        (session?.user || checkoutData.guestInformation?.email)) ||
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
          if (taxData.taxSettings && taxData.taxSettings.active) {
            taxRate = parseFloat(taxData.taxSettings.rate) / 100;
          }
        }
      } catch (error) {
        console.error("Error fetching tax settings:", error);
        // Continue with default tax rate
      }

      // Get initial shipping cost
      let shippingCost = checkoutData.shippingMethod?.price || 0;

      // Check for free shipping threshold
      try {
        const shippingSettings = await fetch("/api/checkout/shipping-settings");
        if (shippingSettings.ok) {
          const shippingData = await shippingSettings.json();
          if (shippingData.freeThreshold && shippingData.freeThreshold.active) {
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
        couponCode: appliedCoupon?.code || null,
        discountAmount: discountAmount || 0,
        items: cartItems.map(item => ({
          productId: item.productId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          isBook: item.isBook,
          selectedLanguage: item.selectedLanguage,
        })),
      };

      console.log("Creating order with coupon data:", {
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
        (error as Error).message ||
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

        {currentStep === "guest-info" && (
          <GuestInformationForm
            initialData={checkoutData.guestInformation}
            onSubmit={guestInfo => {
              updateCheckoutData({
                guestInformation: guestInfo,
                isGuestCheckout: true,
              });
              goToNextStep();
            }}
            onLoginRedirect={() => {
              nextRouter.push("/auth/login?callbackUrl=/checkout");
            }}
          />
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
          shippingCost={checkoutData.shippingMethod?.price || 0}
          appliedCoupon={appliedCoupon}
          onCouponApplied={handleCouponApplied}
          onCouponRemoved={handleCouponRemoved}
        />
      </div>
    </div>
  );
}
