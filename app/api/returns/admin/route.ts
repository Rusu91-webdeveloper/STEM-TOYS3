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

    const skip = (page - 1) * limit;

    // Build the query filter
    const where: any = {};
    if (status) {
      where.status = status;
    }

    // Get returns with pagination
    const [returns, total] = await Promise.all([
      prisma.return.findMany({
        where,
        include: {
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
      }),
      prisma.return.count({ where }),
    ]);

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
