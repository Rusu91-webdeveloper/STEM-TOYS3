import { db } from "@/lib/db";

export interface OrderProcessingResult {
  success: boolean;
  supplierOrders: any[];
  errors: string[];
}

export interface SupplierOrderData {
  orderItemId: string;
  supplierId: string;
  productId: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
}

export class OrderProcessor {
  /**
   * Process a new order and create supplier orders for each item
   */
  static async processNewOrder(
    orderId: string
  ): Promise<OrderProcessingResult> {
    try {
      // Get the order with all items
      const order = await db.order.findUnique({
        where: { id: orderId },
        include: {
          items: {
            include: {
              product: {
                include: {
                  supplier: true,
                },
              },
            },
          },
        },
      });

      if (!order) {
        return {
          success: false,
          supplierOrders: [],
          errors: ["Order not found"],
        };
      }

      const supplierOrders: any[] = [];
      const errors: string[] = [];

      // Group items by supplier
      const itemsBySupplier = new Map<string, any[]>();

      for (const item of order.items) {
        if (!item.product) {
          errors.push(`Product not found for item: ${item.name}`);
          continue;
        }

        if (!item.product.supplier) {
          errors.push(`No supplier assigned to product: ${item.product.name}`);
          continue;
        }

        const supplierId = item.product.supplier.id;
        if (!itemsBySupplier.has(supplierId)) {
          itemsBySupplier.set(supplierId, []);
        }
        itemsBySupplier.get(supplierId)!.push(item);
      }

      // Create supplier orders for each supplier
      for (const [supplierId, items] of itemsBySupplier) {
        try {
          const supplier = items[0].product.supplier;

          for (const item of items) {
            const supplierOrder = await db.supplierOrder.create({
              data: {
                orderId: orderId,
                orderItemId: item.id,
                supplierId: supplierId,
                productId: item.productId!,
                quantity: item.quantity,
                unitCost: item.product.costPrice || 0,
                totalCost: (item.product.costPrice || 0) * item.quantity,
                status: "PENDING",
                notes: `Order #${order.orderNumber} - ${item.name}`,
              },
              include: {
                supplier: true,
                product: true,
                orderItem: true,
              },
            });

            supplierOrders.push(supplierOrder);
          }

          // Send notification to supplier
          await this.notifySupplier(supplierId, order, items);
        } catch (error) {
          errors.push(
            `Failed to create supplier order for supplier ${supplierId}: ${error}`
          );
        }
      }

      // Update main order status
      await db.order.update({
        where: { id: orderId },
        data: {
          status: "PROCESSING",
          updatedAt: new Date(),
        },
      });

      return {
        success: errors.length === 0,
        supplierOrders,
        errors,
      };
    } catch (error) {
      return {
        success: false,
        supplierOrders: [],
        errors: [`Failed to process order: ${error}`],
      };
    }
  }

  /**
   * Update order status based on supplier order statuses
   */
  static async updateOrderStatusFromSuppliers(orderId: string): Promise<void> {
    try {
      // Get all supplier orders for this order
      const supplierOrders = await db.supplierOrder.findMany({
        where: { orderId },
        include: {
          supplier: true,
        },
      });

      if (supplierOrders.length === 0) {
        return;
      }

      // Determine overall order status based on supplier order statuses
      const statuses = supplierOrders.map(so => so.status);
      const uniqueStatuses = [...new Set(statuses)];

      let newOrderStatus: string;

      if (uniqueStatuses.includes("CANCELLED")) {
        newOrderStatus = "CANCELLED";
      } else if (uniqueStatuses.every(status => status === "DELIVERED")) {
        newOrderStatus = "DELIVERED";
      } else if (uniqueStatuses.some(status => status === "SHIPPED")) {
        newOrderStatus = "SHIPPED";
      } else if (uniqueStatuses.some(status => status === "CONFIRMED")) {
        newOrderStatus = "PROCESSING";
      } else {
        newOrderStatus = "PROCESSING";
      }

      // Update main order
      await db.order.update({
        where: { id: orderId },
        data: {
          status: newOrderStatus as any,
          updatedAt: new Date(),
        },
      });

      // Create status history entry
      await db.orderStatusHistory.create({
        data: {
          orderId: orderId,
          fromStatus: "PROCESSING" as any,
          toStatus: newOrderStatus as any,
          reason: "Status updated based on supplier order progress",
          notes: `Supplier statuses: ${uniqueStatuses.join(", ")}`,
        },
      });
    } catch (error) {
      console.error("Error updating order status from suppliers:", error);
    }
  }

