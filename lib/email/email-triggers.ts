/**
 * Email Triggers
 *
 * Integration points for triggering emails based on business events
 * This file connects the e-commerce email service to the application logic
 */

import { EcommerceEmailService } from "./ecommerce-email-service";

const emailService = new EcommerceEmailService();

/**
 * Authentication Email Triggers
 */

export async function triggerPasswordChangeEmail(
  userId: string,
  changeData: {
    changeTime: string;
    deviceInfo: string;
    ipAddress: string;
  }
) {
  console.log("🔐 Triggering password change email for user:", userId);

  return await emailService.sendAuthenticationEmail("password-change", userId, {
    data: changeData,
  });
}

export async function triggerNewDeviceLoginEmail(
  userId: string,
  loginData: {
    loginTime: string;
    deviceInfo: string;
    location: string;
    ipAddress: string;
  }
) {
  console.log("📱 Triggering new device login email for user:", userId);

  return await emailService.sendAuthenticationEmail(
    "new-device-login",
    userId,
    {
      data: loginData,
    }
  );
}

/**
 * Order Email Triggers
 */

export async function triggerOrderProcessingEmail(
  orderId: string,
  orderData: {
    estimatedDelivery: string;
  }
) {
  console.log("⚙️ Triggering order processing email for order:", orderId);

  return await emailService.sendOrderEmail("processing", orderId, {
    data: orderData,
  });
}

export async function triggerOrderShippedEmail(
  orderId: string,
  shippingData: {
    trackingNumber: string;
    carrier: string;
    shippingDate: string;
    trackingUrl: string;
  }
) {
  console.log("🚚 Triggering order shipped email for order:", orderId);

  return await emailService.sendOrderEmail("shipped", orderId, {
    data: shippingData,
  });
}

export async function triggerOrderDeliveredEmail(
  orderId: string,
  deliveryData: {
    deliveryDate: string;
    reviewUrl: string;
  }
) {
  console.log("📦 Triggering order delivered email for order:", orderId);

  return await emailService.sendOrderEmail("delivered", orderId, {
    data: deliveryData,
  });
}

/**
 * Marketing Email Triggers
 */

export async function triggerBlogPostNotification(blogData: {
  blogTitle: string;
  blogExcerpt: string;
  blogUrl: string;
}) {
  console.log("📝 Triggering blog post notification:", blogData.blogTitle);

  return await emailService.sendMarketingEmail("blog-post", "all", {
    data: blogData,
  });
}

export async function triggerCouponDistribution(couponData: {
  couponCode: string;
  discountAmount: string;
  expiryDate: string;
}) {
  console.log("🎁 Triggering coupon distribution:", couponData.couponCode);

  return await emailService.sendMarketingEmail("coupon", "all", {
    data: couponData,
  });
}

export async function triggerFlashSaleAlert(saleData: {
  saleTitle: string;
  discountPercent: number;
  saleEndTime: string;
}) {
  console.log("⚡ Triggering flash sale alert:", saleData.saleTitle);

  return await emailService.sendMarketingEmail("flash-sale", "all", {
    data: saleData,
  });
}

/**
 * Admin Email Triggers
 */

export async function triggerNewOrderAdminEmail(
  orderId: string,
  orderData: {
    orderNumber: string;
    customerName: string;
    orderTotal: number;
    orderItems: Array<{
      name: string;
      quantity: number;
      price: number;
    }>;
  }
) {
  console.log("🛒 Triggering new order admin email for order:", orderId);

  return await emailService.sendAdminEmail("new-order", {
    order: {
      id: orderId,
      number: orderData.orderNumber,
      total: orderData.orderTotal,
      status: "pending",
      items: orderData.orderItems,
    },
    user: {
      id: "",
      name: orderData.customerName,
      email: "",
    },
    data: orderData,
  });
}

export async function triggerHighValueOrderAdminEmail(
  orderId: string,
  orderData: {
    orderNumber: string;
    customerName: string;
    orderTotal: number;
    orderItems: Array<{
      name: string;
      quantity: number;
      price: number;
    }>;
  }
) {
  console.log("💰 Triggering high value order admin email for order:", orderId);

  return await emailService.sendAdminEmail("high-value-order", {
    order: {
      id: orderId,
      number: orderData.orderNumber,
      total: orderData.orderTotal,
      status: "pending",
      items: orderData.orderItems,
    },
    user: {
      id: "",
      name: orderData.customerName,
      email: "",
    },
    data: orderData,
  });
}

