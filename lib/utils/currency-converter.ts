/**
 * Currency Conversion Utility for Netopia Payments
 * 
 * Netopia requires all payments to be in RON (Romanian Leu).
 * This utility helps convert from other currencies to RON.
 */

// Exchange rates (last updated: 2025-01-01)
// These should be fetched from an API in production
const EXCHANGE_RATES: Record<string, number> = {
  RON: 1.0,
  EUR: 4.97, // 1 EUR = 4.97 RON (approximate)
  USD: 4.55, // 1 USD = 4.55 RON (approximate)
  GBP: 5.75, // 1 GBP = 5.75 RON (approximate)
};

export interface CurrencyConversionResult {
  originalAmount: number;
  originalCurrency: string;
  convertedAmount: number;
  convertedCurrency: string;
  exchangeRate: number;
  note?: string;
}

/**
 * Convert an amount from one currency to RON
 * 
 * @param amount - The amount to convert
 * @param fromCurrency - The source currency (EUR, USD, GBP, RON)
 * @returns Conversion result with converted amount in RON
 */
export function convertToRON(
  amount: number,
  fromCurrency: string
): CurrencyConversionResult {
  const currency = fromCurrency.toUpperCase();
  
  // If already in RON, no conversion needed
  if (currency === "RON") {
    return {
      originalAmount: amount,
      originalCurrency: currency,
      convertedAmount: amount,
      convertedCurrency: "RON",
      exchangeRate: 1.0,
    };
  }
  
  // Get exchange rate
  const exchangeRate = EXCHANGE_RATES[currency];
  
  if (!exchangeRate) {
    console.warn(`⚠️  [CURRENCY] Unsupported currency: ${currency}`);
    console.warn("   Supported currencies: RON, EUR, USD, GBP");
    throw new Error(
      `Currency conversion failed: ${currency} is not supported. Supported currencies are: RON, EUR, USD, GBP.`
    );
  }
  
  // Convert to RON
  const convertedAmount = Math.round(amount * exchangeRate * 100) / 100;
  
  console.log(`💱 [CURRENCY] Converting ${amount} ${currency} to RON`);
  console.log(`   Exchange Rate: 1 ${currency} = ${exchangeRate} RON`);
  console.log(`   Converted Amount: ${convertedAmount} RON`);
  
  return {
    originalAmount: amount,
    originalCurrency: currency,
    convertedAmount,
    convertedCurrency: "RON",
    exchangeRate,
    note: "Exchange rates are approximate and may vary. The final amount will be charged in RON.",
  };
}

/**
 * Check if a currency is supported for conversion to RON
 * 
 * @param currency - The currency code to check
 * @returns true if the currency is supported
 */
export function isSupportedCurrency(currency: string): boolean {
  return currency.toUpperCase() in EXCHANGE_RATES;
}

/**
 * Get all supported currencies
 * 
 * @returns Array of supported currency codes
 */
export function getSupportedCurrencies(): string[] {
  return Object.keys(EXCHANGE_RATES);
}

/**
 * Get the exchange rate for a currency to RON
 * 
 * @param currency - The currency code
 * @returns The exchange rate, or undefined if not supported
 */
export function getExchangeRate(currency: string): number | undefined {
  return EXCHANGE_RATES[currency.toUpperCase()];
}

/**
 * Format an amount with currency symbol
 * 
 * @param amount - The amount to format
 * @param currency - The currency code
 * @returns Formatted string with currency symbol
 */
export function formatCurrency(amount: number, currency: string): string {
  const formatted = new Intl.NumberFormat("ro-RO", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
  
  return formatted;
}

/**
 * Prepare order data for Netopia by converting to RON if needed
 * 
 * @param amount - The order amount
 * @param currency - The order currency
 * @returns Object with amount in RON and conversion info
 */
export function prepareNetopiaAmount(
  amount: number,
  currency: string
): {
  amountInRON: number;
  currency: "RON";
  conversionInfo?: CurrencyConversionResult;
} {
  if (currency.toUpperCase() === "RON") {
    return {
      amountInRON: amount,
      currency: "RON",
    };
  }
  
  const conversion = convertToRON(amount, currency);
  
  return {
    amountInRON: conversion.convertedAmount,
    currency: "RON",
    conversionInfo: conversion,
  };
}

/**
 * Update exchange rates (should be called periodically in production)
 * This would typically fetch from an API like European Central Bank or similar
 * 
 * @param rates - Object with currency codes as keys and rates as values
 */
export function updateExchangeRates(rates: Partial<Record<string, number>>): void {
  console.log("📊 [CURRENCY] Updating exchange rates...");
  
  Object.entries(rates).forEach(([currency, rate]) => {
    if (rate && rate > 0) {
      EXCHANGE_RATES[currency.toUpperCase()] = rate;
      console.log(`   ${currency.toUpperCase()}: ${rate}`);
    }
  });
  
  console.log("✅ [CURRENCY] Exchange rates updated");
}

