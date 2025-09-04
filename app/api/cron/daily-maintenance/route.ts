import { OrderStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import {
  shouldAutoFulfillOrder,
  calculateProcessingTime,
  getNotificationSettings,
  shouldAlertHighValueOrder,
} from "@/lib/utils/order-processing";

export const dynamic = "force-dynamic";

/**
 * Comprehensive daily maintenance job for pre-launch e-commerce
 * Handles: order processing, auto-fulfillment, status updates, and cleanup
 * Runs once daily at 01:00 UTC on Hobby plan
 */
export async function GET(req: NextRequest) {
  try {
    // Verify this is a cron job request
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    console.log("Starting daily maintenance job...");
    const startTime = Date.now();
    const results = {
      orderProcessing: { processed: 0, errors: 0 },
      autoCompletion: { completed: 0, errors: 0 },
      statusUpdates: { updated: 0, errors: 0 },
      notifications: { sent: 0, errors: 0 },
    };

    // 1. ORDER PROCESSING & AUTO-FULFILLMENT
    console.log("Phase 1: Processing orders and auto-fulfillment...");
    try {
      const eligibleOrders = await db.order.findMany({
        where: {
          status: "PROCESSING",
          paymentStatus: "PAID",
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
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

      console.log(`Found ${eligibleOrders.length} orders for processing`);

      for (const order of eligibleOrders) {
        try {
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

            // Send fulfillment notification
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
                results.notifications.sent++;
              } catch (emailError) {
                console.error(`Failed to send fulfillment email for order ${order.id}:`, emailError);
                results.notifications.errors++;
              }
            }

            results.orderProcessing.processed++;
            console.log(`Auto-fulfilled order ${order.id}`);
          } else {
            // Check if it's been too long in PROCESSING status
            const hoursSinceCreated = (Date.now() - order.createdAt.getTime()) / (1000 * 60 * 60);
            if (hoursSinceCreated > 48) { // Increased threshold for daily processing
              await db.order.update({
                where: { id: order.id },
                data: {
                  status: "PENDING_REVIEW",
                },
              });
              results.orderProcessing.processed++;
              console.log(`Flagged order ${order.id} for manual review (${hoursSinceCreated.toFixed(1)}h old)`);
            }
          }
        } catch (orderError) {
          console.error(`Error processing order ${order.id}:`, orderError);
          results.orderProcessing.errors++;
        }
      }
    } catch (error) {
      console.error("Error in order processing phase:", error);
      results.orderProcessing.errors++;
    }

    // 2. STATUS UPDATES (PROCESSING → READY_FOR_SHIPPING)
    console.log("Phase 2: Updating order statuses...");
    try {
      const staleOrders = await db.order.findMany({
        where: {
          status: "PROCESSING",
          createdAt: {
            lt: new Date(Date.now() - 4 * 60 * 60 * 1000), // Orders older than 4 hours
          },
        },
        include: {
          items: true,
        },
      });

      for (const order of staleOrders) {
        try {
          const processingTime = await calculateProcessingTime("standard");
          const expectedCompletionTime = new Date(
            order.createdAt.getTime() + processingTime * 60 * 60 * 1000
          );

          if (Date.now() > expectedCompletionTime.getTime()) {
            await db.order.update({
              where: { id: order.id },
              data: {
                status: "READY_FOR_SHIPPING",
              },
            });
            results.statusUpdates.updated++;
            console.log(`Updated order ${order.id} to READY_FOR_SHIPPING`);
          }
        } catch (error) {
          console.error(`Error updating order ${order.id}:`, error);
          results.statusUpdates.errors++;
        }
      }
    } catch (error) {
      console.error("Error in status updates phase:", error);
      results.statusUpdates.errors++;
    }

    // 3. AUTO-COMPLETION (DELIVERED → COMPLETED after 30 days)
    console.log("Phase 3: Auto-completing old delivered orders...");
    try {
      const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
      const cutoff = new Date(Date.now() - THIRTY_DAYS_MS);

      const eligibleOrders = await db.order.findMany({
        where: {
          status: OrderStatus.DELIVERED,
          deliveredAt: {
            lte: cutoff,
          },
        },
        select: { id: true, orderNumber: true, deliveredAt: true },
      });

      if (eligibleOrders.length > 0) {
        const update = await db.order.updateMany({
          where: {
            id: { in: eligibleOrders.map(o => o.id) },
          },
          data: {
            status: OrderStatus.COMPLETED,
          },
        });
        results.autoCompletion.completed = update.count;
        console.log(`Auto-completed ${update.count} orders`);
      }
    } catch (error) {
      console.error("Error in auto-completion phase:", error);
      results.autoCompletion.errors++;
    }

    // 4. CLEANUP & ANALYTICS
    console.log("Phase 4: Cleanup and analytics...");
    try {
      // Clean up old failed payment attempts (older than 7 days)
      const oldFailedPayments = await db.order.deleteMany({
        where: {
          status: "FAILED",
          paymentStatus: "FAILED",
          createdAt: {
            lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      });
      console.log(`Cleaned up ${oldFailedPayments.count} old failed orders`);

      // Log daily stats
      const todayStats = await db.order.aggregate({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
        _count: true,
        _sum: {
          total: true,
        },
      });
      console.log(`Today's stats: ${todayStats._count} orders, $${todayStats._sum.total || 0} revenue`);
    } catch (error) {
      console.error("Error in cleanup phase:", error);
    }

    const duration = Date.now() - startTime;
    console.log(`Daily maintenance job completed in ${duration}ms`);

    return NextResponse.json({
      success: true,
      message: "Daily maintenance job completed",
      data: {
        results,
        duration: `${duration}ms`,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Error in daily maintenance job:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to run daily maintenance",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * Manual trigger for testing (POST request)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phase } = body;

    if (phase === "test") {
      // Run a lightweight test version
      const testResults = await db.order.count({
        where: {
          status: "PROCESSING",
        },
      });

      return NextResponse.json({
        success: true,
        message: "Test completed",
        data: {
          processingOrders: testResults,
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Full manual run
    return GET(req);
  } catch (error) {
    console.error("Error in manual maintenance trigger:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to run manual maintenance",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
