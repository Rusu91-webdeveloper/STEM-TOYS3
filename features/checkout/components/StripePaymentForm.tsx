"use client";

import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Loader2 } from "lucide-react";
import React, { useState } from "react";

import { Button } from "@/components/ui/button";
import { useCurrency } from "@/lib/currency";
import { CustomPaymentForm } from "@/components/checkout/CustomPaymentForm";
import { ServiceWorkerBypass } from "@/components/checkout/ServiceWorkerBypass";
import { useStripeBypass } from "@/components/checkout/StripeBypassProvider";

import { PaymentDetails } from "../types";

interface StripePaymentFormProps {
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
  const { useCustomForm, stripeFailed } = useStripeBypass();

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

  // Convert amount from cents to dollars for display
  const displayAmount = amount / 100;

  const cardElementOptions = {
    style: {
      base: {
        fontSize: "16px",
        color: "#32325d",
        fontFamily: "Arial, sans-serif",
        "::placeholder": {
          color: "#aab7c4",
        },
      },
      invalid: {
        color: "#fa755a",
        iconColor: "#fa755a",
      },
    },
    hidePostalCode: true,
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js has not loaded yet
      return;
    }

    setIsProcessing(true);
    setCardError(undefined);

    try {
      // Get the card element
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error("Card element not found");
      }

      // Create a payment intent on the server
      const response = await fetch("/api/stripe/create-payment-intent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount,
          currency: "usd", // This should match your base currency
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create payment intent");
      }

      const { clientSecret } = await response.json();

      // Confirm the payment with the card element
      const { error, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: cardElement,
            billing_details: billingDetails || {
              name: "Anonymous Customer",
            },
          },
        }
      );

      if (error) {
        throw new Error(error.message || "Payment failed");
      }

      if (paymentIntent.status === "succeeded") {
        // Create a payment details object
        // Note: For security, we don't have direct access to the card details
        // We create a simplified representation for the UI
        const cardInfo: PaymentDetails = {
          cardNumber: "•••• •••• •••• 4242", // For testing, we use a fixed value
          cardholderName: billingDetails?.name || "Card Holder",
          expiryDate: "**/**", // We don't store the actual expiry date
          cvv: "***", // Never store the actual CVV
          cardType: "visa", // Assuming test card is Visa
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

  // Show service worker bypass and custom payment form if Stripe is not loaded or failed
  if (!stripeLoaded || useCustomForm || stripeFailed) {
    return (
      <div className="space-y-6">
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-orange-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-orange-800">
                Service Worker Blocking Stripe
              </h3>
              <div className="mt-2 text-sm text-orange-700">
                <p>
                  A service worker is blocking Stripe from loading. Try the bypass option below.
                </p>
              </div>
            </div>
          </div>
        </div>

        <ServiceWorkerBypass
          onStripeReady={() => {
            console.log("Stripe ready after bypass - reloading page");
            window.location.reload();
          }}
          onStripeFailed={() => {
            console.log("Bypass failed - using custom form");
          }}
        />
        
        <div className="border-t pt-4">
          <h4 className="text-sm font-medium mb-2">Fallback Payment Form</h4>
          <CustomPaymentForm
            onSuccess={onSuccess}
            onError={onError}
            amount={amount}
            isCalculatingTotal={isCalculatingTotal}
            billingDetails={billingDetails}
          />
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white rounded-lg border p-4">
        <div className="space-y-4">
          <div>
            <label
              htmlFor="card-element"
              className="block text-sm font-medium mb-1"
            >
              Card de credit sau debit
            </label>
            <div className="border rounded-md p-3">
              <CardElement id="card-element" options={cardElementOptions} />
            </div>
            {cardError && (
              <p className="text-red-500 text-sm mt-1">{cardError}</p>
            )}
          </div>

          <div className="pt-2 text-sm text-gray-500">
            <p>
              Pentru testare, poți folosi numărul de card:{" "}
              <strong>4242 4242 4242 4242</strong>
            </p>
            <p>
              Folosește orice dată viitoare pentru expirare și orice CVC de 3
              cifre.
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={!stripe || isProcessing || isCalculatingTotal}
          className="px-8"
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
