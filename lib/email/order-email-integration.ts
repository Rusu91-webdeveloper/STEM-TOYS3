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
 * Check if a payment method is Cash on Delivery (COD/Ramburs)
 */
export function isCodPaymentMethod(paymentMethod: string | null | undefined): boolean {
  if (!paymentMethod) return false;
  const method = paymentMethod.toLowerCase();
  return method === "cash_on_delivery" || 
         method === "cod" || 
         method === "ramburs" ||
         method.includes("cash_on_delivery");
}

/**
 * Parse COD guarantee evidence from order notes
 */
function parseCodGuaranteeAmount(notes: string | null): number | null {
  if (!notes) return null;
  const match = notes.match(/authorized[_\s]?amount[:\s]+(\d+\.?\d*)/i);
  return match ? parseFloat(match[1]) : null;
}

/**
 * Send order confirmation email with proper COD/paid handling
 */
export async function sendOrderConfirmationImproved(orderId: string): Promise<{ success: boolean; error?: string }> {
  try {
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

    const isCOD = isCodPaymentMethod(order.paymentMethod);

    // Card hold: check COD_GUARANTEE_AUTHORIZED tag or notes
    const hasCardHoldTag = order.tags?.includes("COD_GUARANTEE_AUTHORIZED") || false;
    const authorizedAmount = parseCodGuaranteeAmount(order.notes);
    const hasCardHold = hasCardHoldTag || authorizedAmount !== null;
    const cardHoldAmount = authorizedAmount || 25; // Use actual amount or fallback to 25 lei policy

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
      hasCardHold: hasCardHold && isCOD,
      cardHoldAmount: hasCardHold && isCOD ? cardHoldAmount : undefined,
    };

    const html = await generateOrderConfirmationEmail(emailData);

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
 * Send shipped email with atomic tag-based deduplication
 */
export async function sendShippedEmailImproved(
  orderId: string, 
  awbNumber?: string | null, 
  carrier?: string | null
): Promise<{ success: boolean; error?: string; skipped?: boolean }> {
  try {
    const TAG = "shipped-email-sent";

    // Atomic claim: update only if tag doesn't exist
    const claimed = await prisma.order.updateMany({
      where: {
        id: orderId,
        NOT: { tags: { has: TAG } },
      },
      data: {
        tags: { push: TAG },
      },
    });

    if (claimed.count === 0) {
      console.log(`✅ Shipped email already sent for order ${orderId}, skipping`);
      return { success: true, skipped: true };
    }

    // Fetch order details
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: { select: { name: true, email: true } },
      },
    });

    if (!order || !order.user) {
      // Remove tag if order not found
      await prisma.order.update({
        where: { id: orderId },
        data: { tags: { set: order?.tags?.filter(t => t !== TAG) || [] } },
      });
      throw new Error("Order or user not found");
    }

    const trackingNumber = awbNumber || order.trackingNumber;
    const courierName = carrier || order.carrier || "Curier";

    // Skip if no tracking number and order not marked SHIPPED
    if (!trackingNumber && order.status !== "SHIPPED") {
      console.log(`⏭️ Order ${orderId} has no tracking number and not SHIPPED yet, skipping shipped email`);
      await prisma.order.update({
        where: { id: orderId },
        data: { tags: { set: order.tags?.filter(t => t !== TAG) || [] } },
      });
      return { success: true, skipped: true };
    }

    const isCOD = isCodPaymentMethod(order.paymentMethod);

    const emailData: ShippedEmailData = {
      customerName: order.user.name || "Client",
      customerEmail: order.user.email,
      orderNumber: order.orderNumber,
      trackingNumber: trackingNumber || "",
      carrier: courierName,
      shippedDate: order.shippedAt || new Date(),
      estimatedDeliveryDays: 2,
      isCOD,
      codAmount: isCOD ? order.total : undefined,
    };

    const html = await generateShippedEmail(emailData);

    const result = await sendEmailViaUnifiedSystem({
      to: order.user.email,
      subject: `📦 Comandă expediată #${order.orderNumber} - TechTots`,
      html,
    });

    if (!result.success) {
      // Remove tag if send failed
      await prisma.order.update({
        where: { id: orderId },
        data: { tags: { set: order.tags?.filter(t => t !== TAG) || [] } },
      });
      return { success: false, error: result.error };
    }

    return { success: true };
  } catch (error) {
    console.error("❌ Error sending shipped email:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Send admin new order notification
 * Send exactly once per order, after confirmation is sent
 */
export async function sendAdminNewOrderNotification(orderId: string): Promise<{ success: boolean; error?: string; skipped?: boolean }> {
  try {
    const TAG = "admin-new-order-sent";

    // Atomic claim
    const claimed = await prisma.order.updateMany({
      where: {
        id: orderId,
        NOT: { tags: { has: TAG } },
      },
      data: {
        tags: { push: TAG },
      },
    });

    if (claimed.count === 0) {
      console.log(`✅ Admin notification already sent for order ${orderId}, skipping`);
      return { success: true, skipped: true };
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: { select: { name: true, email: true } },
        items: { select: { name: true, quantity: true, price: true } },
        shippingAddress: true,
      },
    });

    if (!order) {
      throw new Error("Order not found");
    }

    const config = await getAppConfig();
    const adminEmail = config.alertEmail;

    const isCOD = isCodPaymentMethod(order.paymentMethod);

    const emailData: AdminNewOrderData = {
      orderNumber: order.orderNumber,
      orderId: orderId,
      customerName: order.user?.name || order.shippingAddress?.fullName || "Guest",
      customerEmail: order.user?.email || "N/A",
      paymentMethod: isCOD ? "Ramburs (plată la livrare)" : "Card bancar",
      items: order.items.map(item => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
      })),
      subtotal: order.subtotal,
      shippingCost: order.shippingCost,
      codFee: order.codFeeEstimate || undefined,
      total: order.total,
    };

    const html = await generateAdminNewOrderEmail(emailData);

    const result = await sendEmailViaUnifiedSystem({
      to: adminEmail,
      subject: `🔔 Comandă nouă #${order.orderNumber} - ${emailData.customerName}`,
      html,
    });

    if (!result.success) {
      // Remove tag if send failed
      await prisma.order.update({
        where: { id: orderId },
        data: { tags: { set: order.tags?.filter(t => t !== TAG) || [] } },
      });
    }

    return { success: result.success, error: result.error };
  } catch (error) {
    console.error("❌ Error sending admin notification:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
