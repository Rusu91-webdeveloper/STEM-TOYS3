/**
 * Currency conversion utilities for the STEM Toys platform
 * Handles conversion between EUR and RON
 */

export const EXCHANGE_RATES = {
  EUR_TO_RON: 5.0, // 1 EUR = 5 RON
  RON_TO_EUR: 0.2, // 1 RON = 0.2 EUR
} as const;

export type Currency = "EUR" | "RON";

/**
 * Convert price from one currency to another
 */
export function convertCurrency(
  amount: number,
  fromCurrency: Currency,
  toCurrency: Currency
): number {
  if (fromCurrency === toCurrency) {
    return amount;
  }

  if (fromCurrency === "EUR" && toCurrency === "RON") {
    return amount * EXCHANGE_RATES.EUR_TO_RON;
  }

  if (fromCurrency === "RON" && toCurrency === "EUR") {
    return amount * EXCHANGE_RATES.RON_TO_EUR;
  }

  return amount;
}

/**
 * Format price with currency symbol
 */
export function formatPriceWithCurrency(
  amount: number,
  currency: Currency,
  showSymbol: boolean = true
): string {
  const formattedAmount = amount.toFixed(2);

  if (!showSymbol) {
    return formattedAmount;
  }

  switch (currency) {
    case "EUR":
      return `€${formattedAmount}`;
    case "RON":
      return `${formattedAmount} RON`;
    default:
      return formattedAmount;
  }
}

/**
 * Get display price for admin dashboard
 * Shows original price and converted price if different
 */
export function getDisplayPrice(
  price: number,
  currency: Currency,
  targetCurrency: Currency = "RON"
): {
  original: string;
  converted?: string;
  isConverted: boolean;
} {
  const original = formatPriceWithCurrency(price, currency);

  if (currency === targetCurrency) {
    return {
      original,
      isConverted: false,
    };
  }

  const convertedAmount = convertCurrency(price, currency, targetCurrency);
  const converted = formatPriceWithCurrency(convertedAmount, targetCurrency);

  return {
    original,
    converted,
    isConverted: true,
  };
}

/**
 * Get currency symbol
 */
export function getCurrencySymbol(currency: Currency): string {
  switch (currency) {
    case "EUR":
      return "€";
    case "RON":
      return "RON";
    default:
      return "";
  }
}
