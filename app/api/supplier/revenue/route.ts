import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "SUPPLIER") {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const supplier = await db.supplier.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!supplier) {
      return NextResponse.json(
        { error: "Supplier not found" },
        { status: 404 }
      );
    }

    // Get time range parameter
    const timeRange = request.nextUrl.searchParams.get("period") || "30d";
    const { startDate, endDate } = getDateRange(timeRange);

    // Get orders for the current period
    const currentPeriodOrders = await db.supplierOrder.findMany({
      where: {
        supplierId: supplier.id,
        createdAt: { gte: startDate, lte: endDate },
        status: {
          in: [
            "CONFIRMED",
            "IN_PRODUCTION",
            "READY_TO_SHIP",
            "SHIPPED",
            "DELIVERED",
          ],
        },
      },
      include: {
        product: {
          include: {
            category: true,
          },
        },
        order: {
          select: {
            userId: true,
          },
        },
      },
    });

    // Get orders for the previous period to calculate growth
    const previousPeriodStart = new Date(startDate);
    const previousPeriodEnd = new Date(startDate);
    previousPeriodStart.setDate(
      previousPeriodStart.getDate() -
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    const previousPeriodOrders = await db.supplierOrder.findMany({
      where: {
        supplierId: supplier.id,
        createdAt: { gte: previousPeriodStart, lt: startDate },
        status: {
          in: [
            "CONFIRMED",
            "IN_PRODUCTION",
            "READY_TO_SHIP",
            "SHIPPED",
            "DELIVERED",
          ],
        },
      },
      select: {
        supplierRevenue: true,
        commission: true,
        quantity: true,
      },
    });

    // Calculate current period metrics
    const currentTotalRevenue = currentPeriodOrders.reduce(
      (sum, order) => sum + (order.supplierRevenue || 0),
      0
    );
    const currentCommissionEarned = currentPeriodOrders.reduce(
      (sum, order) => sum + (order.commission || 0),
      0
    );
    const currentTotalOrders = currentPeriodOrders.reduce(
      (sum, order) => sum + (order.quantity || 0),
      0
    );

    // Calculate previous period metrics
    const previousTotalRevenue = previousPeriodOrders.reduce(
      (sum, order) => sum + (order.supplierRevenue || 0),
      0
    );

    // Calculate growth
    const revenueGrowth =
      previousTotalRevenue > 0
        ? ((currentTotalRevenue - previousTotalRevenue) /
            previousTotalRevenue) *
          100
        : 0;

    // Calculate average order value
    const averageOrderValue =
      currentTotalOrders > 0 ? currentTotalRevenue / currentTotalOrders : 0;

    // Get monthly revenue (current month)
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlyRevenue = currentPeriodOrders
      .filter(order => order.createdAt >= startOfMonth)
      .reduce((sum, order) => sum + (order.supplierRevenue || 0), 0);

    // Calculate pending payouts (simplified - orders not yet invoiced)
    const pendingPayouts = currentPeriodOrders
      .filter(order => !order.invoiceId)
      .reduce((sum, order) => sum + (order.supplierRevenue || 0), 0);

    // Generate time series data
    const series = generateTimeSeries(currentPeriodOrders, startDate, endDate);

    // Generate breakdown data
    const breakdown = await generateBreakdown(
      currentPeriodOrders,
      currentTotalRevenue
    );

    return NextResponse.json({
      totalRevenue: Number(currentTotalRevenue.toFixed(2)),
      monthlyRevenue: Number(monthlyRevenue.toFixed(2)),
      commissionEarned: Number(currentCommissionEarned.toFixed(2)),
      pendingPayouts: Number(pendingPayouts.toFixed(2)),
      revenueGrowth: Number(revenueGrowth.toFixed(1)),
      averageOrderValue: Number(averageOrderValue.toFixed(2)),
      totalOrders: currentTotalOrders,
      series,
      breakdown,
    });
  } catch (error) {
    console.error("Error fetching revenue data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function getDateRange(timeRange: string): { startDate: Date; endDate: Date } {
  const endDate = new Date();
  const startDate = new Date();

  switch (timeRange) {
    case "7d":
      startDate.setDate(startDate.getDate() - 7);
      break;
    case "30d":
      startDate.setDate(startDate.getDate() - 30);
      break;
    case "90d":
      startDate.setDate(startDate.getDate() - 90);
      break;
    case "1y":
      startDate.setFullYear(startDate.getFullYear() - 1);
      break;
    default:
      startDate.setDate(startDate.getDate() - 30);
  }

  return { startDate, endDate };
}

function generateTimeSeries(orders: any[], startDate: Date, endDate: Date) {
  const seriesMap = new Map<
    string,
    {
      revenue: number;
      commission: number;
      orders: number;
      customers: Set<string>;
    }
  >();

  // Initialize all months in the range
  const cursor = new Date(startDate);
  while (cursor <= endDate) {
    const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`;
    seriesMap.set(key, {
      revenue: 0,
      commission: 0,
      orders: 0,
      customers: new Set(),
    });
    cursor.setMonth(cursor.getMonth() + 1);
  }

  // Aggregate orders by month
  for (const order of orders) {
    const d = new Date(order.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const entry = seriesMap.get(key);
    if (entry) {
      entry.revenue += order.supplierRevenue || 0;
      entry.commission += order.commission || 0;
      entry.orders += order.quantity || 0;
      if (order.order?.userId) {
        entry.customers.add(order.order.userId);
      }
    }
  }

  return Array.from(seriesMap.entries()).map(([month, v]) => ({
    month,
    revenue: Number(v.revenue.toFixed(2)),
    commission: Number(v.commission.toFixed(2)),
    orders: v.orders,
    customers: v.customers.size,
  }));
}

async function generateBreakdown(orders: any[], totalRevenue: number) {
  // Product breakdown
  const productMap = new Map<
    string,
    {
      productId: string;
      name: string;
      revenue: number;
      quantity: number;
    }
  >();

  // Category breakdown
  const categoryMap = new Map<
    string,
    {
      category: string;
      revenue: number;
      quantity: number;
    }
  >();

  // Process orders
  for (const order of orders) {
    // Product breakdown
    const productKey = order.productId;
    const existingProduct = productMap.get(productKey) || {
      productId: order.productId,
      name: order.product?.name || "Unknown Product",
      revenue: 0,
      quantity: 0,
    };
    existingProduct.revenue += order.supplierRevenue || 0;
    existingProduct.quantity += order.quantity || 0;
    productMap.set(productKey, existingProduct);

    // Category breakdown
    const categoryName = order.product?.category?.name || "Uncategorized";
    const existingCategory = categoryMap.get(categoryName) || {
      category: categoryName,
      revenue: 0,
      quantity: 0,
    };
    existingCategory.revenue += order.supplierRevenue || 0;
    existingCategory.quantity += order.quantity || 0;
    categoryMap.set(categoryName, existingCategory);
  }

  // Convert to arrays and calculate percentages
  const byProduct = Array.from(productMap.values())
    .map(product => ({
      ...product,
      percentage: totalRevenue > 0 ? (product.revenue / totalRevenue) * 100 : 0,
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  const byCategory = Array.from(categoryMap.values())
    .map(category => ({
      ...category,
      percentage:
        totalRevenue > 0 ? (category.revenue / totalRevenue) * 100 : 0,
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  // Generate period breakdown (simplified - could be enhanced with more granular data)
  const byPeriod = [
    {
      period: "This Month",
      revenue: byProduct.reduce((sum, p) => sum + p.revenue, 0),
      growth: 12.5, // Mock growth - could be calculated from historical data
    },
    {
      period: "Last Month",
      revenue: byProduct.reduce((sum, p) => sum + p.revenue * 0.8, 0), // Mock previous month
      growth: 8.2,
    },
    {
      period: "This Quarter",
      revenue: byProduct.reduce((sum, p) => sum + p.revenue * 2.5, 0), // Mock quarterly
      growth: 15.7,
    },
  ];

  return {
    byProduct,
    byCategory,
    byPeriod,
  };
}
