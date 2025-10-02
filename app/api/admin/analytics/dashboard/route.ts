import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getCached, CacheKeys, invalidateCachePattern } from "@/lib/cache";
import { db } from "@/lib/db";
import { withRateLimit } from "@/lib/rate-limit";
import {
  AnalyticsRequestSchema,
  validateAnalyticsData,
} from "@/lib/validations/analytics";

export const GET = withRateLimit(
  async (request: NextRequest) => {
    try {
      // Check authentication
      const session = await auth();
      if (!session?.user || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Not authorized" }, { status: 403 });
      }

      // Parse and validate query parameters
      const searchParams = request.nextUrl.searchParams;
      const period = searchParams.get("period") || "30";

      // Validate period using Zod schema
      const validatedData = AnalyticsRequestSchema.parse({ period });

      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - validatedData.period);

      // Caching strategy for analytics data
      const cacheKey = CacheKeys.analytics(`admin:${validatedData.period}`);
      const CACHE_TTL = 5 * 60 * 1000; // 5 minutes for analytics (less critical than dashboard)

      const analyticsData = await getCached(
        cacheKey,
        async () => {
          // Fetch all analytics data in parallel for better performance
          const [
            salesData,
            orderStats,
            topSellingProducts,
            salesByCategory,
            salesChartData,
          ] = await Promise.all([
            fetchSalesData(startDate, endDate),
            fetchOrderStats(startDate, endDate),
            fetchTopSellingProducts(startDate, endDate),
            fetchSalesByCategory(startDate, endDate),
            fetchSalesChartData(startDate, endDate),
          ]);

          return {
            salesData,
            orderStats,
            topSellingProducts,
            salesByCategory,
            salesChartData,
          };
        },
        CACHE_TTL
      );

      // Validate the analytics data before returning
      const validatedAnalyticsData = validateAnalyticsData(analyticsData);

      return NextResponse.json(validatedAnalyticsData);
    } catch (error) {
      console.error("Error fetching analytics data:", error);

      // Handle validation errors
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      if (errorMessage.includes("Invalid request parameters")) {
        return NextResponse.json(
          {
            error: "Invalid request parameters",
            details: error,
          },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: "Failed to fetch analytics data" },
        { status: 500 }
      );
    }
  },
  { limit: 20, windowMs: 10 * 60 * 1000 } // Stricter rate limiting for analytics
);

/**
 * Fetch sales data with aggregations for daily, weekly, and monthly
 */
async function fetchSalesData(startDate: Date, endDate: Date) {
  // Get current period sales data using parameterized query
  const currentPeriodSales = await db.order.aggregate({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
      status: {
        in: ["COMPLETED", "DELIVERED", "SHIPPED"],
      },
    },
    _sum: {
      total: true,
    },
  });

  // Calculate daily sales
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const dailySales = await db.order.aggregate({
    where: {
      createdAt: {
        gte: yesterday,
        lte: today,
      },
      status: {
        in: ["COMPLETED", "DELIVERED", "SHIPPED"],
      },
    },
    _sum: {
      total: true,
    },
  });

  // Calculate weekly sales
  const weekStartDate = new Date();
  weekStartDate.setDate(today.getDate() - 7);

  const weeklySales = await db.order.aggregate({
    where: {
      createdAt: {
        gte: weekStartDate,
        lte: today,
      },
      status: {
        in: ["COMPLETED", "DELIVERED", "SHIPPED"],
      },
    },
    _sum: {
      total: true,
    },
  });

  // Get previous period data for comparison
  const prevPeriodStartDate = new Date(startDate);
  prevPeriodStartDate.setDate(
    prevPeriodStartDate.getDate() -
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  const previousPeriodSales = await db.order.aggregate({
    where: {
      createdAt: {
        gte: prevPeriodStartDate,
        lt: startDate,
      },
      status: {
        in: ["COMPLETED", "DELIVERED", "SHIPPED"],
      },
    },
    _sum: {
      total: true,
    },
  });

  // Calculate percentage change
  const currentTotal = currentPeriodSales._sum.total || 0;
  const previousTotal = previousPeriodSales._sum.total || 0;

  let percentageChange = 0;
  if (previousTotal > 0) {
    percentageChange = ((currentTotal - previousTotal) / previousTotal) * 100;
  } else if (currentTotal > 0) {
    percentageChange = 100;
  }

  return {
    daily: dailySales._sum.total || 0,
    weekly: weeklySales._sum.total || 0,
    monthly: currentTotal,
    previousPeriodChange: parseFloat(percentageChange.toFixed(1)),
    trending: percentageChange >= 0 ? ("up" as const) : ("down" as const),
  };
}

