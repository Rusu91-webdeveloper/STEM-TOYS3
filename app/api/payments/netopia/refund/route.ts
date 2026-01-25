import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { AdminNotificationService } from "@/lib/email/admin-notification-service";

/**
 * Netopia Refund API
 * 
 * Since Netopia doesn't support programmatic refunds, this endpoint:
 * 1. Creates a refund request record in the database
 * 2. Updates order status to REFUND_PENDING
 * 3. Notifies admin to process manually in Netopia dashboard
 * 4. Provides tracking for the refund lifecycle
 */
export async function POST(request: Request) {
  try {
    // Check authentication - only admins can initiate refunds
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized: Admin access required" },
        { status: 403 }
      );
    }

    const { transactionId, orderId, amount, reason } = await request.json();

    // Validate required fields
    if (!transactionId && !orderId) {
      return NextResponse.json(
        { error: "Missing required field: transactionId or orderId" },
        { status: 400 }
      );
    }

    // Find the order
    const order = await db.order.findFirst({
      where: orderId 
        ? { id: orderId }
        : { netopiaTransactionId: transactionId },
      include: {
        user: {
          select: { name: true, email: true },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    // Validate order can be refunded
    if (order.paymentStatus === "REFUNDED") {
      return NextResponse.json(
        { error: "Order has already been refunded" },
        { status: 400 }
      );
    }

    if (order.paymentStatus !== "PAID") {
      return NextResponse.json(
        { error: "Only paid orders can be refunded" },
        { status: 400 }
      );
    }

    // Calculate refund amount (default to full order amount if not specified)
    const refundAmount = amount && amount > 0 ? amount : order.total;
    const isPartialRefund = refundAmount < order.total;

    // Generate refund request ID
    const refundRequestId = `REF-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Update order with refund pending status
    const updatedOrder = await db.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: "REFUND_PENDING",
        notes: order.notes
          ? `${order.notes}\n[REFUND_REQUESTED: ${refundRequestId} - Amount: ${refundAmount.toFixed(2)} RON - ${reason || "No reason provided"} - ${new Date().toISOString()} - Requested by: ${session.user.email}]`
          : `[REFUND_REQUESTED: ${refundRequestId} - Amount: ${refundAmount.toFixed(2)} RON - ${reason || "No reason provided"} - ${new Date().toISOString()} - Requested by: ${session.user.email}]`,
      },
    });

    console.log(`Netopia refund request created:`, {
      refundRequestId,
      orderId: order.id,
      orderNumber: order.orderNumber,
      transactionId: order.netopiaTransactionId,
      amount: refundAmount,
      isPartialRefund,
      reason,
      requestedBy: session.user.email,
      timestamp: new Date().toISOString(),
    });

    // Send admin notification for manual processing
    const refundDescription = `Refund request for order ${order.orderNumber}. ` +
      `Amount: ${refundAmount.toFixed(2)} RON ${isPartialRefund ? "(partial refund)" : "(full refund)"}. ` +
      `Transaction ID: ${order.netopiaTransactionId || "N/A"}. ` +
      `Reason: ${reason || "Not specified"}. ` +
      `Customer: ${order.user?.name || "Guest"} (${order.user?.email || "N/A"}). ` +
      `Please process this refund manually through the Netopia merchant dashboard.`;

    AdminNotificationService.sendOrderIssueNotification(
      order.id,
      "REFUND_REQUEST",
      refundDescription,
      "HIGH"
    ).catch(err => {
      console.error(`Failed to send refund request notification:`, err);
    });

    return NextResponse.json({
      success: true,
      message: "Refund request created successfully",
      data: {
        refundRequestId,
        orderId: order.id,
        orderNumber: order.orderNumber,
        transactionId: order.netopiaTransactionId,
        amount: refundAmount,
        isPartialRefund,
        status: "PENDING",
        reason: reason || null,
        customerEmail: order.user?.email || null,
        manualProcessingRequired: true,
        instructions: "Please process this refund through the Netopia merchant dashboard. After processing, use the /api/payments/netopia/refund/complete endpoint to mark the refund as completed.",
      },
    });
  } catch (error) {
    console.error("Error processing Netopia refund request:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    return NextResponse.json(
      {
        success: false,
        error: "Failed to create refund request",
        details:
          process.env.NODE_ENV === "development" ? errorMessage : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * GET - Check refund status for an order
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get("orderId");
    const transactionId = searchParams.get("transactionId");

    if (!orderId && !transactionId) {
      return NextResponse.json(
        { error: "Missing required query parameter: orderId or transactionId" },
        { status: 400 }
      );
    }

    const order = await db.order.findFirst({
      where: orderId
        ? { id: orderId }
        : { netopiaTransactionId: transactionId },
      select: {
        id: true,
        orderNumber: true,
        netopiaTransactionId: true,
        paymentStatus: true,
        total: true,
        notes: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    // Extract refund information from notes if available
    const refundInfo = order.notes?.match(/\[REFUND_REQUESTED: ([^\]]+)\]/);
    const completedInfo = order.notes?.match(/\[REFUNDED: ([^\]]+)\]/);

    return NextResponse.json({
      success: true,
      data: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        transactionId: order.netopiaTransactionId,
        paymentStatus: order.paymentStatus,
        total: order.total,
        hasRefundRequest: !!refundInfo,
        isRefunded: order.paymentStatus === "REFUNDED",
        refundDetails: refundInfo ? refundInfo[1] : null,
        completionDetails: completedInfo ? completedInfo[1] : null,
      },
    });
  } catch (error) {
    console.error("Error checking refund status:", error);
    return NextResponse.json(
      { error: "Failed to check refund status" },
      { status: 500 }
    );
  }
}
