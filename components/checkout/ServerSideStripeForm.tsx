"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useCurrency } from "@/lib/currency";

interface ServerSideStripeFormProps {
  onSuccess: (paymentDetails: any) => void;
  onError: (error: string) => void;
  amount: number;
  isCalculatingTotal?: boolean;
  billingDetails?: any;
}

export function ServerSideStripeForm({
  onSuccess,
  onError,
  amount,
  isCalculatingTotal = false,
  billingDetails,
}: ServerSideStripeFormProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [cardNumber, setCardNumber] = useState("");
  const [expiryMonth, setExpiryMonth] = useState("");
  const [expiryYear, setExpiryYear] = useState("");
  const [cvv, setCvv] = useState("");
  const [cardholderName, setCardholderName] = useState("");
  const { formatPrice } = useCurrency();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!cardNumber || !expiryMonth || !expiryYear || !cvv || !cardholderName) {
      onError("Please fill in all card details");
      return;
    }

    setIsProcessing(true);

    try {
      // Prepare card data for server-side processing
      const cardData = {
        number: cardNumber.replace(/\s/g, ""), // Remove spaces
        exp_month: parseInt(expiryMonth),
        exp_year: parseInt(expiryYear),
        cvc: cvv,
      };

      // Process payment server-side
      const response = await fetch("/api/stripe/process-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: amount / 100, // Convert from cents to dollars
          cardData,
          currency: "usd",
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Create payment details for the UI
        const paymentDetails = {
          cardNumber: `•••• •••• •••• ${cardNumber.slice(-4)}`,
          cardholderName,
          expiryDate: `${expiryMonth}/${expiryYear}`,
          cvv: "***",
          cardType: "visa", // We'll detect this based on card number
          paymentIntentId: result.paymentIntent?.id,
        };

        onSuccess(paymentDetails);
      } else {
        onError(result.error || "Payment processing failed");
      }
    } catch (error) {
      console.error("Payment error:", error);
      onError("Payment processing failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const getCardType = (number: string) => {
    const cleanNumber = number.replace(/\s/g, "");
    if (cleanNumber.startsWith("4")) return "visa";
    if (cleanNumber.startsWith("5")) return "mastercard";
    if (cleanNumber.startsWith("3")) return "amex";
    return "unknown";
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white rounded-lg border p-4">
        <div className="space-y-4">
          <div>
            <Label htmlFor="cardholder-name" className="block text-sm font-medium mb-1">
              Cardholder Name
            </Label>
            <Input
              id="cardholder-name"
              type="text"
              value={cardholderName}
              onChange={(e) => setCardholderName(e.target.value)}
              placeholder="John Doe"
              className="w-full"
              required
            />
          </div>

          <div>
            <Label htmlFor="card-number" className="block text-sm font-medium mb-1">
              Card Number
            </Label>
            <Input
              id="card-number"
              type="text"
              value={cardNumber}
              onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
              placeholder="4242 4242 4242 4242"
              className="w-full"
              maxLength={19}
              required
            />
            {cardNumber && (
              <p className="text-xs text-gray-500 mt-1">
                Card type: {getCardType(cardNumber)}
              </p>
            )}
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="expiry-month" className="block text-sm font-medium mb-1">
                Month
              </Label>
              <Input
                id="expiry-month"
                type="text"
                value={expiryMonth}
                onChange={(e) => setExpiryMonth(e.target.value.replace(/\D/g, '').slice(0, 2))}
                placeholder="MM"
                className="w-full"
                maxLength={2}
                required
              />
            </div>
            <div>
              <Label htmlFor="expiry-year" className="block text-sm font-medium mb-1">
                Year
              </Label>
              <Input
                id="expiry-year"
                type="text"
                value={expiryYear}
                onChange={(e) => setExpiryYear(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="YYYY"
                className="w-full"
                maxLength={4}
                required
              />
            </div>
            <div>
              <Label htmlFor="cvv" className="block text-sm font-medium mb-1">
                CVC
              </Label>
              <Input
                id="cvv"
                type="text"
                value={cvv}
                onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="123"
                className="w-full"
                maxLength={4}
                required
              />
            </div>
          </div>

          <div className="pt-2 text-sm text-gray-500">
            <p>
              🔒 <strong>Secure Payment Processing</strong> - Powered by Stripe
            </p>
            <p>
              For testing: <strong>4242 4242 4242 4242</strong>
            </p>
            <p>
              Any future date for expiry, any 3-digit CVC
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={isProcessing || isCalculatingTotal}
          className="px-8"
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Processing Payment...
            </>
          ) : isCalculatingTotal ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Calculating...
            </>
          ) : (
            `Pay ${formatPrice(amount / 100)}`
          )}
        </Button>
      </div>
    </form>
  );
}
