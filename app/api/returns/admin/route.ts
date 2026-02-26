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

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const status = searchParams.get("status");
    const reason = searchParams.get("reason");
    const customerSegment = searchParams.get("customerSegment");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const skip = (page - 1) * limit;

    // Build the query filter
    const where: any = {};
    if (status) {
      where.status = status;
    }
    if (reason) {
      where.reason = reason;
    }
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    // Customer segment filtering requires more complex logic
    let customerSegmentFilter = {};
    if (customerSegment) {
      // We'll handle customer segment filtering in the query with includes
    }

    // Get returns with pagination - using select to include photos field
    let returnsQuery = {
      where,
      select: {
        id: true,
        reason: true,
        details: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        refundStatus: true,
        refundError: true,
        photos: true,
        supplierAuthorizationStatus: true,
        supplierAuthorizationDeadline: true,
        supplierAuthorizationRequestedAt: true,
        supplierAuthorizationNumber: true,
        supplierAuthorizationNotes: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        order: {
          select: {
            id: true,
            orderNumber: true,
            createdAt: true,
          },
        },
        orderItem: {
          select: {
            id: true,
            name: true,
            price: true,
            quantity: true,
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                sku: true,
                images: true,
                supplier: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limit,
    };

    // If customer segment filtering is needed, we need to fetch all and filter
    let returns, total;
    if (customerSegment) {
      // Get all returns that match other filters first
      const allReturns = await prisma.return.findMany({
        where,
        select: {
          id: true,
          reason: true,
          details: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          refundStatus: true,
          refundError: true,
          photos: true,
          supplierAuthorizationStatus: true,
          supplierAuthorizationDeadline: true,
          supplierAuthorizationRequestedAt: true,
          supplierAuthorizationNumber: true,
          supplierAuthorizationNotes: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              orders: {
                select: {
                  total: true,
                  createdAt: true,
                },
              },
            },
          },
          order: {
            select: {
              id: true,
              orderNumber: true,
              createdAt: true,
            },
          },
          orderItem: {
            select: {
              id: true,
              name: true,
              price: true,
              quantity: true,
              product: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  sku: true,
                  images: true,
                  supplier: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      // Filter by customer segment
      const filteredReturns = allReturns.filter(returnItem => {
        const userOrders = returnItem.user.orders;
        const totalSpent = userOrders.reduce(
          (sum, order) => sum + order.total,
          0
        );
        const orderCount = userOrders.length;

        switch (customerSegment) {
          case "new":
            return orderCount === 1;
          case "returning":
            return orderCount > 1;
          case "high-value":
            return totalSpent >= 1000;
          case "medium-value":
            return totalSpent >= 500 && totalSpent < 1000;
          case "low-value":
            return totalSpent < 500;
          default:
            return true;
        }
      });

      // Apply pagination to filtered results
      total = filteredReturns.length;
      returns = filteredReturns.slice(skip, skip + limit);

      // Remove user orders from the response (not needed in UI)
      returns = returns.map(returnItem => ({
        ...returnItem,
        user: {
          id: returnItem.user.id,
          name: returnItem.user.name,
          email: returnItem.user.email,
        },
      }));
    } else {
      // Standard query without customer segment filtering
      [returns, total] = await Promise.all([
        prisma.return.findMany(returnsQuery),
        prisma.return.count({ where }),
      ]);
    }

    return NextResponse.json({
      returns,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching returns for admin:", error);
    return NextResponse.json(
      { error: "Failed to fetch returns" },
      { status: 500 }
    );
  }
}
