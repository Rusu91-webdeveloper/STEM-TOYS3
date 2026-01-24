"use client";

import {
  CreditCard,
  Loader2,
  ShieldCheck,
  Sparkles,
  Banknote,
  Check,
  Smartphone,
  Wallet,
} from "lucide-react";
import React, { useEffect, useMemo } from "react";

import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useCart } from "@/features/cart";
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
  badgeVariant?: "recommended" | "popular" | "saved";
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
  const { items: cartItems } = useCart();
  const stripeEnabled = process.env.NEXT_PUBLIC_STRIPE_ENABLED !== "false";
  const netopiaEnabled = process.env.NEXT_PUBLIC_NETOPIA_ENABLED === "true";

  // Check if cart contains only digital books (no physical items)
  const isDigitalOnlyCart = cartItems.length > 0 && cartItems.every(item => item.isBook);

  // Get card logo or icon based on card type
  const getCardIcon = (cardType: string) => {
    switch (cardType.toLowerCase()) {
      case "visa":
        return (
          <div className="flex h-6 items-center justify-center rounded bg-[#1A1F71] px-1.5">
            <span className="text-[10px] font-bold italic text-white tracking-tight">VISA</span>
          </div>
        );
      case "mastercard":
        return (
          <div className="flex h-6 w-8 items-center justify-center">
            <div className="relative flex">
              <div className="h-4 w-4 rounded-full bg-[#EB001B]" />
              <div className="h-4 w-4 -ml-2 rounded-full bg-[#F79E1B] opacity-80" />
            </div>
          </div>
        );
      case "amex":
        return (
          <div className="flex h-6 items-center justify-center rounded bg-[#006FCF] px-1">
            <span className="text-[9px] font-bold text-white">AMEX</span>
          </div>
        );
      default:
        return <CreditCard className="h-5 w-5 text-slate-600" />;
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
            fee: t("stripeSavedCardFee", "Fără taxe"),
            description: t(
              "stripeSavedCardDescription",
              "Plată instant cu cardul salvat"
            ),
            badge: t("stripeOnFile", "Salvat"),
            badgeVariant: "saved",
            color: "violet",
            borderColor: "border-violet-200",
            bgColor: "bg-violet-50",
          });
        });
      }

      methods.push({
        id: "stripe_new",
        type: "new_card",
        name: t("useNewCard", "Folosește un card nou"),
        icon: <ShieldCheck className="h-6 w-6" />,
        provider: "stripe",
        fee: t("stripeFee", "0% taxe"),
        description: t(
          "stripeSecurePayment",
          "Visa, Mastercard, Apple Pay, Google Pay"
        ),
        badge: t("recommended", "Recomandat"),
        badgeVariant: "recommended",
        color: "violet",
        borderColor: "border-violet-200",
        bgColor: "bg-violet-50",
      });
    }

    if (netopiaEnabled) {
      if (isRomanianUser) {
        methods.push(
          {
            id: "netopia_card",
            type: "netopia_card",
            name: "Card bancar",
            icon: <CreditCard className="h-6 w-6" />,
            provider: "netopia",
            fee: "1.5%",
            description: "Plată securizată cu card Visa sau Mastercard",
            color: "blue",
            borderColor: "border-blue-200",
            bgColor: "bg-blue-50",
          },
          {
            id: "netopia_sms",
            type: "netopia_sms",
            name: "Plată prin SMS",
            icon: <Smartphone className="h-6 w-6" />,
            provider: "netopia",
            fee: "2.0%",
            description: "Primești SMS cu link securizat de plată",
            color: "blue",
            borderColor: "border-blue-200",
            bgColor: "bg-blue-50",
          },
          {
            id: "netopia_wallet",
            type: "netopia_wallet",
            name: "Portofel mobilPay",
            icon: <Wallet className="h-6 w-6" />,
            provider: "netopia",
            fee: "1.2%",
            description: "Plată rapidă din portofelul electronic",
            color: "blue",
            borderColor: "border-blue-200",
            bgColor: "bg-blue-50",
          }
        );
      } else {
        methods.push({
          id: "netopia_card",
          type: "netopia_card",
          name: "Credit/Debit Card",
          icon: <CreditCard className="h-6 w-6" />,
          provider: "netopia",
          fee: "1.5%",
          description: "Secure payment with Visa or Mastercard",
          color: "blue",
          borderColor: "border-blue-200",
          bgColor: "bg-blue-50",
        });
      }
    }

    // Add COD option for Romanian users, but only if cart contains physical items
    // Digital books only should not allow COD (cash on delivery)
    if (isRomanianUser && !isDigitalOnlyCart) {
      methods.push({
        id: "cash_on_delivery",
        type: "cash_on_delivery",
        name: "Ramburs",
        icon: <Banknote className="h-6 w-6" />,
        provider: "cod",
        fee: "3% + 5 RON",
        description: "Plătești numerar la primirea coletului",
        badge: t("codPopular", "Popular în România"),
        badgeVariant: "popular",
        color: "amber",
        borderColor: "border-amber-200",
        bgColor: "bg-amber-50",
      });
    }

    return methods;
  }, [isRomanianUser, isDigitalOnlyCart, netopiaEnabled, savedCards, stripeEnabled, t, cartItems]);


  useEffect(() => {
    if (paymentMethods.length === 0) {
      return;
    }

    // If COD is selected but cart is digital-only, switch to first available method
    if (selectedPaymentMethod === "cash_on_delivery" && isDigitalOnlyCart) {
      const nonCODMethod = paymentMethods.find(m => m.id !== "cash_on_delivery");
      if (nonCODMethod) {
        onPaymentMethodChange(nonCODMethod.id);
      }
      return;
    }

    const hasSelection = paymentMethods.some(
      method => method.id === selectedPaymentMethod
    );

    if (!hasSelection) {
      onPaymentMethodChange(paymentMethods[0].id);
    }
  }, [paymentMethods, selectedPaymentMethod, onPaymentMethodChange, isDigitalOnlyCart]);

  if (isLoadingCards) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
          <p className="text-sm text-slate-500">Se încarcă metodele de plată...</p>
        </div>
      </div>
    );
  }

  // Badge styling based on variant
  const getBadgeStyles = (variant?: "recommended" | "popular" | "saved") => {
    switch (variant) {
      case "recommended":
        return "bg-gradient-to-r from-violet-500 to-purple-500 text-white";
      case "popular":
        return "bg-gradient-to-r from-amber-500 to-orange-500 text-white";
      case "saved":
        return "bg-gradient-to-r from-emerald-500 to-teal-500 text-white";
      default:
        return "bg-slate-100 text-slate-600";
    }
  };

  // Provider chip styling
  const getProviderStyles = (provider: Provider) => {
    switch (provider) {
      case "stripe":
        return {
          bg: "bg-violet-100",
          text: "text-violet-700",
          icon: <ShieldCheck className="h-3.5 w-3.5" />,
          label: "Stripe",
        };
      case "netopia":
        return {
          bg: "bg-blue-100",
          text: "text-blue-700",
          icon: <CreditCard className="h-3.5 w-3.5" />,
          label: "Netopia",
        };
      case "cod":
        return {
          bg: "bg-amber-100",
          text: "text-amber-700",
          icon: <Banknote className="h-3.5 w-3.5" />,
          label: "Ramburs",
        };
    }
  };

  // Color config for each payment method type
  const getColorConfig = (color: string, isSelected: boolean) => {
    const configs: Record<string, { icon: string; ring: string; bg: string; border: string; selectedBg: string }> = {
      violet: {
        icon: "text-violet-600",
        ring: "ring-violet-500",
        bg: "bg-violet-50",
        border: "border-violet-200",
        selectedBg: "bg-violet-50",
      },
      blue: {
        icon: "text-blue-600",
        ring: "ring-blue-500",
        bg: "bg-blue-50",
        border: "border-blue-200",
        selectedBg: "bg-blue-50",
      },
      amber: {
        icon: "text-amber-600",
        ring: "ring-amber-500",
        bg: "bg-amber-50",
        border: "border-amber-200",
        selectedBg: "bg-amber-50",
      },
    };
    return configs[color] || configs.violet;
  };

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/25">
          <CreditCard className="h-5 w-5 text-white" />
        </div>
        <div>
          <Label className="block text-lg font-semibold text-slate-800">
            {t("selectPaymentMethod", "Metodă de plată")}
          </Label>
          <p className="text-sm text-slate-500">
            {t("paymentMethodSubtitle", "Alege cum dorești să plătești")}
          </p>
        </div>
      </div>

      {/* Payment Methods Grid */}
      <RadioGroup
        value={selectedPaymentMethod}
        onValueChange={onPaymentMethodChange}
        className="grid gap-3"
      >
        {paymentMethods.map(method => {
          const isSelected = selectedPaymentMethod === method.id;
          const colorConfig = getColorConfig(method.color, isSelected);
          const providerStyles = getProviderStyles(method.provider);

          return (
            <label
              key={method.id}
              htmlFor={`payment-${method.id}`}
              className={cn(
                "group relative flex cursor-pointer rounded-2xl border-2 bg-white p-4 transition-all duration-200",
                isSelected
                  ? `${colorConfig.border} ${colorConfig.ring} ring-2 shadow-lg`
                  : "border-slate-200 hover:border-slate-300 hover:shadow-md",
              )}
            >
              {/* Selection indicator */}
              <div className={cn(
                "absolute right-4 top-4 flex h-6 w-6 items-center justify-center rounded-full transition-all duration-200",
                isSelected
                  ? "bg-gradient-to-br from-violet-500 to-purple-600 shadow-md"
                  : "border-2 border-slate-300 bg-white"
              )}>
                {isSelected && <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />}
              </div>

              {/* Hidden radio input */}
              <RadioGroupItem
                value={method.id}
                id={`payment-${method.id}`}
                className="sr-only"
              />

              {/* Card content */}
              <div className="flex flex-1 items-start gap-4">
                {/* Icon container */}
                <div className={cn(
                  "flex h-14 w-14 shrink-0 items-center justify-center rounded-xl transition-colors",
                  isSelected ? colorConfig.bg : "bg-slate-100 group-hover:bg-slate-50"
                )}>
                  <div className={cn(
                    "transition-colors",
                    isSelected ? colorConfig.icon : "text-slate-500 group-hover:text-slate-600"
                  )}>
                    {method.icon}
                  </div>
                </div>

                {/* Text content */}
                <div className="min-w-0 flex-1 pr-8">
                  {/* Method name + badge row */}
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-slate-800">
                      {method.name}
                    </h3>
                    {method.badge && (
                      <span className={cn(
                        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
                        getBadgeStyles(method.badgeVariant)
                      )}>
                        {method.badge}
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  {method.description && (
                    <p className="mt-1 text-sm text-slate-500 line-clamp-2">
                      {method.description}
                    </p>
                  )}

                  {/* Saved card holder name */}
                  {method.type === "saved_card" && (
                    <p className="mt-1 text-xs text-slate-400">
                      {savedCards.find(card => card.id === method.id)?.cardholderName}
                    </p>
                  )}

                  {/* Footer: Provider + Fee */}
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {/* Provider chip */}
                    <span className={cn(
                      "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
                      providerStyles.bg,
                      providerStyles.text
                    )}>
                      {providerStyles.icon}
                      {providerStyles.label}
                    </span>

                    {/* Fee chip */}
                    {method.fee && (
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                        {method.fee}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </label>
          );
        })}
      </RadioGroup>

      {/* Security footer */}
      <div className="flex items-center justify-center gap-2 rounded-xl bg-slate-50 px-4 py-3">
        <ShieldCheck className="h-4 w-4 text-emerald-500" />
        <p className="text-xs text-slate-500">
          {t("securePayment", "Plățile tale sunt protejate și criptate end-to-end")}
        </p>
      </div>
    </div>
  );
});
