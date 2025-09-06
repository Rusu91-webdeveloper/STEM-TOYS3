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

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const role = searchParams.get("role") || "";
    const status = searchParams.get("status") || "";
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    if (role && role !== "all") {
      where.role = role;
    }

    if (status && status !== "all") {
      where.isActive = status === "active";
    }

    // Build order by clause
    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    // Get role counts
    const roleCounts = await db.user.groupBy({
      by: ["role"],
      _count: {
        role: true,
      },
    });

    // Get status counts
    const statusCounts = await db.user.groupBy({
      by: ["isActive"],
      _count: {
        isActive: true,
      },
    });

    // Fetch users with pagination
    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              orders: true,
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      db.user.count({ where }),
    ]);

    // Format role counts
    const roleStats = {
      CUSTOMER: 0,
      ADMIN: 0,
      SUPPLIER: 0,
      VISITOR: 0,
    };

    roleCounts.forEach(count => {
      roleStats[count.role as keyof typeof roleStats] = count._count.role;
    });

    // Format status counts
    const statusStats = {
      active: 0,
      inactive: 0,
    };

    statusCounts.forEach(count => {
      if (count.isActive) {
        statusStats.active = count._count.isActive;
      } else {
        statusStats.inactive = count._count.isActive;
      }
    });

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      users,
      pagination: {
        total,
        page,
        limit,
        pages: totalPages,
      },
      statistics: {
        totalUsers: total,
        roleStats,
        statusStats,
      },
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}
