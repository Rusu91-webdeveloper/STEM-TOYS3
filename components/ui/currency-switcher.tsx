"use client";

import { Coins } from "lucide-react";
import React, { useMemo, useState, useEffect } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Currency definitions
const CURRENCIES = [
  { code: "RON", symbol: "RON", name: "Romanian Leu" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "USD", symbol: "$", name: "US Dollar" },
];

interface CurrencySwitcherProps {
  allowedCodes?: string[]; // Optional: limit which currencies are shown (e.g., ["RON", "EUR"])
}

export function CurrencySwitcher({ allowedCodes }: CurrencySwitcherProps) {
  const [isClient, setIsClient] = useState(false);
  const [localCurrency, setLocalCurrency] = useState(CURRENCIES[0]);
  const [hasError, setHasError] = useState(false);

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
      try {
        const newCurrency =
          effectiveCurrencies.find(c => c.code === currencyCode) ??
          effectiveCurrencies[0];

        // Update local state
        setLocalCurrency(newCurrency);
        try {
          localStorage.setItem("currency", currencyCode);
        } catch (error) {
          console.warn("Failed to save currency to localStorage:", error);
        }

        // Refresh page if not in checkout
        if (
          typeof window !== "undefined" &&
          window.location.pathname &&
          !window.location.pathname.startsWith("/checkout")
        ) {
          try {
            window.location.reload();
          } catch (error) {
            console.warn("Failed to refresh page:", error);
          }
        }
      } catch (error) {
        console.error("Error switching currency:", error);
        setHasError(true);
      }
    },
    [effectiveCurrencies]
  );

  // Show error state if something went wrong
  if (hasError) {
    return (
      <Button
        variant="outline"
        size="sm"
        disabled
        className="flex items-center gap-1.5 h-9 px-3 bg-red-100 text-red-600 border-red-200"
      >
        <Coins className="h-4 w-4" />
        <span className="text-xs">Error</span>
      </Button>
    );
  }

  // Show loading state for SSR
  if (!isClient) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="flex items-center gap-1.5 h-9 px-3 bg-indigo-600 text-white border-indigo-600"
      >
        <Coins className="h-4 w-4" />
        <span className="text-xs">RON</span>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-1.5 h-9 px-3 bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700"
        >
          <Coins className="h-4 w-4" />
          <span className="text-xs">{localCurrency.code}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {effectiveCurrencies.map(currency => (
          <DropdownMenuItem
            key={currency.code}
            onClick={() => handleCurrencySwitch(currency.code)}
            className={`cursor-pointer ${
              localCurrency.code === currency.code
                ? "bg-indigo-50 text-indigo-700"
                : ""
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <span className="font-medium">{currency.symbol}</span>
              <span className="text-sm text-gray-600">{currency.name}</span>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
