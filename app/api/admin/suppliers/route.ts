import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

export const GET = async (request: NextRequest) => {
  try {
    // Check authentication
    let session;
    try {
      session = await auth();
    } catch (authError) {
      logger.warn("Auth error in admin suppliers", { error: authError });
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Check if user is admin
    if (session.user.role !== "ADMIN") {
      logger.warn("Unauthorized admin access attempt", {
        path: request.nextUrl.pathname,
        userId: session.user.id,
        userRole: session.user.role,
      });
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    // Build where clause
    const where: any = {};

    if (search) {
      where.OR = [
        { companyName: { contains: search, mode: "insensitive" } },
        { contactPersonName: { contains: search, mode: "insensitive" } },
        { contactPersonEmail: { contains: search, mode: "insensitive" } },
        { vatNumber: { contains: search, mode: "insensitive" } },
      ];
    }

    if (status) {
      where.status = status;
    }

    // Build order by clause
    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    // Fetch suppliers with pagination
    const [suppliers, total] = await Promise.all([
      db.supplier.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              isActive: true,
              createdAt: true,
            },
          },
          _count: {
            select: {
              products: true,
              orders: true,
            },
          },
        },
      }),
      db.supplier.count({ where }),
    ]);

    // Get status counts for filters
    const statusCounts = await db.supplier.groupBy({
      by: ["status"],
      _count: {
        status: true,
      },
    });

    const statusCountsMap = statusCounts.reduce(
      (acc, item) => {
        acc[item.status] = item._count.status;
        return acc;
      },
      {} as Record<string, number>
    );

    // Calculate total revenue for each supplier
    const suppliersWithRevenue = await Promise.all(
      suppliers.map(async supplier => {
        const revenue = await db.supplierOrder.aggregate({
          where: {
            supplierId: supplier.id,
            status: { in: ["DELIVERED"] },
          },
          _sum: { supplierRevenue: true },
        });

        return {
          ...supplier,
          totalRevenue: revenue._sum.supplierRevenue || 0,
        };
      })
    );

    const response = {
      suppliers: suppliersWithRevenue,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      filters: {
        statusCounts: statusCountsMap,
      },
    };

    logger.info("Admin suppliers list retrieved successfully", {
      adminId: session.user.id,
      totalSuppliers: total,
      page,
      limit,
    });

    return NextResponse.json(response);
  } catch (error) {
    logger.error("Error retrieving admin suppliers list:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
};

export const POST = async (request: NextRequest) => {
  try {
    // Check authentication
    let session;
    try {
      session = await auth();
    } catch (authError) {
      logger.warn("Auth error in admin suppliers POST", { error: authError });
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Check if user is admin
    if (session.user.role !== "ADMIN") {
      logger.warn("Unauthorized admin access attempt", {
        path: request.nextUrl.pathname,
        userId: session.user.id,
        userRole: session.user.role,
      });
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action, supplierId, ...data } = body;

    if (!action || !supplierId) {
      return NextResponse.json(
        { error: "Action and supplierId are required" },
        { status: 400 }
      );
    }

    // Verify supplier exists
    const existingSupplier = await db.supplier.findUnique({
      where: { id: supplierId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!existingSupplier) {
      return NextResponse.json(
        { error: "Supplier not found" },
        { status: 404 }
      );
    }

    let supplier;
    let logMessage;

    switch (action) {
      case "approve":
        supplier = await db.supplier.update({
          where: { id: supplierId },
          data: {
            status: "APPROVED",
            approvedAt: new Date(),
            approvedBy: session.user.id,
            rejectionReason: null,
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        });
        logMessage = "Supplier approved";
        break;

      case "reject":
        supplier = await db.supplier.update({
          where: { id: supplierId },
          data: {
            status: "REJECTED",
            rejectionReason: data.rejectionReason || "Application rejected",
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        });
        logMessage = "Supplier rejected";
        break;

      case "suspend":
        supplier = await db.supplier.update({
          where: { id: supplierId },
          data: {
            status: "SUSPENDED",
            rejectionReason: data.suspensionReason || "Account suspended",
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        });
        logMessage = "Supplier suspended";
        break;

      case "update":
        const updateData: any = {};
        if (data.commissionRate !== undefined)
          updateData.commissionRate = data.commissionRate;
        if (data.paymentTerms !== undefined)
          updateData.paymentTerms = data.paymentTerms;
        if (data.minimumOrderValue !== undefined)
          updateData.minimumOrderValue = data.minimumOrderValue;
        if (data.status !== undefined) updateData.status = data.status;

        supplier = await db.supplier.update({
          where: { id: supplierId },
          data: updateData,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        });
        logMessage = "Supplier updated";
        break;

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    logger.info(logMessage, {
      adminId: session.user.id,
      supplierId,
      action,
      supplierName: supplier?.companyName,
    });

    return NextResponse.json({
      success: true,
      message: logMessage,
      supplier,
    });
  } catch (error) {
    logger.error("Error in admin supplier action:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
};
