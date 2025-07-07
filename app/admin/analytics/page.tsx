import {
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  ShoppingBag,
  Users,
  CreditCard,
  Activity,
  Calendar,
} from "lucide-react";
import { redirect } from "next/navigation";
import React from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { auth } from "@/lib/auth";
import { CurrencyProvider } from "@/lib/currency";
import { db } from "@/lib/db";

import { AnalyticsDashboard } from "./components/AnalyticsDashboard";
import { ClientAnalytics } from "./components/ClientAnalytics";
import { CurrencyDisplay } from "./components/CurrencyDisplay";
import { SalesChart } from "./components/sales-chart";
import { SalesByCategoryChart } from "./components/SalesByCategoryChart";
import { TopSellingProductsTable } from "./components/TopSellingProductsTable";

// Define types for our API responses
interface SalesData {
  daily: number;
  weekly: number;
  monthly: number;
  previousPeriodChange: number;
  trending: "up" | "down";
}

interface OrderStats {
  conversionRate: {
    rate: number;
    previousPeriodChange: number;
    trending: "up" | "down";
  };
  averageOrderValue: {
    value: number;
    previousPeriodChange: number;
    trending: "up" | "down";
  };
  totalCustomers: {
    value: number;
    previousPeriodChange: number;
    trending: "up" | "down";
  };
}

interface TopSellingProduct {
  name: string;
  price: number;
  sold: number;
  revenue: number;
}

interface CategorySales {
  categoryId: string;
  category: string;
  amount: number;
  percentage: number;
}

interface SalesByDay {
  date: string;
  sales: number;
}

interface AnalyticsData {
  salesData: SalesData;
  orderStats: OrderStats;
  topSellingProducts: TopSellingProduct[];
  salesByCategory: CategorySales[];
}

interface SalesChartData {
  salesData: SalesByDay[];
}

/**
 * Fetch sales data with aggregations for daily, weekly, and monthly
 */
async function fetchSalesData(startDate: Date, endDate: Date) {
  // Get current period sales data
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
  const estimatedVisits = totalOrders * 25; // Simple estimation
  const conversionRate =
    estimatedVisits > 0 ? (totalOrders / estimatedVisits) * 100 : 0;

  // Simulate previous conversion rate (in real app, get from analytics)
  const previousConversionRate = conversionRate * 0.9; // 10% lower than current
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
 * Fetch top selling products
 */
async function fetchTopSellingProducts(startDate: Date, endDate: Date) {
  // Get top products by quantity sold
  const topSoldProducts = await db.$queryRaw`
    SELECT 
      p.id, 
      p.name, 
      p.price, 
      SUM(oi.quantity) AS sold,
      SUM(oi.price * oi.quantity) AS revenue
    FROM "OrderItem" oi
    JOIN "Product" p ON oi."productId" = p.id
    JOIN "Order" o ON oi."orderId" = o.id
    WHERE o."createdAt" >= ${startDate} AND o."createdAt" <= ${endDate}
      AND o.status IN ('COMPLETED', 'DELIVERED', 'SHIPPED')
    GROUP BY p.id, p.name, p.price
    ORDER BY sold DESC
    LIMIT 5
  `;

  return (topSoldProducts as any[]).map(product => ({
    name: product.name,
    price: parseFloat(product.price),
    sold: parseInt(product.sold),
    revenue: parseFloat(product.revenue),
  }));
}

/**
 * Fetch sales by category
 */
async function fetchSalesByCategory(startDate: Date, endDate: Date) {
  // Get sales by category
  const categorySales = await db.$queryRaw`
    SELECT 
      c.id AS "categoryId", 
      c.name AS category, 
      SUM(oi.price * oi.quantity) AS amount
    FROM "OrderItem" oi
    JOIN "Product" p ON oi."productId" = p.id
    JOIN "Category" c ON p."categoryId" = c.id
    JOIN "Order" o ON oi."orderId" = o.id
    WHERE o."createdAt" >= ${startDate} AND o."createdAt" <= ${endDate}
      AND o.status IN ('COMPLETED', 'DELIVERED', 'SHIPPED')
    GROUP BY c.id, c.name
    ORDER BY amount DESC
  `;

  // Calculate total sales to get percentages
  const totalSales = (categorySales as any[]).reduce(
    (sum, item) => sum + parseFloat(item.amount),
    0
  );

  return (categorySales as any[]).map(item => ({
    categoryId: item.categoryId,
    category: item.category,
    amount: parseFloat(item.amount),
    percentage: parseFloat(
      ((parseFloat(item.amount) / totalSales) * 100).toFixed(1)
    ),
  }));
}

/**
 * Fetch sales chart data by day
 */
async function fetchSalesChartData(startDate: Date, endDate: Date) {
  // Create an array with all days in the period
  const days = [];
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    days.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Get daily sales data using SQL for better performance
  const dailySales = await db.$queryRaw`
    SELECT 
      DATE(o."createdAt") AS date,
      SUM(o.total) AS sales
    FROM "Order" o
    WHERE o."createdAt" >= ${startDate} AND o."createdAt" <= ${endDate}
      AND o.status IN ('COMPLETED', 'DELIVERED', 'SHIPPED', 'PROCESSING')
    GROUP BY DATE(o."createdAt")
    ORDER BY date
  `;

  // Create a map for quick lookups
  const salesByDateMap = new Map();
  (dailySales as any[]).forEach(day => {
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

export default async function AnalyticsPage() {
  // Check if user is authenticated
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/login");
  }

  // Default to 30 days
  const defaultPeriod = "30";

  try {
    // Get analytics data for default period (30 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - parseInt(defaultPeriod));

    // Fetch all data
    const salesData = await fetchSalesData(startDate, endDate);
    const orderStats = await fetchOrderStats(startDate, endDate);
    const topSellingProducts = await fetchTopSellingProducts(
      startDate,
      endDate
    );
    const salesByCategory = await fetchSalesByCategory(startDate, endDate);
    const salesChartData = await fetchSalesChartData(startDate, endDate);

    // Return the client component with all data
    return (
      <ClientAnalytics
        initialSalesData={salesData}
        initialOrderStats={orderStats}
        initialTopSellingProducts={topSellingProducts}
        initialSalesByCategory={salesByCategory}
        initialSalesChartData={salesChartData}
        defaultPeriod={defaultPeriod}
      />
    );
  } catch (error) {
    console.error("Error fetching analytics data:", error);

    // Fallback to graceful error handling
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        </div>

        <Card>
          <CardContent className="p-12 flex flex-col items-center justify-center">
            <h2 className="text-xl font-semibold text-center mb-4">
              Unable to load analytics data
            </h2>
            <p className="text-muted-foreground text-center max-w-md">
              There was an error loading the analytics data. Please try again
              later or contact support if the issue persists.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }
}
