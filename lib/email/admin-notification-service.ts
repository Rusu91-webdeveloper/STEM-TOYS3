/**
 * Admin Notification Email Service
 *
 * Handles sending notification emails to administrators for:
 * - New orders
 * - Payment failures
 * - Order issues
 * - Stock alerts
 * - Return requests
 */

import { appConfig } from "@/lib/config/app-config";
import { prisma } from "@/lib/prisma";
import { DatabaseTemplateService } from "./database-template-service";

export class AdminNotificationService {
  /**
   * Send new order notification to admin
   */
  static async sendNewOrderNotification(
    orderId: string,
    adminEmail: string = appConfig.adminEmail
  ): Promise<{ success: boolean; error?: string; messageId?: string }> {
    try {
      console.log(`📧 Preparing admin notification for order ${orderId}`);

      // Fetch complete order with user info
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
          items: {
            include: {
              product: {
                select: {
                  name: true,
                  price: true,
                },
              },
              book: {
                select: {
                  name: true,
                  price: true,
                },
              },
            },
          },
          shippingAddress: {
            select: {
              fullName: true,
              addressLine1: true,
              city: true,
              phone: true,
            },
          },
        },
      });

      if (!order) {
        throw new Error(`Order ${orderId} not found`);
      }

      // Prepare complete order data with all required fields
      const orderData = {
        number: order.orderNumber,
        customerName:
          order.user?.name ||
          order.shippingAddress?.fullName ||
          "Guest Customer",
        customerEmail: order.user?.email || "N/A", // ✅ Now included
        total: order.total.toFixed(2) + " RON",
        date: order.createdAt.toLocaleDateString("ro-RO", {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        status: order.status, // ✅ Now included
      };

      console.log("📦 Order data prepared:", orderData);

      const result = await DatabaseTemplateService.sendEmailWithTemplate({
        to: adminEmail,
        templateSlug: "admin-new-order",
        data: {
          order: orderData,
          adminUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/admin/orders/${order.id}`,
        },
      });

      if (result.success) {
        console.log(
          `✅ Admin notification sent for order ${order.orderNumber}`
        );
      } else {
        console.error(`❌ Failed to send admin notification:`, result.error);
      }

      return result;
    } catch (error) {
      console.error("Failed to send admin order notification:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Send payment failed notification to admin
   */
  static async sendPaymentFailedNotification(
    orderId: string,
    paymentError: string,
    paymentMethod?: string,
    adminEmail: string = appConfig.adminEmail
  ): Promise<{ success: boolean; error?: string; messageId?: string }> {
    try {
      console.log(
        `📧 Preparing payment failure notification for order ${orderId}`
      );

      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      });

      if (!order) {
        throw new Error(`Order ${orderId} not found`);
      }

      const result = await DatabaseTemplateService.sendEmailWithTemplate({
        to: adminEmail,
        templateSlug: "admin-payment-failed",
        data: {
          order: {
            number: order.orderNumber,
            customerName: order.user?.name || "Guest",
            customerEmail: order.user?.email || "N/A", // ✅ Now included
            total: order.total.toFixed(2) + " RON",
          },
          payment: {
            method: paymentMethod || order.paymentMethod || "Unknown",
            error: paymentError,
            date: new Date().toLocaleDateString("ro-RO", {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            }),
          },
          adminUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/admin/orders/${order.id}`,
        },
      });

      if (result.success) {
        console.log(
          `✅ Payment failure notification sent for order ${order.orderNumber}`
        );
      } else {
        console.error(
          `❌ Failed to send payment failure notification:`,
          result.error
        );
      }

      return result;
    } catch (error) {
      console.error("Failed to send payment failed notification:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Send order issue notification to admin
   */
  static async sendOrderIssueNotification(
    orderId: string,
    issueType: string,
    issueDescription: string,
    priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT" = "MEDIUM",
    adminEmail: string = appConfig.adminEmail
  ): Promise<{ success: boolean; error?: string; messageId?: string }> {
    try {
      console.log(`📧 Preparing order issue notification: ${issueType}`);

      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          user: {
            select: {
              name: true,
              email: true,
              phone: true,
            },
          },
        },
      });

      if (!order) {
        throw new Error(`Order ${orderId} not found`);
      }

      const result = await DatabaseTemplateService.sendEmailWithTemplate({
        to: adminEmail,
        templateSlug: "admin-order-issue",
        data: {
          order: {
            number: order.orderNumber,
            customerName: order.user?.name || "Guest",
          },
          issue: {
            type: issueType,
            description: issueDescription,
            priority: priority,
          },
          adminUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/admin/orders/${order.id}`,
        },
      });

      if (result.success) {
        console.log(`✅ Order issue notification sent: ${issueType}`);
      }

      return result;
    } catch (error) {
      console.error("Failed to send order issue notification:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Send low stock alert to admin
   */
  static async sendLowStockAlert(
    productId: string,
    currentStock: number,
    minimumStock: number,
    adminEmail: string = appConfig.adminEmail
  ): Promise<{ success: boolean; error?: string; messageId?: string }> {
    try {
      console.log(`📧 Preparing low stock alert for product ${productId}`);

      const product = await prisma.product.findUnique({
        where: { id: productId },
        select: {
          name: true,
          sku: true,
          stockQuantity: true,
          reorderPoint: true,
          category: {
            select: {
              name: true,
            },
          },
        },
      });

      if (!product) {
        throw new Error(`Product ${productId} not found`);
      }

      // Get sales statistics for the product
      const lastWeekSales = await prisma.orderItem.count({
        where: {
          productId: productId,
          order: {
            createdAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            },
          },
        },
      });

      const lastMonthSales = await prisma.orderItem.count({
        where: {
          productId: productId,
          order: {
            createdAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            },
          },
        },
      });

      const result = await DatabaseTemplateService.sendEmailWithTemplate({
        to: adminEmail,
        templateSlug: "admin-low-stock",
        data: {
          product: {
            name: product.name,
            sku: product.sku || "N/A",
            category: product.category?.name || "Uncategorized",
          },
          stock: {
            quantity: currentStock,
            minimum: minimumStock,
          },
          sales: {
            lastWeek: lastWeekSales,
            lastMonth: lastMonthSales,
          },
          adminUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/admin/products/${productId}`,
        },
      });

      if (result.success) {
        console.log(`✅ Low stock alert sent for ${product.name}`);
      }

      return result;
    } catch (error) {
      console.error("Failed to send low stock alert:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Send return request notification to admin
   */
  static async sendReturnRequestNotification(
    returnId: string,
    adminEmail: string = appConfig.adminEmail
  ): Promise<{ success: boolean; error?: string; messageId?: string }> {
    try {
      console.log(`📧 Preparing return request notification: ${returnId}`);

      const returnRequest = await prisma.return.findUnique({
        where: { id: returnId },
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
          order: {
            select: {
              orderNumber: true,
            },
          },
          orderItem: {
            include: {
              product: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      });

      if (!returnRequest) {
        throw new Error(`Return request ${returnId} not found`);
      }

      const result = await DatabaseTemplateService.sendEmailWithTemplate({
        to: adminEmail,
        templateSlug: "admin-return-request",
        data: {
          return: {
            number: returnId,
            product:
              returnRequest.orderItem.product?.name ||
              returnRequest.orderItem.name,
            reason: returnRequest.reason,
            amount: 0, // Would need to calculate from orderItem
          },
          customer: {
            name: returnRequest.user.name || "Guest",
            email: returnRequest.user.email,
          },
          order: {
            number: returnRequest.order.orderNumber,
          },
          adminUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/admin/returns/${returnId}`,
        },
      });

      if (result.success) {
        console.log(`✅ Return request notification sent`);
      }

      return result;
    } catch (error) {
      console.error("Failed to send return request notification:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Test admin notifications with sample data
   */
  static async testAdminNotifications(): Promise<void> {
    console.log("\n🧪 Testing Admin Notification Service\n");

    try {
      // Get a recent order for testing
      const testOrder = await prisma.order.findFirst({
        orderBy: { createdAt: "desc" },
        include: {
          user: true,
        },
      });

      if (testOrder) {
        console.log("📧 Testing with real order:", testOrder.orderNumber);

        const result = await this.sendNewOrderNotification(
          testOrder.id,
          process.env.ADMIN_EMAIL || "test@example.com"
        );

        console.log("Result:", result);
      } else {
        console.log("⚠️  No orders found in database for testing");
        console.log("Create a test order first, then run this test again");
      }
    } catch (error) {
      console.error("Test failed:", error);
    }
  }
}

// If run directly, execute test
if (require.main === module) {
  AdminNotificationService.testAdminNotifications()
    .then(() => {
      console.log("\n✅ Test complete");
      process.exit(0);
    })
    .catch(error => {
      console.error("\n❌ Test failed:", error);
      process.exit(1);
    });
}
