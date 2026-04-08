/**
 * Enhanced Dropshipping Pricing Formula
 * 
 * Calculates final selling price with all costs and buffers included.
 * Formula: Final Price = (COGS + Shipping + COD Fee + Rejection Buffer) / (1 - Target Margin)
 */

export interface DropshippingPricingInput {
  /** Cost of Goods Sold (supplier price) */
  cogs: number;
  /** Shipping cost */
  shipping: number;
  /** COD fee (if COD payment method) - defaults to 0 */
  codFee?: number;
  /** Rejection buffer amount (defaults to 2% of subtotal) */
  rejectionBuffer?: number;
  /** Rejection buffer percentage (defaults to 0.02 = 2%) */
  rejectionBufferPercentage?: number;
  /** Target margin (defaults to 0.25 = 25%) */
  targetMargin?: number;
  /** Currency (defaults to "RON") */
  currency?: string;
}

export interface DropshippingPricingResult {
  /** Final selling price */
  finalPrice: number;
  /** Subtotal before margin (COGS + Shipping + COD Fee + Rejection Buffer) */
  subtotal: number;
  /** Breakdown of all costs */
  breakdown: {
    cogs: number;
    shipping: number;
    codFee: number;
    rejectionBuffer: number;
    subtotal: number;
    margin: number;
    finalPrice: number;
  };
  /** Profit margin amount */
  marginAmount: number;
  /** Profit margin percentage */
  marginPercentage: number;
  /** Currency */
  currency: string;
}

export interface BufferedRetailPriceInput {
  /** Supplier B2C/retail price in store currency */
  supplierRetailPrice: number;
  /** Extra buffer added directly on top of supplier B2C (0.20 => 20%) */
  extraBufferPercentage?: number;
  /** Planned coupon/discount that should still preserve the target price */
  plannedDiscountPercentage?: number;
  /** Currency (defaults to "RON") */
  currency?: string;
}

export interface BufferedRetailPriceResult {
  /** Price you want to realize before any promotional discount */
  targetPrice: number;
  /** Display price saved to the catalog to support the planned discount */
  displayPrice: number;
  /** Extra amount added on top of supplier retail price for the target price */
  extraBufferAmount: number;
  /** Extra buffer percentage on top of supplier retail price */
  extraBufferPercentage: number;
  /** Planned discount percentage */
  plannedDiscountPercentage: number;
  /** Currency */
  currency: string;
}

/**
 * Default pricing configuration
 */
const DEFAULT_CONFIG = {
  rejectionBufferPercentage: 0.02, // 2% rejection buffer
  targetMargin: 0.25, // 25% target margin
  currency: "RON",
};

function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Supplier retail-price based catalog pricing with an optional promo buffer.
 *
 * Example:
 * - supplierRetailPrice = 30
 * - extraBufferPercentage = 0.20 => targetPrice = 36
 * - plannedDiscountPercentage = 0.10 => displayPrice = 40
 * - 10% coupon on 40 => 36.00 realized price
 */
export function calculateBufferedRetailPrice(
  input: BufferedRetailPriceInput
): BufferedRetailPriceResult {
  const {
    supplierRetailPrice,
    extraBufferPercentage = 0,
    plannedDiscountPercentage = 0,
    currency = DEFAULT_CONFIG.currency,
  } = input;

  const safeBuffer = Number.isFinite(extraBufferPercentage)
    ? extraBufferPercentage
    : 0;
  const safeDiscount =
    Number.isFinite(plannedDiscountPercentage) && plannedDiscountPercentage > 0
      ? plannedDiscountPercentage
      : 0;

  const targetPrice = supplierRetailPrice * (1 + safeBuffer);
  const displayPrice =
    safeDiscount > 0 ? targetPrice / (1 - safeDiscount) : targetPrice;
  const extraBufferAmount = targetPrice - supplierRetailPrice;

  return {
    targetPrice: roundCurrency(targetPrice),
    displayPrice: roundCurrency(displayPrice),
    extraBufferAmount: roundCurrency(extraBufferAmount),
    extraBufferPercentage: roundCurrency(safeBuffer * 100),
    plannedDiscountPercentage: roundCurrency(safeDiscount * 100),
    currency,
  };
}

