/**
 * Enhanced Currency Service
 * Handles dynamic currency conversion for Romanian market
 */

export interface CurrencyRate {
  from: string;
  to: string;
  rate: number;
  timestamp: number;
  source: string;
}

export interface CurrencyConversionResult {
  originalAmount: number;
  originalCurrency: string;
  convertedAmount: number;
  convertedCurrency: string;
  rate: number;
  markup: number;
  finalAmount: number;
  timestamp: number;
}

export class CurrencyService {
  private static instance: CurrencyService;
  private rates: Map<string, CurrencyRate> = new Map();
  private lastUpdate: number = 0;
  private readonly CACHE_DURATION = 60 * 60 * 1000; // 1 hour
  private readonly DEFAULT_MARKUP = 20; // 20% markup

  // Romanian market currency priorities
  private readonly SUPPORTED_CURRENCIES = [
    "RON", // Romanian Leu (primary)
    "EUR", // Euro (common in Romania)
    "USD", // US Dollar (international)
    "GBP", // British Pound (some imports)
    "CHF", // Swiss Franc (some imports)
  ];

  // Fallback rates (updated periodically)
  private readonly FALLBACK_RATES: Record<string, number> = {
    USD_RON: 4.52,
    EUR_RON: 4.95,
    GBP_RON: 5.68,
    CHF_RON: 5.12,
    RON_RON: 1.0,
  };

  private constructor() {
    this.loadFallbackRates();
  }

  public static getInstance(): CurrencyService {
    if (!CurrencyService.instance) {
      CurrencyService.instance = new CurrencyService();
    }
    return CurrencyService.instance;
  }

