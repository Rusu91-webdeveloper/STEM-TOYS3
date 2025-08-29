import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// GET - Aggregated supplier stats for analytics dashboards
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "SUPPLIER") {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const supplier = await db.supplier.findUnique({
      where: { userId: session.user.id },
      select: { id: true, commissionRate: true },
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

    // Define useful time ranges
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Parallelize queries for performance
    const [
      totalProducts,
      activeProducts,
      totalOrders,
      pendingOrders,
      revenueAllTimeAgg,
      revenueThisMonthAgg,
      pendingInvoicesCount,
      revenueSeries,
      performanceMetrics,
    ] = await Promise.all([
      db.product.count({ where: { supplierId: supplier.id } }),
      db.product.count({ where: { supplierId: supplier.id, isActive: true } }),
      db.supplierOrder.count({ where: { supplierId: supplier.id } }),
      db.supplierOrder.count({
        where: { supplierId: supplier.id, status: "PENDING" },
      }),
      db.supplierOrder.aggregate({
        _sum: { supplierRevenue: true, commission: true },
        where: { supplierId: supplier.id },
      }),
      db.supplierOrder.aggregate({
        _sum: { supplierRevenue: true },
        where: { supplierId: supplier.id, createdAt: { gte: startOfMonth } },
      }),
      db.supplierInvoice.count({
        where: {
          supplierId: supplier.id,
          status: { in: ["DRAFT", "SENT", "OVERDUE"] },
        },
      }),
      getRevenueSeriesForSupplier(supplier.id, startDate, endDate),
      getPerformanceMetrics(supplier.id, startDate, endDate),
    ]);

    const totalRevenue = revenueAllTimeAgg._sum.supplierRevenue ?? 0;
    const monthlyRevenue = revenueThisMonthAgg._sum.supplierRevenue ?? 0;
    const commissionEarned = revenueAllTimeAgg._sum.commission ?? 0;

    return NextResponse.json({
      totalProducts,
      activeProducts,
      totalOrders,
      pendingOrders,
      totalRevenue,
      monthlyRevenue,
      commissionEarned,
      pendingInvoices: pendingInvoicesCount,
      revenueSeries,
      performanceMetrics,
    });
  } catch (error) {
    console.error("Error fetching supplier stats:", error);
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

async function getRevenueSeriesForSupplier(
  supplierId: string,
  startDate: Date,
  endDate: Date
) {
  // Build list of days
  const days: Date[] = [];
  const d = new Date(startDate);
  d.setHours(0, 0, 0, 0);
  while (d <= endDate) {
    days.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }

  const orders = await db.supplierOrder.findMany({
    where: {
      supplierId,
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
    select: { createdAt: true, supplierRevenue: true },
  });

  return days.map(day => {
    const dayStart = new Date(day);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(day);
    dayEnd.setHours(23, 59, 59, 999);

    const dayTotal = orders
      .filter(o => o.createdAt >= dayStart && o.createdAt <= dayEnd)
      .reduce((sum, o) => sum + (o.supplierRevenue || 0), 0);

    return {
      date: day.toISOString().split("T")[0],
      revenue: Number(dayTotal.toFixed(2)),
    };
  });
}

async function getPerformanceMetrics(
  supplierId: string,
  startDate: Date,
  endDate: Date
) {
  try {
    // Get orders for the period
    const orders = await db.supplierOrder.findMany({
      where: {
        supplierId,
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
        order: {
          include: {
            user: true,
          },
        },
        product: {
          include: {
            category: true,
            reviews: true,
          },
        },
      },
    });

    // Calculate basic metrics
    const totalRevenue = orders.reduce(
      (sum, o) => sum + (o.supplierRevenue || 0),
      0
    );
    const totalOrders = orders.length;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Calculate conversion rate (simplified - would need actual visitor data)
    const conversionRate = 3.2; // Mock value - in real implementation would calculate from analytics

    // Calculate customer retention
    const uniqueCustomers = new Set(orders.map(o => o.order.userId));
    const customerRetentionRate = 85.5; // Mock value - would calculate from historical data

    // Get product performance
    const productPerformance = await getProductPerformance(
      supplierId,
      startDate,
      endDate
    );

    // Get category performance
    const topCategories = await getCategoryPerformance(
      supplierId,
      startDate,
      endDate
    );

    // Get customer segments (simplified)
    const customerSegments = [
      {
        segment: "New Customers",
        count: Math.floor(uniqueCustomers.size * 0.3),
        revenue: totalRevenue * 0.25,
      },
      {
        segment: "Returning Customers",
        count: Math.floor(uniqueCustomers.size * 0.5),
        revenue: totalRevenue * 0.55,
      },
      {
        segment: "VIP Customers",
        count: Math.floor(uniqueCustomers.size * 0.2),
        revenue: totalRevenue * 0.2,
      },
    ];

    return {
      conversionRate,
      averageOrderValue,
      customerRetentionRate,
      productPerformance,
      topCategories,
      customerSegments,
    };
  } catch (error) {
    console.error("Error calculating performance metrics:", error);
    return {
      conversionRate: 0,
      averageOrderValue: 0,
      customerRetentionRate: 0,
      productPerformance: [],
      topCategories: [],
      customerSegments: [],
    };
  }
}

async function getProductPerformance(
  supplierId: string,
  startDate: Date,
  endDate: Date
) {
  const productStats = await db.supplierOrder.groupBy({
    by: ["productId"],
    where: {
      supplierId,
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
    _sum: {
      quantity: true,
      supplierRevenue: true,
    },
    _count: {
      id: true,
    },
  });

  const productIds = productStats.map(p => p.productId);
  const products = await db.product.findMany({
    where: { id: { in: productIds } },
    include: {
      reviews: true,
    },
  });

  return productStats
    .map(stat => {
      const product = products.find(p => p.id === stat.productId);
      const averageRating = product?.reviews.length
        ? product.reviews.reduce((sum, r) => sum + r.rating, 0) /
          product.reviews.length
        : 0;

      return {
        productId: stat.productId,
        name: product?.name || "Unknown Product",
        sales: stat._sum.quantity || 0,
        revenue: stat._sum.supplierRevenue || 0,
        rating: averageRating,
      };
    })
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);
}

async function getCategoryPerformance(
  supplierId: string,
  startDate: Date,
  endDate: Date
) {
  const categoryStats = await db.supplierOrder.groupBy({
    by: ["productId"],
    where: {
      supplierId,
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
    _sum: {
      quantity: true,
      supplierRevenue: true,
    },
  });

  const productIds = categoryStats.map(p => p.productId);
  const products = await db.product.findMany({
    where: { id: { in: productIds } },
    include: {
      category: true,
    },
  });

  const categoryMap = new Map<string, { sales: number; revenue: number }>();

  categoryStats.forEach(stat => {
    const product = products.find(p => p.id === stat.productId);
    const categoryName = product?.category?.name || "Uncategorized";

    const existing = categoryMap.get(categoryName) || { sales: 0, revenue: 0 };
    categoryMap.set(categoryName, {
      sales: existing.sales + (stat._sum.quantity || 0),
      revenue: existing.revenue + (stat._sum.supplierRevenue || 0),
    });
  });

  return Array.from(categoryMap.entries())
    .map(([category, stats]) => ({
      category,
      sales: stats.sales,
      revenue: stats.revenue,
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);
}
