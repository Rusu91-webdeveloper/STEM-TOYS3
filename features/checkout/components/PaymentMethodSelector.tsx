"use client";

import {
  CreditCard,
  Loader2,
  ShieldCheck,
  Banknote,
  Check,
  Info,
  Lock,
} from "lucide-react";
import React, { useEffect, useMemo } from "react";

import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useCart } from "@/features/cart";
import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { ShippingMethod } from "../types";

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
  /** Whether the current user has admin role. */
  isAdmin?: boolean;
  /** Mirrors backend `CHECKOUT_ADMIN_ONLY` gate from `/api/checkout/settings`. */
  checkoutAdminOnly?: boolean;
  /** Currently selected shipping method (used for payment constraints). */
  shippingMethod?: ShippingMethod;
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
  badgeVariant?: "recommended" | "popular" | "saved" | "unavailable";
  disabled?: boolean;
  disabledReason?: string;
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
  isAdmin = false,
  checkoutAdminOnly = false,
  shippingMethod,
}: PaymentMethodSelectorProps) {
  const { t } = useTranslation();
  const { items: cartItems } = useCart();
  const isCheckoutRestricted = checkoutAdminOnly && !isAdmin;
  const stripeEnabled =
    !isCheckoutRestricted && process.env.NEXT_PUBLIC_STRIPE_ENABLED !== "false";
  const netopiaEnabled =
    !isCheckoutRestricted && process.env.NEXT_PUBLIC_NETOPIA_ENABLED === "true";
  const codEnabled = !isCheckoutRestricted;
  const codBlockedByFanbox = useMemo(() => {
    if (!shippingMethod) return false;
    if (shippingMethod.requiresLocker) return true;
    if (shippingMethod.methodType === "easybox") return true;
    const methodId = (shippingMethod.id || "").toLowerCase();
    return methodId.includes("fanbox") || methodId.includes("easybox");
  }, [shippingMethod]);
  const codBlockedByMixedSupplier = useMemo(() => {
    return Boolean(
      shippingMethod?.isMixedSupplierCart || shippingMethod?.requiresPrepaid
    );
  }, [shippingMethod]);

  // Check if cart contains only digital books (no physical items)
  const isDigitalOnlyCart =
    cartItems.length > 0 && cartItems.every(item => item.isBook);

  // Get card logo or icon based on card type
  const getCardIcon = (cardType: string) => {
    switch (cardType.toLowerCase()) {
      case "visa":
        return (
          <div className="flex h-6 items-center justify-center rounded bg-[#1A1F71] px-1.5">
            <span className="text-[10px] font-bold italic text-white tracking-tight">
              VISA
            </span>
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
      // Netopia v2 API only supports card payments
      methods.push({
        id: "netopia_card",
        type: "netopia_card",
        name: isRomanianUser ? "Card bancar" : "Credit/Debit Card",
        icon: <CreditCard className="h-6 w-6" />,
        provider: "netopia",
        fee: "1.5%",
        description: isRomanianUser
          ? "Plată securizată cu card Visa sau Mastercard"
          : "Secure payment with Visa or Mastercard",
        color: "blue",
        borderColor: "border-blue-200",
        bgColor: "bg-blue-50",
      });
    }

    const codDisabledReason = codBlockedByFanbox
      ? t(
          "codUnavailableLocker",
          "Pentru livrarea la FANbox, plata ramburs nu este disponibilă."
        )
      : codBlockedByMixedSupplier
        ? t(
            "codUnavailableMixedSupplier",
            "Produsele din această comandă sunt expediate de la furnizori diferiți, iar rambursul nu este disponibil. Finalizează comanda prin plată online cu cardul."
          )
        : undefined;

    // Show COD for Romanian physical carts, but keep it disabled when business rules require prepaid.
    if (codEnabled && isRomanianUser && !isDigitalOnlyCart) {
      methods.push({
        id: "cash_on_delivery",
        type: "cash_on_delivery",
        name: "Ramburs",
        icon: <Banknote className="h-6 w-6" />,
        provider: "cod",
        fee: "3% + 5 RON",
        description: "Plătești numerar la primirea coletului",
        badge: codDisabledReason
          ? t("codUnavailableBadge", "Doar card online")
          : t("codPopular", "Popular în România"),
        badgeVariant: codDisabledReason ? "unavailable" : "popular",
        disabled: Boolean(codDisabledReason),
        disabledReason: codDisabledReason,
        color: "amber",
        borderColor: "border-amber-200",
        bgColor: "bg-amber-50",
      });
    }

    return methods;
  }, [
    isRomanianUser,
    isDigitalOnlyCart,
    codBlockedByFanbox,
    codBlockedByMixedSupplier,
    netopiaEnabled,
    codEnabled,
    savedCards,
    stripeEnabled,
    t,
  ]);

  useEffect(() => {
    if (paymentMethods.length === 0) {
      return;
    }

    const selectedMethod = paymentMethods.find(
      method => method.id === selectedPaymentMethod
    );

    if (selectedMethod?.disabled) {
      const firstEnabledMethod = paymentMethods.find(
        method => !method.disabled
      );
      if (firstEnabledMethod) {
        onPaymentMethodChange(firstEnabledMethod.id);
      }
      return;
    }

    const hasSelection = paymentMethods.some(
      method => method.id === selectedPaymentMethod
    );

    if (!hasSelection) {
      const firstEnabledMethod = paymentMethods.find(
        method => !method.disabled
      );
      onPaymentMethodChange(firstEnabledMethod?.id || paymentMethods[0].id);
    }
  }, [
    paymentMethods,
    selectedPaymentMethod,
    onPaymentMethodChange,
    isDigitalOnlyCart,
    codBlockedByFanbox,
    codBlockedByMixedSupplier,
  ]);

  if (isLoadingCards) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
          <p className="text-sm text-slate-500">
            Se încarcă metodele de plată...
          </p>
        </div>
      </div>
    );
  }

  if (paymentMethods.length === 0) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-center">
        <p className="font-medium text-amber-800">
          {t(
            "checkoutTemporarilyDisabled",
            "Checkout is temporarily unavailable"
          )}
        </p>
        <p className="mt-2 text-sm text-amber-700">
          {isCheckoutRestricted
            ? t(
                "checkoutTemporarilyDisabledDescription",
                "Only administrators can place orders during this testing period. Please try again later."
              )
            : t(
                "checkoutNoPaymentMethodsDescription",
                "No payment methods are currently available for your checkout details."
              )}
        </p>
      </div>
    );
  }

  // Badge styling based on variant
  const getBadgeStyles = (
    variant?: "recommended" | "popular" | "saved" | "unavailable"
  ) => {
    switch (variant) {
      case "recommended":
        return "border border-violet-200 bg-violet-50 text-violet-700";
      case "popular":
        return "border border-amber-200 bg-amber-50 text-amber-700";
      case "saved":
        return "border border-emerald-200 bg-emerald-50 text-emerald-700";
      case "unavailable":
        return "border border-rose-200 bg-rose-50 text-rose-700";
      default:
        return "border border-slate-200 bg-slate-50 text-slate-700";
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
  const getColorConfig = (color: string) => {
    const configs: Record<
      string,
      { icon: string; ring: string; bg: string; border: string }
    > = {
      violet: {
        icon: "text-violet-600",
        ring: "ring-violet-300",
        bg: "bg-violet-50",
        border: "border-violet-300",
      },
      blue: {
        icon: "text-blue-600",
        ring: "ring-blue-300",
        bg: "bg-blue-50",
        border: "border-blue-300",
      },
      amber: {
        icon: "text-amber-600",
        ring: "ring-amber-300",
        bg: "bg-amber-50",
        border: "border-amber-300",
      },
    };
    return configs[color] || configs.violet;
  };

  return (
    <div className="space-y-5">
      {/* Section Header */}
      <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 shadow-sm">
          <CreditCard className="h-5 w-5 text-white" />
        </div>
        <div className="min-w-0">
          <Label className="block text-base font-semibold text-slate-900 sm:text-lg">
            {t("selectPaymentMethod", "Metodă de plată")}
          </Label>
          <p className="text-sm text-slate-600">
            {t("paymentMethodSubtitle", "Alege cum dorești să plătești")}
          </p>
        </div>
      </div>

      {/* Payment Methods Grid */}
      {codBlockedByFanbox && (
        <div className="rounded-2xl border border-amber-300/80 bg-gradient-to-r from-amber-50 to-orange-50 px-4 py-3.5 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
              <Info className="h-4 w-4" />
            </div>
            <p className="text-sm leading-relaxed text-amber-900">
              {t(
                "codUnavailableLocker",
                "Pentru livrarea la FANbox, plata ramburs nu este disponibilă."
              )}
            </p>
          </div>
        </div>
      )}
      {codBlockedByMixedSupplier && (
        <div className="rounded-2xl border border-amber-300/80 bg-gradient-to-r from-amber-50 to-orange-50 px-4 py-3.5 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
              <Info className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center rounded-full border border-amber-300 bg-amber-100/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800">
                  {t("onlinePaymentRequiredBadge", "Plată online obligatorie")}
                </span>
                <p className="text-sm font-semibold text-amber-900">
                  {t("mixedSupplierOrderLabel", "Comandă cu livrare separată")}
                </p>
              </div>
              <p className="mt-1 text-sm leading-relaxed text-amber-800">
                {t(
                  "codUnavailableMixedSupplier",
                  "Produsele din această comandă sunt expediate de la furnizori diferiți, iar rambursul nu este disponibil. Finalizează comanda prin plată online cu cardul."
                )}
              </p>
            </div>
          </div>
        </div>
      )}
      <RadioGroup
        value={selectedPaymentMethod}
        onValueChange={value => {
          const selectedMethod = paymentMethods.find(
            method => method.id === value
          );
          if (selectedMethod?.disabled) return;
          onPaymentMethodChange(value);
        }}
        className="grid gap-3.5"
      >
        {paymentMethods.map(method => {
          const isSelected = selectedPaymentMethod === method.id;
          const isDisabled = method.disabled === true;
          const colorConfig = getColorConfig(method.color);
          const providerStyles = getProviderStyles(method.provider);

          return (
            <label
              key={method.id}
              htmlFor={`payment-${method.id}`}
              className={cn(
                "group relative flex rounded-2xl border px-4 py-4 transition-all duration-200 sm:px-5",
                isDisabled
                  ? "cursor-not-allowed border-slate-200 bg-slate-50/80 opacity-90"
                  : "cursor-pointer bg-white",
                !isDisabled &&
                  (isSelected
                    ? `${colorConfig.border} ${colorConfig.ring} ring-2 shadow-md`
                    : "border-slate-200 hover:border-slate-300 hover:shadow-sm")
              )}
            >
              {/* Selection indicator */}
              <div
                className={cn(
                  "absolute right-4 top-4 flex h-5 w-5 items-center justify-center rounded-full transition-all duration-200",
                  isDisabled
                    ? "border border-slate-300 bg-slate-100"
                    : isSelected
                      ? "bg-slate-900 shadow-sm"
                      : "border border-slate-300 bg-white"
                )}
              >
                {isDisabled ? (
                  <Lock className="h-2.5 w-2.5 text-slate-500" />
                ) : (
                  isSelected && (
                    <Check className="h-3 w-3 text-white" strokeWidth={3} />
                  )
                )}
              </div>

              {/* Hidden radio input */}
              <RadioGroupItem
                value={method.id}
                id={`payment-${method.id}`}
                disabled={isDisabled}
                className="sr-only"
              />

              {/* Card content */}
              <div className="flex flex-1 items-start gap-3.5 sm:gap-4">
                {/* Icon container */}
                <div
                  className={cn(
                    "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-colors sm:h-12 sm:w-12",
                    isDisabled
                      ? "bg-slate-100"
                      : isSelected
                        ? colorConfig.bg
                        : "bg-slate-100 group-hover:bg-slate-50"
                  )}
                >
                  <div
                    className={cn(
                      "transition-colors",
                      isDisabled
                        ? "text-slate-400"
                        : isSelected
                          ? colorConfig.icon
                          : "text-slate-500 group-hover:text-slate-600"
                    )}
                  >
                    {method.icon}
                  </div>
                </div>

                {/* Text content */}
                <div className="min-w-0 flex-1 pr-8">
                  {/* Method name + fee row */}
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <h3 className="text-sm font-semibold text-slate-900 sm:text-base">
                      {method.name}
                    </h3>
                    {method.fee && !isDisabled && (
                      <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                        {method.fee}
                      </span>
                    )}
                  </div>

                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    {method.badge && (
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                          getBadgeStyles(method.badgeVariant)
                        )}
                      >
                        {method.badge}
                      </span>
                    )}

                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                        providerStyles.bg,
                        providerStyles.text
                      )}
                    >
                      {providerStyles.icon}
                      {providerStyles.label}
                    </span>
                  </div>

                  {/* Description */}
                  {(method.description || method.disabledReason) && (
                    <p
                      className={cn(
                        "mt-2 text-sm leading-relaxed line-clamp-2",
                        isDisabled ? "text-slate-500" : "text-slate-600"
                      )}
                    >
                      {method.disabledReason || method.description}
                    </p>
                  )}

                  {/* Saved card holder name */}
                  {method.type === "saved_card" && (
                    <p className="mt-1.5 text-xs font-medium text-slate-500">
                      {
                        savedCards.find(card => card.id === method.id)
                          ?.cardholderName
                      }
                    </p>
                  )}
                </div>
              </div>
            </label>
          );
        })}
      </RadioGroup>

      {/* Security footer */}
      <div className="flex items-center justify-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50/70 px-4 py-2.5">
        <ShieldCheck className="h-4 w-4 text-emerald-600" />
        <p className="text-xs font-medium text-emerald-800">
          {t(
            "securePayment",
            "Plățile tale sunt protejate și criptate end-to-end"
          )}
        </p>
      </div>
    </div>
  );
});
