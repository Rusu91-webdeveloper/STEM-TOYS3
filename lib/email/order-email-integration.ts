/**
 * Order Email Integration Service
 * Connects improved email templates to order lifecycle events
 * Handles order confirmation, shipped, and admin notifications
 */

import { prisma } from "@/lib/prisma";
import { sendEmailViaUnifiedSystem } from "@/lib/nodemailer";
import { generateOrderConfirmationEmail, type OrderConfirmationData } from "./order-confirmation-improved";
import { generateShippedEmail, type ShippedEmailData } from "./shipped-email-improved";
import { generateAdminNewOrderEmail, type AdminNewOrderData } from "./admin-new-order-email";
import { getAppConfig } from "@/lib/config/app-config";

/**
 * Send order confirmation email with proper COD/paid handling
 */
export async function sendOrderConfirmationImproved(orderId: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Fetch order with all necessary details
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: { select: { name: true, email: true } },
        items: { select: { name: true, quantity: true, price: true } },
        shippingAddress: true,
      },
    });

    if (!order || !order.user) {
      throw new Error("Order or user not found");
    }

    // Determine if this is a COD order
    const isCOD = order.paymentMethod.toLowerCase().includes("cod") || 
                  order.paymentMethod.toLowerCase().includes("ramburs");

    // Check if there's a card hold (notes contain "card hold" or codAmount exists)
    const hasCardHold = order.notes?.toLowerCase().includes("card hold") || 
                       (order.codAmount !== null && order.codAmount > 0 && order.codAmount < order.total);
    const cardHoldAmount = hasCardHold ? (order.codAmount || 25) : undefined;

    // Prepare email data
    const emailData: OrderConfirmationData = {
      customerName: order.user.name || "Client",
      customerEmail: order.user.email,
      orderNumber: order.orderNumber,
      orderDate: order.createdAt,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      items: order.items.map(item => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
      })),
      subtotal: order.subtotal,
      shippingCost: order.shippingCost,
      codFee: order.codFeeEstimate || undefined,
      discountAmount: order.discountAmount > 0 ? order.discountAmount : undefined,
      total: order.total,
      shippingAddress: {
        fullName: order.shippingAddress?.fullName,
        addressLine1: order.shippingAddress?.addressLine1,
        addressLine2: order.shippingAddress?.addressLine2,
        city: order.shippingAddress?.city,
        state: order.shippingAddress?.state,
        postalCode: order.shippingAddress?.postalCode,
        country: order.shippingAddress?.country,
        phone: order.shippingAddress?.phone,
      },
      isCOD,
      codAmount: isCOD ? order.total : undefined,
      hasCardHold,
      cardHoldAmount,
    };

    // Generate HTML
    const html = await generateOrderConfirmationEmail(emailData);

    // Send email
    const result = await sendEmailViaUnifiedSystem({
      to: order.user.email,
      subject: `✅ Confirmare comandă #${order.orderNumber} - TechTots`,
      html,
    });

    return { success: result.success, error: result.error };
  } catch (error) {
    console.error("❌ Error sending improved order confirmation:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Send shipped email when AWB is created
 * Prevents duplicate emails using order tags
 */
export async function sendShippedEmailImproved(orderId: string, awbNumber?: string, carrier?: string): Promise<{ success: boolean; error?: string; skipped?: boolean }> {
  try {
    // Fetch order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: { select: { name: true, email: true } },
      },
    });

    if (!order || !order.user) {
      throw new Error("Order or user not found");
    }

    // Check if shipped email already sent (using tags)
    const SHIPPED_EMAIL_TAG = "shipped-email-sent";
    if (order.tags?.includes(SHIPPED_EMAIL_TAG)) {
      console.log(`✅ Shipped email already sent for order ${orderId}, skipping`);
      return { success: true, skipped: true };
    }

    // Use AWB from order if not provided
    const trackingNumber = awbNumber || order.trackingNumber;
    const courierName = carrier || order.carrier || "FanCourier";

    if (!trackingNumber) {
      throw new Error("No tracking number available");
    }

    // Determine if COD
    const isCOD = order.paymentMethod.toLowerCase().includes("cod") || 
                  order.paymentMethod.toLowerCase().includes("ramburs");

    // Prepare email data
    const emailData: ShippedEmailData = {
      customerName: order.user.name || "Client",
      customerEmail: order.user.email,
      orderNumber: order.orderNumber,
      trackingNumber,
      carrier: courierName,
      shippedDate: order.shippedAt || new Date(),
      estimatedDeliveryDays: 2,
      isCOD,
      codAmount: isCOD ? order.total : undefined,
    };

    // Generate HTML
    const html = await generateShippedEmail(emailData);

    // Send email
    const result = await sendEmailViaUnifiedSystem({
      to: order.user.email,
      subject: `🚚 Comanda #${order.orderNumber} a fost expediată - TechTots`,
      html,
    });

    if (result.success) {
      // Mark email as sent using tags
      await prisma.order.update({
        where: { id: orderId },
        data: {
          tags: {
            set: [...(order.tags || []), SHIPPED_EMAIL_TAG],
          },
        },
      });
    }

    return { success: result.success, error: result.error };
  } catch (error) {
    console.error("❌ Error sending shipped email:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Send admin new order notification with correct data
 */
export async function sendAdminNewOrderNotification(orderId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const config = await getAppConfig();
    
    // Fetch order with all details
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: { select: { name: true, email: true } },
        items: {
          select: {
            name: true,
            quantity: true,
            price: true,
            product: { select: { sku: true } },
          },
        },
      },
    });

    if (!order || !order.user) {
      throw new Error("Order or user not found");
    }

    // Determine payment method display
    let paymentMethodDisplay = order.paymentMethod;
    if (order.paymentMethod.toLowerCase().includes("cod") || order.paymentMethod.toLowerCase().includes("ramburs")) {
      paymentMethodDisplay = "Ramburs (plată la livrare)";
    } else if (order.paymentMethod.toLowerCase().includes("card")) {
      paymentMethodDisplay = "Card bancar";
    } else if (order.paymentMethod.toLowerCase().includes("netopia")) {
      paymentMethodDisplay = "Card bancar (Netopia)";
    }

    // Prepare email data
    const emailData: AdminNewOrderData = {
      orderNumber: order.orderNumber,
      orderId: order.id,
      customerName: order.user.name || "Client anonim",
      customerEmail: order.user.email,
      paymentMethod: paymentMethodDisplay,
      items: order.items.map(item => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        sku: item.product?.sku || undefined,
      })),
      subtotal: order.subtotal,
      shippingCost: order.shippingCost,
      codFee: order.codFeeEstimate || undefined,
      total: order.total,
    };

    // Generate HTML
    const html = await generateAdminNewOrderEmail(emailData);

    // Send to admin email(s)
    const adminEmails = [config.alertEmail, config.adminEmail].filter(Boolean);
    const uniqueAdmins = Array.from(new Set(adminEmails));

    const results = await Promise.all(
      uniqueAdmins.map(email =>
        sendEmailViaUnifiedSystem({
          to: email,
          subject: `🛒 Comandă nouă #${order.orderNumber} - TechTots Admin`,
          html,
        })
      )
    );

    const allSuccess = results.every(r => r.success);
    return { success: allSuccess };
  } catch (error) {
    console.error("❌ Error sending admin notification:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
