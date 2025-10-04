import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { withRateLimit } from "@/lib/rate-limit";

const bulkUpdateSchema = z.object({
  orderIds: z.array(z.string()).min(1, "At least one order ID is required"),
  status: z.enum([
    "PROCESSING",
    "PENDING_REVIEW",
    "READY_FOR_SHIPPING",
    "FULFILLED",
    "SHIPPED",
    "DELIVERED",
    "COMPLETED",
    "CANCELLED",
  ]),
  reason: z.string().optional(),
  notes: z.string().optional(),
  sendNotification: z.boolean().default(true),
});

export const PATCH = withRateLimit(
  async (request: NextRequest) => {
    try {
      // Check authentication
      const session = await auth();
      if (!session?.user || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Not authorized" }, { status: 403 });
      }

      const body = await request.json();
      const validatedData = bulkUpdateSchema.parse(body);

      const { orderIds, status, reason, notes, sendNotification } =
        validatedData;

      // Verify all orders exist
      const existingOrders = await db.order.findMany({
        where: {
          id: { in: orderIds },
        },
        select: {
          id: true,
          orderNumber: true,
          status: true,
          userId: true,
        },
      });

      if (existingOrders.length !== orderIds.length) {
        return NextResponse.json(
          { error: "Some orders not found" },
          { status: 404 }
        );
      }

      // Update orders in a transaction
      const result = await db.$transaction(async tx => {
        const updatedOrders = [];

        for (const orderId of orderIds) {
          const order = existingOrders.find(o => o.id === orderId);
          if (!order) continue;

          // Create status history entry
          await tx.orderStatusHistory.create({
            data: {
              orderId: order.id,
              fromStatus: order.status as any,
              toStatus: status as any,
              reason: reason || "Bulk status update",
              notes: notes || "",
              updatedBy: session.user.id,
            },
          });

          // Update the order
          const updatedOrder = await tx.order.update({
            where: { id: orderId },
            data: {
              status: status as any,
              updatedBy: session.user.id,
              updatedAt: new Date(),
            },
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          });

          updatedOrders.push(updatedOrder);
        }

        return updatedOrders;
      });

      // TODO: Send notifications if requested
      if (sendNotification) {
        // Implementation for sending notifications to customers
        console.log(
          "Notifications would be sent for orders:",
          result.map(o => o.orderNumber)
        );
      }

      return NextResponse.json({
        success: true,
        message: `Successfully updated ${result.length} orders to ${status}`,
        data: {
          updatedCount: result.length,
          orders: result.map(order => ({
            id: order.id,
            orderNumber: order.orderNumber,
            status: order.status,
            customerEmail: order.user?.email,
          })),
        },
      });
    } catch (error) {
      console.error("Error updating bulk order status:", error);

      if (error instanceof z.ZodError) {
        return NextResponse.json(
          {
            error: "Invalid request data",
            details: error.errors,
          },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: "Failed to update order statuses" },
        { status: 500 }
      );
    }
  },
  { limit: 10, windowMs: 60 * 1000 } // Rate limiting for bulk operations
);
