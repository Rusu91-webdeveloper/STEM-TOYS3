import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { releaseCodGuaranteeHoldIfNeeded } from "@/lib/checkout/release-cod-hold";
import { validateCsrfForRequest } from "@/lib/csrf";
import {
  handleOrderStatusChange,
  checkAndTriggerHighValueOrderEmail,
} from "@/lib/email/email-triggers";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const session = await auth();
    const { orderId } = await params;

    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Admin authentication required" },
        { status: 401 }
      );
    }

    if (!(await validateCsrfForRequest(req)).valid) {
      return NextResponse.json(
        { error: "Security validation failed" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { status, trackingNumber, carrier, notes } = body;

    if (!status) {
      return NextResponse.json(
        { error: "Status is required" },
        { status: 400 }
      );
    }

    // Valid order statuses
    const validStatuses = [
      "PENDING",
      "PROCESSING",
      "SHIPPED",
      "IN_TRANSIT",
      "OUT_FOR_DELIVERY",
      "DELIVERED",
      "CANCELLED",
      "FAILED",
    ];

    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    // Get the order with user information
    const order = await prisma.order.findUnique({
      where: { id: orderId },
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
            name: true,
            quantity: true,
            price: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Check if this is a COD order
    const isCODOrder =
      order.paymentMethod === "cash_on_delivery" ||
      order.paymentMethod === "cod";

    // Prepare update data
    const updateData: {
      status: string;
      trackingNumber?: string;
      carrier?: string;
      deliveredAt?: Date;
      updatedAt: Date;
      paymentStatus?: string;
    } = {
      status,
      trackingNumber: trackingNumber ?? order.trackingNumber ?? undefined,
      carrier: carrier || order.carrier,
      deliveredAt: status === "DELIVERED" ? new Date() : order.deliveredAt,
      updatedAt: new Date(),
    };

    // For COD orders: automatically mark payment as PAID when delivered
    // This reflects real-world business logic where payment is collected on delivery
    if (
      isCODOrder &&
      status === "DELIVERED" &&
      order.paymentStatus !== "PAID"
    ) {
      updateData.paymentStatus = "PAID";
      console.log(
        `✅ COD Order ${orderId}: Automatically updating paymentStatus to PAID (order delivered)`
      );
    }

    // Update the order status
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: updateData,
    });

    const guaranteeSettlement =
      isCODOrder && ["DELIVERED", "CANCELLED"].includes(status)
        ? await releaseCodGuaranteeHoldIfNeeded({
            orderId,
            notes: order.notes,
            event: status === "CANCELLED" ? "cancellation" : "delivery",
          })
        : null;

    // Prepare additional data for email triggers
    const additionalData: Record<string, any> = {
      trackingNumber: updatedOrder.trackingNumber,
      carrier: updatedOrder.carrier || "Curier",
      shippingDate: new Date().toLocaleDateString("ro-RO"),
      trackingUrl: `${process.env.NEXTAUTH_URL}/tracking/${orderId}`,
      deliveryDate:
        status === "DELIVERED"
          ? new Date().toLocaleDateString("ro-RO")
          : undefined,
      reviewUrl:
        status === "DELIVERED"
          ? `${process.env.NEXTAUTH_URL}/reviews/new`
          : undefined,
      cancellationReason:
        status === "CANCELLED" ? notes || "Anulat de admin" : undefined,
      cancellationDate:
        status === "CANCELLED"
          ? new Date().toLocaleDateString("ro-RO")
          : undefined,
      refundInfo:
        status === "CANCELLED"
          ? "Verificăm separat sumele efectiv achitate și dreptul la rambursare. Autorizarea temporară nu este o plată."
          : undefined,
      failureReason:
        status === "FAILED" ? notes || "Eroare de procesare" : undefined,
      failureDate:
        status === "FAILED"
          ? new Date().toLocaleDateString("ro-RO")
          : undefined,
      retryUrl:
        status === "FAILED"
          ? `${process.env.NEXTAUTH_URL}/orders/${orderId}/retry`
          : undefined,
    };

    // Trigger email based on status change
    try {
      await handleOrderStatusChange(orderId, status, additionalData);
      console.log(
        `✅ Email triggered for order ${orderId} status change to ${status}`
      );
    } catch (emailError) {
      console.error(
        `❌ Failed to send email for order ${orderId}:`,
        emailError
      );
      // Don't fail the request if email fails
    }

    // Check for high value order and trigger admin email
    if (status === "PENDING" && order.total >= 500) {
      try {
        await checkAndTriggerHighValueOrderEmail(orderId, order.total);
        console.log(`✅ High value order email triggered for order ${orderId}`);
      } catch (emailError) {
        console.error(`❌ Failed to send high value order email:`, emailError);
      }
    }

    return NextResponse.json({
      success: true,
      guaranteeSettlement,
      order: {
        id: updatedOrder.id,
        orderNumber: updatedOrder.orderNumber,
        status: updatedOrder.status,
        trackingNumber: updatedOrder.trackingNumber,
        carrier: updatedOrder.carrier,
        deliveredAt: updatedOrder.deliveredAt,
        updatedAt: updatedOrder.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error updating order status:", error);
    return NextResponse.json(
      { error: "Failed to update order status" },
      { status: 500 }
    );
  }
}
