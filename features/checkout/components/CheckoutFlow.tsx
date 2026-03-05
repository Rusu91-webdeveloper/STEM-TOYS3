"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useState, useEffect, useRef } from "react";

import { toast } from "@/components/ui/use-toast";
import { useCart } from "@/features/cart/context/CartContext";
import { useOptimizedSession } from "@/lib/auth/SessionContext";
import { useTranslation } from "@/lib/i18n";
import { checkFreeShipping } from "@/lib/shipping/shipping-price-resolver";

import { useCheckoutSettings } from "../hooks/useCheckoutSettings";
import { createOrder } from "../lib/checkoutApi";
import { CheckoutData, CheckoutStep } from "../types";

import { CheckoutSummary } from "./CheckoutSummary";
import { EnhancedCheckoutStepper } from "./EnhancedCheckoutStepper";
import { OrderReview } from "./OrderReview";
import { PaymentForm } from "./PaymentForm";
import { ShippingAddressForm } from "./ShippingAddressForm";
import { ShippingMethodSelector } from "./ShippingMethodSelector";

export function CheckoutFlow() {
  const router = useRouter();
  const { data: session, status } = useOptimizedSession();
  const { cartItems, getCartTotal, clearCart } = useCart();
  const { t } = useTranslation();
  const { settings } = useCheckoutSettings();

  // Removed the forceSyncWithServer call that was causing excessive API requests
  // The cart should already be properly synced when the user reaches checkout
  // If there are any sync issues, they should be handled at the cart level, not during checkout

  const [currentStep, setCurrentStep] = useState<CheckoutStep>("loading");
  const [checkoutData, setCheckoutData] = useState<CheckoutData>({
    billingAddressSameAsShipping: true,
  });
  const [isProcessingOrder, setIsProcessingOrder] = useState(false);
  const [orderError, setOrderError] = useState<unknown>(null);
  const [redirectToConfirmation, setRedirectToConfirmation] = useState<
    string | null
  >(null);

  // **COUPON STATE MANAGEMENT**
  const [appliedCoupon, setAppliedCoupon] = useState<{
    id?: string;
    code: string;
    name?: string;
    description?: string;
    type: "PERCENTAGE" | "FIXED_AMOUNT";
    value: number;
    discountAmount: number;
    isInfluencer?: boolean;
    influencerName?: string;
  } | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const hasPhysicalItems = cartItems.some(item => item.isBook !== true);

  const computeShippingCost = () => {
    if (!hasPhysicalItems) {
      return 0;
    }

    const isMixedSupplierCart =
      checkoutData.shippingMethod?.isMixedSupplierCart === true;
    const mixedSupplierSurcharge = Math.max(
      0,
      checkoutData.shippingMethod?.mixedSupplierSurcharge || 0
    );

    // Check free shipping threshold FIRST - this is the key fix!
    const cartSubtotal = getCartTotal();
    if (checkFreeShipping(cartSubtotal, settings?.shippingSettings)) {
      return isMixedSupplierCart ? mixedSupplierSurcharge : 0;
    }

    const deliveryPrice = settings?.shippingSettings?.deliveryPrice?.active
      ? parseFloat(settings.shippingSettings.deliveryPrice.price || "15.00")
      : 15.0;

    return checkoutData.shippingMethod?.price ?? deliveryPrice;
  };

  const updateCheckoutData = (data: Partial<CheckoutData>) => {
    setCheckoutData(prev => ({ ...prev, ...data }));
  };

  // **COUPON HANDLERS**
  const handleCouponApplied = (
    coupon: {
      id?: string;
      code: string;
      name?: string;
      description?: string;
      type: "PERCENTAGE" | "FIXED_AMOUNT";
      value: number;
      discountAmount: number;
      isInfluencer?: boolean;
      influencerName?: string;
    },
    discountAmount: number
  ) => {
    setAppliedCoupon({ ...coupon, discountAmount });
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

    // Check if we're coming from a successful order completion FIRST
    const orderCompleted = sessionStorage.getItem("orderCompleted");
    const orderId = sessionStorage.getItem("orderId");

    if (orderCompleted === "true" && orderId) {
      // User just completed an order, redirect to confirmation
      sessionStorage.removeItem("orderCompleted");
      sessionStorage.removeItem("orderId");
      setRedirectToConfirmation(orderId);
      return;
    }

    // Only redirect to products if cart is empty AND we're not coming from order completion
    if (cartItems.length === 0) {
      router.push("/products");
      return;
    }

    // Start with shipping-address step
    setCurrentStep("shipping-address");
  }, [status, session, cartItems.length, router]);

  // Helper function to calculate discount amount locally
  const calculateDiscountAmount = (
    coupon: { type: string; value: number },
    cartTotal: number
  ): number => {
    if (coupon.type === "PERCENTAGE") {
      return Math.round(((cartTotal * coupon.value) / 100) * 100) / 100;
    }
    return Math.min(coupon.value, cartTotal);
  };

  // Automatically fetch and apply welcome discount for new users
  useEffect(() => {
    // Only fetch if user is authenticated, cart has items, and no discount is already applied
    if (
      status !== "authenticated" ||
      !session?.user ||
      cartItems.length === 0 ||
      appliedCoupon !== null
    ) {
      return;
    }

    const fetchAutoDiscount = async () => {
      try {
        const cartTotal = getCartTotal();
        if (cartTotal <= 0) return;

        const response = await fetch(
          `/api/checkout/auto-discount?cartTotal=${cartTotal}`
        );

        if (!response.ok) {
          console.warn("Failed to fetch auto discount:", response.statusText);
          return;
        }

        const data = await response.json();

        if (data.eligible && data.discount) {
          // Automatically apply the welcome discount
          setAppliedCoupon({
            id: data.discount.coupon.id,
            code: data.discount.coupon.code,
            name: data.discount.coupon.name,
            description: data.discount.coupon.description,
            type: data.discount.coupon.type as "PERCENTAGE" | "FIXED_AMOUNT",
            value: data.discount.coupon.value,
            discountAmount: data.discount.discountAmount,
            isInfluencer: false,
          });
          setDiscountAmount(data.discount.discountAmount);

          // Show a toast notification to inform the user
          toast({
            title: t("discountApplied", "Discount Applied!"),
            description: t(
              "welcomeDiscountApplied",
              "You've received a {percentage}% welcome discount on your first order!",
              { percentage: data.discount.coupon.value }
            ),
            variant: "default",
          });
        }
      } catch (error) {
        console.error("Error fetching auto discount:", error);
        // Silently fail - don't show error to user as this is an automatic feature
      }
    };

    fetchAutoDiscount();
  }, [status, session, cartItems.length, getCartTotal, appliedCoupon, t]);

  // Track previous cart total to avoid unnecessary recalculations
  const prevCartTotalRef = useRef<number>(0);

  // Recalculate discount amount when cart total changes (for auto-applied discounts)
  useEffect(() => {
    // Only recalculate if we have an applied coupon (auto-applied welcome discount)
    if (!appliedCoupon || cartItems.length === 0) {
      prevCartTotalRef.current = 0;
      return;
    }

    const cartTotal = getCartTotal();

    // Skip if cart total hasn't changed significantly
    if (Math.abs(cartTotal - prevCartTotalRef.current) < 0.01) {
      return;
    }

    prevCartTotalRef.current = cartTotal;

    if (cartTotal <= 0) {
      setDiscountAmount(0);
      setAppliedCoupon({ ...appliedCoupon, discountAmount: 0 });
      return;
    }

    // Recalculate discount amount based on current cart total
    const newDiscountAmount = calculateDiscountAmount(appliedCoupon, cartTotal);
    setDiscountAmount(newDiscountAmount);
    // Update the discountAmount in the appliedCoupon object as well
    setAppliedCoupon({ ...appliedCoupon, discountAmount: newDiscountAmount });
  }, [getCartTotal, cartItems.length, appliedCoupon]);

  // Handle redirect to confirmation page
  useEffect(() => {
    if (redirectToConfirmation) {
      router.push(`/checkout/confirmation?orderId=${redirectToConfirmation}`);
      setRedirectToConfirmation(null);
    }
  }, [redirectToConfirmation, router]);

  const handlePlaceOrder = async () => {
    if (cartItems.length === 0) {
      setOrderError(t("cartEmpty", "Your cart is empty"));
      return;
    }

    setIsProcessingOrder(true);
    setOrderError(null);

    try {
      // Check payment method type
      const isNetopiaPayment =
        checkoutData.paymentMethod?.startsWith("netopia_");
      const isCODPayment = checkoutData.paymentMethod === "cash_on_delivery";

      if (isNetopiaPayment) {
        // For Netopia payments: Create order first, then initiate payment
        await handleNetopiaPayment();
      } else if (isCODPayment) {
        // For COD payments: Create order with COD status
        await handleCODPayment();
      } else {
        // For other payment methods: Create order directly
        await handleRegularOrder();
      }
    } catch (error) {
      console.error("Order creation failed:", error);
      setOrderError(error);
      setIsProcessingOrder(false);
    }
  };

  const handleNetopiaPayment = async () => {
    try {
      // Get tax settings from database
      let taxRate = 0;
      let includeInPrice = false;
      let isTaxEnabled = false;
      try {
        const response = await fetch("/api/checkout/tax-settings");
        if (response.ok) {
          const taxData = await response.json();
          if (taxData.taxSettings?.active) {
            isTaxEnabled = true;
            taxRate = parseFloat(taxData.taxSettings.rate || "21") / 100;
            includeInPrice = taxData.taxSettings.includeInPrice !== false;
          }
        }
      } catch (error) {
        console.warn("Failed to fetch tax settings, using default:", error);
      }

      // Calculate proper total
      const cartTotalIncludingVAT = getCartTotal();
      const shippingCost = computeShippingCost();

      // Calculate tax based on settings
      let subtotalExcludingVAT: number;
      let tax: number;

      if (isTaxEnabled && includeInPrice) {
        // Tax is included in prices - calculate backwards
        subtotalExcludingVAT = cartTotalIncludingVAT / (1 + taxRate);
        tax = cartTotalIncludingVAT - subtotalExcludingVAT;
      } else if (isTaxEnabled && !includeInPrice) {
        // Tax is not included - add it to subtotal
        subtotalExcludingVAT = cartTotalIncludingVAT;
        tax = subtotalExcludingVAT * taxRate;
      } else {
        // Tax is disabled - no VAT calculation
        subtotalExcludingVAT = cartTotalIncludingVAT;
        tax = 0;
      }
      const total = cartTotalIncludingVAT + shippingCost - discountAmount;

      // Prepare order data for Netopia - create with pending payment status
      const orderData = {
        items: cartItems,
        shippingAddress: checkoutData.shippingAddress!,
        billingAddress: checkoutData.billingAddressSameAsShipping
          ? checkoutData.shippingAddress!
          : checkoutData.billingAddress!,
        shippingMethod: checkoutData.shippingMethod!,
        lockerId: checkoutData.lockerId,
        lockerAddressSnapshot: checkoutData.lockerAddressSnapshot,
        paymentMethod: checkoutData.paymentMethod!,
        couponCode: appliedCoupon?.code || null,
        discountAmount,
        subtotal: subtotalExcludingVAT,
        tax,
        shippingCost,
        total,
        // Mark as Netopia payment - order will be created with pending status
        paymentProvider: "netopia",
        paymentStatus: "PENDING",
      };

      // Create order first (will be in pending payment status)
      const order = await createOrder(orderData);

      if (order?.success) {
        // Store order ID for Netopia callback
        sessionStorage.setItem("pendingOrderId", order.orderId);
        sessionStorage.setItem(
          "pendingPaymentMethod",
          checkoutData.paymentMethod!
        );
        sessionStorage.setItem("pendingPaymentProvider", "netopia");

        // Now initiate Netopia payment with the order ID
        const netopiaData = {
          orderId: order.orderId,
          amount: total,
          currency: "RON",
          customerData: {
            name: orderData.billingAddress.fullName,
            email: session?.user?.email || "",
            phone: orderData.billingAddress.phone,
          },
          paymentMethod: checkoutData.paymentMethod,
        };

        console.log("🚀 [CHECKOUT] Initiating Netopia payment...");
        console.log("   Order ID:", order.orderId);
        console.log("   Amount:", total, "RON");

        const response = await fetch("/api/payments/netopia/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(netopiaData),
        });

        if (response.ok) {
          const paymentResult = await response.json();
          console.log(
            "✅ [CHECKOUT] Payment URL received:",
            paymentResult.paymentUrl
          );

          if (paymentResult.paymentUrl) {
            // Clear cart before redirect
            await clearCart();

            console.log("🔄 [CHECKOUT] Redirecting to Netopia payment page...");
            // Redirect to Netopia payment page
            window.location.href = paymentResult.paymentUrl;
            return;
          }
          console.error("❌ [CHECKOUT] No payment URL in response");
          throw new Error("Netopia did not return a payment URL");
        } else {
          const errorData = await response.json().catch(() => ({}));
          console.error("❌ [CHECKOUT] Payment creation failed:");
          console.error("   Status:", response.status);
          console.error("   Error:", errorData.error || "Unknown error");
          console.error(
            "   Details:",
            errorData.details || "No details provided"
          );

          throw new Error(
            errorData.details ||
              errorData.error ||
              "Failed to create Netopia payment. Please check your payment settings."
          );
        }
      }
    } catch (error) {
      console.error("❌ [CHECKOUT] Netopia payment failed:", error);

      // Provide user-friendly error message
      const userMessage =
        error instanceof Error
          ? error.message
          : "Failed to initiate Netopia payment. Please try again or contact support.";

      setOrderError(new Error(userMessage));
      throw error;
    } finally {
      setIsProcessingOrder(false);
    }
  };

  const handleCODPayment = async () => {
    try {
      if (
        checkoutData.codConsentAccepted !== true ||
        !checkoutData.codConsentAcceptedAt ||
        !checkoutData.codConsentVersion ||
        !checkoutData.codConsentText ||
        !checkoutData.codGuaranteePaymentIntentId ||
        !checkoutData.codGuaranteeAmount
      ) {
        throw new Error(
          t(
            "codConsentMissing",
            "Pentru plata ramburs trebuie să accepți condițiile COD și să autorizezi garanția logistică înainte de finalizarea comenzii."
          )
        );
      }

      // Import COD fee calculator
      const { calculateCODFee } = await import(
        "@/lib/pricing/cod-fee-calculator"
      );

      // Get tax settings from database
      let taxRate = 0;
      let includeInPrice = false;
      let isTaxEnabled = false;
      try {
        const response = await fetch("/api/checkout/tax-settings");
        if (response.ok) {
          const taxData = await response.json();
          if (taxData.taxSettings?.active) {
            isTaxEnabled = true;
            taxRate = parseFloat(taxData.taxSettings.rate || "21") / 100;
            includeInPrice = taxData.taxSettings.includeInPrice !== false;
          }
        }
      } catch (error) {
        console.warn("Failed to fetch tax settings, using default:", error);
      }

      // Calculate proper total
      const cartTotalIncludingVAT = getCartTotal();
      const shippingCost = computeShippingCost();

      // Calculate tax based on settings
      let subtotalExcludingVAT: number;
      let tax: number;

      if (isTaxEnabled && includeInPrice) {
        // Tax is included in prices - calculate backwards
        subtotalExcludingVAT = cartTotalIncludingVAT / (1 + taxRate);
        tax = cartTotalIncludingVAT - subtotalExcludingVAT;
      } else if (isTaxEnabled && !includeInPrice) {
        // Tax is not included - add it to subtotal
        subtotalExcludingVAT = cartTotalIncludingVAT;
        tax = subtotalExcludingVAT * taxRate;
      } else {
        // Tax is disabled - no VAT calculation
        subtotalExcludingVAT = cartTotalIncludingVAT;
        tax = 0;
      }

      // Calculate order total before COD fee
      const orderTotalBeforeCOD =
        cartTotalIncludingVAT + shippingCost - discountAmount;

      // Get COD settings from database
      let codConfig = undefined;
      try {
        const codResponse = await fetch("/api/checkout/cod-settings");
        if (codResponse.ok) {
          const codData = await codResponse.json();
          if (codData?.active) {
            codConfig = {
              percentage: parseFloat(codData.percentage || "3") / 100,
              fixedFee: parseFloat(codData.fixedFee || "5.00"),
            };
          }
        }
      } catch (error) {
        console.warn("Failed to fetch COD settings, using default:", error);
      }

      // Calculate COD fee using settings from database
      const codFeeResult = calculateCODFee(orderTotalBeforeCOD, codConfig);
      const codFee = codFeeResult.fee;

      // Final total including COD fee
      const total = orderTotalBeforeCOD + codFee;

      // Prepare order data for COD - create with pending payment status
      const orderData = {
        items: cartItems,
        shippingAddress: checkoutData.shippingAddress!,
        billingAddress: checkoutData.billingAddressSameAsShipping
          ? checkoutData.shippingAddress!
          : checkoutData.billingAddress!,
        shippingMethod: checkoutData.shippingMethod!,
        lockerId: checkoutData.lockerId,
        lockerAddressSnapshot: checkoutData.lockerAddressSnapshot,
        paymentMethod: "cash_on_delivery",
        couponCode: appliedCoupon?.code || null,
        discountAmount,
        subtotal: subtotalExcludingVAT,
        tax,
        shippingCost,
        total,
        // Mark as COD payment - order will be created with pending status
        paymentProvider: "cod",
        paymentStatus: "PENDING",
        // Store COD fee in metadata
        codFee,
        codAmount: total, // Total amount to collect on delivery
        codConsentAccepted: checkoutData.codConsentAccepted,
        codConsentAcceptedAt: checkoutData.codConsentAcceptedAt,
        codConsentVersion: checkoutData.codConsentVersion,
        codConsentText: checkoutData.codConsentText,
        codGuaranteePaymentIntentId: checkoutData.codGuaranteePaymentIntentId,
        codGuaranteeAmount: checkoutData.codGuaranteeAmount,
      };

      console.log("🚀 [CHECKOUT] Creating COD order...");
      console.log("   Order total before COD:", orderTotalBeforeCOD);
      console.log("   COD fee:", codFee);
      console.log("   Total with COD:", total);

      // Create order with COD status
      const order = await createOrder(orderData);

      if (order?.success) {
        // Set a flag in session storage to indicate order completion
        sessionStorage.setItem("orderCompleted", "true");
        sessionStorage.setItem("orderId", order.orderId);
        sessionStorage.setItem("paymentMethod", "cash_on_delivery");

        // Show success notification
        toast({
          title: t("codOrderSuccess", "Comandă plasată cu succes!"),
          description: t(
            "codOrderSuccessMessage",
            "Comanda ta a fost plasată. Vei plăti cash la primirea coletului. Vei primi un email de confirmare în curând."
          ),
          variant: "default",
        });

        // Set redirect state to trigger navigation
        setRedirectToConfirmation(order.orderId);

        // Clear cart after setting the flags
        await clearCart();
      }
    } catch (error) {
      console.error("❌ [CHECKOUT] COD order creation failed:", error);

      // Provide user-friendly error message
      const userMessage =
        error instanceof Error
          ? error.message
          : "Failed to create COD order. Please try again or contact support.";

      setOrderError(new Error(userMessage));
      throw error;
    } finally {
      setIsProcessingOrder(false);
    }
  };

  const handleRegularOrder = async () => {
    try {
      // Get tax settings from database
      let taxRate = 0;
      let includeInPrice = false;
      let isTaxEnabled = false;
      try {
        const response = await fetch("/api/checkout/tax-settings");
        if (response.ok) {
          const taxData = await response.json();
          if (taxData.taxSettings?.active) {
            isTaxEnabled = true;
            taxRate = parseFloat(taxData.taxSettings.rate || "21") / 100;
            includeInPrice = taxData.taxSettings.includeInPrice !== false;
          }
        }
      } catch (error) {
        console.warn("Failed to fetch tax settings, using default:", error);
      }

      // Calculate proper total
      const cartTotalIncludingVAT = getCartTotal();
      const shippingCost = computeShippingCost();

      // Calculate tax based on settings
      let subtotalExcludingVAT: number;
      let tax: number;

      if (isTaxEnabled && includeInPrice) {
        // Tax is included in prices - calculate backwards
        subtotalExcludingVAT = cartTotalIncludingVAT / (1 + taxRate);
        tax = cartTotalIncludingVAT - subtotalExcludingVAT;
      } else if (isTaxEnabled && !includeInPrice) {
        // Tax is not included - add it to subtotal
        subtotalExcludingVAT = cartTotalIncludingVAT;
        tax = subtotalExcludingVAT * taxRate;
      } else {
        // Tax is disabled - no VAT calculation
        subtotalExcludingVAT = cartTotalIncludingVAT;
        tax = 0;
      }
      const total = cartTotalIncludingVAT + shippingCost - discountAmount;

      const stripePaymentIntentId =
        checkoutData.stripePaymentIntentId ||
        checkoutData.paymentDetails?.stripePaymentIntentId;
      const isStripePayment =
        checkoutData.paymentMethod?.startsWith("stripe") ||
        Boolean(stripePaymentIntentId);

      const orderData = {
        items: cartItems,
        shippingAddress: checkoutData.shippingAddress!,
        billingAddress: checkoutData.billingAddressSameAsShipping
          ? checkoutData.shippingAddress!
          : checkoutData.billingAddress!,
        shippingMethod: checkoutData.shippingMethod!,
        lockerId: checkoutData.lockerId,
        lockerAddressSnapshot: checkoutData.lockerAddressSnapshot,
        paymentMethod: checkoutData.paymentMethod || "stripe_new",
        couponCode: appliedCoupon?.code || null,
        discountAmount,
        subtotal: subtotalExcludingVAT,
        tax,
        shippingCost,
        total,
        paymentStatus: isStripePayment ? "PENDING" : "PAID",
        paymentProvider: isStripePayment ? "stripe" : undefined,
        stripePaymentIntentId,
      };

      const order = await createOrder(orderData);

      if (order?.success) {
        // Set a flag in session storage to indicate order completion FIRST
        sessionStorage.setItem("orderCompleted", "true");
        sessionStorage.setItem("orderId", order.orderId);

        // Show success notification
        toast({
          title: t("orderSuccess", "Order Placed Successfully!"),
          description: t(
            "orderSuccessMessage",
            "Your order has been placed successfully. You will receive a confirmation email shortly."
          ),
          variant: "default",
        });

        // Set redirect state to trigger navigation
        setRedirectToConfirmation(order.orderId);

        // Clear cart after setting the flags to prevent race condition
        await clearCart();
      }
    } finally {
      setIsProcessingOrder(false);
    }
  };

  // Show loading state
  if (currentStep === "loading" || status === "loading") {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-100">
        <Loader2 className="mb-4 h-12 w-12 animate-spin text-sky-300" />
        <p className="text-lg font-medium text-sky-200">
          {t("loading", "Loading checkout...")}
        </p>
      </div>
    );
  }

  // Show error if no session
  if (!session?.user) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-100">
        <p className="text-lg font-medium text-rose-300">
          {t("loginRequired", "Please log in to continue with checkout")}
        </p>
      </div>
    );
  }

  // Show error if cart is empty
  if (cartItems.length === 0) {
    // Check if we're coming from a successful order completion
    const orderCompleted = sessionStorage.getItem("orderCompleted");
    const orderId = sessionStorage.getItem("orderId");

    if (orderCompleted === "true" && orderId) {
      // User just completed an order, redirect to confirmation
      sessionStorage.removeItem("orderCompleted");
      sessionStorage.removeItem("orderId");
      setRedirectToConfirmation(orderId);
      return (
        <div className="flex flex-col items-center justify-center py-12 text-slate-100">
          <Loader2 className="mb-4 h-12 w-12 animate-spin text-sky-300" />
          <p className="text-lg font-medium text-sky-200">
            {t(
              "redirectingToConfirmation",
              "Redirecting to order confirmation..."
            )}
          </p>
        </div>
      );
    }

    // Only show cart empty error if we're not coming from order completion
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-100">
        <p className="text-lg font-medium text-rose-300">
          {t("cartEmpty", "Your cart is empty")}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-8 text-slate-100 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      {/* Main Checkout Flow */}
      <div className="lg:col-span-2">
        <EnhancedCheckoutStepper
          currentStep={currentStep}
          checkoutData={checkoutData}
        />

        {/* Step Content */}
        <div
          className="mt-8 space-y-6 text-slate-100
          [&_div.bg-white]:border-white/10 [&_div.bg-white]:bg-slate-900/70 [&_div.bg-white]:text-slate-100
          [&_div.bg-blue-50]:border-white/10 [&_div.bg-blue-50]:bg-sky-500/10 [&_div.bg-blue-50]:text-slate-100
          [&_div.bg-green-50]:border-white/10 [&_div.bg-green-50]:bg-emerald-500/10 [&_div.bg-green-50]:text-slate-100
          [&_div.bg-purple-50]:border-white/10 [&_div.bg-purple-50]:bg-purple-500/10 [&_div.bg-purple-50]:text-slate-100
          [&_.bg-indigo-50]:border-white/10 [&_.bg-indigo-50]:bg-sky-500/10 [&_.bg-indigo-50]:text-slate-100
          [&_.border-gray-200]:border-white/10 [&_.border-gray-300]:border-white/15
          [&_.border-blue-200]:border-white/10 [&_.border-green-200]:border-white/10
          [&_.bg-gray-50]:bg-white/10 [&_.bg-gray-200]:bg-white/10
          [&_.text-gray-500]:text-slate-300 [&_.text-gray-400]:text-slate-400
          [&_.text-gray-600]:text-slate-200 [&_.text-gray-700]:text-slate-100 [&_.text-gray-800]:text-slate-100
          [&_.text-indigo-600]:text-sky-300 [&_.text-indigo-700]:text-sky-200
          [&_.text-green-600]:text-emerald-300 [&_.text-blue-700]:text-sky-200 [&_.text-blue-600]:text-sky-300
          [&_.text-purple-700]:text-purple-200 [&_.bg-blue-100]:bg-sky-500/10 [&_.text-blue-800]:text-sky-200
          [&_.bg-yellow-100]:bg-amber-400/10 [&_.text-yellow-800]:text-amber-200
          [&_.bg-green-200]:bg-emerald-500/15 [&_.text-green-700]:text-emerald-200 [&_.text-green-800]:text-emerald-100
          [&_.border]:border-white/10"
        >
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
                shippingAddress={checkoutData.shippingAddress}
                onSubmit={({ method, lockerId, lockerAddressSnapshot }) => {
                  updateCheckoutData({
                    shippingMethod: method,
                    lockerId,
                    lockerAddressSnapshot,
                  });
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
                initialPaymentMethod={checkoutData.paymentMethod}
                initialCodConsentAccepted={checkoutData.codConsentAccepted}
                initialCodGuaranteePaymentIntentId={
                  checkoutData.codGuaranteePaymentIntentId
                }
                initialCodGuaranteeAmount={checkoutData.codGuaranteeAmount}
                billingAddressSameAsShipping={
                  checkoutData.billingAddressSameAsShipping
                }
                shippingAddress={checkoutData.shippingAddress}
                billingAddress={checkoutData.billingAddress}
                shippingMethod={checkoutData.shippingMethod}
                appliedCoupon={appliedCoupon}
                discountAmount={discountAmount}
                isAdmin={session?.user?.role === "ADMIN"}
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
              onGoToCart={() => router.push("/cart")}
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
          shippingCost={computeShippingCost()}
          appliedCoupon={appliedCoupon}
          onCouponRemoved={handleCouponRemoved}
          selectedPaymentMethod={checkoutData.paymentMethod}
          shippingMethod={checkoutData.shippingMethod}
          stripePaymentIntentId={
            checkoutData.stripePaymentIntentId ||
            checkoutData.paymentDetails?.stripePaymentIntentId
          }
          currentStep={currentStep}
        />
      </div>
    </div>
  );
}
