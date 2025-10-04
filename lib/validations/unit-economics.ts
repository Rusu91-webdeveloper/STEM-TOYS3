import { z } from "zod";

// Unit Economics Cost Breakdown Schema
export const CostBreakdownSchema = z.object({
  costPrice: z.number().min(0).optional(), // Supplier cost per unit
  importDuties: z.number().min(0).default(0), // Import duties per unit
  shippingCost: z.number().min(0).default(0), // Shipping to warehouse per unit
  storageCost: z.number().min(0).default(0), // Storage cost per unit per month
  packagingCost: z.number().min(0).default(0), // Packaging materials cost per unit
  laborCost: z.number().min(0).default(0), // Labor cost (picking, packing, shipping)
  qualityControlCost: z.number().min(0).default(0), // Quality control/inspection cost per unit
  paymentProcessingFee: z.number().min(0).max(100).default(2.9), // Payment processing fee percentage
  customerServiceCost: z.number().min(0).default(0), // Customer service cost per order
  operationalOverhead: z.number().min(0).default(0), // Operational overhead per unit
});

// Marketing Cost Schema
export const MarketingCostSchema = z.object({
  googleAdsCost: z.number().min(0).default(0), // Google Ads cost per sale
  facebookAdsCost: z.number().min(0).default(0), // Facebook/Instagram ads cost per sale
  seoCost: z.number().min(0).default(0), // SEO content creation costs (amortized per sale)
  influencerCost: z.number().min(0).default(0), // Influencer marketing costs per sale
  totalMarketingCost: z.number().min(0).default(0), // Total marketing cost per sale
  notes: z.string().optional(),
});

// Unit Economics Calculation Schema
export const UnitEconomicsSchema = z.object({
  productId: z.string(),
  sellingPrice: z.number().min(0),
  costs: CostBreakdownSchema,
  marketingCosts: MarketingCostSchema,
  expectedMonthlySales: z.number().min(0).default(0),
  calculatedAt: z.date().default(() => new Date()),
});

// Product Profitability Analysis Schema
export const ProductProfitabilitySchema = z.object({
  productId: z.string(),
  name: z.string(),
  category: z.string().optional(),
  sellingPrice: z.number().min(0),
  costPrice: z.number().min(0).optional(),
  totalCostPerSale: z.number().min(0),
  netProfitPerSale: z.number(),
  profitMargin: z.number(), // Percentage
  monthlySales: z.number().min(0),
  monthlyRevenue: z.number().min(0),
  monthlyProfit: z.number(),
  customerAcquisitionCost: z.number().min(0),
  lifetimeValue: z.number().min(0),
  ltvToCacRatio: z.number().min(0),
  breakEvenPoint: z.number().min(0), // Units needed to break even
  isProfitable: z.boolean(),
  riskLevel: z.enum(["LOW", "MEDIUM", "HIGH"]),
});

// Unit Economics Summary Schema
export const UnitEconomicsSummarySchema = z.object({
  totalProducts: z.number().min(0),
  profitableProducts: z.number().min(0),
  unprofitableProducts: z.number().min(0),
  totalMonthlyRevenue: z.number().min(0),
  totalMonthlyCosts: z.number().min(0),
  totalMonthlyProfit: z.number(),
  overallProfitMargin: z.number(),
  averageOrderValue: z.number().min(0),
  averageCustomerAcquisitionCost: z.number().min(0),
  averageLifetimeValue: z.number().min(0),
  averageLtvToCacRatio: z.number().min(0),
  mostProfitableProduct: z
    .object({
      id: z.string(),
      name: z.string(),
      profitMargin: z.number(),
    })
    .optional(),
  leastProfitableProduct: z
    .object({
      id: z.string(),
      name: z.string(),
      profitMargin: z.number(),
    })
    .optional(),
  highestVolumeProduct: z
    .object({
      id: z.string(),
      name: z.string(),
      monthlySales: z.number(),
    })
    .optional(),
  productsToDiscontinue: z.array(z.string()),
});

// API Request Schemas
export const UnitEconomicsRequestSchema = z.object({
  timeRange: z.enum(["7d", "30d", "90d", "1y"]).default("30d"),
  categoryId: z.string().optional(),
  supplierId: z.string().optional(),
  includeInactive: z.boolean().default(false),
});

export const CostUpdateRequestSchema = z.object({
  productId: z.string(),
  costs: CostBreakdownSchema.partial(),
  marketingCosts: MarketingCostSchema.partial().optional(),
});

// Type Exports
export type CostBreakdown = z.infer<typeof CostBreakdownSchema>;
export type MarketingCost = z.infer<typeof MarketingCostSchema>;
export type UnitEconomics = z.infer<typeof UnitEconomicsSchema>;
export type ProductProfitability = z.infer<typeof ProductProfitabilitySchema>;
export type UnitEconomicsSummary = z.infer<typeof UnitEconomicsSummarySchema>;
export type UnitEconomicsRequest = z.infer<typeof UnitEconomicsRequestSchema>;
export type CostUpdateRequest = z.infer<typeof CostUpdateRequestSchema>;

// Utility Functions
export function validateUnitEconomics(data: unknown): UnitEconomics {
  return UnitEconomicsSchema.parse(data);
}

export function validateProductProfitability(
  data: unknown
): ProductProfitability {
  return ProductProfitabilitySchema.parse(data);
}

export function validateUnitEconomicsSummary(
  data: unknown
): UnitEconomicsSummary {
  return UnitEconomicsSummarySchema.parse(data);
}

export function validateUnitEconomicsRequest(
  request: unknown
): UnitEconomicsRequest {
  return UnitEconomicsRequestSchema.parse(request);
}

export function validateCostUpdateRequest(request: unknown): CostUpdateRequest {
  return CostUpdateRequestSchema.parse(request);
}

// Safe parsing functions
export function safeParseUnitEconomics(data: unknown): UnitEconomics | null {
  try {
    return UnitEconomicsSchema.parse(data);
  } catch {
    return null;
  }
}

export function safeParseProductProfitability(
  data: unknown
): ProductProfitability | null {
  try {
    return ProductProfitabilitySchema.parse(data);
  } catch {
    return null;
  }
}

export function safeParseUnitEconomicsSummary(
  data: unknown
): UnitEconomicsSummary | null {
  try {
    return UnitEconomicsSummarySchema.parse(data);
  } catch {
    return null;
  }
}
