import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { DatabaseTemplateService } from "@/lib/email/database-template-service";
import { mapReturnStatusToOrderItemStatus } from "@/lib/returns/status-machine";
import {
  appendManualRefundResolutionNote,
  buildManualRefundCompletedNote,
  buildManualRefundResolutionNote,
  extractLatestManualRefundRequestedReturnIds,
  normalizeManualRefundReturnIds,
  planManualRefundReturnSync,
} from "@/lib/returns/manual-refund-sync";

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

    const { orderId, netopiaRefundId, refundedAmount, returnIds } =
      await request.json();
    const normalizedReturnIds = normalizeManualRefundReturnIds(returnIds);

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

    const effectiveRefundedAmount = refundedAmount || order.total;
    const orderReturns = await db.return.findMany({
      where: { orderId: order.id },
      select: {
        id: true,
        orderItemId: true,
        status: true,
        refundStatus: true,
        resolutionNotes: true,
      },
    });

    const requestedReturnIds =
      normalizedReturnIds.length > 0
        ? normalizedReturnIds
        : extractLatestManualRefundRequestedReturnIds(order.notes);
    const syncPlan = planManualRefundReturnSync({
      orderReturns,
      orderTotal: order.total,
      refundedAmount: effectiveRefundedAmount,
      requestedReturnIds,
    });

    if (!syncPlan.ok) {
      return NextResponse.json(
        { error: syncPlan.error },
        { status: 400 }
      );
    }

    const completedAt = new Date();
    const manualRefundResolutionNote = buildManualRefundResolutionNote({
      completedAt,
      refundId: netopiaRefundId,
      refundedAmount: effectiveRefundedAmount,
    });
    const refundCompletedNote = buildManualRefundCompletedNote({
      refundId: netopiaRefundId,
      refundedAmount: effectiveRefundedAmount,
      completedAt,
      completedBy: session.user.email,
      syncedReturnIds: syncPlan.targetReturns.map(returnRecord => returnRecord.id),
    });

    const updatedOrder = await db.$transaction(async tx => {
      const nextOrder = await tx.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: "REFUNDED",
          notes: order.notes
            ? `${order.notes}\n${refundCompletedNote}`
            : refundCompletedNote,
        },
      });

      for (const returnRecord of syncPlan.targetReturns) {
        const currentReturn = orderReturns.find(
          candidate => candidate.id === returnRecord.id
        );

        await tx.return.update({
          where: { id: returnRecord.id },
          data: {
            status: "REFUNDED",
            refundStatus: "SUCCESS",
            refundError: "",
            resolutionStatus: "REFUNDED",
            resolutionNotes: appendManualRefundResolutionNote(
              currentReturn?.resolutionNotes,
              manualRefundResolutionNote
            ),
          },
        });

        await tx.orderItem.update({
          where: { id: returnRecord.orderItemId },
          data: {
            returnStatus: mapReturnStatusToOrderItemStatus("REFUNDED"),
          },
        });
      }

      return nextOrder;
    });

    console.log(`Netopia refund completed:`, {
      orderId: order.id,
      orderNumber: order.orderNumber,
      netopiaRefundId,
      refundedAmount: refundedAmount || order.total,
      syncedReturnIds: syncPlan.targetReturns.map(returnRecord => returnRecord.id),
      manualReviewRequired: syncPlan.manualReviewRequired,
      manualReviewReason: syncPlan.manualReviewReason,
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
        refundedAmount: effectiveRefundedAmount,
        netopiaRefundId: netopiaRefundId || null,
        syncedReturnIds: syncPlan.targetReturns.map(returnRecord => returnRecord.id),
        alreadyRefundedReturnIds: syncPlan.alreadyRefundedReturnIds,
        manualReviewRequired: syncPlan.manualReviewRequired,
        manualReviewReason: syncPlan.manualReviewReason,
        syncSource: syncPlan.source,
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
