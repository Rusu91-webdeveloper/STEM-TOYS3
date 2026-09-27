"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

import { formatStorefrontPrice } from "@/lib/format/storefront-price";

// Define available currencies
export const currencies = [
  { code: "RON", symbol: "lei", exchangeRate: 1 }, // RON as default
  { code: "EUR", symbol: "€", exchangeRate: 0.2 }, // Euro as secondary option
];

type CurrencyType = {
  code: string;
  symbol: string;
  exchangeRate: number;
};

type CurrencyContextType = {
  currency: CurrencyType;
  setCurrency: (currencyCode: string) => void;
  formatPrice: (price: number) => string;
};

const CurrencyContext = createContext<CurrencyContextType | undefined>(
  undefined
);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<CurrencyType>(currencies[0]);

  useEffect(() => {
    // Force RON for all areas since all prices are now stored in RON
    const ronCurrency = currencies.find(c => c.code === "RON") || currencies[0];
    setCurrencyState(ronCurrency);

    if (typeof window !== "undefined") {
      localStorage.setItem("currency", "RON");
    }
  }, []);

  // Set currency based on currency code - always force RON
  const setCurrency = (currencyCode: string) => {
    // Always force RON since all prices are now stored in RON
    const ronCurrency = currencies.find(c => c.code === "RON") || currencies[0];
    setCurrencyState(ronCurrency);

    if (typeof window !== "undefined") {
      localStorage.setItem("currency", "RON");
    }
  };

  // Shopper-facing lei amount. JSON-LD, Stripe, and Netopia keep raw numbers.
  const formatPrice = (price: number): string => {
    const convertedPrice = price * currency.exchangeRate;
    return formatStorefrontPrice(convertedPrice);
  };

  const value = {
    currency,
    setCurrency,
    formatPrice,
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}

// Hook to use currency
export function useCurrency() {
  const context = useContext(CurrencyContext);

  if (context === undefined) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }

  return context;
}
