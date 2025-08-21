"use client";

import { CreditCard, Loader2 } from "lucide-react";
import React, { useState, useEffect } from "react";

import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useTranslation } from "@/lib/i18n";

interface PaymentCard {
  id: string;
  cardType: string;
  lastFourDigits: string;
  expiryMonth: string;
  expiryYear: string;
  cardholderName: string;
  isDefault: boolean;
  billingAddressId?: string;
}

interface PaymentMethodSelectorProps {
  selectedPaymentMethod: string;
  onPaymentMethodChange: (value: string) => void;
  savedCards: PaymentCard[];
  isLoadingCards: boolean;
}

export const PaymentMethodSelector = React.memo(function PaymentMethodSelector({
  selectedPaymentMethod,
  onPaymentMethodChange,
  savedCards,
  isLoadingCards,
}: PaymentMethodSelectorProps) {
  const { t } = useTranslation();

  // Get card logo or icon based on card type
  const getCardIcon = (cardType: string) => {
    switch (cardType.toLowerCase()) {
      case "visa":
        return (
          <div className="bg-blue-500 text-white font-bold text-xs px-1.5 py-0.5 rounded">
            VISA
          </div>
        );
      case "mastercard":
        return (
          <div className="bg-red-500 text-white font-bold text-xs px-1.5 py-0.5 rounded">
            MC
          </div>
        );
      case "amex":
        return (
          <div className="bg-blue-700 text-white font-bold text-xs px-1.5 py-0.5 rounded">
            AMEX
          </div>
        );
      default:
        return <CreditCard className="h-4 w-4 text-gray-500" />;
    }
  };

  if (isLoadingCards) {
    return (
      <div className="flex justify-center items-center py-6">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (savedCards.length === 0) {
    return null;
  }

  return (
    <div className="mb-6">
      <Label className="text-base font-medium mb-3 block">
        {t("selectPaymentMethod", "Selectează metoda de plată")}
      </Label>
      <RadioGroup
        value={selectedPaymentMethod}
        onValueChange={onPaymentMethodChange}
        className="space-y-3"
      >
        {savedCards.map(card => (
          <div
            key={card.id}
            className="flex items-start space-x-2 p-3 border rounded-md hover:bg-gray-50"
          >
            <RadioGroupItem
              value={card.id}
              id={`card-${card.id}`}
              className="mt-1"
            />
            <div className="flex-1">
              <div className="flex items-center">
                <Label
                  htmlFor={`card-${card.id}`}
                  className="font-medium cursor-pointer flex items-center gap-2"
                >
                  {getCardIcon(card.cardType)}
                  •••• {card.lastFourDigits}
                  <span className="text-sm text-gray-500 ml-2">
                    {t("expires", "Expires")} {card.expiryMonth}/
                    {card.expiryYear}
                  </span>
                  {card.isDefault && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded ml-2">
                      {t("default", "Default")}
                    </span>
                  )}
                </Label>
              </div>
              <div className="text-sm text-gray-600 mt-1">
                {card.cardholderName}
              </div>
            </div>
          </div>
        ))}
        <div className="flex items-start space-x-2 p-3 border rounded-md hover:bg-gray-50">
          <RadioGroupItem value="new" id="payment-new" className="mt-1" />
          <Label htmlFor="payment-new" className="font-medium cursor-pointer">
            {t("useNewCard", "Folosește un card nou")}
          </Label>
        </div>
      </RadioGroup>
    </div>
  );
});
