"use client";

import { Coins } from "lucide-react";
import React, { useMemo, useState, useEffect } from "react";

import { cn } from "@/lib/utils";

// Currency definitions
const CURRENCIES = [
  { code: "RON", symbol: "RON", name: "Romanian Leu" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "USD", symbol: "$", name: "US Dollar" },
];

interface MobileCurrencySelectorProps {
  allowedCodes?: string[]; // Optional: limit which currencies are shown (e.g., ["RON", "EUR"])
}

export function MobileCurrencySelector({
  allowedCodes,
}: MobileCurrencySelectorProps) {
  const [isClient, setIsClient] = useState(false);
  const [localCurrency, setLocalCurrency] = useState(CURRENCIES[0]);

  // Compute the effective currency list based on allowedCodes (preserves default order)
  const effectiveCurrencies = useMemo(() => {
    if (!allowedCodes || allowedCodes.length === 0) return CURRENCIES;
    const allowed = new Set(allowedCodes);
    return CURRENCIES.filter(c => allowed.has(c.code));
  }, [allowedCodes]);

  useEffect(() => {
    setIsClient(true);

    // Initialize currency from localStorage, but clamp to allowed list
    try {
      const storedCurrency = localStorage.getItem("currency");
      if (storedCurrency) {
        const found = effectiveCurrencies.find(c => c.code === storedCurrency);
        setLocalCurrency(found ?? effectiveCurrencies[0]);
      } else {
        setLocalCurrency(effectiveCurrencies[0]);
      }
    } catch (error) {
      console.warn("Failed to load currency from localStorage:", error);
    }
  }, [effectiveCurrencies]);

  const handleCurrencySwitch = React.useCallback(
    (currencyCode: string) => {
      const newCurrency = effectiveCurrencies.find(
        c => c.code === currencyCode
      );
      if (!newCurrency || newCurrency.code === localCurrency.code) return;

      setLocalCurrency(newCurrency);

      // Save to localStorage
      try {
        localStorage.setItem("currency", newCurrency.code);
      } catch (error) {
        console.warn("Failed to save currency to localStorage:", error);
      }

      // Trigger a custom event so other components can listen
      if (typeof window !== "undefined") {
        const event = new CustomEvent("currencyChange", {
          detail: { currency: newCurrency.code },
        });
        window.dispatchEvent(event);
      }

      // Reload the page to update all prices
      window.location.reload();
    },
    [effectiveCurrencies, localCurrency.code]
  );

  // Show loading state during hydration
  if (!isClient) {
    return (
      <div className="w-full">
        <div className="flex items-center gap-2 mb-2 px-1">
          <div className="p-0.5 rounded bg-green-50">
            <Coins className="h-3 w-3 text-green-600" />
          </div>
          <span className="text-[10px] font-semibold text-gray-700 uppercase tracking-wider">
            Currency
          </span>
        </div>
        <div className="flex gap-2">
          {effectiveCurrencies.map(currency => (
            <button
              key={currency.code}
              type="button"
              disabled
              className="flex-1 flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-400 min-h-[52px] border-2 border-gray-200"
            >
              <span className="text-lg font-bold">{currency.symbol}</span>
              <span className="text-[10px] font-semibold">{currency.code}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 mb-2 px-1">
        <div className="p-0.5 rounded bg-green-50">
          <Coins className="h-3 w-3 text-green-600" />
        </div>
        <span className="text-[10px] font-semibold text-gray-700 uppercase tracking-wider">
          Currency
        </span>
      </div>
      <div className="flex gap-2">
        {effectiveCurrencies.map(currency => {
          const isActive = localCurrency.code === currency.code;
          return (
            <button
              key={currency.code}
              type="button"
              onClick={() => handleCurrencySwitch(currency.code)}
              className={cn(
                "flex-1 flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 min-h-[52px] touch-target border-2 relative",
                isActive
                  ? "bg-gradient-to-br from-green-500 to-green-600 text-white shadow-md border-green-400"
                  : "bg-white text-gray-700 hover:bg-gray-50 active:bg-gray-100 border-gray-200 hover:border-green-200 shadow-sm"
              )}
            >
              <span className="text-lg font-bold">{currency.symbol}</span>
              <span className="text-[10px] font-bold tracking-wide">
                {currency.code}
              </span>
              {isActive && (
                <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-green-300 rounded-full border border-white"></div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
