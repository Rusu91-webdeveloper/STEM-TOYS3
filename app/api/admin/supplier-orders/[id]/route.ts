import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { syncParentOrderFromSupplierOrders } from "@/lib/order-fulfillment-sync";

// Validation schema for updating supplier order
const updateSupplierOrderSchema = z.object({
  trackingNumber: z.string().optional(),
  supplierOrderId: z.string().optional(),
  carrier: z.string().optional(),
  status: z.string().optional(),
  notes: z.string().optional(),
  appendNote: z.string().optional(),
});

// PATCH - Update supplier order (admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const { id: supplierOrderId } = await params;
    const body = await request.json();

    // Validate the request body
    const updatePayload = updateSupplierOrderSchema.parse(body);

    // Find the existing supplier order
    const existingOrder = await db.supplierOrder.findUnique({
      where: { id: supplierOrderId },
    });

    if (!existingOrder) {
      return NextResponse.json(
        { error: "Supplier order not found" },
        { status: 404 }
      );
    }

    // Update the supplier order
    const mergedNotes = updatePayload.appendNote
      ? [existingOrder.notes, updatePayload.appendNote.trim()]
          .filter(Boolean)
          .join("\n\n")
      : updatePayload.notes;

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (typeof updatePayload.trackingNumber !== "undefined") {
      updateData.trackingNumber = updatePayload.trackingNumber;
    }
    if (typeof updatePayload.supplierOrderId !== "undefined") {
      updateData.supplierOrderId = updatePayload.supplierOrderId;
    }
    if (typeof updatePayload.carrier !== "undefined") {
      updateData.carrier = updatePayload.carrier;
    }
    if (typeof updatePayload.status !== "undefined") {
      updateData.status = updatePayload.status;
    }
    if (
      typeof updatePayload.notes !== "undefined" ||
      typeof updatePayload.appendNote !== "undefined"
    ) {
      updateData.notes = mergedNotes;
    }

    const updatedOrder = await db.supplierOrder.update({
      where: { id: supplierOrderId },
      data: {
        ...updateData,
        // Set shippedAt if status is SHIPPED
        ...(updatePayload.status === "SHIPPED" && !existingOrder.shippedAt
          ? { shippedAt: new Date() }
          : {}),
      },
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
            companyName: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
          },
        },
        order: {
          select: {
            id: true,
            orderNumber: true,
          },
        },
      },
    });

    if (existingOrder.orderId) {
      await syncParentOrderFromSupplierOrders(
        existingOrder.orderId,
        "admin-supplier-order-update"
      );
    }

    return NextResponse.json({
      success: true,
      supplierOrder: updatedOrder,
    });
  } catch (error) {
    console.error("Error updating supplier order:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update supplier order" },
      { status: 500 }
    );
  }
}
