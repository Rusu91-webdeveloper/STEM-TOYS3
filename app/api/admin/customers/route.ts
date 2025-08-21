import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import {
  getCached,
  CacheKeys,
  invalidateCache,
  invalidateCachePattern,
} from "@/lib/cache";
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
        "sortBy",
        "search",
      ]);

      // Build where clause for filtering
      const where: any = {
        role: "CUSTOMER", // Only get customers, not admins
      };

      if (filters.status && filters.status !== "all") {
        where.isActive = filters.status === "active";
      }

      if (filters.search) {
        where.OR = [
          { name: { contains: String(filters.search), mode: "insensitive" } },
          { email: { contains: String(filters.search), mode: "insensitive" } },
        ];
      }

      // Determine sort order
      let orderBy: any = { createdAt: "desc" };

      switch (filters.sortBy) {
        case "oldest":
          orderBy = { createdAt: "asc" };
          break;
        case "spent-high":
          orderBy = { orders: { _count: "desc" } };
          break;
        case "spent-low":
          orderBy = { orders: { _count: "asc" } };
          break;
        case "orders-high":
          orderBy = { orders: { _count: "desc" } };
          break;
        default:
          orderBy = { createdAt: "desc" };
      }

      // Use shared cache key utility
      const cacheKey = getCacheKey("admin-customers", {
        ...filters,
        page,
        limit,
      });
      const CACHE_TTL = 2 * 60 * 1000; // 2 minutes
      const customers = await getCached(
        cacheKey,
        async () => {
          // Fetch customers with orders and order counts
          const customers = await db.user.findMany({
            where,
            include: {
              orders: {
                select: {
                  id: true,
                  total: true,
                  createdAt: true,
                },
              },
              _count: {
                select: { orders: true },
              },
            },
            orderBy,
            skip,
            take: limit,
          });
          // Fetch total spent for all customers in one aggregate query
          const customerIds = customers.map(c => c.id);
          const spentAgg = await db.order.groupBy({
            by: ["userId"],
            where: { userId: { in: customerIds } },
            _sum: { total: true },
          });
          const spentByUserId = Object.fromEntries(
            spentAgg.map(a => [a.userId, a._sum.total || 0])
          );
          // Attach total spent to each customer
          type CustomerWithSpent = (typeof customers)[0] & {
            totalSpent: number;
          };
          const customersWithSpent: CustomerWithSpent[] = customers.map(c => ({
            ...c,
            totalSpent: spentByUserId[c.id] || 0,
          }));
          return customersWithSpent;
        },
        CACHE_TTL
      );

      // Format customers for frontend
      const formattedCustomers = customers.map(
        (customer: { totalSpent: number; [key: string]: any }) => {
          // Use precomputed totalSpent
          const totalSpent = customer.totalSpent || 0;

          // Determine customer status
          const status = customer.isActive ? "Active" : "Inactive";

          // Get date of first order for join date or use account creation date
          const joinDate =
            customer.orders.length > 0
              ? new Date(
                  Math.min(
                    ...customer.orders.map((o: { createdAt: string | Date }) =>
                      new Date(o.createdAt).getTime()
                    )
                  )
                )
              : customer.createdAt;

          return {
            id: customer.id,
            name: customer.name || "Anonymous",
            email: customer.email,
            joined: new Date(joinDate).toISOString().split("T")[0],
            orders: customer._count.orders,
            spent: totalSpent,
            status,
          };
        }
      );

      return NextResponse.json({
        customers: formattedCustomers,
        pagination: {
          total: customers.length,
          page,
          limit,
          pages: Math.ceil(customers.length / limit),
        },
      });
    } catch (error) {
      console.error("Error fetching customers:", error);
      return NextResponse.json(
        { error: "Failed to fetch customers" },
        { status: 500 }
      );
    }
  },
  { limit: 30, windowMs: 10 * 60 * 1000 }
);