  /**
   * Convert price to RON with markup
   */
  async convertToRON(
    amount: number,
    fromCurrency: string,
    markupPercentage: number = this.DEFAULT_MARKUP
  ): Promise<CurrencyConversionResult> {
    try {
      // Normalize currency codes
      const normalizedFrom = fromCurrency.toUpperCase();
      const normalizedTo = "RON";

      // For testing, use fallback rates to avoid API calls
      if (process.env.NODE_ENV === "development") {
        return this.fallbackConversion(amount, fromCurrency, markupPercentage);
      }

      // Get current exchange rate
      const rate = await this.getExchangeRate(normalizedFrom, normalizedTo);

      // Convert to RON
      const convertedAmount = amount * rate;

      // Apply markup
      const finalAmount = convertedAmount * (1 + markupPercentage / 100);

      return {
        originalAmount: amount,
        originalCurrency: normalizedFrom,
        convertedAmount: Math.round(convertedAmount * 100) / 100,
        convertedCurrency: normalizedTo,
        rate: rate,
        markup: markupPercentage,
        finalAmount: Math.round(finalAmount * 100) / 100,
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error("Currency conversion failed:", error);
      // Fallback to simple conversion
      return this.fallbackConversion(amount, fromCurrency, markupPercentage);
    }
  }

  /**
   * Get current exchange rate
   */
  private async getExchangeRate(from: string, to: string): Promise<number> {
    const key = `${from}_${to}`;

    // Check if we have a recent cached rate
    if (this.rates.has(key)) {
      const rate = this.rates.get(key)!;
      if (Date.now() - rate.timestamp < this.CACHE_DURATION) {
        return rate.rate;
      }
    }

    // Try to fetch fresh rate
    try {
      const rate = await this.fetchExchangeRate(from, to);
      this.rates.set(key, rate);
      return rate.rate;
    } catch (error) {
      console.warn(
        "Failed to fetch fresh exchange rate, using fallback:",
        error
      );
      return this.FALLBACK_RATES[key] || 1;
    }
  }

  /**
   * Fetch exchange rate from external API
   */
  private async fetchExchangeRate(
    from: string,
    to: string
  ): Promise<CurrencyRate> {
    // Try multiple currency APIs for reliability
    const apis = [
      this.fetchFromExchangeRateAPI,
      this.fetchFromFixerIO,
      this.fetchFromCurrencyAPI,
    ];

    for (const api of apis) {
      try {
        const rate = await api(from, to);
        if (rate && rate.rate > 0) {
          return rate;
        }
      } catch (error) {
        console.warn(`Currency API failed:`, error);
        continue;
      }
    }

    throw new Error("All currency APIs failed");
  }

  /**
   * ExchangeRate-API.com (free tier)
   */
  private async fetchFromExchangeRateAPI(
    from: string,
    to: string
  ): Promise<CurrencyRate> {
    const response = await fetch(
      `https://api.exchangerate-api.com/v4/latest/${from}`,
      {
        headers: {
          "User-Agent": "STEM-TOYS3/1.0",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`ExchangeRate API error: ${response.status}`);
    }

    const data = await response.json();
    const rate = data.rates[to];

    if (!rate || rate <= 0) {
      throw new Error(`Invalid rate for ${from} to ${to}`);
    }

    return {
      from,
      to,
      rate,
      timestamp: Date.now(),
      source: "exchangerate-api.com",
    };
  }

  /**
   * Fixer.io (requires API key)
   */
  private async fetchFromFixerIO(
    from: string,
    to: string
  ): Promise<CurrencyRate> {
    const apiKey = process.env.FIXER_API_KEY;
    if (!apiKey) {
      throw new Error("Fixer.io API key not configured");
    }

    const response = await fetch(
      `https://api.fixer.io/latest?access_key=${apiKey}&base=${from}&symbols=${to}`,
      {
        headers: {
          "User-Agent": "STEM-TOYS3/1.0",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Fixer.io API error: ${response.status}`);
    }

    const data = await response.json();
    const rate = data.rates[to];

    if (!rate || rate <= 0) {
      throw new Error(`Invalid rate for ${from} to ${to}`);
    }

    return {
      from,
      to,
      rate,
      timestamp: Date.now(),
      source: "fixer.io",
    };
  }

  /**
   * CurrencyAPI.com (free tier)
   */
  private async fetchFromCurrencyAPI(
    from: string,
    to: string
  ): Promise<CurrencyRate> {
    const response = await fetch(
      `https://api.currencyapi.com/v3/latest?apikey=${process.env.CURRENCY_API_KEY}&currencies=${to}&base_currency=${from}`,
      {
        headers: {
          "User-Agent": "STEM-TOYS3/1.0",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`CurrencyAPI error: ${response.status}`);
    }

    const data = await response.json();
    const rate = data.data[to]?.value;

    if (!rate || rate <= 0) {
      throw new Error(`Invalid rate for ${from} to ${to}`);
    }

    return {
      from,
      to,
      rate,
      timestamp: Date.now(),
      source: "currencyapi.com",
    };
  }

  /**
   * Fallback conversion using cached rates
   */
  private fallbackConversion(
    amount: number,
    fromCurrency: string,
    markupPercentage: number
  ): CurrencyConversionResult {
    const normalizedFrom = fromCurrency.toUpperCase();
    const normalizedTo = "RON";
    const key = `${normalizedFrom}_${normalizedTo}`;
    const rate = this.FALLBACK_RATES[key] || 1;

    const convertedAmount = amount * rate;
    const finalAmount = convertedAmount * (1 + markupPercentage / 100);

    return {
      originalAmount: amount,
      originalCurrency: normalizedFrom,
      convertedAmount: Math.round(convertedAmount * 100) / 100,
      convertedCurrency: normalizedTo,
      rate: rate,
      markup: markupPercentage,
      finalAmount: Math.round(finalAmount * 100) / 100,
      timestamp: Date.now(),
    };
  }

  /**
   * Load fallback rates into cache
   */
  private loadFallbackRates(): void {
    for (const [key, rate] of Object.entries(this.FALLBACK_RATES)) {
      const [from, to] = key.split("_");
      this.rates.set(key, {
        from,
        to,
        rate,
        timestamp: Date.now(),
        source: "fallback",
      });
    }
  }

  /**
   * Detect currency from product data
   */
  detectCurrency(productData: any): string {
    // Check explicit currency field
    if (productData.currency) {
      return productData.currency.toUpperCase();
    }

    // Check price format patterns
    const priceStr = String(productData.price || "");

    // Romanian patterns
    if (priceStr.includes("RON") || priceStr.includes("lei")) {
      return "RON";
    }

    // Euro patterns
    if (priceStr.includes("€") || priceStr.includes("EUR")) {
      return "EUR";
    }

    // Dollar patterns
    if (priceStr.includes("$") || priceStr.includes("USD")) {
      return "USD";
    }

    // Pound patterns
    if (priceStr.includes("£") || priceStr.includes("GBP")) {
      return "GBP";
    }

    // Swiss Franc patterns
    if (priceStr.includes("CHF") || priceStr.includes("Fr")) {
      return "CHF";
    }

    // Default to USD for international products
    return "USD";
  }

  /**
   * Get supported currencies
   */
  getSupportedCurrencies(): string[] {
    return [...this.SUPPORTED_CURRENCIES];
  }

  /**
   * Check if currency is supported
   */
  isSupported(currency: string): boolean {
    return this.SUPPORTED_CURRENCIES.includes(currency.toUpperCase());
  }

  /**
   * Get cached rates info
   */
  getCacheInfo(): { rates: number; lastUpdate: number; cacheAge: number } {
    return {
      rates: this.rates.size,
      lastUpdate: this.lastUpdate,
      cacheAge: Date.now() - this.lastUpdate,
    };
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.rates.clear();
    this.lastUpdate = 0;
  }
}
