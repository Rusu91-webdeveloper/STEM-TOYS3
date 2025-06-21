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

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");
    const period = searchParams.get("period");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    // Build where clause for filtering
    const where: any = {};

    if (status && status !== "all") {
      where.status = status.toUpperCase();
    }

    if (period && period !== "all") {
      const days = parseInt(period);
      const date = new Date();
      date.setDate(date.getDate() - days);
      where.createdAt = {
        gte: date,
      };
    }

    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: "insensitive" } },
        {
          user: {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
            ],
          },
        },
      ];
    }

    // Fetch orders with pagination
    const [orders, totalCount] = await Promise.all([
      db.order.findMany({
        where,
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
        },
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: limit,
      }),
      db.order.count({ where }),
    ]);

    // Format orders for frontend
    const formattedOrders = orders.map((order) => ({
      id: order.orderNumber,
      customer: order.user.name || "Guest User",
      email: order.user.email,
      date: order.createdAt.toISOString().split("T")[0],
      total: order.total,
      status: formatStatus(order.status),
      payment: order.paymentMethod,
      items: order.items.reduce((sum, item) => sum + item.quantity, 0),
    }));

    return NextResponse.json({
      orders: formattedOrders,
      pagination: {
        total: totalCount,
        page,
        limit,
        pages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

// Helper function to format order status for display
function formatStatus(status: string): string {
  // Convert from enum format (e.g., PROCESSING) to title case (e.g., Processing)
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
}
