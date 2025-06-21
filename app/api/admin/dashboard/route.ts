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

      // Top 5 products by orderItems count
      db.orderItem
        .groupBy({
          by: ["productId"],
          _sum: {
            quantity: true,
          },
          orderBy: {
            _sum: {
              quantity: "desc",
            },
          },
          take: 5,
        })
        .then(async (topItems) => {
          // Get full product details
          if (topItems.length === 0) return [];

          // Filter out null productIds and ensure we only have valid IDs
          const productIds = topItems
            .map((item) => item.productId)
            .filter((id): id is string => id !== null && id !== undefined);

          if (productIds.length === 0) return [];

          const products = await db.product.findMany({
            where: {
              id: {
                in: productIds,
              },
            },
            select: {
              id: true,
              name: true,
              price: true,
              stockQuantity: true,
            },
          });

          // Merge sales data with product data
          return topItems.map((item) => {
            const product = products.find((p) => p.id === item.productId);
            return {
              id: item.productId,
              name: product?.name || "Unknown Product",
              price: product?.price || 0,
              sales: item._sum.quantity || 0,
              inventory: product?.stockQuantity || 0,
            };
          });
        }),
    ]);

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
    const formattedRecentOrders = recentOrders.map((order) => ({
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
        value: totalRevenue._sum.total || 0, // Return as number for client-side formatting with RON
        change: calculateChange(
          totalRevenue._sum.total || 0,
          prevTotalRevenue._sum.total || 0
        ),
        trend:
          (totalRevenue._sum.total || 0) >= (prevTotalRevenue._sum.total || 0)
            ? "up"
            : "down",
        description: `Last ${period} days`,
      },
      {
        title: "Total Orders",
        value: totalOrders.toString(),
        change: calculateChange(totalOrders, prevTotalOrders),
        trend: totalOrders >= prevTotalOrders ? "up" : "down",
        description: `Last ${period} days`,
      },
      {
        title: "New Customers",
        value: newCustomers.toString(),
        change: calculateChange(newCustomers, prevNewCustomers),
        trend: newCustomers >= prevNewCustomers ? "up" : "down",
        description: `Last ${period} days`,
      },
      {
        title: "Total Products",
        value: totalProducts.toString(),
        change: "+0.0%", // No comparison for total products
        trend: "up",
        description: "Active products",
      },
    ];

    return NextResponse.json({
      stats,
      recentOrders: formattedRecentOrders,
      topProducts,
    });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
