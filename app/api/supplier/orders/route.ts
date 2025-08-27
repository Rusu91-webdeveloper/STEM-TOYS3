import { NextRequest, NextResponse } from "next/server";
import { withSupplierAuth } from "@/lib/authorization";
import { getCurrentSupplier } from "@/lib/supplier-auth";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

export const GET = withSupplierAuth(async (request: NextRequest, session) => {
  try {
    const supplier = await getCurrentSupplier(session);
    
    if (!supplier) {
      return NextResponse.json(
        { error: "Supplier profile not found" },
        { status: 404 }
      );
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const period = searchParams.get("period") || "";
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    // Build where clause
    const where: any = { supplierId: supplier.id };
    
    if (status && status !== "ALL") {
      where.status = status;
    }
    
    if (search) {
      where.OR = [
        {
          order: {
            orderNumber: { contains: search, mode: "insensitive" }
          }
        },
        {
          product: {
            name: { contains: search, mode: "insensitive" }
          }
        }
      ];
    }
    
    if (period && period !== "ALL") {
      const days = parseInt(period);
      const date = new Date();
      date.setDate(date.getDate() - days);
      where.createdAt = { gte: date };
    }

    // Build order by clause
    const orderBy: any = {};
    if (sortBy === "createdAt") {
      orderBy.createdAt = sortOrder;
    } else if (sortBy === "status") {
      orderBy.status = sortOrder;
    } else if (sortBy === "totalPrice") {
      orderBy.totalPrice = sortOrder;
    } else {
      orderBy.createdAt = "desc";
    }

    // Get total count for pagination
    const total = await db.supplierOrder.count({ where });

    // Get orders with relations
    const orders = await db.supplierOrder.findMany({
      where,
      include: {
        order: {
          select: {
            orderNumber: true,
            total: true,
            status: true,
            paymentStatus: true,
            createdAt: true,
            user: {
              select: {
                name: true,
                email: true,
              }
            },
            shippingAddress: {
              select: {
                fullName: true,
                addressLine1: true,
                city: true,
                state: true,
                postalCode: true,
                country: true,
                phone: true,
              }
            }
          }
        },
        product: {
          select: {
            name: true,
            images: true,
            sku: true,
          }
        }
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy,
    });

    logger.info("Supplier orders fetched successfully", {
      supplierId: supplier.id,
      count: orders.length,
      page,
      limit,
    });

    return NextResponse.json({
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error("Error fetching supplier orders:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
});
