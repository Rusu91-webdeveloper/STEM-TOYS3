"use client";

import { Loader2, Truck, Gift } from "lucide-react";
import React, { useState, useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useCart } from "@/features/cart";
import { useCurrency } from "@/lib/currency";
import { useTranslation } from "@/lib/i18n";
import { glassCardClass } from "@/features/home/components/homeTheme";
import { cn } from "@/lib/utils";

import { fetchShippingSettings } from "../lib/checkoutApi";
import { ShippingMethod } from "../types";

interface ShippingMethodSelectorProps {
  initialMethod?: ShippingMethod;
  onSubmit: (method: ShippingMethod) => void;
  onBack: () => void;
}

export function ShippingMethodSelector({
  initialMethod,
  onSubmit,
  onBack,
}: ShippingMethodSelectorProps) {
  const [selectedMethodId, setSelectedMethodId] = useState<string>(
    initialMethod?.id || "standard"
  );
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [freeShippingApplied, setFreeShippingApplied] = useState(false);
  const [freeShippingThreshold, setFreeShippingThreshold] = useState<
    number | null
  >(null);
  const { formatPrice } = useCurrency();
  const { t } = useTranslation();
  const { getCartTotal, items: cartItems } = useCart();

  const isDigitalOnlyCart =
    cartItems.length > 0 && cartItems.every(item => item.isBook);

  // Fetch shipping settings from the database
  useEffect(() => {
    async function loadShippingSettings() {
      if (isDigitalOnlyCart) {
        const digitalMethod: ShippingMethod = {
          id: "digital",
          name: t("digitalDelivery", "Digital Delivery"),
          description: t(
            "digitalDeliveryDescription",
            "Primești cartea pe email, fără livrare fizică"
          ),
          price: 0,
          estimatedDelivery: t("instantDelivery", "Livrare instant"),
        };

        setShippingMethods([digitalMethod]);
        setSelectedMethodId("digital");
        setFreeShippingApplied(true);
        setFreeShippingThreshold(null);
        setIsLoading(false);
        return;
      }

      try {
        const settings = await fetchShippingSettings();
        const cartTotal = getCartTotal();

        // Check if free shipping applies
        let isFreeShipping = false;
        let threshold = null;

        if (settings.freeThreshold?.active) {
          threshold = parseFloat(settings.freeThreshold.price);
          isFreeShipping = cartTotal >= threshold;
          setFreeShippingThreshold(threshold);
        }

        setFreeShippingApplied(isFreeShipping);

        // Create shipping methods array from settings
        const methods: ShippingMethod[] = [];

        // Add standard shipping if active
        if (settings.standard?.active) {
          // Apply free shipping only to standard shipping if threshold is met
          const standardPrice = isFreeShipping
            ? 0
            : parseFloat(settings.standard.price);
          methods.push({
            id: "standard",
            name: t("standardShipping", "Standard Shipping"),
            description: t("deliveryIn35Days", "Delivery in 3-5 business days"),
            price: standardPrice,
            estimatedDelivery: t("businessDays35", "3-5 business days"),
          });
        }

        // Add express shipping if active
        if (settings.express?.active) {
          methods.push({
            id: "express",
            name: t("expressShipping", "Express Shipping"),
            description: t("deliveryIn12Days", "Delivery in 1-2 business days"),
            price: parseFloat(settings.express.price),
            estimatedDelivery: t("businessDays12", "1-2 business days"),
          });
        }

        // Add priority shipping (hardcoded for now)
        methods.push({
          id: "priority",
          name: t("priorityShipping", "Priority Shipping"),
          description: t("deliveryIn24Hours", "Delivery in 24 hours"),
          price: 19.99,
          estimatedDelivery: t("hours24", "24 hours"),
        });

        setShippingMethods(methods);

        // Only auto-select if no method is currently selected or current selection is invalid
        if (methods.length > 0) {
          const currentMethodExists = methods.some(
            m => m.id === selectedMethodId
          );
          if (!selectedMethodId || !currentMethodExists) {
            // If free shipping applies, suggest standard method but don't force it
            if (isFreeShipping) {
              const standardMethod = methods.find(m => m.id === "standard");
              if (standardMethod) {
                setSelectedMethodId("standard");
              }
            } else {
              setSelectedMethodId(methods[0].id);
            }
          }
        }
      } catch (error) {
        console.error("Error loading shipping settings:", error);
        // Fallback to default methods from store settings
        const defaultSettings = {
          standard: { price: "5.99", active: true },
          express: { price: "12.99", active: true },
          freeThreshold: { price: "250.00", active: true },
        };

        const cartTotal = getCartTotal();
        let isFreeShipping = false;
        let threshold = null;

        if (defaultSettings.freeThreshold?.active) {
          threshold = parseFloat(defaultSettings.freeThreshold.price);
          isFreeShipping = cartTotal >= threshold;
          setFreeShippingThreshold(threshold);
        }

        setFreeShippingApplied(isFreeShipping);

        const methods: ShippingMethod[] = [];

        // Add standard shipping if active
        if (defaultSettings.standard?.active) {
          const standardPrice = isFreeShipping
            ? 0
            : parseFloat(defaultSettings.standard.price);
          methods.push({
            id: "standard",
            name: t("standardShipping", "Standard Shipping"),
            description: t("deliveryIn35Days", "Delivery in 3-5 business days"),
            price: standardPrice,
            estimatedDelivery: t("businessDays35", "3-5 business days"),
          });
        }

        // Add express shipping if active
        if (defaultSettings.express?.active) {
          methods.push({
            id: "express",
            name: t("expressShipping", "Express Shipping"),
            description: t("deliveryIn12Days", "Delivery in 1-2 business days"),
            price: parseFloat(defaultSettings.express.price),
            estimatedDelivery: t("businessDays12", "1-2 business days"),
          });
        }

        setShippingMethods(methods);

        // Only auto-select if no method is currently selected or current selection is invalid
        if (methods.length > 0) {
          const currentMethodExists = methods.some(
            m => m.id === selectedMethodId
          );
          if (!selectedMethodId || !currentMethodExists) {
            // If free shipping applies, suggest standard method but don't force it
            if (isFreeShipping) {
              const standardMethod = methods.find(m => m.id === "standard");
              if (standardMethod) {
                setSelectedMethodId("standard");
              }
            } else {
              setSelectedMethodId(methods[0].id);
            }
          }
        }
      } finally {
        setIsLoading(false);
      }
    }

    loadShippingSettings();
  }, [t, getCartTotal, isDigitalOnlyCart]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedMethod = shippingMethods.find(
      method => method.id === selectedMethodId
    );
    if (selectedMethod) {
      onSubmit(selectedMethod);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-slate-100">
        <Loader2 className="h-8 w-8 animate-spin text-sky-300" />
        <p className="ml-2 text-sky-200">
          {t("loadingShippingOptions", "Loading shipping options...")}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Free Shipping Banner */}
      {freeShippingApplied && (
      <div className="mb-6 rounded-2xl border border-emerald-400/40 bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-sky-500/10 p-4 text-emerald-100 shadow-inner shadow-emerald-500/20">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <Gift className="h-6 w-6 text-emerald-300" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-emerald-100">
                🎉 Transport Gratuit Aplicat!
              </h3>
              <p className="text-sm text-emerald-100/90">
                Comanda ta depășește pragul de{" "}
                {formatPrice(freeShippingThreshold || 100)} - livrarea standard
                este gratuită! Pentru livrare mai rapidă, poți opta pentru
                express sau prioritar.
              </p>
            </div>
          </div>
        </div>
      )}

      <div
        className={`${glassCardClass} border-white/10 bg-slate-900/70 p-6 text-slate-100 shadow-lg shadow-black/20`}
      >
        <div className="mb-4 flex items-center gap-2">
          <Truck className="h-5 w-5 text-sky-300" />
          <h2 className="text-xl font-semibold text-slate-100">
            {freeShippingApplied
              ? "Alege Viteza de Livrare"
              : t("shippingMethod", "Shipping Method")}
          </h2>
        </div>

        {shippingMethods.length > 0 ? (
          <RadioGroup
            value={selectedMethodId}
            onValueChange={setSelectedMethodId}
            className="space-y-4"
          >
            {shippingMethods.map(method => {
              const isSelected = selectedMethodId === method.id;

              return (
                <div
                  key={method.id}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl border p-4 transition-all duration-200",
                    isSelected
                      ? "border-sky-400 bg-sky-500/20 shadow-lg shadow-sky-500/20"
                      : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10",
                    freeShippingApplied && method.id === "priority"
                      ? "border-amber-400/30 bg-amber-500/10"
                      : ""
                  )}
                >
                  <RadioGroupItem
                    value={method.id}
                    id={method.id}
                    className="border-white/40 text-sky-300"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <Label
                        htmlFor={method.id}
                        className="flex items-center gap-2 font-semibold text-slate-100"
                      >
                        <span>{method.name}</span>
                        {freeShippingApplied && method.id === "priority" && (
                          <span className="rounded-full border border-amber-300/60 bg-amber-500/10 px-2 py-0.5 text-xs text-amber-100">
                            Recomandat
                          </span>
                        )}
                      </Label>
                      <span
                        className={cn(
                          "font-semibold",
                          method.price === 0
                            ? "text-emerald-300 text-lg"
                            : "text-sky-200"
                        )}
                      >
                        {method.price === 0 ? (
                          <span className="flex items-center gap-1">
                            <Gift className="h-4 w-4" />
                            <span>GRATUIT</span>
                          </span>
                        ) : (
                          formatPrice(method.price)
                        )}
                      </span>
                    </div>
                    <p className="text-sm text-slate-300">
                      {method.description}
                    </p>
                    <p className="text-sm text-slate-300">
                      {t("estimatedDelivery", "Estimated delivery")}:{" "}
                      {method.estimatedDelivery}
                    </p>
                    {method.price === 0 &&
                      method.id === "standard" &&
                      freeShippingApplied && (
                        <p className="mt-1 text-xs text-emerald-300">
                          Preț normal: {formatPrice(5.99)} - Economisești{" "}
                          {formatPrice(5.99)}!
                        </p>
                      )}
                  </div>
                </div>
              );
            })}
          </RadioGroup>
        ) : (
          <p className="py-4 text-center text-slate-300">
            {t(
              "noShippingMethodsAvailable",
              "No shipping methods are currently available."
            )}
          </p>
        )}
      </div>

      <div className="flex justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          className="border-white/20 bg-white/5 text-slate-100 hover:border-white/30 hover:bg-white/10"
        >
          {t("backToShippingAddress", "Back to Shipping Address")}
        </Button>
        <Button
          type="submit"
          disabled={shippingMethods.length === 0}
          className={cn(
            "bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/25 transition",
            freeShippingApplied
              ? "from-emerald-500 via-sky-500 to-indigo-500 hover:from-emerald-400 hover:via-sky-400 hover:to-indigo-400"
              : "hover:from-sky-400 hover:via-indigo-400 hover:to-purple-400"
          )}
        >
          {freeShippingApplied
            ? "Continuă cu Opțiunea Selectată"
            : t("continueToPayment", "Continue to Payment")}
        </Button>
      </div>
    </form>
  );
}
