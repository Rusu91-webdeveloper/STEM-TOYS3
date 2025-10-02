import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { invalidateAnalyticsOnOrderChange } from "@/lib/cache/analytics-cache";
import {
  updateOrderStatus,
  getOrderStatusHistory,
  bulkUpdateOrderStatuses,
} from "@/lib/utils/order-status-management";

const updateStatusSchema = z.object({
  status: z.enum([
    "PROCESSING",
    "PENDING_REVIEW",
    "READY_FOR_SHIPPING",
    "FULFILLED",
    "SHIPPED",
    "DELIVERED",
    "CANCELLED",
    "COMPLETED",
  ]),
  reason: z.string().optional(),
  notes: z.string().optional(),
  sendNotification: z.boolean().optional().default(true),
});

const bulkUpdateSchema = z.object({
  orderIds: z.array(z.string()),
  status: z.enum([
    "PROCESSING",
    "PENDING_REVIEW",
    "READY_FOR_SHIPPING",
    "FULFILLED",
    "SHIPPED",
    "DELIVERED",
    "CANCELLED",
    "COMPLETED",
  ]),
  reason: z.string().optional(),
  notes: z.string().optional(),
});

/**
 * GET - Get order status history
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    const { orderId } = await params;

    const history = await getOrderStatusHistory(orderId);

    return NextResponse.json({
      success: true,
      data: history,
    });
  } catch (error) {
    console.error("Error getting order status history:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to get order status history",
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH - Update order status
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    const { orderId } = await params;
    const body = await req.json();

    const validatedData = updateStatusSchema.parse(body);

    const result = await updateOrderStatus(orderId, validatedData.status, {
      reason: validatedData.reason,
      notes: validatedData.notes,
      updatedBy: session.user.id,
      sendNotification: validatedData.sendNotification,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 400 }
      );
    }

    // Invalidate analytics cache since order status change affects analytics
    await invalidateAnalyticsOnOrderChange();

    return NextResponse.json({
      success: true,
      message: `Order status updated to ${validatedData.status}`,
      data: result.order,
    });
  } catch (error) {
    console.error("Error updating order status:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request data",
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to update order status",
      },
      { status: 500 }
    );
  }
}

/**
 * POST - Bulk update order statuses
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    const body = await req.json();
    const validatedData = bulkUpdateSchema.parse(body);

    const result = await bulkUpdateOrderStatuses(
      validatedData.orderIds,
      validatedData.status,
      {
        reason: validatedData.reason,
        notes: validatedData.notes,
        updatedBy: session.user.id,
      }
    );

    // Invalidate analytics cache since bulk order status changes affect analytics
    await invalidateAnalyticsOnOrderChange();

    return NextResponse.json({
      success: true,
      message: `Bulk update completed: ${result.success} successful, ${result.errors.length} errors`,
      data: {
        successful: result.success,
        errors: result.errors,
      },
    });
  } catch (error) {
    console.error("Error bulk updating order statuses:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request data",
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to bulk update order statuses",
      },
      { status: 500 }
    );
  }
}
