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

// GET - Get order details for admin
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    // Check authentication
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const { orderId } = await params;

    // Find the order by ID or order number
    const order = await db.order.findFirst({
      where: {
        OR: [{ id: orderId }, { orderNumber: orderId }],
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                name: true,
                images: true,
                slug: true,
              },
            },
            book: {
              select: {
                name: true,
                author: true,
                slug: true,
                coverImage: true,
              },
            },
          },
        },
        shippingAddress: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Format the response
    const formattedOrder = {
      id: order.id,
      orderNumber: order.orderNumber,
      customer: order.user?.name ?? "Guest User",
      email: order.user?.email ?? "N/A",
      date: order.createdAt.toISOString(),
      deliveredAt: order.deliveredAt?.toISOString(),
      status: order.status,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod,
      subtotal: order.subtotal,
      tax: order.tax,
      shippingCost: order.shippingCost,
      discountAmount: order.discountAmount ?? 0,
      couponCode: order.couponCode,
      total: order.total,
      shippingAddress: order.shippingAddress,
      items: order.items.map(item => ({
        id: item.id,
        name:
          item.product?.name ??
          item.book?.name ??
          item.name ??
          "Product no longer available",
        price: item.price,
        quantity: item.quantity,
        isDigital: item.isDigital ?? false,
        returnStatus: item.returnStatus,
        isBook: !!item.book,
        product: item.product
          ? {
              id: item.productId,
              name: item.product.name,
              slug: item.product.slug,
              images: item.product.images,
            }
          : null,
        book: item.book
          ? {
              id: item.bookId,
              name: item.book.name,
              author: item.book.author,
              slug: item.book.slug,
              coverImage: item.book.coverImage,
            }
          : null,
      })),
    };

    return NextResponse.json({ order: formattedOrder });
  } catch (error) {
    console.error("Error fetching order details:", error);
    return NextResponse.json(
      { error: "Failed to fetch order details" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    // Check authentication
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const { orderId } = await params;
    const body = await request.json();

    // Validate the request body
    const { status } = updateOrderSchema.parse(body);

    // Find the existing order
    const existingOrder = await db.order.findFirst({
      where: {
        OR: [{ id: orderId }, { orderNumber: orderId }],
      },
      select: { id: true, status: true },
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
      where: { id: existingOrder.id },
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
      customer: updatedOrder.user?.name ?? "Guest User",
      email: updatedOrder.user?.email ?? "N/A",
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
