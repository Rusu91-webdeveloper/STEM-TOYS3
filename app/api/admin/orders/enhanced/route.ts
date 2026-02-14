import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { getCached, CacheKeys } from "@/lib/cache";
import { db } from "@/lib/db";
import { withRateLimit } from "@/lib/rate-limit";

const querySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
  status: z.string().optional(),
  priority: z.string().optional(),
  dateFilter: z.string().optional(),
  sortBy: z
    .enum(["date", "total", "status", "customer", "priority"])
    .default("date"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const GET = withRateLimit(
  async (request: NextRequest) => {
    try {
      // Check authentication
      const session = await auth();
      if (!session?.user || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Not authorized" }, { status: 403 });
      }

      const searchParams = request.nextUrl.searchParams;
      const query = querySchema.parse(
        Object.fromEntries(searchParams.entries())
      );

      // Build where clause
      const where: any = {};

      // Status filter
      if (query.status && query.status !== "all") {
        where.status = query.status;
      }

      // Priority filter
      if (query.priority && query.priority !== "all") {
        where.priority = query.priority.toUpperCase();
      }

      // Date filter
      if (query.dateFilter && query.dateFilter !== "all") {
        const now = new Date();
        let startDate: Date;

        switch (query.dateFilter) {
          case "today":
            startDate = new Date(
              now.getFullYear(),
              now.getMonth(),
              now.getDate()
            );
            break;
          case "week":
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case "month":
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
          case "quarter":
            const quarter = Math.floor(now.getMonth() / 3);
            startDate = new Date(now.getFullYear(), quarter * 3, 1);
            break;
          default:
            startDate = new Date(0); // All time
        }

        where.createdAt = { gte: startDate };
      }

      // Search filter
      if (query.search) {
        where.OR = [
          {
            orderNumber: {
              contains: query.search,
              mode: "insensitive",
            },
          },
          {
            user: {
              OR: [
                {
                  name: {
                    contains: query.search,
                    mode: "insensitive",
                  },
                },
                {
                  email: {
                    contains: query.search,
                    mode: "insensitive",
                  },
                },
              ],
            },
          },
        ];
      }

      // Build orderBy clause
      let orderBy: any = {};
      switch (query.sortBy) {
        case "date":
          orderBy = { createdAt: query.sortOrder };
          break;
        case "total":
          orderBy = { total: query.sortOrder };
          break;
        case "status":
          orderBy = { status: query.sortOrder };
          break;
        case "customer":
          orderBy = { user: { name: query.sortOrder } };
          break;
        case "priority":
          orderBy = { priority: query.sortOrder };
          break;
        default:
          orderBy = { createdAt: query.sortOrder };
      }

      // Caching strategy
      const cacheKey = CacheKeys.analytics(
        `enhanced-orders:${JSON.stringify({ ...query, where })}`
      );
      const CACHE_TTL = 2 * 60 * 1000; // 2 minutes

      const result = await getCached(
        cacheKey,
        async () => {
          // Get orders with enhanced data
          const orders = await db.order.findMany({
            where,
            skip: (query.page - 1) * query.limit,
            take: query.limit,
            orderBy,
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
              items: {
                select: {
                  id: true,
                  quantity: true,
                },
              },
              shippingAddress: {
                select: {
                  addressLine1: true,
                  city: true,
                  country: true,
                  postalCode: true,
                },
              },
            },
          });

          // Get total count
          const totalCount = await db.order.count({ where });

          // Calculate statistics
          const statistics = await calculateOrderStatistics();

          // Transform orders data
          const transformedOrders = orders.map(order => {
            // Safely handle dates - check if they're valid before converting
            const createdAt = order.createdAt && !isNaN(order.createdAt.getTime())
              ? order.createdAt.toISOString()
              : new Date().toISOString(); // Fallback to current date if invalid
            const updatedAt = order.updatedAt && !isNaN(order.updatedAt.getTime())
              ? order.updatedAt.toISOString()
              : createdAt; // Fallback to createdAt if invalid
            const estimatedDelivery = order.estimatedDelivery && !isNaN(order.estimatedDelivery.getTime())
              ? order.estimatedDelivery.toISOString()
              : undefined;

            return {
              id: order.id,
              orderNumber: order.orderNumber || `ORD-${order.id.slice(-8)}`,
              customerName: order.user?.name || "Guest",
              customerEmail: order.user?.email || "",
              customerPhone: null,
              date: createdAt,
              total: order.total,
              status: order.status,
              paymentStatus: order.paymentStatus || "PENDING",
              paymentMethod: order.paymentMethod || "UNKNOWN",
              items: order.items.length,
              shippingAddress: order.shippingAddress
                ? {
                  addressLine1: order.shippingAddress.addressLine1,
                  city: order.shippingAddress.city,
                  country: order.shippingAddress.country,
                  postalCode: order.shippingAddress.postalCode,
                }
                : null,
              trackingNumber: order.trackingNumber,
              carrier: order.carrier,
              estimatedDelivery,
              notes: order.notes,
              priority: order.priority || "MEDIUM",
              tags: order.tags || [],
              lastUpdated: updatedAt,
              updatedBy: order.updatedBy,
            };
          });

          return {
            orders: transformedOrders,
            pagination: {
              page: query.page,
              limit: query.limit,
              total: totalCount,
              pages: Math.ceil(totalCount / query.limit),
            },
            statistics,
          };
        },
        CACHE_TTL
      );

      return NextResponse.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error("Error fetching enhanced orders:", error);

      if (error instanceof z.ZodError) {
        return NextResponse.json(
          {
            error: "Invalid query parameters",
            details: error.errors,
          },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: "Failed to fetch orders" },
        { status: 500 }
      );
    }
  },
  { limit: 50, windowMs: 10 * 60 * 1000 } // Rate limiting for orders
);