/**
 * Fetch order stats including conversion rate and avg order value
 */
async function fetchOrderStats(startDate: Date, endDate: Date) {
  // Get configuration values from environment
  const CONVERSION_RATE_MULTIPLIER = parseInt(
    process.env.ANALYTICS_CONVERSION_MULTIPLIER || "25"
  );
  const CONVERSION_RATE_SIMULATION = parseFloat(
    process.env.ANALYTICS_CONVERSION_SIMULATION || "0.9"
  );

  // Total orders in period
  const totalOrders = await db.order.count({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
  });

  // Total customers in the system
  const totalCustomers = await db.user.count({
    where: {
      role: "CUSTOMER",
    },
  });

  // New customers in period
  const newCustomers = await db.user.count({
    where: {
      role: "CUSTOMER",
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
  });

  // Previous period data for comparison
  const prevPeriodStartDate = new Date(startDate);
  prevPeriodStartDate.setDate(
    prevPeriodStartDate.getDate() -
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  const prevPeriodNewCustomers = await db.user.count({
    where: {
      role: "CUSTOMER",
      createdAt: {
        gte: prevPeriodStartDate,
        lt: startDate,
      },
    },
  });

  // Calculate customer growth percentage
  let customerGrowthPercentage = 0;
  if (prevPeriodNewCustomers > 0) {
    customerGrowthPercentage =
      ((newCustomers - prevPeriodNewCustomers) / prevPeriodNewCustomers) * 100;
  } else if (newCustomers > 0) {
    customerGrowthPercentage = 100;
  }

  // Average order value
  const orderValues = await db.order.aggregate({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
      status: {
        in: ["COMPLETED", "DELIVERED", "SHIPPED"],
      },
    },
    _avg: {
      total: true,
    },
  });

  // Previous period average order value
  const prevOrderValues = await db.order.aggregate({
    where: {
      createdAt: {
        gte: prevPeriodStartDate,
        lt: startDate,
      },
      status: {
        in: ["COMPLETED", "DELIVERED", "SHIPPED"],
      },
    },
    _avg: {
      total: true,
    },
  });

  // Calculate AOV growth percentage
  const currentAOV = orderValues._avg.total || 0;
  const prevAOV = prevOrderValues._avg.total || 0;

  let aovGrowthPercentage = 0;
  if (prevAOV > 0) {
    aovGrowthPercentage = ((currentAOV - prevAOV) / prevAOV) * 100;
  } else if (currentAOV > 0) {
    aovGrowthPercentage = 100;
  }

  // Estimated site visits for conversion rate
  const estimatedVisits = totalOrders * CONVERSION_RATE_MULTIPLIER;
  const conversionRate =
    estimatedVisits > 0 ? (totalOrders / estimatedVisits) * 100 : 0;

  // Simulate previous conversion rate
  const previousConversionRate = conversionRate * CONVERSION_RATE_SIMULATION;
  const conversionRateChange =
    ((conversionRate - previousConversionRate) / previousConversionRate) * 100;

  return {
    conversionRate: {
      rate: parseFloat(conversionRate.toFixed(1)),
      previousPeriodChange: parseFloat(conversionRateChange.toFixed(1)),
      trending: conversionRateChange >= 0 ? ("up" as const) : ("down" as const),
    },
    averageOrderValue: {
      value: parseFloat(currentAOV.toFixed(2)),
      previousPeriodChange: parseFloat(aovGrowthPercentage.toFixed(1)),
      trending: aovGrowthPercentage >= 0 ? ("up" as const) : ("down" as const),
    },
    totalCustomers: {
      value: totalCustomers,
      previousPeriodChange: parseFloat(customerGrowthPercentage.toFixed(1)),
      trending:
        customerGrowthPercentage >= 0 ? ("up" as const) : ("down" as const),
    },
  };
}

/**
 * Fetch top selling products using parameterized queries
 */
async function fetchTopSellingProducts(startDate: Date, endDate: Date) {
  // Use parameterized query to prevent SQL injection
  const topSoldProducts = await db.$queryRaw<
    Array<{
      id: string;
      name: string;
      price: number;
      sold: bigint;
      revenue: string;
    }>
  >`
    SELECT
      p.id,
      p.name,
      p.price,
      SUM(oi.quantity) AS sold,
      SUM(oi.price * oi.quantity) AS revenue
    FROM "OrderItem" oi
    JOIN "Product" p ON oi."productId" = p.id
    JOIN "Order" o ON oi."orderId" = o.id
    WHERE o."createdAt" >= $1 AND o."createdAt" <= $2
      AND o.status IN ('COMPLETED', 'DELIVERED', 'SHIPPED')
    GROUP BY p.id, p.name, p.price
    ORDER BY sold DESC
    LIMIT 5
  `;

  return topSoldProducts.map(product => ({
    name: product.name,
    price: parseFloat(product.price.toString()),
    sold: parseInt(product.sold.toString()),
    revenue: parseFloat(product.revenue),
  }));
}

/**
 * Fetch sales by category using parameterized queries
 */
async function fetchSalesByCategory(startDate: Date, endDate: Date) {
  // Use parameterized query to prevent SQL injection
  const categorySales = await db.$queryRaw<
    Array<{
      categoryId: string;
      category: string;
      amount: string;
    }>
  >`
    SELECT
      c.id AS "categoryId",
      c.name AS category,
      SUM(oi.price * oi.quantity) AS amount
    FROM "OrderItem" oi
    JOIN "Product" p ON oi."productId" = p.id
    JOIN "Category" c ON p."categoryId" = c.id
    JOIN "Order" o ON oi."orderId" = o.id
    WHERE o."createdAt" >= $1 AND o."createdAt" <= $2
      AND o.status IN ('COMPLETED', 'DELIVERED', 'SHIPPED')
    GROUP BY c.id, c.name
    ORDER BY amount DESC
  `;

  // Calculate total sales to get percentages
  const totalSales = categorySales.reduce(
    (sum, item) => sum + parseFloat(item.amount),
    0
  );

  return categorySales.map(item => ({
    categoryId: item.categoryId,
    category: item.category,
    amount: parseFloat(item.amount),
    percentage: parseFloat(
      ((parseFloat(item.amount) / totalSales) * 100).toFixed(1)
    ),
  }));
}

/**
 * Fetch sales chart data by day using parameterized queries
 */
async function fetchSalesChartData(startDate: Date, endDate: Date) {
  // Create an array with all days in the period
  const days = [];
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    days.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Get daily sales data using parameterized query for better performance
  const dailySales = await db.$queryRaw<
    Array<{
      date: string;
      sales: string;
    }>
  >`
    SELECT
      DATE(o."createdAt") AS date,
      SUM(o.total) AS sales
    FROM "Order" o
    WHERE o."createdAt" >= $1 AND o."createdAt" <= $2
      AND o.status IN ('COMPLETED', 'DELIVERED', 'SHIPPED', 'PROCESSING')
    GROUP BY DATE(o."createdAt")
    ORDER BY date
  `;

  // Create a map for quick lookups
  const salesByDateMap = new Map<string, number>();
  dailySales.forEach(day => {
    const dateStr = new Date(day.date).toISOString().split("T")[0];
    salesByDateMap.set(dateStr, parseFloat(day.sales));
  });

  // Fill in all days, even those with no sales
  const salesData = days.map(day => {
    const dateStr = day.toISOString().split("T")[0];
    return {
      date: dateStr,
      sales: salesByDateMap.get(dateStr) || 0,
    };
  });

  return { salesData };
}
