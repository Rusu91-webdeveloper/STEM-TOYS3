import { NextRequest, NextResponse } from "next/server";

import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import {
  shouldAutoFulfillOrder,
  calculateProcessingTime,
  getNotificationSettings,
  shouldAlertHighValueOrder,
} from "@/lib/utils/order-processing";

/**
 * Background job to process orders and handle auto-fulfillment
 * This endpoint should be called by a cron job every 5-10 minutes
 */
export async function GET(req: NextRequest) {
  try {
    // Verify this is a cron job request (you can add authentication here)
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    console.log("Starting order processing background job...");

    // Find orders that are eligible for processing
    const eligibleOrders = await db.order.findMany({
      where: {
        status: "PROCESSING",
        paymentStatus: "PAID",
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Only process orders from last 24 hours
        },
      },
      include: {
        items: {
          include: {
            product: true,
            book: true,
          },
        },
        user: true,
        shippingAddress: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    console.log(
      `Found ${eligibleOrders.length} orders eligible for processing`
    );

    const processedOrders = [];
    const errors = [];

    for (const order of eligibleOrders) {
      try {
        console.log(`Processing order ${order.id} (${order.orderNumber})`);

        // Check if order should be auto-fulfilled
        const shouldAutoFulfill = await shouldAutoFulfillOrder(
          order.total,
          order.items
        );

        if (shouldAutoFulfill) {
          console.log(`Auto-fulfilling order ${order.id}`);

          // Update order status to FULFILLED
          await db.order.update({
            where: { id: order.id },
            data: {
              status: "FULFILLED",
              fulfilledAt: new Date(),
            },
          });

          // Send fulfillment notification if enabled
          const notificationSettings = await getNotificationSettings();
          if (notificationSettings?.processingUpdate) {
            try {
              await sendEmail({
                to: order.user.email,
                subject: `Order ${order.orderNumber} - Ready for Shipping`,
                template: "order-fulfilled",
                data: {
                  orderNumber: order.orderNumber,
                  customerName: order.user.name || "Customer",
                  orderTotal: order.total,
                  items: order.items.map(item => ({
                    name: item.name,
                    quantity: item.quantity,
                    price: item.price,
                  })),
                  shippingAddress: order.shippingAddress,
                },
              });
              console.log(
                `Sent fulfillment notification for order ${order.id}`
              );
            } catch (emailError) {
              console.error(
                `Failed to send fulfillment email for order ${order.id}:`,
                emailError
              );
            }
          }

          processedOrders.push({
            orderId: order.id,
            orderNumber: order.orderNumber,
            action: "auto-fulfilled",
            total: order.total,
          });
        } else {
          console.log(`Order ${order.id} not eligible for auto-fulfillment`);

          // Check if it's been too long in PROCESSING status
          const hoursSinceCreated =
            (Date.now() - order.createdAt.getTime()) / (1000 * 60 * 60);
          if (hoursSinceCreated > 24) {
            console.log(
              `Order ${order.id} has been processing for ${hoursSinceCreated} hours, flagging for manual review`
            );

            await db.order.update({
              where: { id: order.id },
              data: {
                status: "PENDING_REVIEW",
              },
            });

            processedOrders.push({
              orderId: order.id,
              orderNumber: order.orderNumber,
              action: "flagged-for-review",
              reason: "processing-too-long",
              hoursSinceCreated,
            });
          }
        }
      } catch (orderError) {
        console.error(`Error processing order ${order.id}:`, orderError);
        errors.push({
          orderId: order.id,
          orderNumber: order.orderNumber,
          error:
            orderError instanceof Error ? orderError.message : "Unknown error",
        });
      }
    }

    // Process any orders that need status updates based on time
    const staleOrders = await db.order.findMany({
      where: {
        status: "PROCESSING",
        createdAt: {
          lt: new Date(Date.now() - 2 * 60 * 60 * 1000), // Orders older than 2 hours
        },
      },
      include: {
        items: true,
      },
    });

    for (const order of staleOrders) {
      try {
        // Calculate expected processing time
        const processingTime = await calculateProcessingTime("standard");
        const expectedCompletionTime = new Date(
          order.createdAt.getTime() + processingTime * 60 * 60 * 1000
        );

        if (Date.now() > expectedCompletionTime.getTime()) {
          console.log(`Order ${order.id} should be ready for shipping`);

          // Update status to READY_FOR_SHIPPING
          await db.order.update({
            where: { id: order.id },
            data: {
              status: "READY_FOR_SHIPPING",
            },
          });

          processedOrders.push({
            orderId: order.id,
            orderNumber: order.orderNumber,
            action: "ready-for-shipping",
            processingTime,
          });
        }
      } catch (error) {
        console.error(`Error updating stale order ${order.id}:`, error);
        errors.push({
          orderId: order.id,
          orderNumber: order.orderNumber,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    console.log(
      `Order processing job completed. Processed: ${processedOrders.length}, Errors: ${errors.length}`
    );

    return NextResponse.json({
      success: true,
      message: "Order processing job completed",
      data: {
        processedOrders,
        errors,
        summary: {
          totalProcessed: processedOrders.length,
          totalErrors: errors.length,
          eligibleOrders: eligibleOrders.length,
          staleOrders: staleOrders.length,
        },
      },
    });
  } catch (error) {
    console.error("Error in order processing background job:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to process orders",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * Manual trigger for order processing (for testing)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: "Order ID is required" },
        { status: 400 }
      );
    }

    const order = await db.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: true,
            book: true,
          },
        },
        user: true,
        shippingAddress: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    // Check if order should be auto-fulfilled
    const shouldAutoFulfill = await shouldAutoFulfillOrder(
      order.total,
      order.items
    );

    if (shouldAutoFulfill) {
      await db.order.update({
        where: { id: order.id },
        data: {
          status: "FULFILLED",
          fulfilledAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        message: `Order ${order.orderNumber} has been auto-fulfilled`,
        data: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          status: "FULFILLED",
        },
      });
    } else {
      return NextResponse.json({
        success: false,
        message: `Order ${order.orderNumber} is not eligible for auto-fulfillment`,
        data: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          status: order.status,
        },
      });
    }
  } catch (error) {
    console.error("Error in manual order processing:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to process order",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
