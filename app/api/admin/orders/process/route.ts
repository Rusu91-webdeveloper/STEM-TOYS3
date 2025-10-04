import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { withAdminAuth } from "@/lib/authorization";
import { OrderProcessor } from "@/lib/order-processor";
import { logger } from "@/lib/logger";

// Validation schema for order processing
const orderProcessingSchema = z.object({
  orderId: z.string().min(1, "Order ID is required"),
});

export const POST = withAdminAuth(async (request: NextRequest) => {
  try {
    const body = await request.json();
    const { orderId } = orderProcessingSchema.parse(body);

    logger.info(`Processing order ${orderId} for supplier fulfillment`);

    // Process the order and create supplier orders
    const result = await OrderProcessor.processNewOrder(orderId);

    if (!result.success) {
      logger.error(`Failed to process order ${orderId}:`, result.errors);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to process order",
          details: result.errors,
        },
        { status: 400 }
      );
    }

    logger.info(
      `Successfully processed order ${orderId}: ${result.supplierOrders.length} supplier orders created`
    );

    return NextResponse.json({
      success: true,
      message: "Order processed successfully",
      data: {
        orderId,
        supplierOrdersCreated: result.supplierOrders.length,
        supplierOrders: result.supplierOrders.map(so => ({
          id: so.id,
          supplierId: so.supplierId,
          supplierName: so.supplier.name,
          productId: so.productId,
          productName: so.product.name,
          quantity: so.quantity,
          status: so.status,
        })),
      },
    });
  } catch (error) {
    logger.error("Error processing order:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
});
