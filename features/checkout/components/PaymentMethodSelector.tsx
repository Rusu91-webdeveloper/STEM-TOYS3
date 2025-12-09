"use client";

import { CreditCard, Loader2, ShieldCheck, Sparkles } from "lucide-react";
import React, { /* useState, */ useEffect, useMemo } from "react";

import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { StripeLogoBadge } from "./StripeLogoBadge";

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

const stripeNetworks = ["Visa", "Mastercard", "Apple Pay", "Google Pay", "Revolut"];

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
  const stripeEnabled = process.env.NEXT_PUBLIC_STRIPE_ENABLED !== "false";
  const netopiaEnabled = process.env.NEXT_PUBLIC_NETOPIA_ENABLED === "true";

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
        return <CreditCard className="h-4 w-4 text-slate-200" />;
    }
  };

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
    const methods: Array<{
      id: string;
      type: string;
      name: string;
      icon: React.ReactNode;
      provider: "netopia" | "stripe";
      fee?: string;
      description?: string;
      badge?: string;
    }> = [];

    if (stripeEnabled) {
      if (savedCards.length > 0) {
        savedCards.forEach(card => {
          methods.push({
            id: card.id,
            type: "saved_card",
            name: `${card.cardType.toUpperCase()} •••• ${card.lastFourDigits}`,
            icon: getCardIcon(card.cardType),
            provider: "stripe",
            fee: t("stripeSavedCardFee", "Inclus"),
            description: t(
              "stripeSavedCardDescription",
              "Salvat în siguranță prin Stripe, plătești instant."
            ),
            badge: t("stripeOnFile", "Card salvat"),
          });
        });
      }

      methods.push({
        id: "stripe_new",
        type: "new_card",
        name: t("useNewCard", "Folosește un card nou"),
        icon: (
          <div className="flex items-center gap-1 rounded-md bg-indigo-500/20 px-2 py-1 text-[11px] font-semibold text-indigo-50 ring-1 ring-indigo-300/40">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Stripe</span>
          </div>
        ),
        provider: "stripe",
        fee: t("stripeFee", "0% taxe ascunse"),
        description: t(
          "stripeSecurePayment",
          "Plată securizată prin Stripe (Visa, Mastercard, Apple Pay)"
        ),
        badge: t("recommended", "Recomandat"),
      });
    }

    if (netopiaEnabled) {
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
            icon: <Sparkles className="h-4 w-4 text-green-500" />,
            provider: "netopia",
            fee: "2.0%",
            description: "Primești SMS cu link de plată",
          },
          {
            id: "netopia_wallet",
            type: "netopia_wallet",
            name: "Portofel mobilPay (Netopia)",
            icon: <Sparkles className="h-4 w-4 text-purple-400" />,
            provider: "netopia",
            fee: "1.2%",
            description: "Plată rapidă cu portofel electronic",
          }
        );
      } else {
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
    }

    return methods;
  }, [isRomanianUser, netopiaEnabled, savedCards, stripeEnabled, t]);

  useEffect(() => {
    if (paymentMethods.length === 0) {
      return;
    }

    const hasSelection = paymentMethods.some(
      method => method.id === selectedPaymentMethod
    );

    if (!hasSelection) {
      onPaymentMethodChange(paymentMethods[0].id);
    }
  }, [paymentMethods, selectedPaymentMethod, onPaymentMethodChange]);

  if (isLoadingCards) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="h-8 w-8 animate-spin text-sky-300" />
      </div>
    );
  }

  return (
    <div className="mb-6">
      <Label className="mb-3 block text-base font-semibold text-slate-100">
        {t("selectPaymentMethod", "Selectează metoda de plată")}
      </Label>
      <RadioGroup
        value={selectedPaymentMethod}
        onValueChange={onPaymentMethodChange}
        className="space-y-3"
      >
        {paymentMethods.map(method => {
          const isSelected = selectedPaymentMethod === method.id;
          const isStripe = method.provider === "stripe";

          return (
            <div
              key={method.id}
              className={cn(
                "flex items-start gap-3 rounded-xl border p-4 transition-all duration-200",
                isStripe
                  ? "border-indigo-300/40 bg-indigo-950/30"
                  : "border-sky-400/40 bg-sky-500/10",
                isSelected
                  ? "shadow-lg shadow-indigo-600/25 ring-2 ring-indigo-400"
                  : "hover:border-white/25 hover:bg-white/5"
              )}
            >
              <RadioGroupItem
                value={method.id}
                id={`payment-${method.id}`}
                className="mt-1 border-white/40 text-sky-300"
              />
              <div className="flex-1">
                <div className="flex items-center justify-between gap-3">
                  <Label
                    htmlFor={`payment-${method.id}`}
                    className="flex cursor-pointer items-center gap-2 font-semibold text-slate-100"
                  >
                    {method.icon}
                    <div className="flex flex-wrap items-center gap-2">
                      <span>{method.name}</span>
                      {method.badge && (
                        <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-indigo-50">
                          {method.badge}
                        </span>
                      )}
                      {isStripe && (
                        <span className="rounded-full border border-white/20 bg-white/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-indigo-50">
                          Stripe
                        </span>
                      )}
                      {method.provider === "netopia" && (
                        <span className="rounded border border-sky-400/40 bg-sky-500/15 px-2 py-0.5 text-xs text-sky-100">
                          🇷🇴 Netopia
                        </span>
                      )}
                    </div>
                  </Label>
                  {method.fee ? (
                    <span className="text-sm text-slate-300">{method.fee}</span>
                  ) : null}
                </div>
                {method.description && (
                  <div className="mt-1 text-sm text-slate-300">
                    {method.description}
                  </div>
                )}
                {method.type === "saved_card" && (
                  <div className="mt-1 text-sm text-slate-300">
                    {
                      savedCards.find(card => card.id === method.id)
                        ?.cardholderName
                    }
                  </div>
                )}
                {isStripe && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {stripeNetworks.map(network => (
                      <span
                        key={network}
                        className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-slate-100"
                      >
                        {network}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </RadioGroup>

      <div className="mt-4">
        <StripeLogoBadge />
      </div>
    </div>
  );
});
