import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { getNotificationSettings } from "./order-processing";
import { emailTemplates } from "@/lib/brevoTemplates";

export type OrderStatus =
  | "PROCESSING"
  | "PENDING_REVIEW"
  | "READY_FOR_SHIPPING"
  | "FULFILLED"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"
  | "COMPLETED";

export interface OrderStatusUpdate {
  orderId: string;
  fromStatus: OrderStatus;
  toStatus: OrderStatus;
  reason?: string;
  notes?: string;
  updatedBy?: string;
  timestamp: Date;
}

/**
 * Update order status with validation and notifications
 */
export async function updateOrderStatus(
  orderId: string,
  newStatus: OrderStatus,
  options: {
    reason?: string;
    notes?: string;
    updatedBy?: string;
    sendNotification?: boolean;
  } = {}
): Promise<{ success: boolean; error?: string; order?: any }> {
  try {
    const { reason, notes, updatedBy, sendNotification = true } = options;

    // Get current order
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: {
        user: true,
        items: true,
        shippingAddress: true,
      },
    });

    if (!order) {
      return { success: false, error: "Order not found" };
    }

    const currentStatus = order.status as OrderStatus;

    // Validate status transition
    const isValidTransition = validateStatusTransition(
      currentStatus,
      newStatus
    );
    if (!isValidTransition) {
      return {
        success: false,
        error: `Invalid status transition from ${currentStatus} to ${newStatus}`,
      };
    }

    // Update order status
    const updatedOrder = await db.order.update({
      where: { id: orderId },
      data: {
        status: newStatus,
        ...(newStatus === "FULFILLED" && { fulfilledAt: new Date() }),
        ...(newStatus === "SHIPPED" && { shippedAt: new Date() }),
        ...(newStatus === "DELIVERED" && { deliveredAt: new Date() }),
        ...(newStatus === "COMPLETED" && { completedAt: new Date() }),
      },
    });

    // Create status history record
    await db.orderStatusHistory.create({
      data: {
        orderId,
        fromStatus: currentStatus,
        toStatus: newStatus,
        reason,
        notes,
        updatedBy,
      },
    });

    // Send notification if enabled
    if (sendNotification) {
      await sendOrderStatusNotification(updatedOrder, currentStatus, newStatus);
    }

    console.log(
      `Order ${orderId} status updated from ${currentStatus} to ${newStatus}`
    );

    return { success: true, order: updatedOrder };
  } catch (error) {
    console.error("Error updating order status:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Validate if a status transition is allowed
 */
export function validateStatusTransition(
  fromStatus: OrderStatus,
  toStatus: OrderStatus
): boolean {
  const validTransitions: Record<OrderStatus, OrderStatus[]> = {
    PROCESSING: [
      "PENDING_REVIEW",
      "READY_FOR_SHIPPING",
      "FULFILLED",
      "CANCELLED",
    ],
    PENDING_REVIEW: [
      "PROCESSING",
      "READY_FOR_SHIPPING",
      "FULFILLED",
      "CANCELLED",
    ],
    READY_FOR_SHIPPING: ["FULFILLED", "SHIPPED", "CANCELLED"],
    FULFILLED: ["SHIPPED", "CANCELLED"],
    SHIPPED: ["DELIVERED", "CANCELLED"],
    DELIVERED: ["COMPLETED"],
    CANCELLED: [], // No transitions from cancelled
    COMPLETED: [], // No transitions from completed
  };

  return validTransitions[fromStatus]?.includes(toStatus) || false;
}

/**
 * Send order status notification email
 */
async function sendOrderStatusNotification(
  order: any,
  fromStatus: OrderStatus,
  toStatus: OrderStatus
): Promise<void> {
  try {
    const notificationSettings = await getNotificationSettings();

    if (!notificationSettings) {
      console.log("No notification settings found, skipping email");
      return;
    }

    // Determine which notification to send
    let shouldSend = false;
    let template = "";
    let subject = "";

    switch (toStatus) {
      case "FULFILLED":
        shouldSend = notificationSettings.processingUpdate;
        if (shouldSend) {
          await emailTemplates.sendOrderFulfilledEmail({
            to: order.user.email,
            orderNumber: order.orderNumber,
            customerName: order.user.name || "Customer",
            orderTotal: order.total,
            items: order.items.map((item: any) => ({
              name: item.name,
              quantity: item.quantity,
              price: item.price,
            })),
            shippingAddress: order.shippingAddress,
          });
        }
        break;
      case "SHIPPED":
        shouldSend = notificationSettings.shippingNotification;
        if (shouldSend) {
          await emailTemplates.sendOrderShippedEmail({
            to: order.user.email,
            orderNumber: order.orderNumber,
            customerName: order.user.name || "Customer",
            trackingNumber: order.trackingNumber || undefined,
            items: order.items.map((item: any) => ({
              name: item.name,
              quantity: item.quantity,
              price: item.price,
            })),
            shippingAddress: order.shippingAddress,
          });
        }
        break;
      case "DELIVERED":
        shouldSend = notificationSettings.deliveryConfirmation;
        if (shouldSend) {
          await emailTemplates.sendOrderDeliveredEmail({
            to: order.user.email,
            orderNumber: order.orderNumber,
            customerName: order.user.name || "Customer",
            items: order.items.map((item: any) => ({
              name: item.name,
              quantity: item.quantity,
              price: item.price,
            })),
          });
        }
        break;
      case "COMPLETED":
        shouldSend = notificationSettings.deliveryConfirmation;
        if (shouldSend) {
          await emailTemplates.sendOrderCompletedEmail({
            to: order.user.email,
            orderNumber: order.orderNumber,
            customerName: order.user.name || "Customer",
          });
        }
        break;
      default:
        shouldSend = false;
    }

    if (!shouldSend) {
      console.log(`Notification not enabled for status: ${toStatus}`);
      return;
    }

    console.log(`Sent ${toStatus} notification for order ${order.id}`);
  } catch (error) {
    console.error("Error sending order status notification:", error);
    // Don't throw error - notification failure shouldn't break order processing
  }
}

/**
 * Get order status history
 */
export async function getOrderStatusHistory(orderId: string) {
  try {
    const history = await db.orderStatusHistory.findMany({
      where: { orderId },
      orderBy: { createdAt: "desc" },
    });

    return history;
  } catch (error) {
    console.error("Error getting order status history:", error);
    return [];
  }
}

/**
 * Bulk update order statuses (for admin operations)
 */
export async function bulkUpdateOrderStatuses(
  orderIds: string[],
  newStatus: OrderStatus,
  options: {
    reason?: string;
    notes?: string;
    updatedBy?: string;
  } = {}
): Promise<{
  success: number;
  errors: Array<{ orderId: string; error: string }>;
}> {
  const results = {
    success: 0,
    errors: [] as Array<{ orderId: string; error: string }>,
  };

  for (const orderId of orderIds) {
    const result = await updateOrderStatus(orderId, newStatus, {
      ...options,
      sendNotification: false, // Disable notifications for bulk updates
    });

    if (result.success) {
      results.success++;
    } else {
      results.errors.push({ orderId, error: result.error || "Unknown error" });
    }
  }

  return results;
}

/**
 * Auto-advance order status based on time and conditions
 */
export async function autoAdvanceOrderStatus(
  orderId: string
): Promise<boolean> {
  try {
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
      },
    });

    if (!order) {
      return false;
    }

    const currentStatus = order.status as OrderStatus;
    const now = new Date();
    const hoursSinceCreated =
      (now.getTime() - order.createdAt.getTime()) / (1000 * 60 * 60);

    // Auto-advance logic based on time and status
    switch (currentStatus) {
      case "PROCESSING":
        // If order has been processing for more than 2 hours, move to READY_FOR_SHIPPING
        if (hoursSinceCreated > 2) {
          await updateOrderStatus(orderId, "READY_FOR_SHIPPING", {
            reason: "Auto-advance: Processing time exceeded",
            updatedBy: "system",
          });
          return true;
        }
        break;

      case "READY_FOR_SHIPPING":
        // If order has been ready for shipping for more than 24 hours, move to FULFILLED
        if (order.fulfilledAt && hoursSinceCreated > 24) {
          await updateOrderStatus(orderId, "FULFILLED", {
            reason: "Auto-advance: Ready for shipping time exceeded",
            updatedBy: "system",
          });
          return true;
        }
        break;

      case "SHIPPED":
        // If order has been shipped for more than 7 days, assume delivered
        if (order.shippedAt) {
          const daysSinceShipped =
            (now.getTime() - order.shippedAt.getTime()) / (1000 * 60 * 60 * 24);
          if (daysSinceShipped > 7) {
            await updateOrderStatus(orderId, "DELIVERED", {
              reason: "Auto-advance: Assumed delivered after 7 days",
              updatedBy: "system",
            });
            return true;
          }
        }
        break;

      case "DELIVERED":
        // If order has been delivered for more than 3 days, mark as completed
        if (order.deliveredAt) {
          const daysSinceDelivered =
            (now.getTime() - order.deliveredAt.getTime()) /
            (1000 * 60 * 60 * 24);
          if (daysSinceDelivered > 3) {
            await updateOrderStatus(orderId, "COMPLETED", {
              reason:
                "Auto-advance: Completed after delivery confirmation period",
              updatedBy: "system",
            });
            return true;
          }
        }
        break;
    }

    return false;
  } catch (error) {
    console.error("Error auto-advancing order status:", error);
    return false;
  }
}
