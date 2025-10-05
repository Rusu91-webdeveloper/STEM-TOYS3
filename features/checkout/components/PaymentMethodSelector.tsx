"use client";

import { CreditCard, Loader2, Smartphone, Wallet } from "lucide-react";
import React, { useState, useEffect, useMemo } from "react";

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
  userLocation?: string;
  userLocale?: string;
  billingCountry?: string;
}

export const PaymentMethodSelector = React.memo(function PaymentMethodSelector({
  selectedPaymentMethod,
  onPaymentMethodChange,
  savedCards,
  isLoadingCards,
  userLocation,
  userLocale,
  billingCountry,
}: PaymentMethodSelectorProps) {
  const { t } = useTranslation();

  // Determine if user should see Netopia options
  const isRomanianUser = useMemo(() => {
    return (
      userLocation === "RO" ||
      userLocation === "Romania" ||
      userLocale === "ro" ||
      userLocale === "ro-RO" ||
      billingCountry === "Romania" ||
      billingCountry === "RO"
    );
  }, [userLocation, userLocale, billingCountry]);

  // Get available payment methods based on user location
  const paymentMethods = useMemo(() => {
    const methods = [];

    // Netopia is the primary payment provider - show Netopia options for all users
    // Romanian users get priority with local payment methods
    if (isRomanianUser) {
      methods.push(
        {
          id: "netopia_card",
          type: "netopia_card",
          name: "Card bancar (Netopia)",
          icon: <CreditCard className="h-4 w-4 text-blue-600" />,
          provider: "netopia",
          fee: "1.5%",
          description: "Plată securizată cu card bancar",
        },
        {
          id: "netopia_sms",
          type: "netopia_sms",
          name: "Plată prin SMS (Netopia)",
          icon: <Smartphone className="h-4 w-4 text-green-600" />,
          provider: "netopia",
          fee: "2.0%",
          description: "Primești SMS cu link de plată",
        },
        {
          id: "netopia_wallet",
          type: "netopia_wallet",
          name: "Portofel mobilPay (Netopia)",
          icon: <Wallet className="h-4 w-4 text-purple-600" />,
          provider: "netopia",
          fee: "1.2%",
          description: "Plată rapidă cu portofel electronic",
        }
      );
    } else {
      // Non-Romanian users see Netopia card option
      methods.push({
        id: "netopia_card",
        type: "netopia_card",
        name: "Credit/Debit Card (Netopia)",
        icon: <CreditCard className="h-4 w-4 text-blue-600" />,
        provider: "netopia",
        fee: "1.5%",
        description: "Secure card payment via Netopia",
      });
    }

    // Commented out - Stripe options for future use
    /*
    // Always show saved cards if available
    if (savedCards.length > 0) {
      savedCards.forEach(card => {
        methods.push({
          id: card.id,
          type: "saved_card",
          name: `•••• •••• •••• ${card.lastFourDigits}`,
          icon: getCardIcon(card.cardType),
          provider: "stripe",
          fee: "2.9% + €0.25",
        });
      });
    }

    // Add new card option for Stripe
    methods.push({
      id: "stripe_new",
      type: "new_card",
      name: t("useNewCard", "Folosește un card nou"),
      icon: <CreditCard className="h-4 w-4 text-gray-500" />,
      provider: "stripe",
      fee: "2.9% + €0.25",
    });
    */

    return methods;
  }, [isRomanianUser, t]);

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
        {paymentMethods.map(method => (
          <div
            key={method.id}
            className={`flex items-start space-x-2 p-3 border rounded-md hover:bg-gray-50 ${
              method.provider === "netopia"
                ? "border-blue-200 bg-blue-50/30"
                : ""
            }`}
          >
            <RadioGroupItem
              value={method.id}
              id={`payment-${method.id}`}
              className="mt-1"
            />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor={`payment-${method.id}`}
                  className="font-medium cursor-pointer flex items-center gap-2"
                >
                  {method.icon}
                  {method.name}
                  {method.provider === "netopia" && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                      🇷🇴 Netopia
                    </span>
                  )}
                </Label>
                <span className="text-sm text-gray-500">{method.fee}</span>
              </div>
              {method.description && (
                <div className="text-sm text-gray-600 mt-1">
                  {method.description}
                </div>
              )}
              {method.type === "saved_card" && (
                <div className="text-sm text-gray-600 mt-1">
                  {
                    savedCards.find(card => card.id === method.id)
                      ?.cardholderName
                  }
                </div>
              )}
            </div>
          </div>
        ))}
      </RadioGroup>

      {isRomanianUser && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <div className="flex items-center gap-2">
            <div className="text-blue-600 text-sm">
              <strong>🇷🇴 Netopia Payments:</strong> Plăți sigure pentru clienții
              români cu comisioane mai mici și metode locale de plată.
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
