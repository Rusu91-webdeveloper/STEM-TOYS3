import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { DatabaseTemplateService } from "@/lib/email/database-template-service";

/**
 * Mark a Netopia refund as completed
 * 
 * Called by admin after processing the refund in Netopia merchant dashboard
 */
export async function POST(request: Request) {
  try {
    // Check authentication - only admins can complete refunds
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized: Admin access required" },
        { status: 403 }
      );
    }

    const { orderId, netopiaRefundId, refundedAmount } = await request.json();

    // Validate required fields
    if (!orderId) {
      return NextResponse.json(
        { error: "Missing required field: orderId" },
        { status: 400 }
      );
    }

    // Find the order
    const order = await db.order.findUnique({
      where: { id: orderId },
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

    // Validate order has a pending refund
    if (order.paymentStatus !== "REFUND_PENDING") {
      return NextResponse.json(
        { 
          error: "Invalid refund state",
          details: `Order payment status is ${order.paymentStatus}, expected REFUND_PENDING` 
        },
        { status: 400 }
      );
    }

    // Update order to refunded
    const updatedOrder = await db.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: "REFUNDED",
        notes: order.notes
          ? `${order.notes}\n[REFUNDED: ${netopiaRefundId || "Manual"} - Amount: ${(refundedAmount || order.total).toFixed(2)} RON - ${new Date().toISOString()} - Completed by: ${session.user.email}]`
          : `[REFUNDED: ${netopiaRefundId || "Manual"} - Amount: ${(refundedAmount || order.total).toFixed(2)} RON - ${new Date().toISOString()} - Completed by: ${session.user.email}]`,
      },
    });

    console.log(`Netopia refund completed:`, {
      orderId: order.id,
      orderNumber: order.orderNumber,
      netopiaRefundId,
      refundedAmount: refundedAmount || order.total,
      completedBy: session.user.email,
      timestamp: new Date().toISOString(),
    });

    // Send refund confirmation email to customer
    if (order.user?.email) {
      try {
        await DatabaseTemplateService.sendEmail(
          order.user.email,
          `Refund Processed - Order ${order.orderNumber}`,
          `Dear ${order.user.name || "Customer"},\n\n` +
          `Your refund for order ${order.orderNumber} has been processed.\n\n` +
          `Refund amount: ${(refundedAmount || order.total).toFixed(2)} RON\n\n` +
          `The refund will be credited to your original payment method within 5-10 business days.\n\n` +
          `If you have any questions, please contact our support team.\n\n` +
          `Thank you for your patience.\n\n` +
          `Best regards,\nThe STEM Toys Team`
        );
        console.log(`Refund confirmation email sent to ${order.user.email}`);
      } catch (emailError) {
        console.error(`Failed to send refund confirmation email:`, emailError);
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json({
      success: true,
      message: "Refund marked as completed",
      data: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        paymentStatus: "REFUNDED",
        refundedAmount: refundedAmount || order.total,
        netopiaRefundId: netopiaRefundId || null,
        customerNotified: !!order.user?.email,
      },
    });
  } catch (error) {
    console.error("Error completing Netopia refund:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    return NextResponse.json(
      {
        success: false,
        error: "Failed to complete refund",
        details:
          process.env.NODE_ENV === "development" ? errorMessage : undefined,
      },
      { status: 500 }
    );
  }
}
