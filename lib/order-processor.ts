import { db } from "@/lib/db";
import { syncParentOrderFromSupplierOrders } from "@/lib/order-fulfillment-sync";

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

function parseBundleItemIds(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map(item => String(item).trim())
      .filter(Boolean);
  }

  if (typeof value === "string" && value.trim().length > 0) {
    try {
      const parsed = JSON.parse(value);
      return parseBundleItemIds(parsed);
    } catch {
      return value
        .split(/[,\n\r\t]+/)
        .map(item => item.trim())
        .filter(Boolean);
    }
  }

  return [];
}

type SupplierLineCandidate = {
  orderItemId: string;
  supplierId: string;
  productId: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  noteLabel: string;
};

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
      const supplierLineCandidates: SupplierLineCandidate[] = [];

      const bundleItems = order.items.filter(item => item.product?.isBundle === true);
      const bundleComponentIdsByBundleId = new Map<string, string[]>();
      const allBundleComponentIds = new Set<string>();

      for (const item of bundleItems) {
        const bundleId = item.productId;
        if (!bundleId) continue;

        const componentIds = parseBundleItemIds(item.product.bundleItems);
        bundleComponentIdsByBundleId.set(bundleId, componentIds);
        for (const componentId of componentIds) {
          allBundleComponentIds.add(componentId);
        }
      }

      const bundleComponents = allBundleComponentIds.size
        ? await db.product.findMany({
            where: { id: { in: Array.from(allBundleComponentIds) } },
            include: {
              supplier: true,
            },
          })
        : [];
      const bundleComponentById = new Map(bundleComponents.map(product => [product.id, product]));

      for (const item of order.items) {
        if (!item.product) {
          errors.push(`Product not found for item: ${item.name}`);
          continue;
        }

        if (item.product.isBundle) {
          const bundleId = item.productId;
          const componentIds = (bundleId && bundleComponentIdsByBundleId.get(bundleId)) || [];

          if (!bundleId || componentIds.length === 0) {
            const msg = `Bundle has no components: ${item.product.name}`;
            errors.push(msg);
            console.warn(`[OrderProcessor] ${msg}; skipping SupplierOrder for order item ${item.id}`);
            continue;
          }

          for (const componentId of componentIds) {
            const component = bundleComponentById.get(componentId);
            if (!component) {
              const msg = `Bundle component not found (${componentId}) for bundle: ${item.product.name}`;
              errors.push(msg);
              console.warn(`[OrderProcessor] ${msg}; skipping component for order item ${item.id}`);
              continue;
            }

            if (!component.supplier) {
              const msg = `No supplier assigned to bundle component: ${component.name}`;
              errors.push(msg);
              console.warn(`[OrderProcessor] ${msg}; skipping component for order item ${item.id}`);
              continue;
            }

            supplierLineCandidates.push({
              orderItemId: item.id,
              supplierId: component.supplier.id,
              productId: component.id,
              quantity: item.quantity,
              unitCost: component.costPrice || 0,
              totalCost: (component.costPrice || 0) * item.quantity,
              noteLabel: `${item.name} (bundle component: ${component.name})`,
            });
          }

          continue;
        }

        if (!item.product.supplier) {
          const msg = `No supplier assigned to product: ${item.product.name}`;
          errors.push(msg);
          console.warn(`[OrderProcessor] ${msg}; skipping SupplierOrder for order item ${item.id}`);
          continue;
        }

        supplierLineCandidates.push({
          orderItemId: item.id,
          supplierId: item.product.supplier.id,
          productId: item.productId!,
          quantity: item.quantity,
          unitCost: item.product.costPrice || 0,
          totalCost: (item.product.costPrice || 0) * item.quantity,
          noteLabel: item.name,
        });
      }

      // Group supplier line candidates by supplier for creation + notifications
      const linesBySupplier = new Map<string, SupplierLineCandidate[]>();
      for (const line of supplierLineCandidates) {
        if (!linesBySupplier.has(line.supplierId)) {
          linesBySupplier.set(line.supplierId, []);
        }
        linesBySupplier.get(line.supplierId)!.push(line);
      }

      // Create supplier orders for each supplier
      for (const [supplierId, lines] of linesBySupplier) {
        try {
          for (const line of lines) {
            const supplierOrder = await db.supplierOrder.create({
              data: {
                orderId: orderId,
                orderItemId: line.orderItemId,
                supplierId: supplierId,
                productId: line.productId,
                quantity: line.quantity,
                unitCost: line.unitCost,
                totalCost: line.totalCost,
                status: "PENDING",
                notes: `Order #${order.orderNumber} - ${line.noteLabel}`,
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
          await this.notifySupplier(supplierId, order, lines);
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
      await syncParentOrderFromSupplierOrders(orderId, "order-processor");
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