export async function triggerReturnRequestAdminEmail(returnData: {
  returnId: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  reason: string;
  details?: string;
}) {
  console.log("🔄 Triggering return request admin email:", returnData.returnId);

  return await emailService.sendAdminEmail("return-request", {
    data: returnData,
  });
}

/**
 * Support Email Triggers
 */

export async function triggerSupportTicketCreatedEmail(
  ticketId: string,
  userId: string,
  ticketData: {
    subject: string;
    description: string;
  }
) {
  console.log(
    "🎫 Triggering support ticket created email for ticket:",
    ticketId
  );

  return await emailService.sendSupportEmail("ticket-created", ticketId, {
    user: {
      id: userId,
      name: "",
      email: "",
    },
    data: ticketData,
  });
}

export async function triggerSupportTicketResolvedEmail(
  ticketId: string,
  userId: string,
  ticketData: {
    subject: string;
    resolution: string;
  }
) {
  console.log(
    "✅ Triggering support ticket resolved email for ticket:",
    ticketId
  );

  return await emailService.sendSupportEmail("ticket-resolved", ticketId, {
    user: {
      id: userId,
      name: "",
      email: "",
    },
    data: ticketData,
  });
}

/**
 * Utility function to trigger emails based on order status changes
 */
export async function handleOrderStatusChange(
  orderId: string,
  newStatus: string,
  additionalData?: Record<string, any>
) {
  console.log(`📦 Order ${orderId} status changed to: ${newStatus}`);

  switch (newStatus) {
    case "processing":
      return await triggerOrderProcessingEmail(orderId, {
        estimatedDelivery:
          additionalData?.estimatedDelivery || "3-5 zile lucrătoare",
      });

    case "shipped":
      return await triggerOrderShippedEmail(orderId, {
        trackingNumber: additionalData?.trackingNumber || "N/A",
        carrier: additionalData?.carrier || "Curier",
        shippingDate:
          additionalData?.shippingDate ||
          new Date().toLocaleDateString("ro-RO"),
        trackingUrl:
          additionalData?.trackingUrl ||
          `${process.env.NEXTAUTH_URL}/tracking/${additionalData?.trackingNumber}`,
      });

    case "delivered":
      return await triggerOrderDeliveredEmail(orderId, {
        deliveryDate:
          additionalData?.deliveryDate ||
          new Date().toLocaleDateString("ro-RO"),
        reviewUrl:
          additionalData?.reviewUrl ||
          `${process.env.NEXTAUTH_URL}/reviews/new`,
      });

    case "cancelled":
      return await emailService.sendOrderEmail("cancelled", orderId, {
        data: additionalData || {},
      });

    case "failed":
      return await emailService.sendOrderEmail("failed", orderId, {
        data: additionalData || {},
      });

    default:
      console.log(`⚠️ Unknown order status: ${newStatus}`);
      return { success: false, error: `Unknown status: ${newStatus}` };
  }
}

/**
 * Utility function to check if order is high value and trigger admin email
 */
export async function checkAndTriggerHighValueOrderEmail(
  orderId: string,
  orderTotal: number,
  threshold: number = 500
) {
  if (orderTotal >= threshold) {
    console.log(
      `💰 High value order detected: ${orderTotal} RON (threshold: ${threshold} RON)`
    );

    // Get order details for admin email
    const { prisma } = await import("@/lib/prisma");
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: { select: { name: true, email: true } },
        items: {
          select: {
            name: true,
            quantity: true,
            price: true,
          },
        },
      },
    });

    if (order) {
      return await triggerHighValueOrderAdminEmail(orderId, {
        orderNumber: order.number || orderId,
        customerName:
          order.user?.name || order.user?.email || "Client necunoscut",
        orderTotal: order.total,
        orderItems: order.items,
      });
    }
  }

  return { success: true, messageId: "not-high-value" };
}