async function calculateOrderStatistics() {
  const [
    totalOrders,
    pendingOrders,
    processingOrders,
    shippedOrders,
    deliveredOrders,
    cancelledOrders,
    totalRevenue,
    ordersRequiringAttention,
    highPriorityOrders,
  ] = await Promise.all([
    // Total orders
    db.order.count(),

    // Orders by status
    db.order.count({ where: { status: "PENDING_REVIEW" } }),
    db.order.count({ where: { status: "PROCESSING" } }),
    db.order.count({ where: { status: "SHIPPED" } }),
    db.order.count({ where: { status: "DELIVERED" } }),
    db.order.count({ where: { status: "CANCELLED" } }),

    // Total revenue from completed orders
    db.order.aggregate({
      where: {
        status: {
          in: ["DELIVERED", "COMPLETED"],
        },
      },
      _sum: {
        total: true,
      },
    }),

    // Orders requiring attention (processing for more than 24h)
    db.order.count({
      where: {
        status: "PROCESSING",
        updatedAt: {
          lt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
    }),

    // High priority orders
    db.order.count({
      where: {
        priority: "HIGH",
        status: {
          notIn: ["DELIVERED", "COMPLETED", "CANCELLED"],
        },
      },
    }),
  ]);

  // Calculate average processing time (simplified)
  const processingTimeOrders = await db.order.findMany({
    where: {
      status: "DELIVERED",
      shippedAt: { not: null },
    },
    select: {
      createdAt: true,
      shippedAt: true,
    },
    take: 100, // Sample for performance
  });

  const averageProcessingTime =
    processingTimeOrders.length > 0
      ? processingTimeOrders.reduce((sum, order) => {
        if (order.shippedAt) {
          const diffHours =
            (order.shippedAt.getTime() - order.createdAt.getTime()) /
            (1000 * 60 * 60);
          return sum + diffHours;
        }
        return sum;
      }, 0) / processingTimeOrders.length
      : 0;

  return {
    totalOrders,
    pendingOrders,
    processingOrders,
    shippedOrders,
    deliveredOrders,
    cancelledOrders,
    averageProcessingTime: Math.round(averageProcessingTime * 10) / 10, // Round to 1 decimal
    totalRevenue: totalRevenue._sum.total || 0,
    ordersRequiringAttention,
    highPriorityOrders,
  };
}
