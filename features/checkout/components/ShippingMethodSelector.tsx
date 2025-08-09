"use client";

import { Loader2, Truck, Gift } from "lucide-react";
import React, { useState, useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useCart } from "@/features/cart";
import { useCurrency } from "@/lib/currency";
import { useTranslation } from "@/lib/i18n";

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
  const { getCartTotal } = useCart();

  // Fetch shipping settings from the database
  useEffect(() => {
    async function loadShippingSettings() {
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
        // Fallback to default methods
        setShippingMethods([
          {
            id: "standard",
            name: t("standardShipping", "Standard Shipping"),
            description: t("deliveryIn35Days", "Delivery in 3-5 business days"),
            price: 5.99,
            estimatedDelivery: t("businessDays35", "3-5 business days"),
          },
          {
            id: "express",
            name: t("expressShipping", "Express Shipping"),
            description: t("deliveryIn12Days", "Delivery in 1-2 business days"),
            price: 12.99,
            estimatedDelivery: t("businessDays12", "1-2 business days"),
          },
          {
            id: "priority",
            name: t("priorityShipping", "Priority Shipping"),
            description: t("deliveryIn24Hours", "Delivery in 24 hours"),
            price: 19.99,
            estimatedDelivery: t("hours24", "24 hours"),
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    }

    loadShippingSettings();
  }, [t, getCartTotal]);

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
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        <p className="ml-2 text-indigo-600">
          {t("loadingShippingOptions", "Loading shipping options...")}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Free Shipping Banner */}
      {freeShippingApplied && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <Gift className="h-6 w-6 text-green-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-green-800">
                🎉 Transport Gratuit Aplicat!
              </h3>
              <p className="text-green-700 text-sm">
                Comanda ta depășește pragul de{" "}
                {formatPrice(freeShippingThreshold || 100)} - livrarea standard
                este gratuită! Pentru livrare mai rapidă, poți opta pentru
                express sau prioritar.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Truck className="h-5 w-5 text-indigo-600" />
          <h2 className="text-xl font-semibold">
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
            {shippingMethods.map(method => (
              <div
                key={method.id}
                className={`flex items-center space-x-2 border p-4 rounded-lg transition-all ${
                  selectedMethodId === method.id
                    ? "border-indigo-500 bg-indigo-50"
                    : "border-gray-200 hover:border-gray-300"
                } ${
                  freeShippingApplied
                    ? "bg-gradient-to-r from-green-50 to-emerald-50"
                    : ""
                }`}
              >
                <RadioGroupItem value={method.id} id={method.id} />
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <Label
                      htmlFor={method.id}
                      className="font-medium flex items-center space-x-2"
                    >
                      <span>{method.name}</span>
                      {freeShippingApplied && method.id === "priority" && (
                        <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                          Recomandat
                        </span>
                      )}
                    </Label>
                    <span
                      className={`font-medium ${
                        method.price === 0
                          ? "text-green-600 text-lg"
                          : "text-indigo-700"
                      }`}
                    >
                      {method.price === 0 ? (
                        <span className="flex items-center space-x-1">
                          <Gift className="h-4 w-4" />
                          <span>GRATUIT</span>
                        </span>
                      ) : (
                        formatPrice(method.price)
                      )}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">{method.description}</p>
                  <p className="text-sm text-gray-500">
                    {t("estimatedDelivery", "Estimated delivery")}:{" "}
                    {method.estimatedDelivery}
                  </p>
                  {method.price === 0 &&
                    method.id === "standard" &&
                    freeShippingApplied && (
                      <p className="text-xs text-green-600 mt-1">
                        Preț normal: {formatPrice(5.99)} - Economisești{" "}
                        {formatPrice(5.99)}!
                      </p>
                    )}
                </div>
              </div>
            ))}
          </RadioGroup>
        ) : (
          <p className="text-center text-gray-500 py-4">
            {t(
              "noShippingMethodsAvailable",
              "No shipping methods are currently available."
            )}
          </p>
        )}
      </div>

      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={onBack}>
          {t("backToShippingAddress", "Back to Shipping Address")}
        </Button>
        <Button
          type="submit"
          disabled={shippingMethods.length === 0}
          className={
            freeShippingApplied ? "bg-green-600 hover:bg-green-700" : ""
          }
        >
          {freeShippingApplied
            ? "Continuă cu Opțiunea Selectată"
            : t("continueToPayment", "Continue to Payment")}
        </Button>
      </div>
    </form>
  );
}
