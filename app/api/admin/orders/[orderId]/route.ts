import { OrderStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// Schema for updating order status
const updateOrderSchema = z.object({
  status: z.enum([
    "PROCESSING",
    "SHIPPED",
    "DELIVERED",
    "CANCELLED",
    "COMPLETED",
  ]),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    // Check authentication
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const { orderId } = params;
    const body = await request.json();

    // Validate the request body
    const { status } = updateOrderSchema.parse(body);

    // Find the existing order
    const existingOrder = await db.order.findUnique({
      where: { id: orderId },
      select: { status: true },
    });

    if (!existingOrder) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Prepare update data
    const updateData: { status: OrderStatus; deliveredAt?: Date } = {
      status: status as OrderStatus,
    };

    // If changing status to DELIVERED, set deliveredAt to current time
    if (status === "DELIVERED" && existingOrder.status !== "DELIVERED") {
      updateData.deliveredAt = new Date();
    }

    // Update the order
    const updatedOrder = await db.order.update({
      where: { id: orderId },
      data: updateData,
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
    });

    // Format the response
    const formattedOrder = {
      id: updatedOrder.orderNumber,
      customer: updatedOrder.user.name || "Guest User",
      email: updatedOrder.user.email,
      date: updatedOrder.createdAt.toISOString().split("T")[0],
      deliveredAt: updatedOrder.deliveredAt?.toISOString(),
      total: updatedOrder.total,
      status: formatStatus(updatedOrder.status),
      payment: updatedOrder.paymentMethod,
      items: updatedOrder.items.reduce((sum, item) => sum + item.quantity, 0),
    };

    return NextResponse.json({ order: formattedOrder });
  } catch (error) {
    console.error("Error updating order:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update order" },
      { status: 500 }
    );
  }
}

// Helper function to format order status for display
function formatStatus(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
}
