"use client";

import {
  CreditCard,
  Loader2,
  ShieldCheck,
  Sparkles,
  Package,
  CheckCircle2,
} from "lucide-react";
import React, { useEffect, useMemo } from "react";

import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";

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
  shippingCountry?: string;
}

type Provider = "netopia" | "stripe" | "cod";
type PaymentMethodItem = {
  id: string;
  type: string;
  name: string;
  icon: React.ReactNode;
  provider: Provider;
  fee?: string;
  description?: string;
  badge?: string;
  color: string;
  borderColor: string;
  bgColor: string;
};

export const PaymentMethodSelector = React.memo(function PaymentMethodSelector({
  selectedPaymentMethod,
  onPaymentMethodChange,
  savedCards,
  isLoadingCards,
  userLocation,
  userLocale,
  billingCountry,
  shippingCountry,
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
      billingCountry === "RO" ||
      shippingCountry === "Romania" ||
      shippingCountry === "RO"
    );
  }, [userLocation, userLocale, billingCountry, shippingCountry]);

  // Get available payment methods based on user location
  const paymentMethods = useMemo(() => {
    const methods: PaymentMethodItem[] = [];

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
              "Card salvat, plătești instant"
            ),
            badge: t("stripeOnFile", "Card salvat"),
            color: "indigo",
            borderColor: "border-indigo-300/50",
            bgColor: "bg-indigo-500/10",
          });
        });
      }

      methods.push({
        id: "stripe_new",
        type: "new_card",
        name: t("useNewCard", "Card nou (Stripe)"),
        icon: <ShieldCheck className="h-5 w-5" />,
        provider: "stripe",
        fee: t("stripeFee", "0% taxe"),
        description: t(
          "stripeSecurePayment",
          "Visa, Mastercard, Apple Pay, Google Pay"
        ),
        badge: t("recommended", "Recomandat"),
        color: "indigo",
        borderColor: "border-indigo-300/50",
        bgColor: "bg-indigo-500/10",
      });
    }

    if (netopiaEnabled) {
      if (isRomanianUser) {
        methods.push(
          {
            id: "netopia_card",
            type: "netopia_card",
            name: "Card bancar",
            icon: <CreditCard className="h-5 w-5" />,
            provider: "netopia",
            fee: "1.5%",
            description: "Plată securizată cu card",
            color: "sky",
            borderColor: "border-sky-300/50",
            bgColor: "bg-sky-500/10",
          },
          {
            id: "netopia_sms",
            type: "netopia_sms",
            name: "Plată prin SMS",
            icon: <Sparkles className="h-5 w-5" />,
            provider: "netopia",
            fee: "2.0%",
            description: "Primești SMS cu link",
            color: "sky",
            borderColor: "border-sky-300/50",
            bgColor: "bg-sky-500/10",
          },
          {
            id: "netopia_wallet",
            type: "netopia_wallet",
            name: "Portofel mobilPay",
            icon: <Sparkles className="h-5 w-5" />,
            provider: "netopia",
            fee: "1.2%",
            description: "Plată rapidă electronică",
            color: "sky",
            borderColor: "border-sky-300/50",
            bgColor: "bg-sky-500/10",
          }
        );
      } else {
        methods.push({
          id: "netopia_card",
          type: "netopia_card",
          name: "Credit/Debit Card",
          icon: <CreditCard className="h-5 w-5" />,
          provider: "netopia",
          fee: "1.5%",
          description: "Secure card payment",
          color: "sky",
          borderColor: "border-sky-300/50",
          bgColor: "bg-sky-500/10",
        });
      }
    }

    // Add COD option for Romanian users
    if (isRomanianUser) {
      methods.push({
        id: "cash_on_delivery",
        type: "cash_on_delivery",
        name: "Ramburs",
        icon: <Package className="h-5 w-5" />,
        provider: "cod",
        fee: "3% + 5 RON",
        description: "Plătești cash la livrare",
        badge: t("codPopular", "Popular"),
        color: "orange",
        borderColor: "border-orange-300/50",
        bgColor: "bg-orange-500/10",
      });
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
      <Label className="mb-4 block text-base font-semibold text-slate-100">
        {t("selectPaymentMethod", "Selectează metoda de plată")}
      </Label>
      <RadioGroup
        value={selectedPaymentMethod}
        onValueChange={onPaymentMethodChange}
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        {paymentMethods.map(method => {
          const isSelected = selectedPaymentMethod === method.id;
          const colorClasses = {
            indigo: {
              icon: "text-indigo-400",
              border: "border-indigo-300/50",
              bg: "bg-indigo-500/10",
              selectedBorder: "border-indigo-400 ring-indigo-400/50",
              selectedBg: "bg-indigo-500/20",
            },
            sky: {
              icon: "text-sky-400",
              border: "border-sky-300/50",
              bg: "bg-sky-500/10",
              selectedBorder: "border-sky-400 ring-sky-400/50",
              selectedBg: "bg-sky-500/20",
            },
            orange: {
              icon: "text-orange-400",
              border: "border-orange-300/50",
              bg: "bg-orange-500/10",
              selectedBorder: "border-orange-400 ring-orange-400/50",
              selectedBg: "bg-orange-500/20",
            },
          };
          const colors = colorClasses[method.color as keyof typeof colorClasses] || colorClasses.indigo;

          return (
            <label
              key={method.id}
              htmlFor={`payment-${method.id}`}
              className={cn(
                "relative flex cursor-pointer flex-col rounded-xl border p-5 transition-all duration-200",
                "hover:scale-[1.02] hover:shadow-lg",
                isSelected
                  ? `${colors.selectedBorder} ${colors.selectedBg} ring-2 shadow-lg`
                  : `${colors.border} ${colors.bg} border-white/10 hover:border-white/30`,
                "backdrop-blur-sm"
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={cn("rounded-lg p-2.5", colors.bg)}>
                    <div className={colors.icon}>{method.icon}</div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-100">
                        {method.name}
                      </span>
                      {method.badge && (
                        <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-300">
                          {method.badge}
                        </span>
                      )}
                    </div>
                    {method.description && (
                      <p className="mt-1 text-sm text-slate-300/80">
                        {method.description}
                      </p>
                    )}
                    {method.type === "saved_card" && (
                      <p className="mt-1 text-xs text-slate-400">
                        {
                          savedCards.find(card => card.id === method.id)
                            ?.cardholderName
                        }
                      </p>
                    )}
                  </div>
                </div>
                <RadioGroupItem
                  value={method.id}
                  id={`payment-${method.id}`}
                  className="mt-0.5 border-white/40 text-sky-300 data-[state=checked]:border-sky-400"
                />
              </div>
              
              <div className="mt-4 flex items-center justify-between">
                {method.fee && (
                  <span className="rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs font-medium text-slate-200">
                    {method.fee}
                  </span>
                )}
                {isSelected && (
                  <div className="flex items-center gap-1.5 text-emerald-400">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="text-xs font-medium">
                      {t("selected", "Selectat")}
                    </span>
                  </div>
                )}
              </div>
            </label>
          );
        })}
      </RadioGroup>
    </div>
  );
});
