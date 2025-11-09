"use client";

import { PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Loader2 } from "lucide-react";
import React, { useState } from "react";

import { Button } from "@/components/ui/button";
import { useCurrency } from "@/lib/currency";
import { StripeCriticalWarning } from "@/components/checkout/StripeCriticalWarning";
import { useStripeBypass } from "@/components/checkout/StripeBypassProvider";

import { PaymentDetails } from "../types";

interface StripePaymentFormProps {
  clientSecret: string;
  paymentIntentId?: string;
  onSuccess: (paymentDetails: PaymentDetails) => void;
  onError: (error: string) => void;
  amount: number; // In cents
  isCalculatingTotal?: boolean;
  billingDetails?: {
    name: string;
    email: string;
    address: {
      line1: string;
      line2?: string;
      city: string;
      state: string;
      postal_code: string;
      country: string;
    };
  };
}

export function StripePaymentForm({
  clientSecret,
  paymentIntentId,
  onSuccess,
  onError,
  amount,
  isCalculatingTotal = false,
  billingDetails,
}: StripePaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [cardError, setCardError] = useState<string | undefined>();
  const [stripeLoaded, setStripeLoaded] = useState(false);
  const { formatPrice } = useCurrency();
  const { stripeFailed } = useStripeBypass();

  // Check if Stripe is properly loaded
  React.useEffect(() => {
    // Add a timeout to detect when Stripe fails to load
    const timeoutId = setTimeout(() => {
      if (!stripe || !elements) {
        console.warn("Stripe failed to load within timeout - using custom form");
        setStripeLoaded(false);
      }
    }, 3000); // 3 second timeout

    if (stripe && elements) {
      clearTimeout(timeoutId);
      setStripeLoaded(true);
      console.log("Stripe Elements loaded successfully");
    } else {
      console.warn("Stripe Elements not loaded yet");
      // Add more detailed logging for debugging
      console.log("Stripe object:", stripe);
      console.log("Elements object:", elements);
      console.log("Environment:", process.env.NODE_ENV);
      console.log("Stripe key available:", !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
    }

    return () => clearTimeout(timeoutId);
  }, [stripe, elements]);

  // Convert amount from cents to major currency for display
  const displayAmount = amount / 100;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements || !clientSecret) {
      return;
    }

    setIsProcessing(true);
    setCardError(undefined);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: "if_required",
        confirmParams: {
          return_url:
            typeof window !== "undefined"
              ? `${window.location.origin}/checkout/confirmation`
              : undefined,
          payment_method_data: billingDetails
            ? {
                billing_details: {
                  name: billingDetails.name,
                  email: billingDetails.email,
                  address: billingDetails.address,
                },
              }
            : undefined,
        },
      });

      if (error) {
        throw new Error(error.message || "Payment failed");
      }

      if (paymentIntent?.status === "succeeded") {
        const cardInfo: PaymentDetails = {
          cardNumber: "•••• •••• •••• 0000",
          cardholderName: billingDetails?.name || "Card Holder",
          expiryDate: "**/**",
          cvv: "***",
          cardType: paymentIntent.payment_method_types?.[0] || "card",
          stripePaymentIntentId: paymentIntent.id || paymentIntentId,
        };

        onSuccess(cardInfo);
      } else {
        throw new Error("Payment processing failed");
      }
    } catch (error) {
      const errorMessage =
        (error as Error).message || "An error occurred with your payment";
      setCardError(errorMessage);
      onError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  if (process.env.NODE_ENV === "production" && (!stripeLoaded || stripeFailed)) {
    return (
      <StripeCriticalWarning
        onRetry={() => {
          console.log("Retrying Stripe loading...");
          window.location.reload();
        }}
      />
    );
  }

  if (!stripeLoaded || stripeFailed) {
    return (
      <div className="space-y-4 bg-orange-50 border border-orange-200 rounded-lg p-4 text-sm text-orange-700">
        <p>
          Stripe nu a reușit să se încarce în această sesiune de dezvoltare.
          Reîmprospătează pagina sau dezactivează service worker-ul pentru a continua testarea.
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.location.reload()}
          className="w-full sm:w-auto"
        >
          Reîncarcă pagina
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white rounded-lg border p-4 space-y-4">
        <div className="border rounded-md p-3">
          <PaymentElement id="payment-element" key={clientSecret} />
        </div>
        {cardError && (
          <p className="text-red-500 text-sm mt-1">{cardError}</p>
        )}
        <div className="pt-2 text-sm text-gray-500">
          <p>Plățile sunt procesate prin Stripe și pot necesita verificare 3D Secure.</p>
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={!stripe || isProcessing || isCalculatingTotal}
          className="px-8 stripe-submit-button"
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Se procesează...
            </>
          ) : isCalculatingTotal ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Calculez totalul...
            </>
          ) : (
            `Plătește ${formatPrice(displayAmount)}`
          )}
        </Button>
      </div>
    </form>
  );
}
