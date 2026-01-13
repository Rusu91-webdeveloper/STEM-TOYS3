/**
 * COD (Cash on Delivery) Fee Calculator
 * 
 * Calculates COD fees based on order total and configured rates.
 * Romanian market standard: 3% + fixed fee
 */

export interface CODFeeConfig {
  /** Percentage fee (e.g., 0.03 for 3%) */
  percentage: number;
  /** Fixed fee in RON */
  fixedFee: number;
  /** Minimum order value for COD (optional) */
  minimumOrderValue?: number;
  /** Maximum COD amount (optional) */
  maximumCODAmount?: number;
}

export interface CODFeeResult {
  /** Calculated COD fee amount */
  fee: number;
  /** Order total before COD fee */
  orderTotalBeforeFee: number;
  /** Order total including COD fee */
  orderTotalWithFee: number;
  /** Breakdown of calculation */
  breakdown: {
    percentageFee: number;
    fixedFee: number;
    totalFee: number;
  };
}

/**
 * Default COD fee configuration for Romanian market
 * 3% percentage + 5 RON fixed fee
 */
export const DEFAULT_COD_CONFIG: CODFeeConfig = {
  percentage: 0.03, // 3%
  fixedFee: 5.0, // 5 RON
  minimumOrderValue: 0, // No minimum
  maximumCODAmount: undefined, // No maximum
};

/**
 * Calculate COD fee for an order
 * 
 * @param orderTotal - Order total before COD fee (in RON)
 * @param config - COD fee configuration (uses default if not provided)
 * @returns COD fee calculation result
 * 
 * @example
 * ```typescript
 * const result = calculateCODFee(100, { percentage: 0.03, fixedFee: 5 });
 * // result.fee = 8 RON (3% of 100 = 3, + 5 = 8)
 * // result.orderTotalWithFee = 108 RON
 * ```
 */
export function calculateCODFee(
  orderTotal: number,
  config: Partial<CODFeeConfig> = {}
): CODFeeResult {
  const finalConfig: CODFeeConfig = {
    ...DEFAULT_COD_CONFIG,
    ...config,
  };

  // Validate minimum order value
  if (
    finalConfig.minimumOrderValue !== undefined &&
    orderTotal < finalConfig.minimumOrderValue
  ) {
    throw new Error(
      `Order total ${orderTotal} RON is below minimum COD order value of ${finalConfig.minimumOrderValue} RON`
    );
  }

  // Calculate percentage fee
  const percentageFee = orderTotal * finalConfig.percentage;

  // Calculate total fee
  const totalFee = percentageFee + finalConfig.fixedFee;

  // Apply maximum COD amount limit if configured
  const finalFee =
    finalConfig.maximumCODAmount !== undefined
      ? Math.min(totalFee, finalConfig.maximumCODAmount)
      : totalFee;

  // Calculate final order total
  const orderTotalWithFee = orderTotal + finalFee;

  return {
    fee: Math.round(finalFee * 100) / 100, // Round to 2 decimal places
    orderTotalBeforeFee: orderTotal,
    orderTotalWithFee: Math.round(orderTotalWithFee * 100) / 100,
    breakdown: {
      percentageFee: Math.round(percentageFee * 100) / 100,
      fixedFee: finalConfig.fixedFee,
      totalFee: Math.round(finalFee * 100) / 100,
    },
  };
}

/**
 * Check if COD is available for an order
 * 
 * @param orderTotal - Order total
 * @param config - COD fee configuration
 * @returns true if COD is available
 */
export function isCODAvailable(
  orderTotal: number,
  config: Partial<CODFeeConfig> = {}
): boolean {
  const finalConfig: CODFeeConfig = {
    ...DEFAULT_COD_CONFIG,
    ...config,
  };

  // Check minimum order value
  if (
    finalConfig.minimumOrderValue !== undefined &&
    orderTotal < finalConfig.minimumOrderValue
  ) {
    return false;
  }

  // Check maximum COD amount
  if (finalConfig.maximumCODAmount !== undefined) {
    const fee = calculateCODFee(orderTotal, config).fee;
    if (fee > finalConfig.maximumCODAmount) {
      return false;
    }
  }

  return true;
}

/**
 * Get COD fee configuration from store settings
 * Falls back to environment variables or defaults if settings not available
 */
export async function getCODFeeConfig(): Promise<CODFeeConfig> {
  try {
    const { getCODSettings } = await import("@/lib/utils/store-settings");
    const codSettings = await getCODSettings();
    
    if (codSettings?.active) {
      return {
        percentage: parseFloat(codSettings.percentage || "3") / 100, // Convert percentage to decimal
        fixedFee: parseFloat(codSettings.fixedFee || "5.00"),
        minimumOrderValue: undefined,
        maximumCODAmount: undefined,
      };
    }
  } catch (error) {
    console.error("Error fetching COD settings, using defaults:", error);
  }

  // Fallback to environment variables or defaults
  const percentage = parseFloat(
    process.env.COD_FEE_PERCENTAGE || "0.03"
  );
  const fixedFee = parseFloat(process.env.COD_FIXED_FEE || "5.0");
  const minimumOrderValue = process.env.COD_MINIMUM_ORDER_VALUE
    ? parseFloat(process.env.COD_MINIMUM_ORDER_VALUE)
    : undefined;
  const maximumCODAmount = process.env.COD_MAXIMUM_AMOUNT
    ? parseFloat(process.env.COD_MAXIMUM_AMOUNT)
    : undefined;

  return {
    percentage,
    fixedFee,
    minimumOrderValue,
    maximumCODAmount,
  };
}

