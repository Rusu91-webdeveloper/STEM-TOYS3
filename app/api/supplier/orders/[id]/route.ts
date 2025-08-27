import { NextRequest, NextResponse } from "next/server";
import { withSupplierAuth } from "@/lib/authorization";
import { getCurrentSupplier } from "@/lib/supplier-auth";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import { z } from "zod";

// Validation schema for order status update
const orderUpdateSchema = z.object({
  status: z.enum(["PENDING", "CONFIRMED", "IN_PRODUCTION", "READY_TO_SHIP", "SHIPPED", "DELIVERED", "CANCELLED"]).optional(),
  trackingNumber: z.string().optional(),
  notes: z.string().optional(),
});

export const GET = withSupplierAuth(async (request: NextRequest, session, { params }) => {
  try {
    const supplier = await getCurrentSupplier(session);
    
    if (!supplier) {
      return NextResponse.json(
        { error: "Supplier profile not found" },
        { status: 404 }
      );
    }

    const orderId = params.id;

    // Get order with all relations
    const order = await db.supplierOrder.findFirst({
      where: {
        id: orderId,
        supplierId: supplier.id,
      },
      include: {
        order: {
          select: {
            orderNumber: true,
            total: true,
            status: true,
            paymentStatus: true,
            paymentMethod: true,
            createdAt: true,
            deliveredAt: true,
            shippingAddress: {
              select: {
                fullName: true,
                addressLine1: true,
                addressLine2: true,
                city: true,
                state: true,
                postalCode: true,
                country: true,
                phone: true,
              }
            },
            user: {
              select: {
                name: true,
                email: true,
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
      }
    });

    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    logger.info("Supplier order details fetched successfully", {
      supplierId: supplier.id,
      orderId,
    });

    return NextResponse.json({ order });
  } catch (error) {
    logger.error("Error fetching supplier order details:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
});

export const PUT = withSupplierAuth(async (request: NextRequest, session, { params }) => {
  try {
    const supplier = await getCurrentSupplier(session);
    
    if (!supplier) {
      return NextResponse.json(
        { error: "Supplier profile not found" },
        { status: 404 }
      );
    }

    const orderId = params.id;

    // Check if order exists and belongs to supplier
    const existingOrder = await db.supplierOrder.findFirst({
      where: {
        id: orderId,
        supplierId: supplier.id,
      },
    });

    if (!existingOrder) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = orderUpdateSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: "Validation failed", 
          details: validationResult.error.errors 
        },
        { status: 400 }
      );
    }

    const { status, trackingNumber, notes } = validationResult.data;

    // Build update data
    const updateData: any = {};
    
    if (status !== undefined) {
      updateData.status = status;
      
      // Set shippedAt timestamp when status changes to SHIPPED
      if (status === "SHIPPED") {
        updateData.shippedAt = new Date();
      }
    }
    
    if (trackingNumber !== undefined) {
      updateData.trackingNumber = trackingNumber;
    }
    
    if (notes !== undefined) {
      updateData.notes = notes;
    }

    // Update order
    const updatedOrder = await db.supplierOrder.update({
      where: { id: orderId },
      data: updateData,
      include: {
        order: {
          select: {
            orderNumber: true,
            total: true,
            status: true,
            paymentStatus: true,
            paymentMethod: true,
            createdAt: true,
            deliveredAt: true,
            shippingAddress: {
              select: {
                fullName: true,
                addressLine1: true,
                addressLine2: true,
                city: true,
                state: true,
                postalCode: true,
                country: true,
                phone: true,
              }
            },
            user: {
              select: {
                name: true,
                email: true,
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
      }
    });

    logger.info("Supplier order updated successfully", {
      supplierId: supplier.id,
      orderId,
      status,
      trackingNumber: trackingNumber ? "provided" : "not provided",
    });

    return NextResponse.json({
      success: true,
      message: "Order updated successfully",
      order: updatedOrder,
    });
  } catch (error) {
    logger.error("Error updating supplier order:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
});
