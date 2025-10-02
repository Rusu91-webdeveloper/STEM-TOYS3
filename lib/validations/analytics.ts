import { z } from "zod";

// Base schemas for analytics data structures
export const SalesDataSchema = z.object({
  daily: z.number().min(0),
  weekly: z.number().min(0),
  monthly: z.number().min(0),
  previousPeriodChange: z.number(),
  trending: z.enum(["up", "down"]),
});

export const OrderStatsSchema = z.object({
  conversionRate: z.object({
    rate: z.number().min(0).max(100),
    previousPeriodChange: z.number(),
    trending: z.enum(["up", "down"]),
  }),
  averageOrderValue: z.object({
    value: z.number().min(0),
    previousPeriodChange: z.number(),
    trending: z.enum(["up", "down"]),
  }),
  totalCustomers: z.object({
    value: z.number().min(0),
    previousPeriodChange: z.number(),
    trending: z.enum(["up", "down"]),
  }),
});

export const TopSellingProductSchema = z.object({
  name: z.string().min(1),
  price: z.number().min(0),
  sold: z.number().min(0),
  revenue: z.number().min(0),
});

export const CategorySalesSchema = z.object({
  categoryId: z.string().min(1),
  category: z.string().min(1),
  amount: z.number().min(0),
  percentage: z.number().min(0).max(100),
});

export const SalesByDaySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD format
  sales: z.number().min(0),
});

// Complete analytics data schema
export const AnalyticsDataSchema = z.object({
  salesData: SalesDataSchema,
  orderStats: OrderStatsSchema,
  topSellingProducts: z.array(TopSellingProductSchema),
  salesByCategory: z.array(CategorySalesSchema),
  salesChartData: z.object({
    salesData: z.array(SalesByDaySchema),
  }),
});

// API request validation schemas
export const AnalyticsRequestSchema = z.object({
  period: z
    .string()
    .regex(/^\d+$/)
    .transform(Number)
    .refine(val => val > 0 && val <= 365, {
      message: "Period must be between 1 and 365 days",
    }),
});

// Analytics period validation
export const AnalyticsPeriodSchema = z
  .string()
  .regex(/^(7|30|90)$/, {
    message: "Period must be one of: 7, 30, 90",
  })
  .transform(Number);

// Cache key validation
export const AnalyticsCacheKeySchema = z.string().refine(
  key => {
    const parts = key.split(":");
    return (
      parts.length >= 2 &&
      parts[0] === "analytics" &&
      ["admin", "page", "data"].includes(parts[1])
    );
  },
  {
    message: "Invalid analytics cache key format",
  }
);

// Analytics API response validation
export const AnalyticsAPIResponseSchema = z.object({
  salesData: SalesDataSchema,
  orderStats: OrderStatsSchema,
  topSellingProducts: z.array(TopSellingProductSchema),
  salesByCategory: z.array(CategorySalesSchema),
  salesChartData: z.object({
    salesData: z.array(SalesByDaySchema),
  }),
});

// Error response schema
export const AnalyticsErrorResponseSchema = z.object({
  error: z.string(),
  details: z.any().optional(),
});

// Type exports for TypeScript
export type SalesData = z.infer<typeof SalesDataSchema>;
export type OrderStats = z.infer<typeof OrderStatsSchema>;
export type TopSellingProduct = z.infer<typeof TopSellingProductSchema>;
export type CategorySales = z.infer<typeof CategorySalesSchema>;
export type SalesByDay = z.infer<typeof SalesByDaySchema>;
export type AnalyticsData = z.infer<typeof AnalyticsDataSchema>;
export type AnalyticsRequest = z.infer<typeof AnalyticsRequestSchema>;
export type AnalyticsPeriod = z.infer<typeof AnalyticsPeriodSchema>;

// Utility functions for validation
export function validateAnalyticsData(data: unknown): AnalyticsData {
  return AnalyticsDataSchema.parse(data);
}

export function validateAnalyticsRequest(request: unknown): AnalyticsRequest {
  return AnalyticsRequestSchema.parse(request);
}

export function validateAnalyticsPeriod(period: unknown): AnalyticsPeriod {
  return AnalyticsPeriodSchema.parse(period);
}

export function isValidAnalyticsData(data: unknown): data is AnalyticsData {
  try {
    AnalyticsDataSchema.parse(data);
    return true;
  } catch {
    return false;
  }
}

// Safe parsing functions that return null instead of throwing
export function safeParseAnalyticsData(data: unknown): AnalyticsData | null {
  try {
    return AnalyticsDataSchema.parse(data);
  } catch {
    return null;
  }
}

export function safeParseAnalyticsRequest(
  request: unknown
): AnalyticsRequest | null {
  try {
    return AnalyticsRequestSchema.parse(request);
  } catch {
    return null;
  }
}

// Validation with detailed error messages
export function validateAnalyticsDataWithErrors(data: unknown): {
  success: boolean;
  data?: AnalyticsData;
  errors?: z.ZodError["errors"];
} {
  const result = AnalyticsDataSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  } else {
    return { success: false, errors: result.error.errors };
  }
}
