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

import { fetchShippingQuotes, fetchShippingSettings } from "../lib/checkoutApi";
import { fetchFanboxPickupPoints, FanboxPickupPoint } from "../lib/checkoutApi";
import {
  LockerAddressSnapshot,
  ShippingAddress,
  ShippingMethod,
} from "../types";
import { checkFreeShipping } from "@/lib/shipping/shipping-price-resolver";
import { DEFAULT_COURIERS } from "@/lib/shipping/couriers";
import { FanboxMapPicker } from "./FanboxMapPicker";

interface ShippingMethodSelectorProps {
  initialMethod?: ShippingMethod;
  shippingAddress?: ShippingAddress;
  onSubmit: (input: {
    method: ShippingMethod;
    lockerId?: string;
    lockerAddressSnapshot?: LockerAddressSnapshot | null;
  }) => void;
  onBack: () => void;
}

export function ShippingMethodSelector({
  initialMethod,
  shippingAddress,
  onSubmit,
  onBack,
}: ShippingMethodSelectorProps) {
  const defaultMethodId =
    initialMethod?.id ||
    (() => {
      const courier =
        DEFAULT_COURIERS.find(c => c.enabled) || DEFAULT_COURIERS[0];
      const service =
        courier?.services?.find(s => s.enabled !== false) ||
        courier?.services?.[0];
      return courier && service ? `${courier.id}:${service.id}` : "home";
    })();
  const [selectedMethodId, setSelectedMethodId] =
    useState<string>(defaultMethodId);
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingFanbox, setIsLoadingFanbox] = useState(false);
  const [freeShippingApplied, setFreeShippingApplied] = useState(false);
  const [freeShippingThreshold, setFreeShippingThreshold] = useState<
    number | null
  >(null);
  const [fanboxPoints, setFanboxPoints] = useState<FanboxPickupPoint[]>([]);
  const [fanboxError, setFanboxError] = useState<string | null>(null);
  const [selectedFanboxId, setSelectedFanboxId] = useState<string>("");
  const [selectionError, setSelectionError] = useState<string | null>(null);
  const { formatPrice } = useCurrency();
  const { t } = useTranslation();
  const { items: cartItems, getCartTotal } = useCart();

  const isDigitalOnlyCart =
    cartItems.length > 0 && cartItems.every(item => item.isBook);

  const methodRequiresLocker = (method?: ShippingMethod | null) => {
    if (!method) return false;
    if (method.requiresLocker) return true;
    const id = method.id.toLowerCase();
    return id.includes("fanbox") || id.includes("easybox");
  };

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
        const quoteResponse = await fetchShippingQuotes();
        const settings = await fetchShippingSettings();

        // Get cart total to check free shipping threshold
        const cartTotal = getCartTotal();
        const isFreeShipping = checkFreeShipping(cartTotal, settings);

        // Extract threshold value for display
        const thresholdValue = settings?.freeThreshold?.active
          ? parseFloat(settings.freeThreshold.price || "0")
          : null;

        let methods: ShippingMethod[] = [];

        if (quoteResponse?.methods?.length) {
          methods = quoteResponse.methods.map(
            (method: {
              id: string;
              name: string;
              description: string;
              estimatedDelivery: string;
              price: number;
              courierId?: string;
              serviceId?: string;
              methodType?: "home" | "easybox";
              requiresLocker?: boolean;
            }) => ({
              id: method.id,
              name: method.name,
              description: method.description,
              estimatedDelivery: method.estimatedDelivery,
              courierId: method.courierId,
              serviceId: method.serviceId,
              methodType: method.methodType,
              requiresLocker: Boolean(method.requiresLocker),
              // Apply free shipping if threshold is exceeded
              price: isFreeShipping ? 0 : method.price,
            })
          );
        } else {
          const deliveryPrice = settings.deliveryPrice?.active
            ? parseFloat(settings.deliveryPrice.price || "15.00")
            : 15.0;

          const finalPrice = isFreeShipping ? 0 : deliveryPrice;

          const configuredCouriers =
            settings?.couriers && Array.isArray(settings.couriers)
              ? settings.couriers
              : DEFAULT_COURIERS;

          const fallbackMethods: ShippingMethod[] = configuredCouriers
            .filter((courier: any) => courier.enabled !== false)
            .flatMap((courier: any) =>
              (courier.services || [])
                .filter((service: any) => service.enabled !== false)
                .map((service: any) => ({
                  id: `${courier.id}:${service.id}`,
                  name: service.name,
                  description: service.description,
                  courierId: courier.id,
                  serviceId: service.id,
                  methodType: service.methodType,
                  requiresLocker:
                    courier.id === "fancourier" &&
                    service.methodType === "easybox",
                  price:
                    service.priceOverride !== undefined &&
                    service.priceOverride !== null &&
                    service.priceOverride !== ""
                      ? Number(service.priceOverride)
                      : finalPrice,
                  estimatedDelivery: service.estimatedDelivery,
                }))
            );

          methods.push(...fallbackMethods);
        }

        // Set free shipping state based on threshold check
        setFreeShippingApplied(isFreeShipping);
        setFreeShippingThreshold(thresholdValue);
        setShippingMethods(methods);

        const currentMethodExists = methods.some(
          method => method.id === selectedMethodId
        );
        if (!selectedMethodId || !currentMethodExists) {
          setSelectedMethodId(methods[0]?.id || defaultMethodId);
        }
      } catch (error) {
        console.error("Error loading shipping settings:", error);

        // Even in fallback, check free shipping based on cart total
        const cartTotal = getCartTotal();
        // Can't check threshold without settings, use default threshold of 199
        const defaultThreshold = 199;
        const isFreeShipping = cartTotal >= defaultThreshold;

        const fallbackMethods: ShippingMethod[] = DEFAULT_COURIERS.filter(
          courier => courier.enabled !== false
        ).flatMap(courier =>
          courier.services
            .filter(service => service.enabled !== false)
            .map(service => ({
              id: `${courier.id}:${service.id}`,
              name: service.name,
              description: service.description,
              courierId: courier.id,
              serviceId: service.id,
              methodType: service.methodType,
              requiresLocker:
                courier.id === "fancourier" && service.methodType === "easybox",
              price: isFreeShipping
                ? 0
                : service.methodType === "easybox"
                  ? 19
                  : 25,
              estimatedDelivery: service.estimatedDelivery,
            }))
        );

        setShippingMethods(fallbackMethods);
        setFreeShippingApplied(isFreeShipping);
        setFreeShippingThreshold(isFreeShipping ? defaultThreshold : null);
        if (!selectedMethodId) {
          setSelectedMethodId(defaultMethodId);
        }
      } finally {
        setIsLoading(false);
      }
    }

    loadShippingSettings();
  }, [t, isDigitalOnlyCart, getCartTotal]);

  useEffect(() => {
    const selectedMethod = shippingMethods.find(
      method => method.id === selectedMethodId
    );

    if (!methodRequiresLocker(selectedMethod)) {
      setFanboxPoints([]);
      setFanboxError(null);
      setSelectedFanboxId("");
      return;
    }

    if (!shippingAddress?.state || !shippingAddress?.city) {
      setFanboxPoints([]);
      setFanboxError(
        t(
          "fanboxAddressRequired",
          "Completează județul și localitatea pentru a vedea FANbox-urile disponibile."
        )
      );
      return;
    }

    let isActive = true;
    setIsLoadingFanbox(true);
    setFanboxError(null);

    fetchFanboxPickupPoints({
      state: shippingAddress.state,
      city: shippingAddress.city,
      // Intentionally omit postalCode to show FANbox options for the entire city
      // (not only for the exact street/postal code).
    })
      .then(result => {
        if (!isActive) return;

        if (!result.configured) {
          setFanboxPoints([]);
          setFanboxError(
            t(
              "fanboxTemporarilyUnavailable",
              "FANbox nu este disponibil momentan. Alege livrare la adresă."
            )
          );
          return;
        }

        setFanboxPoints(result.points);
        if (result.points.length === 0) {
          setFanboxError(
            t(
              "fanboxNoPointsForAddress",
              "Nu am găsit FANbox disponibil în orașul selectat. Alege livrare la adresă."
            )
          );
        } else {
          setFanboxError(
            result.fallbackUsed
              ? t(
                  "fanboxAddressFallback",
                  "Nu am găsit FANbox exact pe adresa ta. Alege unul din lista extinsă."
                )
              : null
          );
          setSelectedFanboxId(prev =>
            prev && result.points.some(point => point.id === prev)
              ? prev
              : result.points[0].id
          );
        }
      })
      .catch(() => {
        if (!isActive) return;
        setFanboxPoints([]);
        setFanboxError(
          t(
            "fanboxFetchError",
            "Nu am putut încărca FANbox-urile pentru adresa ta. Te rugăm să încerci din nou."
          )
        );
      })
      .finally(() => {
        if (isActive) setIsLoadingFanbox(false);
      });

    return () => {
      isActive = false;
    };
  }, [selectedMethodId, shippingMethods, shippingAddress, t]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedMethod = shippingMethods.find(
      method => method.id === selectedMethodId
    );
    if (selectedMethod) {
      if (methodRequiresLocker(selectedMethod)) {
        const selectedFanbox = fanboxPoints.find(
          point => point.id === selectedFanboxId
        );
        if (!selectedFanbox) {
          setSelectionError(
            t(
              "fanboxSelectionRequired",
              "Selectează un FANbox înainte să continui."
            )
          );
          return;
        }

        setSelectionError(null);
        onSubmit({
          method: selectedMethod,
          lockerId: selectedFanbox.id,
          lockerAddressSnapshot: {
            id: selectedFanbox.id,
            name: selectedFanbox.name,
            county: selectedFanbox.county,
            locality: selectedFanbox.locality,
            address: selectedFanbox.address,
            postalCode: selectedFanbox.postalCode,
            latitude: selectedFanbox.latitude,
            longitude: selectedFanbox.longitude,
          },
        });
        return;
      }

      setSelectionError(null);
      onSubmit({
        method: selectedMethod,
        lockerId: undefined,
        lockerAddressSnapshot: null,
      });
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
            onValueChange={value => {
              setSelectedMethodId(value);
              setSelectionError(null);
            }}
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
                    {method.price === 0 && freeShippingApplied && (
                      <p className="mt-1 text-xs text-emerald-300">
                        Transport gratuit pentru comenzi peste{" "}
                        {formatPrice(freeShippingThreshold || 199)}!
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

        {methodRequiresLocker(
          shippingMethods.find(method => method.id === selectedMethodId)
        ) && (
          <div className="mt-4 rounded-xl border border-sky-300/30 bg-sky-500/10 p-4">
            <Label className="mb-2 block text-sm font-semibold text-sky-100">
              Selectează FANbox pentru adresa ta
            </Label>

            {isLoadingFanbox ? (
              <div className="flex items-center gap-2 text-sm text-sky-200">
                <Loader2 className="h-4 w-4 animate-spin" />
                Se încarcă FANbox-urile disponibile...
              </div>
            ) : fanboxError ? (
              <p className="text-sm text-amber-200">{fanboxError}</p>
            ) : (
              <FanboxMapPicker
                points={fanboxPoints}
                selectedId={selectedFanboxId}
                countyHint={shippingAddress?.state}
                localityHint={shippingAddress?.city}
                onSelect={point => {
                  setSelectedFanboxId(point.id);
                  setSelectionError(null);
                }}
              />
            )}
          </div>
        )}

        {selectionError && (
          <p className="mt-3 text-sm font-medium text-rose-300">
            {selectionError}
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
