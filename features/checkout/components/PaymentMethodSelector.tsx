"use client";

import { Banknote, Info, Loader2, Lock } from "lucide-react";
import Link from "next/link";
import React, { useEffect, useMemo } from "react";

import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useCart } from "@/features/cart";
import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";

import {
  NetopiaPaymentRowLogo,
  StripePaymentRowLogo,
} from "./PaymentMethodBrandLogos";
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
  icon: React.ReactNode | null;
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
        icon: null,
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
        icon: null,
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
        return "border-rose-200 bg-rose-600 text-white";
      case "popular":
        return "border-rose-200 bg-rose-600 text-white";
      case "saved":
        return "border-emerald-200 bg-emerald-600 text-white";
      case "unavailable":
        return "border-slate-200 bg-slate-100 text-slate-600";
      default:
        return "border-slate-200 bg-slate-100 text-slate-600";
    }
  };

  const getMethodStyles = (provider: Provider) => {
    switch (provider) {
      case "stripe":
        return {
          iconBox: "border-slate-200 bg-white text-slate-700",
          meta: "text-slate-500",
        };
      case "netopia":
        return {
          iconBox: "border-slate-200 bg-white text-slate-700",
          meta: "text-slate-500",
        };
      case "cod":
        return {
          iconBox: "border-slate-200 bg-white text-slate-700",
          meta: "text-slate-500",
        };
      default:
        return {
          iconBox: "border-slate-200 bg-white text-slate-700",
          meta: "text-slate-500",
        };
    }
  };

  return (
    <div className="space-y-3.5">
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
        <div className="overflow-hidden rounded-2xl border border-amber-200/90 bg-gradient-to-br from-amber-50/95 via-white to-amber-50/40 shadow-[0_4px_20px_-10px_rgba(180,83,9,0.25)]">
          <div className="h-0.5 bg-gradient-to-r from-amber-400 to-orange-400" />
          <div className="px-4 py-4 sm:px-5 sm:py-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800 ring-1 ring-amber-200/60">
                <Info className="h-4 w-4" aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-slate-900">
                    {t("codSelectorPreviewTitle", "Ramburs la livrare")}
                  </p>
                  <span className="inline-flex items-center rounded-full border border-amber-200 bg-white/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-900">
                    {t("codInfoBadge", "Confirmare înainte de finalizare")}
                  </span>
                </div>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
                  {t(
                    "codSelectorPreviewBody",
                    "Plătești la curier la primire. Refuzul sau nepreluarea pot fi tratate ca retur (RTO); mai jos îți explicăm clar taxa ramburs, garanția pe card (dacă e cazul) și costurile posibile tur + retur."
                  )}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="inline-flex items-center rounded-lg border border-amber-100 bg-white/90 px-2.5 py-1 text-xs font-medium text-amber-950 shadow-sm">
                    {t("codInfoPointOne", "Nu plătești acum produsele")}
                  </span>
                  <span className="inline-flex items-center rounded-lg border border-amber-100 bg-white/90 px-2.5 py-1 text-xs font-medium text-amber-950 shadow-sm">
                    {t("codInfoPointTwo", "Refuzul poate genera cost logistic")}
                  </span>
                </div>
                <p className="mt-3 text-xs leading-relaxed text-slate-500">
                  {t("codSelectorPreviewLinksLead", "Documente:")}{" "}
                  <Link
                    href="/shipping"
                    className="font-semibold text-amber-900 underline decoration-amber-300 underline-offset-2 hover:text-amber-950"
                  >
                    {t("shippingPolicy", "Politica de livrare")}
                  </Link>
                  {", "}
                  <Link
                    href="/returns"
                    className="font-semibold text-amber-900 underline decoration-amber-300 underline-offset-2 hover:text-amber-950"
                  >
                    {t("returnsPolicy", "Politica de retur")}
                  </Link>
                  {", "}
                  <Link
                    href="/terms"
                    className="font-semibold text-amber-900 underline decoration-amber-300 underline-offset-2 hover:text-amber-950"
                  >
                    {t("termsAndConditions", "Termeni și Condiții")}
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-3 py-3 sm:px-5 sm:py-3.5">
          <Label className="block text-base font-semibold text-slate-900 sm:text-[17px]">
            {t("paymentOptionsTitle", "Payment options")}
          </Label>
          <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">
            {t("paymentOptionsSubtitle", "Please select a payment method.")}
          </p>
        </div>

        <RadioGroup
          value={selectedPaymentMethod}
          onValueChange={value => {
            const selectedMethod = paymentMethods.find(
              method => method.id === value
            );
            if (selectedMethod?.disabled) return;
            onPaymentMethodChange(value);
          }}
          className="divide-y divide-slate-200"
        >
          {paymentMethods.map(method => {
            const isSelected = selectedPaymentMethod === method.id;
            const isDisabled = method.disabled === true;
            const detailText = method.disabledReason ?? method.description;
            const methodStyles = getMethodStyles(method.provider);
            const trailingLabel = !isDisabled
              ? (method.badge ?? method.fee)
              : method.badge;

            return (
              <label
                key={method.id}
                htmlFor={`payment-${method.id}`}
                className={cn(
                  "block px-3 py-2.5 transition-colors sm:px-5 sm:py-3",
                  isDisabled
                    ? "cursor-not-allowed bg-slate-50/80 opacity-70"
                    : "cursor-pointer bg-white hover:bg-slate-50/70",
                  isSelected && !isDisabled && "bg-slate-50/80"
                )}
              >
                <RadioGroupItem
                  value={method.id}
                  id={`payment-${method.id}`}
                  disabled={isDisabled}
                  className="sr-only"
                />

                <div className="flex items-center gap-2.5 sm:gap-3">
                  <div
                    className={cn(
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 sm:h-6 sm:w-6",
                      isDisabled
                        ? "border-slate-300 bg-slate-100"
                        : isSelected
                          ? "border-primary bg-white"
                          : "border-slate-300 bg-white"
                    )}
                  >
                    {isDisabled ? (
                      <Lock className="h-3 w-3 text-slate-500" />
                    ) : (
                      <span
                        className={cn(
                          "h-2 w-2 rounded-full bg-primary transition-opacity sm:h-2.5 sm:w-2.5",
                          isSelected ? "opacity-100" : "opacity-0"
                        )}
                      />
                    )}
                  </div>

                  <div
                    className={cn(
                      "flex shrink-0 items-center justify-center rounded-lg border",
                      methodStyles.iconBox,
                      method.provider === "stripe" || method.provider === "netopia"
                        ? "h-9 min-h-9 w-[min(100%,6.25rem)] min-w-[5rem] max-w-[6.5rem] sm:h-10 sm:min-h-10"
                        : "h-9 w-9 sm:h-10 sm:w-10"
                    )}
                  >
                    {method.provider === "stripe" ? (
                      <StripePaymentRowLogo />
                    ) : method.provider === "netopia" ? (
                      <NetopiaPaymentRowLogo />
                    ) : (
                      <div
                        className={cn("text-slate-700", methodStyles.meta)}
                      >
                        {React.isValidElement(method.icon)
                          ? React.cloneElement(
                              method.icon as React.ReactElement<{
                                className?: string;
                              }>,
                              {
                                className: "h-5 w-5 sm:h-[1.35rem] sm:w-[1.35rem]",
                              }
                            )
                          : method.icon}
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col items-start gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-2">
                      <p className="w-full text-sm font-medium leading-tight text-slate-900 sm:text-[15px] sm:leading-snug">
                        {method.name}
                      </p>

                      {trailingLabel && (
                        <span
                          className={cn(
                            "inline-flex max-w-full items-center rounded-md border px-1.5 py-0.5 text-[10px] font-semibold leading-none sm:shrink-0 sm:px-2 sm:py-0.5 sm:text-[11px]",
                            method.badge
                              ? getBadgeStyles(method.badgeVariant)
                              : "border-slate-200 bg-slate-50 text-slate-600"
                          )}
                        >
                          {trailingLabel}
                        </span>
                      )}
                    </div>

                    {detailText && (
                      <p className="mt-0.5 text-xs leading-snug text-slate-500 sm:text-[13px] sm:leading-relaxed">
                        {detailText}
                      </p>
                    )}
                  </div>
                </div>
              </label>
            );
          })}
        </RadioGroup>
      </div>
    </div>
  );
};

PaymentMethodSelectorComponent.displayName = "PaymentMethodSelector";

export const PaymentMethodSelector = React.memo(PaymentMethodSelectorComponent);
