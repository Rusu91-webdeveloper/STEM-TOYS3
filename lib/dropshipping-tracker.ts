import { db } from "@/lib/db";
import { syncParentOrderFromSupplierOrders } from "@/lib/order-fulfillment-sync";

export interface TrackingUpdate {
  orderId: string;
  supplierOrderId?: string;
  trackingNumber?: string;
  carrier?: string;
  status: string;
  estimatedDelivery?: Date;
  location?: string;
  notes?: string;
}

export interface SupplierAPIResponse {
  success: boolean;
  trackingNumber?: string;
  carrier?: string;
  status?: string;
  estimatedDelivery?: string;
  location?: string;
  error?: string;
}

export class DropshippingTracker {
  /**
   * Update supplier order when supplier provides tracking info
   */
  static async updateSupplierOrderTracking(
    supplierOrderId: string,
    update: TrackingUpdate
  ) {
    try {
      // Update the supplier order
      const supplierOrder = await db.supplierOrder.update({
        where: { id: supplierOrderId },
        data: {
          trackingNumber: update.trackingNumber,
          carrier: update.carrier,
          status: update.status as any,
          shippedAt: update.status === "SHIPPED" ? new Date() : undefined,
          estimatedDelivery: update.estimatedDelivery,
          notes: update.notes,
          updatedAt: new Date(),
        },
        include: {
          order: {
            include: {
              user: { select: { email: true, name: true } },
              items: { include: { product: true } },
            },
          },
          supplier: true,
          product: true,
        },
      });

      // Update main order status based on all supplier orders
      await this.updateMainOrderStatus(supplierOrder.orderId);

      // Send customer notification
      await this.sendCustomerNotification(supplierOrder.order, update);

      return { success: true, supplierOrder };
    } catch (error) {
      console.error("Error updating supplier order tracking:", error);
      return { success: false, error };
    }
  }

  /**
   * Update main order status based on supplier order statuses
   */
  private static async updateMainOrderStatus(orderId: string) {
    try {
      await syncParentOrderFromSupplierOrders(orderId, "dropshipping-tracker");
    } catch (error) {
      console.error("Error updating main order status:", error);
    }
  }

  /**
   * Send notification to customer about tracking update
   */
  static async sendCustomerNotification(order: any, update: TrackingUpdate) {
    const emailTemplates = {
      SHIPPED: {
        subject: `🚚 Your order #${order.orderNumber} has been shipped!`,
        body: `
          <h2>Great news! Your order is on its way!</h2>
          <p>Order #${order.orderNumber} has been shipped and is heading to you.</p>
          
          ${
            update.trackingNumber
              ? `
            <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3>📦 Tracking Information</h3>
              <p><strong>Tracking Number:</strong> ${update.trackingNumber}</p>
              <p><strong>Carrier:</strong> ${update.carrier}</p>
              ${update.estimatedDelivery ? `<p><strong>Estimated Delivery:</strong> ${update.estimatedDelivery.toLocaleDateString()}</p>` : ""}
            </div>
          `
              : ""
          }
          
          <p>You can track your package using the tracking number above.</p>
          <p>Thank you for choosing TechTots!</p>
        `,
      },
      DELIVERED: {
        subject: `✅ Your order #${order.orderNumber} has been delivered!`,
        body: `
          <h2>Your order has arrived!</h2>
          <p>Order #${order.orderNumber} has been successfully delivered.</p>
          <p>We hope you love your new STEM toys! If you have any questions, please don't hesitate to contact us.</p>
        `,
      },
    };

    const template =
      emailTemplates[update.status as keyof typeof emailTemplates];
    if (template) {
      // TODO: Implement actual email sending
      console.log("Would send email to:", order.user.email);
      console.log("Subject:", template.subject);
      console.log("Body:", template.body);
    }
  }

  /**
   * Fetch tracking updates from supplier APIs
   */
  static async fetchSupplierUpdates() {
    const pendingOrders = await db.supplierOrder.findMany({
      where: {
        status: {
          in: ["PENDING", "CONFIRMED", "IN_PRODUCTION", "READY_TO_SHIP"],
        },
        createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, // Last 30 days
      },
      include: {
        supplier: true,
        order: { include: { user: true } },
        product: true,
      },
    });

    const updates = [];
    for (const supplierOrder of pendingOrders) {
      try {
        const update = await this.fetchFromSupplierAPI(supplierOrder);
        if (update) {
          // Add supplier order ID to the update
          update.supplierOrderId = supplierOrder.id;
          updates.push(update);
        }
      } catch (error) {
        console.error(
          `Error fetching update for supplier order ${supplierOrder.id}:`,
          error
        );
      }
    }

    return updates;
  }

  /**
   * Fetch tracking info from supplier API (placeholder)
   */
  static async fetchFromSupplierAPI(
    supplierOrder: any
  ): Promise<TrackingUpdate | null> {
    const supplier = supplierOrder.supplier;
    const integrationMethod = String(supplier?.integrationMethod || "")
      .trim()
      .toLowerCase();
    if (!integrationMethod || integrationMethod === "manual") {
      return null;
    }

    // Keep this deterministic until a real supplier API adapter is implemented.
    console.warn(
      `Supplier tracking adapter not implemented for supplier ${supplier?.name} (integrationMethod=${integrationMethod}).`
    );

    return null;
  }

  /**
   * Handle delivery exceptions and delays
   */
  static async handleDeliveryExceptions() {
    const overdueOrders = await db.order.findMany({
      where: {
        status: "SHIPPED",
        estimatedDelivery: { lt: new Date() },
        deliveredAt: null,
      },
      include: {
        user: { select: { email: true, name: true } },
      },
    });

    for (const order of overdueOrders) {
      // Send delay notification
      console.log(
        `Order ${order.orderNumber} is overdue - sending delay notification`
      );

      // TODO: Send delay notification email
      // TODO: Contact supplier for update
      // TODO: Update estimated delivery date
    }

    return overdueOrders.length;
  }

  /**
   * Get delivery performance metrics
   */
  static async getDeliveryMetrics() {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const metrics = await db.order.aggregate({
      where: {
        createdAt: { gte: thirtyDaysAgo },
        status: { in: ["DELIVERED", "COMPLETED"] },
      },
      _avg: {
        // Calculate average delivery time
      },
    });

    const supplierPerformance = await db.supplierOrder.groupBy({
      by: ["supplierId"],
      where: {
        createdAt: { gte: thirtyDaysAgo },
        status: "DELIVERED",
      },
      _count: {
        id: true,
      },
      _avg: {
        // Calculate average delivery time per supplier
      },
    });

    return {
      totalDelivered: metrics._count,
      averageDeliveryTime: metrics._avg,
      supplierPerformance,
    };
  }
}

/**
 * Scheduled job to fetch updates from suppliers
 */
export async function runDropshippingSync() {
  console.log("🔄 Starting dropshipping sync...");

  try {
    // Fetch updates from supplier APIs
    const updates = await DropshippingTracker.fetchSupplierUpdates();

    // Apply updates
    for (const update of updates) {
      if (update.supplierOrderId) {
        await DropshippingTracker.updateSupplierOrderTracking(
          update.supplierOrderId,
          update
        );
      }
    }

    // Handle delivery exceptions
    const overdueCount = await DropshippingTracker.handleDeliveryExceptions();

    console.log(
      `✅ Dropshipping sync complete: ${updates.length} updates, ${overdueCount} overdue orders`
    );

    return {
      success: true,
      updatesApplied: updates.length,
      overdueOrders: overdueCount,
    };
  } catch (error) {
    console.error("❌ Dropshipping sync failed:", error);
    return { success: false, error };
  }
}
