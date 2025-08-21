import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { getCached } from "@/lib/cache";
import { db } from "@/lib/db";
import { withRateLimit } from "@/lib/rate-limit";
import { getCacheKey } from "@/lib/utils/cache-key";
import { getFilterParams } from "@/lib/utils/filtering";
import { getPaginationParams } from "@/lib/utils/pagination";

export const GET = withRateLimit(
  async (request: NextRequest) => {
    try {
      // Check authentication
      const session = await auth();

      if (!session?.user || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Not authorized" }, { status: 403 });
      }

      // Use shared utilities for pagination and filtering
      const searchParams = request.nextUrl.searchParams;
      const { page, limit, skip } = getPaginationParams(searchParams, {
        defaultLimit: 10,
        maxLimit: 100,
      });
      const filters = getFilterParams(searchParams, [
        "status",
        "period",
        "search",
      ]);

      // Build where clause for filtering
      const where: {
        status?: string;
        createdAt?: { gte: Date };
        OR?: Array<{
          orderNumber?: { contains: string; mode: "insensitive" };
          user?: {
            OR: Array<{
              name?: { contains: string; mode: "insensitive" };
              email?: { contains: string; mode: "insensitive" };
            }>;
          };
        }>;
      } = {};

      if (filters.status && filters.status !== "all") {
        where.status = String(filters.status).toUpperCase();
      }

      if (filters.period && filters.period !== "all") {
        const days = parseInt(String(filters.period));
        const date = new Date();
        date.setDate(date.getDate() - days);
        where.createdAt = {
          gte: date,
        };
      }

      if (filters.search) {
        where.OR = [
          {
            orderNumber: {
              contains: String(filters.search),
              mode: "insensitive",
            },
          },
          {
            user: {
              OR: [
                {
                  name: {
                    contains: String(filters.search),
                    mode: "insensitive",
                  },
                },
                {
                  email: {
                    contains: String(filters.search),
                    mode: "insensitive",
                  },
                },
              ],
            },
          },
        ];
      }

      // Use shared cache key utility
      const cacheKey = getCacheKey("admin-orders", { ...filters, page, limit });
      const CACHE_TTL = 2 * 60 * 1000; // 2 minutes

      // Get total count for pagination (not cached to ensure accuracy)
      const totalCount = await db.order.count({ where });

      // Get orders with proper relations
      const orders = await getCached(
        cacheKey,
        () =>
          db.order.findMany({
            where,
            include: {
              user: {
                select: {
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
            },
            orderBy: {
              createdAt: "desc",
            },
            skip,
            take: limit,
          }),
        CACHE_TTL
      );

      // Format orders for frontend
      const formattedOrders = orders.map(order => ({
        id: order.orderNumber ?? order.id,
        customer: order.user?.name ?? "Guest User",
        email: order.user?.email ?? "N/A",
        date: new Date(order.createdAt).toISOString().split("T")[0], // Format as YYYY-MM-DD
        total: order.total,
        status: formatStatus(order.status),
        payment: order.paymentMethod ?? "N/A",
        items: order.items?.reduce((sum, item) => sum + item.quantity, 0) ?? 0,
      }));

      // Calculate pagination
      const totalPages = Math.ceil(totalCount / limit);
      const pagination = {
        total: totalCount,
        page,
        limit,
        pages: totalPages,
      };

      // Return formatted response that matches frontend expectations
      return NextResponse.json({
        orders: formattedOrders,
        pagination,
      });
    } catch (error) {
      return NextResponse.json(
        { error: "Failed to fetch admin orders", details: error },
        { status: 500 }
      );
    }
  },
  { limit: 30, windowMs: 10 * 60 * 1000 }
);

// Helper function to format order status for display
function formatStatus(status: string): string {
  // Convert from enum format (e.g., PROCESSING) to title case (e.g., Processing)
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
}

// After any admin order mutation (POST, PUT, DELETE), add:
// await invalidateCachePattern('order:');
// await invalidateCachePattern('orders:');
