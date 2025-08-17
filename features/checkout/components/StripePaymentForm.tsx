"use client";

import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Loader2 } from "lucide-react";
import React, { useState } from "react";

import { Button } from "@/components/ui/button";
import { useCurrency } from "@/lib/currency";

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
  const { formatPrice } = useCurrency();

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
      const response = await fetch("/api/stripe/payment-intent", {
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
