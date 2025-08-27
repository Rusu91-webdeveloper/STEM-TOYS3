import { NextRequest, NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/authorization";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

export const GET = withAdminAuth(async (request: NextRequest, session) => {
  try {
    const supplierId = request.nextUrl.pathname.split("/").pop();

    if (!supplierId) {
      return NextResponse.json(
        { error: "Supplier ID is required" },
        { status: 400 }
      );
    }

    const supplier = await db.supplier.findUnique({
      where: { id: supplierId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        approvedByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            products: true,
            orders: true,
            invoices: true,
          },
        },
      },
    });

    if (!supplier) {
      return NextResponse.json(
        { error: "Supplier not found" },
        { status: 404 }
      );
    }

    // Get supplier statistics
    const [totalRevenue, totalOrders, recentOrders, productStats] =
      await Promise.all([
        // Total revenue
        db.supplierOrder.aggregate({
          where: {
            supplierId,
            status: { in: ["DELIVERED"] },
          },
          _sum: { supplierRevenue: true },
        }),

        // Total orders
        db.supplierOrder.count({
          where: { supplierId },
        }),

        // Recent orders
        db.supplierOrder.findMany({
          where: { supplierId },
          include: {
            order: {
              select: {
                orderNumber: true,
                createdAt: true,
                status: true,
                total: true,
              },
            },
            product: {
              select: {
                name: true,
                images: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        }),

        // Product statistics
        db.product.groupBy({
          by: ["isActive"],
          where: { supplierId },
          _count: {
            isActive: true,
          },
        }),
      ]);

    // Get recent products
    const recentProducts = await db.product.findMany({
      where: { supplierId },
      select: {
        id: true,
        name: true,
        price: true,
        stockQuantity: true,
        isActive: true,
        createdAt: true,
        images: true,
        _count: {
          select: {
            reviews: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    const supplierData = {
      ...supplier,
      statistics: {
        totalRevenue: totalRevenue._sum.supplierRevenue || 0,
        totalOrders,
        activeProducts:
          productStats.find(p => p.isActive)?._count.isActive || 0,
        inactiveProducts:
          productStats.find(p => !p.isActive)?._count.isActive || 0,
      },
      recentOrders,
      recentProducts,
    };

    logger.info("Admin supplier details retrieved successfully", {
      adminId: session.user.id,
      supplierId,
    });

    return NextResponse.json(supplierData);
  } catch (error) {
    logger.error("Error retrieving admin supplier details:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
});

export const PUT = withAdminAuth(async (request: NextRequest, session) => {
  try {
    const supplierId = request.nextUrl.pathname.split("/").pop();

    if (!supplierId) {
      return NextResponse.json(
        { error: "Supplier ID is required" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      status,
      commissionRate,
      paymentTerms,
      minimumOrderValue,
      rejectionReason,
      notes,
    } = body;

    // Validate input
    if (
      commissionRate !== undefined &&
      (commissionRate < 0 || commissionRate > 100)
    ) {
      return NextResponse.json(
        { error: "Commission rate must be between 0 and 100" },
        { status: 400 }
      );
    }

    if (paymentTerms !== undefined && paymentTerms < 0) {
      return NextResponse.json(
        { error: "Payment terms must be positive" },
        { status: 400 }
      );
    }

    if (minimumOrderValue !== undefined && minimumOrderValue < 0) {
      return NextResponse.json(
        { error: "Minimum order value must be positive" },
        { status: 400 }
      );
    }

    // Build update data
    const updateData: any = {};

    if (status !== undefined) {
      updateData.status = status;
      if (status === "APPROVED") {
        updateData.approvedAt = new Date();
        updateData.approvedBy = session.user.id;
      } else if (status === "REJECTED" || status === "SUSPENDED") {
        updateData.rejectionReason =
          rejectionReason || `Status changed to ${status}`;
      }
    }

    if (commissionRate !== undefined)
      updateData.commissionRate = commissionRate;
    if (paymentTerms !== undefined) updateData.paymentTerms = paymentTerms;
    if (minimumOrderValue !== undefined)
      updateData.minimumOrderValue = minimumOrderValue;

    const supplier = await db.supplier.update({
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

    logger.info("Admin supplier updated successfully", {
      adminId: session.user.id,
      supplierId,
      updatedFields: Object.keys(updateData),
    });

    return NextResponse.json({
      success: true,
      message: "Supplier updated successfully",
      supplier,
    });
  } catch (error) {
    logger.error("Error updating admin supplier:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
});

export const DELETE = withAdminAuth(async (request: NextRequest, session) => {
  try {
    const supplierId = request.nextUrl.pathname.split("/").pop();

    if (!supplierId) {
      return NextResponse.json(
        { error: "Supplier ID is required" },
        { status: 400 }
      );
    }

    // Check if supplier has active products or orders
    const [activeProducts, activeOrders] = await Promise.all([
      db.product.count({
        where: {
          supplierId,
          isActive: true,
        },
      }),
      db.supplierOrder.count({
        where: {
          supplierId,
          status: {
            in: [
              "PENDING",
              "CONFIRMED",
              "IN_PRODUCTION",
              "READY_TO_SHIP",
              "SHIPPED",
            ],
          },
        },
      }),
    ]);

    if (activeProducts > 0 || activeOrders > 0) {
      return NextResponse.json(
        {
          error:
            "Cannot delete supplier with active products or pending orders",
          details: {
            activeProducts,
            activeOrders,
          },
        },
        { status: 400 }
      );
    }

    // Delete supplier (this will cascade to related records)
    await db.supplier.delete({
      where: { id: supplierId },
    });

    logger.info("Admin supplier deleted successfully", {
      adminId: session.user.id,
      supplierId,
    });

    return NextResponse.json({
      success: true,
      message: "Supplier deleted successfully",
    });
  } catch (error) {
    logger.error("Error deleting admin supplier:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
});
