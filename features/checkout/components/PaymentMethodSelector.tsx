"use client";

import {
  CreditCard,
  Globe2,
  Loader2,
  ShieldCheck,
  Smartphone,
  Sparkles,
} from "lucide-react";
import React, { /* useState, */ useEffect, useMemo } from "react";

import NTPLogo from "ntp-logo-react";

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

type Provider = "netopia" | "stripe";
type PaymentMethodItem = {
  id: string;
  type: string;
  name: string;
  icon: React.ReactNode;
  provider: Provider;
  fee?: string;
  description?: string;
  badge?: string;
};
type ProviderMeta = {
  title: string;
  subtitle: string;
  gradient: string;
  border: string;
  chipTone: string;
  icon: React.ReactNode;
  helperChips: string[];
  logo: React.ReactNode;
};

const StripeMark = () => (
  <div className="flex items-center gap-2 rounded-lg border border-indigo-200/40 bg-white px-3 py-1.5 text-[#635bff] shadow-sm shadow-indigo-500/10">
    <span className="text-lg font-black leading-none tracking-tight">stripe</span>
    <span className="rounded-full bg-[#635bff]/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-[#2d2597]">
      Secure
    </span>
  </div>
);

const NetopiaMark = () => (
  <div className="flex items-center gap-2 rounded-lg border border-sky-200/40 bg-white px-3 py-1.5 text-slate-800 shadow-sm shadow-sky-500/10">
    <NTPLogo color="#0b2d75" version="horizontal" secret="156180" aria-hidden="true" />
    <span className="rounded-full bg-sky-500/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-sky-700">
      Official
    </span>
  </div>
);

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

  const providerDetails: Record<Provider, ProviderMeta> = useMemo(
    () => ({
      stripe: {
        title: t("stripeProviderTitle", "Stripe · Plăți internaționale"),
        subtitle: t(
          "stripeProviderSubtitle",
          "Ideal pentru carduri globale, Apple Pay și Google Pay"
        ),
        gradient: "from-indigo-950/70 via-indigo-900/50 to-indigo-900/25",
        border: "border-indigo-300/40",
        chipTone:
          "border-indigo-200/60 bg-indigo-300/10 text-indigo-50 shadow-indigo-500/10",
        icon: (
          <div className="rounded-xl bg-indigo-500/15 p-2 text-indigo-100 ring-1 ring-indigo-200/40">
            <ShieldCheck className="h-5 w-5" aria-hidden />
          </div>
        ),
        helperChips: [
          t("stripeChipInstant", "Plată instant, fără SMS"),
          t("stripeChipWallets", "Apple Pay & Google Pay"),
          t("stripeChipSecurity", "Protecție Stripe Radar"),
        ],
        logo: <StripeMark />,
      },
      netopia: {
        title: t("netopiaProviderTitle", "Netopia · Plăți rapide în România"),
        subtitle: t(
          "netopiaProviderSubtitle",
          "Card bancar, SMS sau portofel mobilPay pentru clienții locali"
        ),
        gradient: "from-sky-950/70 via-slate-900/55 to-slate-900/25",
        border: "border-sky-300/45",
        chipTone:
          "border-sky-200/60 bg-sky-300/10 text-sky-50 shadow-sky-500/10",
        icon: (
          <div className="rounded-xl bg-sky-500/15 p-2 text-sky-100 ring-1 ring-sky-200/40">
            <CreditCard className="h-5 w-5" aria-hidden />
          </div>
        ),
        helperChips: [
          t("netopiaChipLocal", "Optimizat pentru carduri din România"),
          t("netopiaChipSms", "Opțiune SMS & portofel mobilPay"),
          t("netopiaChipSecure", "3D Secure & GDPR compliant"),
        ],
        logo: <NetopiaMark />,
      },
    }),
    [t]
  );

  const groupedMethods = useMemo(() => {
    const providerOrder: Provider[] = ["stripe", "netopia"];

    return providerOrder
      .map(provider => {
        const providerMethods = paymentMethods.filter(
          method => method.provider === provider
        );

        if (providerMethods.length === 0) return null;

        return {
          provider,
          methods: providerMethods,
          meta: providerDetails[provider],
        };
      })
      .filter(Boolean) as Array<{
      provider: Provider;
      methods: PaymentMethodItem[];
      meta: ProviderMeta;
    }>;
  }, [paymentMethods, providerDetails]);

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
        className="space-y-6"
      >
        {groupedMethods.map(group => {
          const { provider, methods, meta } = group;

          return (
            <div
              key={provider}
              className={cn(
                "relative overflow-hidden rounded-2xl border p-4 sm:p-5 shadow-lg backdrop-blur",
                meta.border,
                "bg-gradient-to-br",
                meta.gradient
              )}
            >
              <div className="pointer-events-none absolute inset-0 opacity-60 blur-3xl" />
              <div className="relative z-10">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    {meta.icon}
                    <div>
                      <p className="text-lg font-semibold text-slate-50">
                        {meta.title}
                      </p>
                      <p className="text-sm text-slate-200/80">{meta.subtitle}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-start gap-2 sm:items-end">
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      {provider === "stripe" ? (
                        <>
                          <span className="flex items-center gap-1 rounded-full border border-indigo-300/40 bg-indigo-500/15 px-3 py-1 text-xs font-semibold text-indigo-50">
                            <Globe2 className="h-3.5 w-3.5" aria-hidden />
                            {t("globalPayments", "Global payments")}
                          </span>
                          <span className="flex items-center gap-1 rounded-full border border-indigo-200/40 bg-indigo-400/10 px-3 py-1 text-xs font-semibold text-indigo-50">
                            <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
                            {t("stripeSecure", "Stripe secure")}
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="flex items-center gap-1 rounded-full border border-sky-300/40 bg-sky-500/15 px-3 py-1 text-xs font-semibold text-sky-50">
                            <Smartphone className="h-3.5 w-3.5" aria-hidden />
                            {t("localPreferred", "Recomandat în România")}
                          </span>
                          <span className="flex items-center gap-1 rounded-full border border-sky-200/40 bg-sky-400/10 px-3 py-1 text-xs font-semibold text-sky-50">
                            <Sparkles className="h-3.5 w-3.5" aria-hidden />
                            {t("netopiaBadge", "Netopia Payments")}
                          </span>
                        </>
                      )}
                    </div>
                    <div className="flex items-center justify-end">{meta.logo}</div>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  {methods.map(method => {
                    const isSelected = selectedPaymentMethod === method.id;
                    const isStripe = method.provider === "stripe";

                    return (
                      <div
                        key={method.id}
                        className={cn(
                          "relative flex items-start gap-3 rounded-xl border p-4 transition-all duration-200",
                          isSelected
                            ? "border-white/60 bg-white/10 shadow-xl shadow-black/20 ring-2 ring-white/35"
                            : "border-white/10 bg-white/5 hover:-translate-y-0.5 hover:border-white/25 hover:bg-white/10",
                          isStripe ? "backdrop-blur-sm" : "backdrop-blur-sm"
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
                                  <span className="rounded-full border border-white/20 bg-indigo-500/20 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-indigo-50">
                                    Stripe
                                  </span>
                                )}
                                {method.provider === "netopia" && (
                                  <span className="rounded border border-sky-400/40 bg-sky-500/20 px-2 py-0.5 text-xs text-sky-50">
                                    🇷🇴 Netopia
                                  </span>
                                )}
                                {isSelected && (
                                  <span className="rounded-full border border-emerald-300/60 bg-emerald-400/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-emerald-50">
                                    {t("selected", "Selectat")}
                                  </span>
                                )}
                              </div>
                            </Label>
                            {method.fee ? (
                              <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-slate-100">
                                {method.fee}
                              </span>
                            ) : null}
                          </div>
                          {method.description && (
                            <div className="mt-1 text-sm text-slate-200/90">
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
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {meta.helperChips.map(text => (
                    <span
                      key={text}
                      className={cn(
                        "rounded-full px-3 py-1 text-xs font-semibold shadow-sm",
                        meta.chipTone
                      )}
                    >
                      {text}
                    </span>
                  ))}
                </div>

                {provider === "stripe" && (
                  <div className="mt-4">
                    <StripeLogoBadge />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </RadioGroup>
    </div>
  );
});
