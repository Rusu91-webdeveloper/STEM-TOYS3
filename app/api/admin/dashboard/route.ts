import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { getCached, CacheKeys, invalidateCachePattern } from "@/lib/cache";
import { db } from "@/lib/db";
import { withRateLimit } from "@/lib/rate-limit";

export const GET = withRateLimit(
  async (request: NextRequest) => {
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

      // --- Caching logic start ---
      const cacheKey = CacheKeys.user(`admin-dashboard:${period}`);
      const CACHE_TTL = 2 * 60 * 1000; // 2 minutes
      const dashboardData = await getCached(
        cacheKey,
        async () => {
          // Fetch stats in parallel
          const [
            totalRevenue,
            totalOrders,
            newCustomers,
            totalProducts,
            recentOrders,
            topProducts,
          ] = await Promise.all([
            // Total Revenue (sum of all completed orders in period)
            db.order.aggregate({
              where: {
                createdAt: {
                  gte: startDate,
                  lte: endDate,
                },
                status: "COMPLETED",
              },
              _sum: {
                total: true,
              },
            }),
            // Total Orders count in period
            db.order.count({
              where: {
                createdAt: {
                  gte: startDate,
                  lte: endDate,
                },
              },
            }),
            // New Customers count in period
            db.user.count({
              where: {
                role: "CUSTOMER",
                createdAt: {
                  gte: startDate,
                  lte: endDate,
                },
              },
            }),
            // Total active products
            db.product.count({
              where: {
                isActive: true,
              },
            }),
            // Recent 5 Orders with customer info
            db.order.findMany({
              take: 5,
              orderBy: {
                createdAt: "desc",
              },
              include: {
                user: {
                  select: {
                    name: true,
                    email: true,
                  },
                },
              },
            }),
            // Top 5 Products by createdAt (fallback if 'sold' is not present)
            db.product.findMany({
              take: 5,
              orderBy: {
                createdAt: "desc",
              },
            }),
          ]);
          return {
            totalRevenue,
            totalOrders,
            newCustomers,
            totalProducts,
            recentOrders,
            topProducts,
          };
        },
        CACHE_TTL
      );
      // --- Caching logic end ---

      // Get previous period data for comparison
      const prevStartDate = new Date(startDate);
      prevStartDate.setDate(prevStartDate.getDate() - period);

      const [prevTotalRevenue, prevTotalOrders, prevNewCustomers] =
        await Promise.all([
          // Previous period revenue
          db.order.aggregate({
            where: {
              createdAt: {
                gte: prevStartDate,
                lt: startDate,
              },
              status: "COMPLETED",
            },
            _sum: {
              total: true,
            },
          }),
          // Previous period orders
          db.order.count({
            where: {
              createdAt: {
                gte: prevStartDate,
                lt: startDate,
              },
            },
          }),
          // Previous period new customers
          db.user.count({
            where: {
              role: "CUSTOMER",
              createdAt: {
                gte: prevStartDate,
                lt: startDate,
              },
            },
          }),
        ]);

      // Calculate percentage changes
      const calculateChange = (current: number, previous: number) => {
        if (previous === 0) return previous === 0 ? "+100%" : "+0%";
        const change = ((current - previous) / previous) * 100;
        return change >= 0 ? `+${change.toFixed(1)}%` : `${change.toFixed(1)}%`;
      };

      // Format recent orders
      const formattedRecentOrders = dashboardData.recentOrders.map(order => ({
        id: order.orderNumber,
        customer: order.user?.name || "Guest User",
        date: order.createdAt.toISOString().split("T")[0],
        amount: order.total, // Return as number for client-side formatting with RON
        status:
          order.status.charAt(0).toUpperCase() +
          order.status.slice(1).toLowerCase(),
      }));

      // Format stats
      const stats = [
        {
          title: "Total Revenue",
          value: dashboardData.totalRevenue._sum.total || 0, // Return as number for client-side formatting with RON
          change: calculateChange(
            dashboardData.totalRevenue._sum.total || 0,
            prevTotalRevenue._sum.total || 0
          ),
          trend:
            (dashboardData.totalRevenue._sum.total || 0) >=
            (prevTotalRevenue._sum.total || 0)
              ? "up"
              : "down",
          description: `Last ${period} days`,
        },
        {
          title: "Total Orders",
          value: dashboardData.totalOrders.toString(),
          change: calculateChange(dashboardData.totalOrders, prevTotalOrders),
          trend: dashboardData.totalOrders >= prevTotalOrders ? "up" : "down",
          description: `Last ${period} days`,
        },
        {
          title: "New Customers",
          value: dashboardData.newCustomers.toString(),
          change: calculateChange(dashboardData.newCustomers, prevNewCustomers),
          trend: dashboardData.newCustomers >= prevNewCustomers ? "up" : "down",
          description: `Last ${period} days`,
        },
        {
          title: "Total Products",
          value: dashboardData.totalProducts.toString(),
          change: "+0.0%", // No comparison for total products
          trend: "up",
          description: "Active products",
        },
      ];

      return NextResponse.json({
        stats,
        recentOrders: formattedRecentOrders,
        topProducts: dashboardData.topProducts,
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      return NextResponse.json(
        { error: "Failed to fetch dashboard data" },
        { status: 500 }
      );
    }
  },
  { limit: 30, windowMs: 10 * 60 * 1000 }
);
