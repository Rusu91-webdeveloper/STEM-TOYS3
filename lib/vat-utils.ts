/**
 * VAT Utility Functions for EU/Romanian E-commerce Compliance
 *
 * According to Romanian and EU law, B2C prices must be displayed VAT-inclusive.
 * This utility provides functions to handle VAT calculations properly.
 */

export interface VATCalculation {
  priceIncludingVAT: number;
  priceExcludingVAT: number;
  vatAmount: number;
  vatRate: number;
}

/**
 * Calculate VAT breakdown from a VAT-inclusive price
 * Used when we display VAT-inclusive prices but need to show VAT breakdown
 *
 * @param priceIncludingVAT - The final price including VAT
 * @param vatRatePercent - VAT rate as percentage (e.g., 21 for 21%)
 * @returns VATCalculation object with all components
 */
export function calculateVATFromInclusivePrice(
  priceIncludingVAT: number,
  vatRatePercent: number = 21
): VATCalculation {
  const vatRate = vatRatePercent / 100;
  const priceExcludingVAT = priceIncludingVAT / (1 + vatRate);
  const vatAmount = priceIncludingVAT - priceExcludingVAT;

  return {
    priceIncludingVAT,
    priceExcludingVAT,
    vatAmount,
    vatRate: vatRatePercent,
  };
}

/**
 * Calculate VAT-inclusive price from a VAT-exclusive price
 * Used for migrating existing prices or when adding VAT to a base price
 *
 * @param priceExcludingVAT - The base price without VAT
 * @param vatRatePercent - VAT rate as percentage (e.g., 21 for 21%)
 * @returns VATCalculation object with all components
 */
export function calculateVATFromExclusivePrice(
  priceExcludingVAT: number,
  vatRatePercent: number = 21
): VATCalculation {
  const vatRate = vatRatePercent / 100;
  const vatAmount = priceExcludingVAT * vatRate;
  const priceIncludingVAT = priceExcludingVAT + vatAmount;

  return {
    priceIncludingVAT,
    priceExcludingVAT,
    vatAmount,
    vatRate: vatRatePercent,
  };
}

/**
 * Get VAT indication text for price displays (Romanian/EU compliance)
 *
 * @param locale - Language locale ('ro' or 'en')
 * @returns Appropriate VAT indication text
 */
export function getVATIndicationText(locale: string = "ro"): string {
  if (locale === "ro") {
    return "inclusiv TVA";
  }
  return "VAT included";
}

/**
 * Format price with VAT indication for display
 *
 * @param price - Price including VAT
 * @param formatPrice - Price formatting function
 * @param locale - Language locale
 * @param showVATIndication - Whether to show VAT indication text
 * @returns Formatted price string with VAT indication
 */
export function formatPriceWithVAT(
  price: number,
  formatPrice: (price: number) => string,
  locale: string = "ro",
  showVATIndication: boolean = false
): string {
  const formattedPrice = formatPrice(price);

  if (showVATIndication) {
    const vatText = getVATIndicationText(locale);
    return `${formattedPrice} (${vatText})`;
  }

  return formattedPrice;
}

/**
 * Calculate cart total with proper VAT breakdown
 *
 * @param items - Cart items with VAT-inclusive prices
 * @param vatRatePercent - VAT rate as percentage
 * @returns Object with subtotal, VAT, and total breakdown
 */
export function calculateCartVATBreakdown(
  items: Array<{ price: number; quantity: number }>,
  vatRatePercent: number = 21
) {
  const totalIncludingVAT = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const vatCalculation = calculateVATFromInclusivePrice(
    totalIncludingVAT,
    vatRatePercent
  );

  return {
    subtotal: vatCalculation.priceExcludingVAT,
    vatAmount: vatCalculation.vatAmount,
    total: totalIncludingVAT,
    vatRate: vatRatePercent,
  };
}
