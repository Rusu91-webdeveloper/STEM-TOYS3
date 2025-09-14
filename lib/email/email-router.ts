/**
 * Email Router
 *
 * This service routes all email sending to use the new template library
 * instead of old hardcoded templates or database templates
 */

import { sendEmailWithTemplate } from "./unified-email-service";

export interface EmailRouterOptions {
  to: string | string[];
  templateSlug: string;
  data: Record<string, any>;
  priority?: 1 | 2 | 3;
  campaignId?: string;
  tracking?: boolean;
  userId?: string;
}

/**
 * Route email sending to use the new template library
 */
export async function routeEmail(options: EmailRouterOptions): Promise<{
  success: boolean;
  jobId?: string;
  error?: string;
  messageId?: string;
}> {
  try {
    const emails = Array.isArray(options.to) ? options.to : [options.to];
    const results = [];

    for (const email of emails) {
      const result = await sendEmailWithTemplate({
        to: email,
        templateSlug: options.templateSlug,
        data: options.data,
      });

      results.push({
        email,
        success: result,
      });
    }

    const allSuccessful = results.every(r => r.success);

    return {
      success: allSuccessful,
      jobId: `email-${Date.now()}`,
      messageId: allSuccessful ? `msg-${Date.now()}` : undefined,
      error: allSuccessful ? undefined : "Some emails failed to send",
    };
  } catch (error) {
    console.error("❌ Error routing email:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Send welcome email using new template
 */
export async function sendWelcomeEmailRouter({
  to,
  userName,
  verificationLink,
}: {
  to: string;
  userName?: string;
  verificationLink?: string;
}): Promise<{
  success: boolean;
  jobId?: string;
  error?: string;
  messageId?: string;
}> {
  return routeEmail({
    to,
    templateSlug: "welcome",
    data: {
      userName: userName || "User",
      siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
      verificationLink: verificationLink || "",
    },
    priority: 2,
  });
}

/**
 * Send order confirmation email using new template
 */
export async function sendOrderConfirmationEmailRouter({
  to,
  orderNumber,
  orderTotal,
  items,
  shippingAddress,
}: {
  to: string;
  orderNumber: string;
  orderTotal: number;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  shippingAddress: {
    fullName: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
}): Promise<{
  success: boolean;
  jobId?: string;
  error?: string;
  messageId?: string;
}> {
  return routeEmail({
    to,
    templateSlug: "order-confirmation",
    data: {
      customerName: shippingAddress.fullName,
      orderNumber,
      orderDate: new Date().toLocaleDateString("ro-RO"),
      orderTotal: orderTotal.toString(),
      items: items.map(item => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price.toFixed(2) + " RON",
      })),
      siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
    },
    priority: 1,
  });
}

/**
 * Send password reset email using new template
 */
export async function sendPasswordResetEmailRouter({
  to,
  resetLink,
  userName,
}: {
  to: string;
  resetLink: string;
  userName?: string;
}): Promise<{
  success: boolean;
  jobId?: string;
  error?: string;
  messageId?: string;
}> {
  return routeEmail({
    to,
    templateSlug: "password-reset",
    data: {
      resetLink,
      userName: userName || "User",
    },
    priority: 1,
  });
}

/**
 * Send return confirmation email using new template
 */
export async function sendReturnConfirmationEmailRouter({
  to,
  orderNumber,
  productName,
  returnId,
  reason,
}: {
  to: string;
  orderNumber: string;
  productName: string;
  returnId: string;
  reason?: string;
}): Promise<{
  success: boolean;
  jobId?: string;
  error?: string;
  messageId?: string;
}> {
  return routeEmail({
    to,
    templateSlug: "return-request-confirmation",
    data: {
      customerName: "Client",
      returnId,
      orderNumber,
      reason: reason || "Return requested",
      requestDate: new Date().toLocaleDateString("ro-RO"),
      siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
    },
    priority: 2,
  });
}

/**
 * Send admin new order notification using new template
 */
export async function sendAdminNewOrderEmailRouter({
  to,
  orderNumber,
  customerName,
  customerEmail,
  orderTotal,
  orderItems,
}: {
  to: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  orderTotal: number;
  orderItems: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
}): Promise<{
  success: boolean;
  jobId?: string;
  error?: string;
  messageId?: string;
}> {
  return routeEmail({
    to,
    templateSlug: "admin-new-order",
    data: {
      orderNumber,
      customerName,
      customerEmail,
      orderTotal: orderTotal.toString(),
      orderItems: orderItems.map(item => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price.toFixed(2) + " RON",
      })),
      adminUrl:
        process.env.NEXT_PUBLIC_SITE_URL + "/admin" ||
        "http://localhost:3000/admin",
    },
    priority: 1,
  });
}

/**
 * Send supplier registration confirmation using new template
 */
export async function sendSupplierRegistrationEmailRouter({
  to,
  companyName,
  contactPersonName,
  contactPersonEmail,
}: {
  to: string;
  companyName: string;
  contactPersonName: string;
  contactPersonEmail: string;
}): Promise<{
  success: boolean;
  jobId?: string;
  error?: string;
  messageId?: string;
}> {
  return routeEmail({
    to,
    templateSlug: "supplier-registration-confirmation",
    data: {
      companyName,
      contactPersonName,
      contactPersonEmail,
      registrationDate: new Date().toLocaleDateString("ro-RO"),
      siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
    },
    priority: 2,
  });
}

/**
 * Send supplier approval email using new template
 */
export async function sendSupplierApprovalEmailRouter({
  to,
  companyName,
  contactPersonName,
  commissionRate,
  paymentTerms,
  minimumOrderValue,
}: {
  to: string;
  companyName: string;
  contactPersonName: string;
  commissionRate: string;
  paymentTerms: string;
  minimumOrderValue: string;
}): Promise<{
  success: boolean;
  jobId?: string;
  error?: string;
  messageId?: string;
}> {
  return routeEmail({
    to,
    templateSlug: "supplier-approval",
    data: {
      companyName,
      contactPersonName,
      commissionRate,
      paymentTerms,
      minimumOrderValue,
      siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
    },
    priority: 2,
  });
}

/**
 * Send supplier rejection email using new template
 */
export async function sendSupplierRejectionEmailRouter({
  to,
  companyName,
  contactPersonName,
  rejectionReason,
}: {
  to: string;
  companyName: string;
  contactPersonName: string;
  rejectionReason: string;
}): Promise<{
  success: boolean;
  jobId?: string;
  error?: string;
  messageId?: string;
}> {
  return routeEmail({
    to,
    templateSlug: "supplier-rejection",
    data: {
      companyName,
      contactPersonName,
      rejectionReason,
      siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
    },
    priority: 2,
  });
}