  /**
   * Get order tracking information for customer display
   */
  static async getOrderTrackingInfo(orderNumber: string) {
    try {
      const order = await db.order.findUnique({
        where: { orderNumber },
        include: {
          items: {
            include: {
              product: {
                select: {
                  name: true,
                  images: true,
                },
              },
              supplierOrders: {
                include: {
                  supplier: {
                    select: {
                      name: true,
                      averageDeliveryDays: true,
                    },
                  },
                },
              },
            },
          },
          statusHistory: {
            orderBy: { createdAt: "desc" },
          },
          user: {
            select: {
              name: true,
              email: true,
            },
          },
          shippingAddress: true,
        },
      });

      if (!order) {
        return null;
      }

      // Calculate overall tracking status
      const allSupplierOrders = order.items.flatMap(
        item => item.supplierOrders
      );
      const trackingInfo = {
        order: {
          id: order.id,
          orderNumber: order.orderNumber,
          status: order.status,
          createdAt: order.createdAt,
          estimatedDelivery: order.estimatedDelivery,
          trackingNumber: order.trackingNumber,
          carrier: order.carrier,
        },
        items: order.items.map(item => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          product: item.product,
          supplierOrders: item.supplierOrders.map(so => ({
            id: so.id,
            supplier: so.supplier,
            status: so.status,
            trackingNumber: so.trackingNumber,
            carrier: so.carrier,
            shippedAt: so.shippedAt,
            estimatedDelivery: so.estimatedDelivery,
          })),
        })),
        statusHistory: order.statusHistory,
        customer: order.user,
        shippingAddress: order.shippingAddress,
      };

      return trackingInfo;
    } catch (error) {
      console.error("Error getting order tracking info:", error);
      return null;
    }
  }

  /**
   * Notify supplier about new order
   */
  private static async notifySupplier(
    supplierId: string,
    order: any,
    items: any[]
  ): Promise<void> {
    try {
      // Create notification for supplier
      await db.supplierNotification.create({
        data: {
          supplierId: supplierId,
          type: "INFO",
          title: `New Order #${order.orderNumber}`,
          message: `You have received a new order with ${items.length} items. Please check your supplier dashboard for details.`,
          actionUrl: `/supplier/orders`,
        },
      });

      // TODO: Send email notification to supplier
      console.log(
        `Notification sent to supplier ${supplierId} for order ${order.orderNumber}`
      );
    } catch (error) {
      console.error("Error notifying supplier:", error);
    }
  }

  /**
   * Get supplier performance metrics
   */
  static async getSupplierPerformanceMetrics() {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const supplierMetrics = await db.supplierOrder.groupBy({
        by: ["supplierId"],
        where: {
          createdAt: { gte: thirtyDaysAgo },
        },
        _count: {
          id: true,
        },
        _avg: {
          // Calculate average processing time
        },
      });

      const suppliers = await db.supplier.findMany({
        where: {
          id: { in: supplierMetrics.map(m => m.supplierId) },
        },
        select: {
          id: true,
          name: true,
          averageDeliveryDays: true,
        },
      });

      return supplierMetrics.map(metric => {
        const supplier = suppliers.find(s => s.id === metric.supplierId);
        return {
          supplierId: metric.supplierId,
          supplierName: supplier?.name || "Unknown",
          totalOrders: metric._count.id,
          averageDeliveryDays: supplier?.averageDeliveryDays || 7,
        };
      });
    } catch (error) {
      console.error("Error getting supplier performance metrics:", error);
      return [];
    }
  }
}
