"use client";

import { Coins } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import React, { useState, useEffect } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";


// Self-contained currencies - no external dependencies
const CURRENCIES = [
  { code: "RON", symbol: "lei", exchangeRate: 1 },
  { code: "EUR", symbol: "€", exchangeRate: 0.2 },
];

export function CurrencySwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const [isClient, setIsClient] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Local state for currency - no external dependencies
  const [localCurrency, setLocalCurrency] = useState(CURRENCIES[0]);

  // Try to use external currency context if available, but don't break if it's not
  let currencyContext = null;
  try {
    // Dynamic import to prevent build-time failures
    if (typeof window !== "undefined") {
      const { useCurrency } = require("@/lib/currency");
      currencyContext = useCurrency();
    }
  } catch (error) {
    // Silently continue without external context
    console.warn("Currency context not available, using local state:", error);
  }

  const contextCurrency = currencyContext?.currency;
  const contextSetCurrency = currencyContext?.setCurrency;

  useEffect(() => {
    setIsClient(true);

    // Initialize currency from localStorage if context is not available
    if (!currencyContext) {
      try {
        const storedCurrency = localStorage.getItem("currency");
        if (storedCurrency) {
          const found = CURRENCIES.find((c) => c.code === storedCurrency);
          if (found) {
            setLocalCurrency(found);
          }
        }
      } catch (error) {
        console.warn("Failed to load currency from localStorage:", error);
      }
    }
  }, [currencyContext]);

  // Determine current currency
  const currentCurrency = contextCurrency || localCurrency;

  const handleCurrencySwitch = React.useCallback(
    (currencyCode: string) => {
      try {
        const newCurrency =
          CURRENCIES.find((c) => c.code === currencyCode) || CURRENCIES[0];

        if (contextSetCurrency) {
          // Use context if available
          contextSetCurrency(currencyCode);
        } else {
          // Fallback to local state
          setLocalCurrency(newCurrency);
          try {
            localStorage.setItem("currency", currencyCode);
          } catch (error) {
            console.warn("Failed to save currency to localStorage:", error);
          }
        }

        // Refresh page if not in checkout
        if (router && pathname && !pathname.startsWith("/checkout")) {
          try {
            router.refresh();
          } catch (error) {
            console.warn("Failed to refresh router:", error);
          }
        }
      } catch (error) {
        console.error("Error switching currency:", error);
        setHasError(true);
      }
    },
    [contextSetCurrency, router, pathname]
  );

  // Show error state if something went wrong
  if (hasError) {
    return (
      <Button
        variant="outline"
        size="sm"
        disabled
        className="flex items-center gap-1.5 h-9 px-3 bg-red-100 text-red-600 border-red-200">
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
        className="flex items-center gap-1.5 h-9 px-3 bg-indigo-600 text-white border-indigo-600">
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
          className="flex items-center gap-1.5 h-9 px-3 bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700 hover:border-indigo-700 shadow-sm transition-all">
          <Coins className="h-4 w-4" />
          <span className="hidden md:inline-block text-xs font-medium">
            {currentCurrency?.code || "RON"}
          </span>
          <span className="inline-block md:hidden text-xs">
            {currentCurrency?.code || "RON"}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-40 bg-white border border-gray-200 shadow-lg rounded-md p-1">
        {CURRENCIES.map((currency) => (
          <DropdownMenuItem
            key={currency.code}
            onClick={() => handleCurrencySwitch(currency.code)}
            className={`cursor-pointer rounded-sm px-2 py-1.5 text-sm ${
              (currentCurrency?.code || "RON") === currency.code
                ? "font-medium bg-indigo-50 text-indigo-700"
                : "text-gray-700 hover:bg-gray-50"
            } transition-colors`}>
            <span className="mr-2 font-medium">{currency.code}</span>
            <span className="text-gray-500">({currency.symbol})</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
