import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    // Get period from query params (default to 30 days)
    const searchParams = request.nextUrl.searchParams;
    const period = parseInt(searchParams.get("period") || "30");

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - period);

    // Fetch analytics data in parallel
    const [salesData, orderStats, topSellingProducts, salesByCategory] =
      await Promise.all([
        // Sales data aggregation (daily, weekly, monthly)
        fetchSalesData(startDate, endDate),

        // Order stats for conversion rate and average order value
        fetchOrderStats(startDate, endDate),

        // Top selling products
        fetchTopSellingProducts(startDate, endDate),

        // Sales by category
        fetchSalesByCategory(startDate, endDate),
      ]);

    return NextResponse.json({
      salesData,
      orderStats,
      topSellingProducts,
      salesByCategory,
    });
  } catch (error) {
    console.error("Error fetching analytics data:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics data" },
      { status: 500 }
    );
  }
}

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
    trending: percentageChange >= 0 ? "up" : "down",
  };
}

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
    _sum: {
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

  // Estimate conversion rate
  // In a real app, you'd track site visits and calculate actual conversion rate
  // For now, we'll use a simplified estimate based on orders vs customers
  const conversionRate =
    totalCustomers > 0 ? (totalOrders / totalCustomers) * 100 : 0;
  const conversionRateChange = Math.random() * 2 - 1; // Random value between -1 and 1 for demo

  return {
    conversionRate: {
      rate: parseFloat(conversionRate.toFixed(1)),
      previousPeriodChange: parseFloat(conversionRateChange.toFixed(1)),
      trending: conversionRateChange >= 0 ? "up" : "down",
    },
    averageOrderValue: {
      value: parseFloat(currentAOV.toFixed(2)),
      previousPeriodChange: parseFloat(aovGrowthPercentage.toFixed(1)),
      trending: aovGrowthPercentage >= 0 ? "up" : "down",
    },
    totalCustomers: {
      value: totalCustomers,
      previousPeriodChange: parseFloat(customerGrowthPercentage.toFixed(1)),
      trending: customerGrowthPercentage >= 0 ? "up" : "down",
    },
  };
}

async function fetchTopSellingProducts(startDate: Date, endDate: Date) {
  // Get top selling products in the period
  const topProductsSales = await db.orderItem.groupBy({
    by: ["productId"],
    where: {
      order: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    },
    _sum: {
      quantity: true,
    },
    _count: {
      productId: true,
    },
    orderBy: {
      _sum: {
        quantity: "desc",
      },
    },
    take: 5,
  });

  if (topProductsSales.length === 0) return [];

  // Get product details
  const productIds = topProductsSales.map(item => item.productId);
  const products = await db.product.findMany({
    where: {
      id: {
        in: productIds.filter((id): id is string => id !== null),
      },
    },
    select: {
      id: true,
      name: true,
      price: true,
    },
  });

  // Calculate revenue and format data
  return topProductsSales
    .map(item => {
      const product = products.find(p => p.id === item.productId);
      const soldQuantity = item._sum.quantity || 0;
      const price = product?.price || 0;
      const revenue = soldQuantity * price;

      return {
        name: product?.name || "Unknown Product",
        price,
        sold: soldQuantity,
        revenue,
      };
    })
    .sort((a, b) => b.revenue - a.revenue);
}

async function fetchSalesByCategory(startDate: Date, endDate: Date) {
  // First get all order items in the period with their products
  const orderItems = await db.orderItem.findMany({
    where: {
      order: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        status: {
          in: ["COMPLETED", "DELIVERED", "SHIPPED"],
        },
      },
    },
    include: {
      product: {
        select: {
          categoryId: true,
        },
      },
    },
  });

  // Get all category IDs from the order items
  const categoryIds = [
    ...new Set(
      orderItems
        .filter(item => item.product !== null)
        .map(item => item.product!.categoryId)
        .filter((id): id is string => id !== null)
    ),
  ];

  // Get category details
  const categories = await db.category.findMany({
    where: {
      id: {
        in: categoryIds,
      },
    },
    select: {
      id: true,
      name: true,
    },
  });

  // Calculate sales by category
  const categorySales = categoryIds
    .map(categoryId => {
      const categoryItems = orderItems.filter(
        item => item.product?.categoryId === categoryId
      );
      const totalAmount = categoryItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );
      const categoryName =
        categories.find(c => c.id === categoryId)?.name || "Unknown";

      return {
        categoryId,
        category: categoryName,
        amount: totalAmount,
      };
    })
    .sort((a, b) => b.amount - a.amount);

  // Calculate total sales for percentage
  const totalSales = categorySales.reduce(
    (sum, category) => sum + category.amount,
    0
  );

  // Add percentage to each category
  return categorySales.map(category => ({
    ...category,
    percentage:
      totalSales > 0 ? Math.round((category.amount / totalSales) * 100) : 0,
  }));
}