/**
 * Calculate dropshipping price with all costs and buffers
 * 
 * Formula: Final Price = (COGS + Shipping + COD Fee + Rejection Buffer) / (1 - Target Margin)
 * 
 * @param input - Pricing input parameters
 * @returns Calculated pricing result
 * 
 * @example
 * ```typescript
 * const result = calculateDropshippingPrice({
 *   cogs: 100,      // 100 RON cost
 *   shipping: 15,   // 15 RON shipping
 *   codFee: 8,      // 8 RON COD fee
 *   targetMargin: 0.25 // 25% margin
 * });
 * // result.finalPrice = 164 RON
 * // Breakdown: (100 + 15 + 8 + 2.46) / (1 - 0.25) = 125.46 / 0.75 = 167.28 RON
 * ```
 */
export function calculateDropshippingPrice(
  input: DropshippingPricingInput
): DropshippingPricingResult {
  const {
    cogs,
    shipping,
    codFee = 0,
    rejectionBuffer,
    rejectionBufferPercentage = DEFAULT_CONFIG.rejectionBufferPercentage,
    targetMargin = DEFAULT_CONFIG.targetMargin,
    currency = DEFAULT_CONFIG.currency,
  } = input;

  // Calculate subtotal before rejection buffer
  const subtotalBeforeBuffer = cogs + shipping + codFee;

  // Calculate rejection buffer (2% of subtotal, or use provided amount)
  const calculatedRejectionBuffer =
    rejectionBuffer !== undefined
      ? rejectionBuffer
      : subtotalBeforeBuffer * rejectionBufferPercentage;

  // Calculate final subtotal (all costs including buffer)
  const subtotal = subtotalBeforeBuffer + calculatedRejectionBuffer;

  // Calculate final price with target margin
  // Formula: Price = Subtotal / (1 - Margin)
  // This ensures that after subtracting the margin, we cover all costs
  const finalPrice = subtotal / (1 - targetMargin);

  // Calculate actual margin amount
  const marginAmount = finalPrice - subtotal;

  // Calculate actual margin percentage
  const marginPercentage = (marginAmount / finalPrice) * 100;

  // Round to 2 decimal places
  const roundedFinalPrice = roundCurrency(finalPrice);
  const roundedMarginAmount = roundCurrency(marginAmount);

  return {
    finalPrice: roundedFinalPrice,
    subtotal: roundCurrency(subtotal),
    breakdown: {
      cogs: roundCurrency(cogs),
      shipping: roundCurrency(shipping),
      codFee: roundCurrency(codFee),
      rejectionBuffer: roundCurrency(calculatedRejectionBuffer),
      subtotal: roundCurrency(subtotal),
      margin: roundedMarginAmount,
      finalPrice: roundedFinalPrice,
    },
    marginAmount: roundedMarginAmount,
    marginPercentage: roundCurrency(marginPercentage),
    currency,
  };
}

/**
 * Calculate price for a product with COD option
 * 
 * @param cogs - Cost of goods
 * @param shipping - Shipping cost
 * @param isCOD - Whether payment method is COD
 * @param codFee - COD fee (calculated if not provided)
 * @param targetMargin - Target margin percentage
 * @returns Pricing result
 */
export async function calculateProductPrice(
  cogs: number,
  shipping: number,
  isCOD: boolean = false,
  codFee?: number,
  targetMargin: number = 0.25
): Promise<DropshippingPricingResult> {
  // If COD fee not provided and is COD, calculate it
  let finalCodFee = codFee;
  if (isCOD && codFee === undefined) {
    const { calculateCODFee } = await import("./cod-fee-calculator");
    const orderTotal = cogs + shipping;
    finalCodFee = calculateCODFee(orderTotal).fee;
  } else if (!isCOD) {
    finalCodFee = 0;
  }

  return calculateDropshippingPrice({
    cogs,
    shipping,
    codFee: finalCodFee || 0,
    targetMargin,
  });
}

/**
 * Get pricing configuration from environment or store settings
 */
export function getPricingConfig(): {
  rejectionBufferPercentage: number;
  targetMargin: number;
} {
  return {
    rejectionBufferPercentage: parseFloat(
      process.env.REJECTION_BUFFER_PERCENTAGE || "0.02"
    ),
    targetMargin: parseFloat(process.env.TARGET_MARGIN || "0.25"),
  };
}
