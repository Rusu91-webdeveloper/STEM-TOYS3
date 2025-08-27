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

    // Get order statistics
    const [
      totalOrders,
      pendingOrders,
      shippedOrders,
      deliveredOrders,
      totalRevenue
    ] = await Promise.all([
      // Total orders
      db.supplierOrder.count({
        where: { supplierId: supplier.id }
      }),
      
      // Pending orders
      db.supplierOrder.count({
        where: { 
          supplierId: supplier.id,
          status: { in: ["PENDING", "CONFIRMED", "IN_PRODUCTION", "READY_TO_SHIP"] }
        }
      }),
      
      // Shipped orders
      db.supplierOrder.count({
        where: { 
          supplierId: supplier.id,
          status: "SHIPPED"
        }
      }),
      
      // Delivered orders
      db.supplierOrder.count({
        where: { 
          supplierId: supplier.id,
          status: "DELIVERED"
        }
      }),
      
      // Total revenue
      db.supplierOrder.aggregate({
        where: { 
          supplierId: supplier.id,
          status: { in: ["DELIVERED"] }
        },
        _sum: { supplierRevenue: true }
      })
    ]);

    logger.info("Supplier order stats fetched successfully", {
      supplierId: supplier.id,
    });

    return NextResponse.json({
      totalOrders,
      pendingOrders,
      shippedOrders,
      deliveredOrders,
      totalRevenue: totalRevenue._sum.supplierRevenue || 0,
    });
  } catch (error) {
    logger.error("Error fetching supplier order stats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
});
