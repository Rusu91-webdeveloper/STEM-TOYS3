"use client";

import {
  Banknote,
  Check,
  CreditCard,
  Info,
  Loader2,
  Lock,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
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
  orderTotal?: number;
  codThreshold?: number;
  userLocation?: string;
  userLocale?: string;
  billingCountry?: string;
  shippingCountry?: string;
  isAdmin?: boolean;
  checkoutAdminOnly?: boolean;
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
};

const isLockerDeliveryMethod = (method?: ShippingMethod): boolean => {
  if (!method) return false;
  if (method.requiresLocker) return true;
  if (method.methodType === "easybox") return true;
  const methodId = (method.id || "").toLowerCase();
  return methodId.includes("fanbox") || methodId.includes("easybox");
};

const PaymentMethodSelectorComponent = ({
  selectedPaymentMethod,
  onPaymentMethodChange,
  isLoadingCards,
  orderTotal = 0,
  codThreshold = 500,
  userLocation,
  userLocale,
  billingCountry,
  shippingCountry,
  isAdmin = false,
  checkoutAdminOnly = false,
  shippingMethod,
}: PaymentMethodSelectorProps) => {
  const { t } = useTranslation();
  const { items: cartItems } = useCart();
  const isCheckoutRestricted = checkoutAdminOnly && !isAdmin;
  const stripeEnabled =
    !isCheckoutRestricted && process.env.NEXT_PUBLIC_STRIPE_ENABLED !== "false";
  const netopiaEnabled =
    !isCheckoutRestricted && process.env.NEXT_PUBLIC_NETOPIA_ENABLED === "true";
  const codEnabled = !isCheckoutRestricted;

  const codBlockedByFanbox = useMemo(
    () => isLockerDeliveryMethod(shippingMethod),
    [shippingMethod]
  );
  const codBlockedByMixedSupplier = useMemo(
    () =>
      (shippingMethod?.isMixedSupplierCart ?? false) ||
      (shippingMethod?.requiresPrepaid ?? false),
    [shippingMethod]
  );
  const codBlockedByLimit = useMemo(
    () => orderTotal > codThreshold,
    [codThreshold, orderTotal]
  );

  const isDigitalOnlyCart =
    cartItems.length > 0 && cartItems.every(item => item.isBook);

  const isRomanianUser = useMemo(
    () =>
      userLocation === "RO" ||
      userLocation === "Romania" ||
      userLocale === "ro" ||
      userLocale === "ro-RO" ||
      billingCountry === "Romania" ||
      billingCountry === "RO" ||
      shippingCountry === "Romania" ||
      shippingCountry === "RO",
    [userLocation, userLocale, billingCountry, shippingCountry]
  );

  const paymentMethods = useMemo(() => {
    const methods: PaymentMethodItem[] = [];

    if (stripeEnabled) {
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
      });
    }

    if (netopiaEnabled) {
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
      });
    }

    const codDisabledReason = codBlockedByFanbox
      ? t(
          "codUnavailableLocker",
          "Pentru livrarea la FANbox, plata ramburs nu este disponibilă."
        )
      : codBlockedByLimit
        ? t(
            "codUnavailableThreshold",
            `Plata ramburs este disponibilă doar pentru comenzi de până la ${codThreshold.toFixed(0)} RON. Pentru această comandă trebuie să alegi plata online cu cardul.`
          )
        : !stripeEnabled
          ? t(
              "codUnavailableGuarantee",
              "Rambursul necesită autorizare garanție pe card. Activează plata cu cardul pentru a folosi COD."
            )
          : codBlockedByMixedSupplier
            ? t(
                "codUnavailableMixedSupplier",
                "Produsele din această comandă sunt expediate de la furnizori diferiți, iar rambursul nu este disponibil. Finalizează comanda prin plată online cu cardul."
              )
            : undefined;

    if (codEnabled && isRomanianUser && !isDigitalOnlyCart) {
      methods.push({
        id: "cash_on_delivery",
        type: "cash_on_delivery",
        name: t("cashOnDelivery", "Ramburs"),
        icon: <Banknote className="h-6 w-6" />,
        provider: "cod",
        fee: "3% + 5 RON",
        description: t(
          "codHomeMethodDescription",
          "Plătești la primirea coletului. Vezi condițiile înainte de finalizare."
        ),
        badge: codDisabledReason
          ? t("codUnavailableBadge", "Doar card online")
          : t("codPopular", "Popular în România"),
        badgeVariant: codDisabledReason ? "unavailable" : "popular",
        disabled: Boolean(codDisabledReason),
        disabledReason: codDisabledReason,
        color: "amber",
      });
    }

    return methods;
  }, [
    codBlockedByFanbox,
    codBlockedByLimit,
    codBlockedByMixedSupplier,
    codEnabled,
    codThreshold,
    isDigitalOnlyCart,
    isRomanianUser,
    netopiaEnabled,
    stripeEnabled,
    t,
  ]);

  const showCodOverview =
    paymentMethods.some(method => method.provider === "cod") &&
    selectedPaymentMethod === "cash_on_delivery";

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
      onPaymentMethodChange(firstEnabledMethod?.id ?? paymentMethods[0].id);
    }
  }, [
    codBlockedByFanbox,
    codBlockedByLimit,
    codBlockedByMixedSupplier,
    isDigitalOnlyCart,
    onPaymentMethodChange,
    paymentMethods,
    selectedPaymentMethod,
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

  const getBadgeStyles = (
    variant?: "recommended" | "popular" | "saved" | "unavailable"
  ) => {
    switch (variant) {
      case "recommended":
        return "border border-violet-200 bg-violet-50 text-violet-700";
      case "popular":
        return "border border-amber-200 bg-amber-50 text-amber-800";
      case "saved":
        return "border border-emerald-200 bg-emerald-50 text-emerald-700";
      case "unavailable":
        return "border border-rose-200 bg-rose-50 text-rose-700";
      default:
        return "border border-slate-200 bg-slate-100 text-slate-600";
    }
  };

  const getProviderStyles = (provider: Provider) => {
    switch (provider) {
      case "stripe":
        return {
          bg: "bg-violet-50",
          text: "text-violet-700",
          icon: <ShieldCheck className="h-3.5 w-3.5" />,
          label: "Stripe",
          borderAndGlow:
            "border-violet-300 bg-violet-50/50 shadow-[0_10px_30px_-18px_rgba(109,40,217,0.45)] ring-1 ring-violet-200",
        };
      case "netopia":
        return {
          bg: "bg-sky-50",
          text: "text-sky-700",
          icon: <CreditCard className="h-3.5 w-3.5" />,
          label: "Netopia",
          borderAndGlow:
            "border-sky-300 bg-sky-50/60 shadow-[0_10px_30px_-18px_rgba(14,116,144,0.35)] ring-1 ring-sky-200",
        };
      case "cod":
        return {
          bg: "bg-amber-50",
          text: "text-amber-800",
          icon: <Banknote className="h-3.5 w-3.5" />,
          label: t("cashOnDelivery", "Ramburs"),
          borderAndGlow:
            "border-amber-300 bg-amber-50/60 shadow-[0_10px_30px_-18px_rgba(217,119,6,0.35)] ring-1 ring-amber-200",
        };
      default:
        return {
          bg: "bg-slate-100",
          text: "text-slate-700",
          icon: <CreditCard className="h-3.5 w-3.5" />,
          label: "Payment",
          borderAndGlow:
            "border-slate-300 bg-slate-50 shadow-sm ring-1 ring-slate-200",
        };
    }
  };

  const getColorConfig = (color: string) => {
    const configs: Record<
      string,
      {
        icon: string;
        bg: string;
        border: string;
        checkBg: string;
        checkBorder: string;
      }
    > = {
      violet: {
        icon: "text-violet-700",
        bg: "bg-violet-50",
        border: "border-violet-200",
        checkBg: "bg-violet-600",
        checkBorder: "border-violet-600",
      },
      blue: {
        icon: "text-sky-700",
        bg: "bg-sky-50",
        border: "border-sky-200",
        checkBg: "bg-primary",
        checkBorder: "border-primary",
      },
      amber: {
        icon: "text-amber-800",
        bg: "bg-amber-50",
        border: "border-amber-200",
        checkBg: "bg-amber-600",
        checkBorder: "border-amber-600",
      },
    };
    return configs[color] || configs.violet;
  };

  return (
    <div className="space-y-3.5">
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <Label className="text-sm font-semibold text-slate-900">
          {t("selectPaymentMethod", "Selectează metoda de plată")}
        </Label>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-800">
          <ShieldCheck className="h-3.5 w-3.5" />
          {t("securePayment", "Plată securizată")}
        </span>
      </div>

      {codBlockedByFanbox && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/80 px-4 py-3">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
              <Info className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-amber-950">
                {t(
                  "codUnavailableLockerTitle",
                  "Ramburs indisponibil pentru FANbox"
                )}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-amber-900">
                {t(
                  "codUnavailableLocker",
                  "Pentru livrarea la FANbox, plata ramburs nu este disponibilă."
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      {codBlockedByMixedSupplier && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/80 px-4 py-3">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
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

      {codBlockedByLimit && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50/80 px-4 py-3">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-700">
              <Info className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-rose-950">
                {t(
                  "codThresholdBannerTitle",
                  "Ramburs indisponibil pentru această comandă"
                )}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-rose-800">
                {t(
                  "codThresholdBannerBody",
                  `Comenzile peste ${codThreshold.toFixed(0)} RON se finalizează doar cu plată online. Totalul curent este ${orderTotal.toFixed(2)} RON.`
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      {showCodOverview && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/70 px-4 py-3.5 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
              <Info className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-amber-950">
                  {t("codInfoTitle", "Ramburs la livrare")}
                </p>
                <span className="inline-flex items-center rounded-full border border-amber-200 bg-white px-2 py-0.5 text-[11px] font-medium text-amber-800">
                  {t("codInfoBadge", "Confirmare înainte de finalizare")}
                </span>
              </div>
              <p className="mt-1 text-sm leading-relaxed text-amber-800">
                {t(
                  "codInfoBody",
                  "Plătești la livrare. Dacă această comandă are risc logistic mai mare, îți vom cere și o autorizare temporară pe card, explicată clar mai jos."
                )}
              </p>
              <div className="mt-2.5 flex flex-wrap gap-2 text-xs">
                <span className="rounded-full bg-white px-2.5 py-1 font-medium text-amber-900">
                  {t("codInfoPointOne", "Nu plătești acum produsele")}
                </span>
                <span className="rounded-full bg-white px-2.5 py-1 font-medium text-amber-900">
                  {t("codInfoPointTwo", "Refuzul poate genera cost logistic")}
                </span>
              </div>
              <p className="mt-2 text-xs text-amber-900">
                Vezi{" "}
                <Link
                  href="/shipping"
                  className="font-semibold underline underline-offset-4 hover:text-amber-700"
                >
                  Politica de Livrare
                </Link>{" "}
                și{" "}
                <Link
                  href="/terms"
                  className="font-semibold underline underline-offset-4 hover:text-amber-700"
                >
                  Termeni și Condiții
                </Link>
                .
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
        className="grid gap-3 sm:gap-4"
      >
        {paymentMethods.map(method => {
          const isSelected = selectedPaymentMethod === method.id;
          const isDisabled = method.disabled === true;
          const colorConfig = getColorConfig(method.color);
          const providerStyles = getProviderStyles(method.provider);
          const detailText = method.disabledReason ?? method.description;

          return (
            <label
              key={method.id}
              htmlFor={`payment-${method.id}`}
              className={cn(
                "group relative flex gap-3 rounded-[24px] border px-4 py-4 transition-all duration-200 ease-out sm:gap-4 sm:px-5 sm:py-[18px]",
                isDisabled
                  ? "cursor-not-allowed border-slate-200 bg-slate-50 opacity-65"
                  : "cursor-pointer border-slate-200 bg-white shadow-[0_6px_20px_-16px_rgba(15,23,42,0.28)] hover:border-slate-300 hover:bg-slate-50/70 hover:shadow-[0_12px_24px_-20px_rgba(15,23,42,0.35)]",
                !isDisabled &&
                  (isSelected ? `${providerStyles.borderAndGlow} z-[1]` : "")
              )}
            >
              <div
                className={cn(
                  "mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-300",
                  isDisabled
                    ? "border-slate-300 bg-slate-200"
                    : isSelected
                      ? `${colorConfig.checkBorder} ${colorConfig.checkBg} scale-105 shadow-sm`
                      : "border-slate-300 bg-white group-hover:border-slate-400"
                )}
              >
                {isDisabled ? (
                  <Lock className="h-2.5 w-2.5 text-slate-600" />
                ) : (
                  <Check
                    className={cn(
                      "h-3 w-3 text-white transition-transform duration-300",
                      isSelected ? "scale-100 opacity-100" : "scale-0 opacity-0"
                    )}
                    strokeWidth={3}
                  />
                )}
              </div>

              <RadioGroupItem
                value={method.id}
                id={`payment-${method.id}`}
                disabled={isDisabled}
                className="sr-only"
              />

              <div className="flex flex-1 items-start gap-4">
                <div
                  className={cn(
                    "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border transition-all duration-200",
                    isDisabled
                      ? "border-slate-200 bg-slate-100"
                      : isSelected
                        ? `${colorConfig.bg} ${colorConfig.border} shadow-inner`
                        : "border-slate-200 bg-slate-50 group-hover:border-slate-300 group-hover:bg-white"
                  )}
                >
                  <div
                    className={cn(
                      "transition-all duration-300",
                      isDisabled
                        ? "text-slate-500"
                        : isSelected
                          ? `${colorConfig.icon} scale-110`
                          : "text-slate-500 group-hover:text-slate-700"
                    )}
                  >
                    {method.icon}
                  </div>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-[15px] font-semibold tracking-tight text-slate-900 sm:text-base">
                        {method.name}
                      </h3>
                      {detailText && (
                        <p
                          className={cn(
                            "mt-1 max-w-[98%] text-sm leading-relaxed",
                            isDisabled ? "text-slate-500" : "text-slate-600"
                          )}
                        >
                          {detailText}
                        </p>
                      )}
                    </div>
                    {method.fee && !isDisabled && (
                      <span className="inline-flex items-center rounded-xl border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                        {method.fee}
                      </span>
                    )}
                  </div>

                  <div className="mt-2.5 flex flex-wrap items-center gap-2">
                    {method.badge && (
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em]",
                          getBadgeStyles(method.badgeVariant)
                        )}
                      >
                        {method.badge}
                      </span>
                    )}

                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em]",
                        providerStyles.bg,
                        providerStyles.text
                      )}
                    >
                      {providerStyles.icon}
                      {providerStyles.label}
                    </span>
                  </div>
                </div>
              </div>
            </label>
          );
        })}
      </RadioGroup>

      <p className="px-1 text-xs leading-relaxed text-slate-500">
        {t(
          "paymentMethodsFootnote",
          "Metoda selectată este confirmată în pasul următor. Pentru ramburs, vezi întâi costurile și condițiile aferente."
        )}
      </p>
    </div>
  );
};

PaymentMethodSelectorComponent.displayName = "PaymentMethodSelector";

export const PaymentMethodSelector = React.memo(PaymentMethodSelectorComponent);
