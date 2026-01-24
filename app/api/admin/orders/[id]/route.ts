import { OrderStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { invalidateCachePattern } from "@/lib/cache";
import { db } from "@/lib/db";
import { invalidateAnalyticsOnOrderChange } from "@/lib/cache/analytics-cache";

// Schema for updating order status
const updateOrderSchema = z.object({
  status: z.enum([
    "PROCESSING",
    "SHIPPED",
    "DELIVERED",
    "CANCELLED",
    "COMPLETED",
  ]),
  cancellationReason: z.string().optional(),
});

// GET - Get order details for admin
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const { id: orderId } = await params;

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
        shipments: {
          orderBy: { createdAt: "desc" },
        },
        supplierOrders: {
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
                images: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Format the response - safely handle dates
    const formatDateSafe = (date: Date | null | undefined): string | undefined => {
      if (!date) return undefined;
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) return undefined;
      return dateObj.toISOString();
    };

    const formattedOrder = {
      id: order.id,
      orderNumber: order.orderNumber,
      customer: order.user?.name ?? "Guest User",
      email: order.user?.email ?? "N/A",
      date: formatDateSafe(order.createdAt) || new Date().toISOString(),
      deliveredAt: formatDateSafe(order.deliveredAt),
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
      shipments: order.shipments.map(shipment => ({
        id: shipment.id,
        courier: shipment.courier,
        awbNumber: shipment.awbNumber,
        status: shipment.status,
        createdAt: formatDateSafe(shipment.createdAt),
        updatedAt: formatDateSafe(shipment.updatedAt),
      })),
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
      supplierOrders: order.supplierOrders.map(so => ({
        id: so.id,
        supplierId: so.supplierId,
        supplierName: so.supplier.name || so.supplier.companyName,
        productId: so.productId,
        productName: so.product.name,
        quantity: so.quantity,
        unitCost: so.unitCost,
        totalCost: so.totalCost,
        status: so.status,
        trackingNumber: so.trackingNumber,
        supplierOrderId: so.supplierOrderId,
        carrier: so.carrier,
        shippedAt: formatDateSafe(so.shippedAt),
        estimatedDelivery: formatDateSafe(so.estimatedDelivery),
        notes: so.notes,
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const { id: orderId } = await params;
    const body = await request.json();

    // Validate the request body
    const { status, cancellationReason } = updateOrderSchema.parse(body);

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
    const updateData: {
      status: OrderStatus;
      deliveredAt?: Date;
      notes?: string;
    } = {
      status: status as OrderStatus,
    };

    // If changing status to DELIVERED, set deliveredAt to current time
    if (status === "DELIVERED" && existingOrder.status !== "DELIVERED") {
      updateData.deliveredAt = new Date();
    }

    // If cancelling order and cancellation reason is provided, save it in notes
    if (status === "CANCELLED" && cancellationReason) {
      updateData.notes = `Cancellation reason: ${cancellationReason}`;
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
            productId: true,
            quantity: true,
            name: true,
            price: true,
            product: {
              select: { images: true },
            },
          },
        },
        shippingAddress: true,
      },
    });

    // Send email notification if status changed to SHIPPED, DELIVERED, CANCELLED, or COMPLETED
    try {
      const userEmail = updatedOrder.user?.email;
      const customerName = updatedOrder.user?.name || "Client";
      if (userEmail) {
        if (status === "SHIPPED") {
          // You may want to fetch real tracking info from the order if available
          const trackingNumber = "N/A"; // Replace with real tracking number if available
          const estimatedDelivery = new Date(
            Date.now() + 3 * 24 * 60 * 60 * 1000
          ).toLocaleDateString("ro-RO");
          const courierName = "Curier";
          const { sendShippingNotificationEmail } = await import(
            "@/lib/email/order-templates"
          );
          await sendShippingNotificationEmail({
            to: userEmail,
            customerName,
            orderId: updatedOrder.orderNumber,
            trackingNumber,
            estimatedDelivery,
            courierName,
          });
        } else if (status === "DELIVERED") {
          const { sendOrderDeliveredEmail } = await import(
            "@/lib/email/order-templates"
          );
          await sendOrderDeliveredEmail({
            to: userEmail,
            customerName,
            orderId: updatedOrder.orderNumber,
            orderItems: updatedOrder.items.map(item => ({
              id: item.id,
              productId: item.productId,
              name: item.name,
              quantity: item.quantity,
              price: item.price,
              image: item.product?.images?.[0] || undefined,
            })),
            totalAmount: updatedOrder.total,
            shippingAddress: updatedOrder.shippingAddress
              ? `${updatedOrder.shippingAddress.addressLine1}, ${updatedOrder.shippingAddress.city}, ${updatedOrder.shippingAddress.state}, ${updatedOrder.shippingAddress.postalCode}, ${updatedOrder.shippingAddress.country}`
              : "",
            deliveredAt: new Date(
              updatedOrder.deliveredAt ?? new Date()
            ).toLocaleDateString("ro-RO"),
          });
        } else if (status === "CANCELLED") {
          const { sendOrderCancellationEmail } = await import(
            "@/lib/email/order-templates"
          );
          await sendOrderCancellationEmail({
            to: userEmail,
            customerName,
            orderId: updatedOrder.orderNumber,
            orderItems: updatedOrder.items.map(item => ({
              name: item.name,
              quantity: item.quantity,
              price: item.price,
              image: item.product?.images?.[0] || undefined,
            })),
            totalAmount: updatedOrder.total,
            cancellationReason: cancellationReason || undefined,
            cancelledAt: new Date().toLocaleDateString("ro-RO"),
          });
        } else if (status === "COMPLETED") {
          const { sendOrderCompletedEmail } = await import(
            "@/lib/email/order-templates"
          );
          await sendOrderCompletedEmail({
            to: userEmail,
            customerName,
            orderId: updatedOrder.orderNumber,
            orderItems: updatedOrder.items.map(item => ({
              name: item.name,
              quantity: item.quantity,
              price: item.price,
              image: item.product?.images?.[0] || undefined,
            })),
            totalAmount: updatedOrder.total,
            shippingAddress: updatedOrder.shippingAddress
              ? `${updatedOrder.shippingAddress.addressLine1}, ${updatedOrder.shippingAddress.city}, ${updatedOrder.shippingAddress.state}, ${updatedOrder.shippingAddress.postalCode}, ${updatedOrder.shippingAddress.country}`
              : "",
            completedAt: new Date().toLocaleDateString("ro-RO"),
          });
        }
      }
    } catch (emailError) {
      console.error(
        "Error sending order status email notification:",
        emailError
      );
    }

    // TODO: Implement a scheduled job/cron to set status to COMPLETED 30 days after deliveredAt

    // Format the response
    const formattedOrder = {
      id: updatedOrder.orderNumber,
      customer: updatedOrder.user?.name ?? "Guest User",
      email: updatedOrder.user?.email ?? "N/A",
      date: new Date(updatedOrder.createdAt).toISOString().split("T")[0],
      deliveredAt: updatedOrder.deliveredAt
        ? new Date(updatedOrder.deliveredAt).toISOString()
        : undefined,
      total: updatedOrder.total,
      status: formatStatus(updatedOrder.status),
      payment: updatedOrder.paymentMethod,
      items: updatedOrder.items.reduce((sum, item) => sum + item.quantity, 0),
    };

    // Invalidate analytics cache since order update affects analytics
    await invalidateAnalyticsOnOrderChange();

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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const { id: orderIdOrNumber } = await params;

    const order = await db.order.findFirst({
      where: {
        OR: [{ id: orderIdOrNumber }, { orderNumber: orderIdOrNumber }],
      },
      select: {
        id: true,
        orderNumber: true,
        items: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const orderItemIds = order.items.map(item => item.id);

    await db.$transaction(async tx => {
      if (orderItemIds.length > 0) {
        await tx.review.deleteMany({
          where: { orderItemId: { in: orderItemIds } },
        });
        await tx.return.deleteMany({
          where: { orderItemId: { in: orderItemIds } },
        });
      }

      await tx.return.deleteMany({
        where: { orderId: order.id },
      });

      await tx.campaignApplication.updateMany({
        where: { orderId: order.id },
        data: { orderId: null },
      });

      await tx.order.delete({
        where: { id: order.id },
      });
    });

    await invalidateAnalyticsOnOrderChange();
    await Promise.all([
      invalidateCachePattern("admin-orders*"),
      invalidateCachePattern("enhanced-orders*"),
    ]);

    return NextResponse.json({
      message: `Order ${order.orderNumber} deleted successfully`,
    });
  } catch (error) {
    console.error("Error deleting order:", error);
    return NextResponse.json(
      { error: "Failed to delete order" },
      { status: 500 }
    );
  }
}

// Helper function to format order status for display
function formatStatus(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
}
