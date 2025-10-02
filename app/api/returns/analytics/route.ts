import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized. Admin access required." },
        { status: 403 }
      );
    }

    // Get date range from query parameters
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Build date filter
    const dateFilter: any = {};
    if (startDate) {
      dateFilter.createdAt = {
        ...dateFilter.createdAt,
        gte: new Date(startDate),
      };
    }
    if (endDate) {
      dateFilter.createdAt = {
        ...dateFilter.createdAt,
        lte: new Date(endDate),
      };
    }

    // Get total returns count
    const totalReturns = await prisma.return.count({
      where: dateFilter,
    });

    // Get returns by status
    const returnsByStatus = await prisma.return.groupBy({
      by: ["status"],
      where: dateFilter,
      _count: {
        status: true,
      },
    });

    // Get returns by reason
    const returnsByReason = await prisma.return.groupBy({
      by: ["reason"],
      where: dateFilter,
      _count: {
        reason: true,
      },
    });

    // Get total orders for return rate calculation
    const totalOrders = await prisma.order.count({
      where: {
        status: "DELIVERED", // Only count delivered orders
        createdAt: dateFilter.createdAt,
      },
    });

    // Calculate return rate
    const returnRate = totalOrders > 0 ? (totalReturns / totalOrders) * 100 : 0;

    // Get average processing time (from approved to refunded)
    const processedReturns = await prisma.return.findMany({
      where: {
        ...dateFilter,
        status: "REFUNDED",
      },
      select: {
        createdAt: true,
        updatedAt: true,
      },
    });

    const processingTimes = processedReturns
      .filter(returnItem => returnItem.updatedAt !== null)
      .map(returnItem => {
        const created = new Date(returnItem.createdAt);
        const updated = new Date(returnItem.updatedAt!);
        return updated.getTime() - created.getTime();
      });

    const averageProcessingTime =
      processingTimes.length > 0
        ? processingTimes.reduce((sum, time) => sum + time, 0) /
          processingTimes.length
        : 0;

    // Get returns by customer segment
    const customerSegments = await prisma.return.findMany({
      where: dateFilter,
      include: {
        user: {
          include: {
            orders: {
              select: {
                total: true,
                createdAt: true,
              },
            },
          },
        },
      },
    });

    // Analyze customer segments
    const segmentAnalysis = customerSegments.reduce(
      (acc: any, returnItem) => {
        const userOrders = returnItem.user.orders;
        const totalSpent = userOrders.reduce(
          (sum, order) => sum + order.total,
          0
        );
        const orderCount = userOrders.length;

        if (orderCount === 1) {
          acc.newCustomers += 1;
        } else {
          acc.returningCustomers += 1;
        }

        if (totalSpent > 1000) {
          acc.highValueCustomers += 1;
        } else if (totalSpent > 500) {
          acc.mediumValueCustomers += 1;
        } else {
          acc.lowValueCustomers += 1;
        }

        return acc;
      },
      {
        newCustomers: 0,
        returningCustomers: 0,
        highValueCustomers: 0,
        mediumValueCustomers: 0,
        lowValueCustomers: 0,
      }
    );

    // Get monthly trends (last 12 months)
    const monthlyTrends = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      const monthReturns = await prisma.return.count({
        where: {
          createdAt: {
            gte: monthStart,
            lte: monthEnd,
          },
        },
      });

      monthlyTrends.push({
        month: monthStart.toISOString().slice(0, 7), // YYYY-MM format
        returns: monthReturns,
      });
    }

    return NextResponse.json({
      totalReturns,
      returnRate: Math.round(returnRate * 100) / 100, // Round to 2 decimal places
      averageProcessingTime: Math.round(
        averageProcessingTime / (1000 * 60 * 60 * 24)
      ), // Convert to days
      returnsByStatus: returnsByStatus.map(item => ({
        status: item.status,
        count: item._count.status,
      })),
      returnsByReason: returnsByReason.map(item => ({
        reason: item.reason,
        count: item._count.reason,
      })),
      customerSegments: segmentAnalysis,
      monthlyTrends,
      dateRange: {
        startDate: startDate || null,
        endDate: endDate || null,
      },
    });
  } catch (error) {
    console.error("Error fetching returns analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch returns analytics" },
      { status: 500 }
    );
  }
}
