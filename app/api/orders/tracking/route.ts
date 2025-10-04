import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { OrderProcessor } from "@/lib/order-processor";
import { logger } from "@/lib/logger";

// Validation schema for order tracking
const orderTrackingSchema = z.object({
  orderNumber: z.string().min(1, "Order number is required"),
  email: z.string().email("Valid email is required"),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderNumber = searchParams.get("orderNumber");
    const email = searchParams.get("email");

    // Validate input
    const validation = orderTrackingSchema.safeParse({ orderNumber, email });
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid input",
          details: validation.error.errors,
        },
        { status: 400 }
      );
    }

    logger.info(`Fetching tracking info for order ${orderNumber}`);

    // Get order by order number and email
    const order = await OrderProcessor.getOrderTrackingInfo(orderNumber!);

    if (!order) {
      return NextResponse.json(
        {
          success: false,
          error: "Order not found or access denied",
        },
        { status: 404 }
      );
    }

    // Verify email matches (basic security check)
    if (order.customer?.email !== email) {
      return NextResponse.json(
        {
          success: false,
          error: "Order not found or access denied",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: order,
    });
  } catch (error) {
    logger.error("Error fetching order tracking:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
