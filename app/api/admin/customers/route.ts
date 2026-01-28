import { randomBytes } from "crypto";

import { hash } from "bcrypt";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

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

const createCustomerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .optional(),
  role: z.enum(["CUSTOMER", "ADMIN"]).default("CUSTOMER"),
  isActive: z.boolean().optional(),
});

function generateRandomPassword(length = 12) {
  // Generate a URL-safe random string
  return randomBytes(length)
    .toString("base64")
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, length);
}

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
            role: customer.role,
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

export const POST = withRateLimit(
  async (request: NextRequest) => {
    try {
      const session = await auth();

      if (!session?.user || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Not authorized" }, { status: 403 });
      }

      const body = await request.json();
      const result = createCustomerSchema.safeParse(body);

      if (!result.success) {
        return NextResponse.json(
          { error: result.error.errors[0]?.message ?? "Invalid request data" },
          { status: 400 }
        );
      }

      const { name, email, password, role, isActive } = result.data;

      // Check if a user with this email already exists
      const existingUser = await db.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        return NextResponse.json(
          {
            error:
              "An account with this email already exists. Please use a different email.",
          },
          { status: 409 }
        );
      }

      const plainPassword = password || generateRandomPassword();
      const hashedPassword = await hash(plainPassword, 12);

      const now = new Date();

      const newUser = await db.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role,
          isActive: isActive ?? true,
          emailVerified: now, // Admin-created accounts are considered verified
          verificationToken: null,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          createdAt: true,
        },
      });

      return NextResponse.json(
        {
          message: "Customer account created successfully",
          user: newUser,
          // Only return the generated password if the admin didn't supply one
          password: password ? undefined : plainPassword,
        },
        { status: 201 }
      );
    } catch (error) {
      console.error("Error creating customer:", error);
      return NextResponse.json(
        { error: "Failed to create customer account" },
        { status: 500 }
      );
    }
  },
  { limit: 20, windowMs: 10 * 60 * 1000 }
);
