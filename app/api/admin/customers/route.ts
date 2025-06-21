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
    const sortBy = searchParams.get("sortBy") || "newest";
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    // Build where clause for filtering
    const where: any = {
      role: "CUSTOMER", // Only get customers, not admins
    };

    if (status && status !== "all") {
      where.isActive = status === "active";
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    // Determine sort order
    let orderBy: any = { createdAt: "desc" };

    switch (sortBy) {
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

    // Fetch customers with pagination
    const [customers, totalCount] = await Promise.all([
      db.user.findMany({
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
      }),
      db.user.count({ where }),
    ]);

    // Format customers for frontend
    const formattedCustomers = customers.map((customer) => {
      // Calculate total spent from all orders
      const totalSpent = customer.orders.reduce(
        (sum, order) => sum + order.total,
        0
      );

      // Determine customer status
      const status = customer.isActive ? "Active" : "Inactive";

      // Get date of first order for join date or use account creation date
      const joinDate =
        customer.orders.length > 0
          ? new Date(
              Math.min(...customer.orders.map((o) => o.createdAt.getTime()))
            )
          : customer.createdAt;

      return {
        id: customer.id,
        name: customer.name || "Anonymous",
        email: customer.email,
        joined: joinDate.toISOString().split("T")[0],
        orders: customer._count.orders,
        spent: totalSpent,
        status,
      };
    });

    return NextResponse.json({
      customers: formattedCustomers,
      pagination: {
        total: totalCount,
        page,
        limit,
        pages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching customers:", error);
    return NextResponse.json(
      { error: "Failed to fetch customers" },
      { status: 500 }
    );
  }
}
