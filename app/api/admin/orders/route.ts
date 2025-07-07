import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  getCached,
  CacheKeys,
  invalidateCache,
  invalidateCachePattern,
} from "@/lib/cache";
import { withRateLimit } from "@/lib/rate-limit";
import { getPaginationParams } from "@/lib/utils/pagination";
import { getFilterParams } from "@/lib/utils/filtering";
import { getCacheKey } from "@/lib/utils/cache-key";

export const GET = withRateLimit(
  async function GET(request: NextRequest) {
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
      const where: any = {};

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
      const orders = await getCached(
        cacheKey,
        async () => {
          return await db.order.findMany({
            where,
            include: {
              user: {
                select: {
                  name: true,
                  email: true,
                },
              },
            },
            orderBy: {
              createdAt: "desc",
            },
            skip,
            take: limit,
          });
        },
        CACHE_TTL
      );

      return NextResponse.json(orders);
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
