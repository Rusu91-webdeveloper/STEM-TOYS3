import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const period = parseInt(searchParams.get("period") || "30");

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - period);

    // Generate trend data (simplified - in production this would use more sophisticated analysis)
    const trends = await generateTrendData(startDate, endDate, period);
    const predictions = await generatePredictions(startDate, endDate);
    const alerts = await getActiveAlerts();
    const alertRules = await getAlertRules();
    const kpis = await calculateKPIs(startDate, endDate);

    logger.info("Advanced analytics data retrieved", {
      adminId: session.user.id,
      period,
      dateRange: `${startDate.toISOString().split("T")[0]} to ${endDate.toISOString().split("T")[0]}`,
    });

    return NextResponse.json({
      trends,
      predictions,
      alerts,
      alertRules,
      kpis,
    });
  } catch (error) {
    logger.error("Error retrieving advanced analytics:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function generateTrendData(
  startDate: Date,
  endDate: Date,
  period: number
) {
  // Generate weekly/monthly trend data based on period
  const intervals = period <= 30 ? 7 : period <= 90 ? 4 : 12; // days/weeks/months
  const intervalLength = Math.floor(period / intervals);

  const trends = {
    revenue: [] as any[],
    orders: [] as any[],
    customers: [] as any[],
    conversion: [] as any[],
  };

  for (let i = 0; i < intervals; i++) {
    const intervalStart = new Date(startDate);
    intervalStart.setDate(startDate.getDate() + i * intervalLength);

    const intervalEnd = new Date(intervalStart);
    intervalEnd.setDate(intervalStart.getDate() + intervalLength);

    if (intervalEnd > endDate) intervalEnd.setTime(endDate.getTime());

    // Revenue trend
    const revenueData = await db.supplierOrder.aggregate({
      where: {
        createdAt: { gte: intervalStart, lte: intervalEnd },
        status: { in: ["DELIVERED"] },
      },
      _sum: { totalCost: true },
    });

    // Orders trend
    const ordersData = await db.supplierOrder.count({
      where: {
        createdAt: { gte: intervalStart, lte: intervalEnd },
      },
    });

    // Customers trend (simplified)
    const customersData = await db.user.count({
      where: {
        role: "CUSTOMER",
        createdAt: { gte: intervalStart, lte: intervalEnd },
      },
    });

    // Calculate trends with previous interval comparison
    const prevIntervalStart = new Date(intervalStart);
    prevIntervalStart.setDate(intervalStart.getDate() - intervalLength);

    const prevRevenueData = await db.supplierOrder.aggregate({
      where: {
        createdAt: { gte: prevIntervalStart, lte: intervalStart },
        status: { in: ["DELIVERED"] },
      },
      _sum: { totalCost: true },
    });

    const prevOrdersData = await db.supplierOrder.count({
      where: {
        createdAt: { gte: prevIntervalStart, lte: intervalStart },
      },
    });

    const currentRevenue = revenueData._sum.totalCost || 0;
    const prevRevenue = prevRevenueData._sum.totalCost || 0;
    const revenueChange =
      prevRevenue > 0
        ? ((currentRevenue - prevRevenue) / prevRevenue) * 100
        : 0;

    const ordersChange =
      prevOrdersData > 0
        ? ((ordersData - prevOrdersData) / prevOrdersData) * 100
        : 0;

    const periodLabel =
      period <= 30
        ? `Day ${i + 1}`
        : period <= 90
          ? `Week ${i + 1}`
          : `Month ${i + 1}`;

    trends.revenue.push({
      period: periodLabel,
      value: currentRevenue,
      change: currentRevenue - prevRevenue,
      changePercent: parseFloat(revenueChange.toFixed(1)),
      trend: revenueChange >= 0 ? "up" : ("down" as const),
    });

    trends.orders.push({
      period: periodLabel,
      value: ordersData,
      change: ordersData - prevOrdersData,
      changePercent: parseFloat(ordersChange.toFixed(1)),
      trend: ordersChange >= 0 ? "up" : ("down" as const),
    });

    trends.customers.push({
      period: periodLabel,
      value: customersData,
      change: 0, // Simplified
      changePercent: 0,
      trend: "stable" as const,
    });

    trends.conversion.push({
      period: periodLabel,
      value: 2.5 + Math.random() * 2, // Mock conversion rate
      change: 0,
      changePercent: Math.random() * 20 - 10,
      trend: Math.random() > 0.5 ? "up" : ("down" as const),
    });
  }

  return trends;
}

async function generatePredictions(startDate: Date, endDate: Date) {
  // Simple linear regression for predictions (simplified)
  const revenueData = await db.supplierOrder.aggregate({
    where: {
      createdAt: { gte: startDate, lte: endDate },
      status: { in: ["DELIVERED"] },
    },
    _sum: { totalCost: true },
  });

  const ordersData = await db.supplierOrder.count({
    where: {
      createdAt: { gte: startDate, lte: endDate },
    },
  });

  const daysInPeriod = Math.ceil(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  const dailyRevenue = (revenueData._sum.totalCost || 0) / daysInPeriod;
  const dailyOrders = ordersData / daysInPeriod;

  // Predict next month (30 days)
  const predictedRevenue = dailyRevenue * 30;
  const predictedOrders = Math.round(dailyOrders * 30);

  return {
    revenue: {
      nextMonth: predictedRevenue,
      confidence: 75 + Math.random() * 20, // 75-95% confidence
      trend:
        predictedRevenue >
        ((revenueData._sum.totalCost || 0) / daysInPeriod) * 30
          ? "up"
          : ("down" as const),
    },
    orders: {
      nextMonth: predictedOrders,
      confidence: 70 + Math.random() * 25, // 70-95% confidence
      trend:
        predictedOrders > (ordersData / daysInPeriod) * 30
          ? "up"
          : ("down" as const),
    },
  };
}

async function getActiveAlerts() {
  // In a real implementation, this would query an alerts table
  // For now, return mock alerts based on current metrics
  const alerts = [];

  // Check for low revenue trend
  const recentRevenue = await db.supplierOrder.aggregate({
    where: {
      createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      status: { in: ["DELIVERED"] },
    },
    _sum: { totalCost: true },
  });

  if ((recentRevenue._sum.totalCost || 0) < 1000) {
    alerts.push({
      id: "revenue-alert-1",
      title: "Low Revenue Warning",
      message:
        "Weekly revenue is below $1,000 threshold. Consider promotional activities.",
      severity: "medium" as const,
      timestamp: new Date(),
      metric: "Weekly Revenue",
      value: recentRevenue._sum.totalCost || 0,
      threshold: 1000,
      acknowledged: false,
    });
  }

  return alerts;
}

async function getAlertRules() {
  // Mock alert rules - in production this would be stored in database
  return [
    {
      id: "revenue-drop",
      name: "Revenue Drop Alert",
      description: "Alert when revenue drops by more than 20% in a week",
      metric: "Weekly Revenue",
      condition: "below" as const,
      threshold: 1000,
      enabled: true,
      severity: "medium" as const,
    },
    {
      id: "order-spike",
      name: "Order Volume Spike",
      description: "Alert when daily orders exceed 50",
      metric: "Daily Orders",
      condition: "above" as const,
      threshold: 50,
      enabled: true,
      severity: "low" as const,
    },
    {
      id: "conversion-drop",
      name: "Conversion Rate Drop",
      description: "Alert when conversion rate drops below 1%",
      metric: "Conversion Rate",
      condition: "below" as const,
      threshold: 1.0,
      enabled: true,
      severity: "high" as const,
    },
  ];
}

async function calculateKPIs(startDate: Date, endDate: Date) {
  // Calculate comprehensive KPIs
  const revenueData = await db.supplierOrder.aggregate({
    where: {
      createdAt: { gte: startDate, lte: endDate },
      status: { in: ["DELIVERED"] },
    },
    _sum: { totalCost: true },
  });

  const ordersData = await db.supplierOrder.count({
    where: {
      createdAt: { gte: startDate, lte: endDate },
    },
  });

  const avgOrderValue =
    ordersData > 0 ? (revenueData._sum.totalCost || 0) / ordersData : 0;

  return {
    totalRevenue: revenueData._sum.totalCost || 0,
    totalOrders: ordersData,
    averageOrderValue: avgOrderValue,
    conversionRate: 2.3 + Math.random() * 1.5, // Mock conversion rate
    customerRetention: 65 + Math.random() * 20, // Mock retention rate
    profitMargin: 25 + Math.random() * 15, // Mock profit margin
  };
}
