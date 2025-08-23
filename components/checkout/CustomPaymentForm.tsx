"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

interface CustomPaymentFormProps {
  onSuccess: (paymentDetails: any) => void;
  onError: (error: string) => void;
  amount: number;
  isCalculatingTotal?: boolean;
  billingDetails?: any;
}

export function CustomPaymentForm({
  onSuccess,
  onError,
  amount,
  isCalculatingTotal = false,
  billingDetails,
}: CustomPaymentFormProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [cardNumber, setCardNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvv, setCvv] = useState("");
  const [cardholderName, setCardholderName] = useState("");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!cardNumber || !expiryDate || !cvv || !cardholderName) {
      onError("Please fill in all card details");
      return;
    }

    setIsProcessing(true);

    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Create mock payment details
      const paymentDetails = {
        cardNumber: `•••• •••• •••• ${cardNumber.slice(-4)}`,
        cardholderName,
        expiryDate,
        cvv: "***",
        cardType: "visa", // Assume Visa for testing
      };

      onSuccess(paymentDetails);
    } catch (error) {
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

  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="expiry-date" className="block text-sm font-medium mb-1">
                Expiry Date
              </Label>
              <Input
                id="expiry-date"
                type="text"
                value={expiryDate}
                onChange={(e) => setExpiryDate(formatExpiryDate(e.target.value))}
                placeholder="MM/YY"
                className="w-full"
                maxLength={5}
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
                onChange={(e) => setCvv(e.target.value.replace(/\D/g, ''))}
                placeholder="123"
                className="w-full"
                maxLength={4}
                required
              />
            </div>
          </div>

          <div className="pt-2 text-sm text-gray-500">
            <p>
              ⚠️ <strong>Custom Payment Form</strong> - For testing only
            </p>
            <p>
              Use test card: <strong>4242 4242 4242 4242</strong>
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
              Processing...
            </>
          ) : isCalculatingTotal ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Calculating...
            </>
          ) : (
            `Pay $${(amount / 100).toFixed(2)}`
          )}
        </Button>
      </div>
    </form>
  );
}
