"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

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

  // Format price according to the current currency
  const formatPrice = (price: number): string => {
    const convertedPrice = price * currency.exchangeRate;

    // Format based on currency
    if (currency.code === "RON") {
      return `${convertedPrice.toFixed(2)} ${currency.symbol}`;
    }
    return `${currency.symbol}${convertedPrice.toFixed(2)}`;
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
