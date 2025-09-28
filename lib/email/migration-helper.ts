/**
 * Email Migration Helper
 *
 * This helper provides functions to migrate from old email services to the new unified system.
 * It maintains backward compatibility while gradually transitioning to the new system.
 */

import { sendEmailWithBrevo } from "../brevo";
import { PersonalizationEngine } from "./personalization-engine";
import { DatabaseTemplateService } from "./database-template-service";

/**
 * Send email using the queue system when available, fallback to direct sending
 * This provides the benefits of queuing while maintaining compatibility
 */
export async function sendEmailViaUnifiedSystem(
  to: string | string[],
  subject: string,
  html: string,
  options?: {
    template?: string;
    variables?: Record<string, any>;
    priority?: 1 | 2 | 3;
    campaignId?: string;
    tracking?: boolean;
    userId?: string;
    personalization?: boolean;
    forceDirect?: boolean; // Force direct sending, skip queue
  }
): Promise<{ success: boolean; jobId?: string; error?: string }> {
  try {
    let finalSubject = subject;
    let finalHtml = html;

    // Apply personalization if enabled and userId provided
    if (options?.personalization && options?.userId) {
      try {
        const personalizationEngine = new PersonalizationEngine();
        const userProfile = await personalizationEngine.getUserProfile(
          options.userId
        );

        if (userProfile) {
          // Get personalized subject
          finalSubject = await personalizationEngine.getPersonalizedSubject(
            subject,
            userProfile,
            {
              userId: options.userId,
              email: Array.isArray(to) ? to[0] : to,
              campaignId: options.campaignId,
              template: options.template,
            }
          );

          // Get personalized content
          finalHtml = await personalizationEngine.generatePersonalizedContent(
            html,
            userProfile,
            {
              userId: options.userId,
              email: Array.isArray(to) ? to[0] : to,
              campaignId: options.campaignId,
              template: options.template,
            }
          );

          console.log("🎯 Applied personalization for user:", options.userId);
        }
      } catch (personalizationError) {
        console.warn(
          "⚠️ Personalization failed, using original content:",
          personalizationError
        );
      }
    }

    // Try to use the queue system first (unless forceDirect is true)
    if (
      process.env.REDIS_URL &&
      process.env.NODE_ENV === "production" &&
      !options?.forceDirect
    ) {
      try {
        const { addEmailJob } = await import("./queue-system");
        const job = await addEmailJob({
          to,
          subject: finalSubject,
          html: finalHtml,
          template: options?.template || "direct-email",
          variables: options?.variables || {},
          priority: options?.priority || 2,
          campaignId: options?.campaignId,
          tracking: options?.tracking ?? true,
        });

        return {
          success: true,
          jobId: job.id.toString(),
        };
      } catch (queueError) {
        console.warn(
          "⚠️ Queue system unavailable, falling back to direct sending:",
          queueError
        );
        // Fall through to direct sending
      }
    }

    // Fallback to direct sending (current working method)
    const result = await sendEmailWithBrevo({
      to,
      subject: finalSubject,
      html: finalHtml,
      text: options?.variables?.textContent || "",
    });

    return {
      success: result.success,
      jobId: result.messageId || `email-${Date.now()}`,
      error: result.success ? undefined : "Email sending failed",
    };
  } catch (error) {
    console.error("❌ Error sending email via migration helper:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Send return notification email (admin)
 */
export async function sendReturnNotificationEmail({
  to,
  orderNumber,
  productName,
  productSku,
  customerName,
  customerEmail,
  reason,
  details,
  returnId,
}: {
  to: string;
  orderNumber: string;
  productName: string;
  productSku?: string;
  customerName: string;
  customerEmail: string;
  reason: string;
  details?: string;
  returnId: string;
}): Promise<{ success: boolean; jobId?: string; error?: string }> {
  const subject = `New Return Request - Order #${orderNumber}`;

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px;">
        New Return Request
      </h2>
      
      <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #495057; margin-top: 0;">Order Details</h3>
        <p><strong>Order Number:</strong> ${orderNumber}</p>
        <p><strong>Product:</strong> ${productName}</p>
        ${productSku ? `<p><strong>SKU:</strong> ${productSku}</p>` : ""}
      </div>
      
      <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
        <h3 style="color: #856404; margin-top: 0;">Customer Information</h3>
        <p><strong>Name:</strong> ${customerName}</p>
        <p><strong>Email:</strong> ${customerEmail}</p>
        <p><strong>Reason:</strong> ${reason}</p>
        ${details ? `<p><strong>Details:</strong> ${details}</p>` : ""}
      </div>
      
      <div style="background: #d1ecf1; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #17a2b8;">
        <h3 style="color: #0c5460; margin-top: 0;">Action Required</h3>
        <p>Please review this return request and take appropriate action.</p>
        <p><strong>Return ID:</strong> ${returnId}</p>
      </div>
      
      <p style="color: #6c757d; font-size: 14px; margin-top: 30px;">
        This is an automated notification from the TechTots STEM Store system.
      </p>
    </div>
  `;

  return sendEmailViaUnifiedSystem(to, subject, html, {
    template: "return-notification",
    variables: {
      orderNumber,
      productName,
      productSku,
      customerName,
      customerEmail,
      reason,
      details,
      returnId,
    },
    priority: 1, // High priority for admin notifications
  });
}

/**
 * Send return confirmation email using new template
 */
export async function sendReturnConfirmationEmail({
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
  const result = await DatabaseTemplateService.sendReturnConfirmationEmail(to, {
    returnId,
    orderNumber,
    reason,
  });
  return {
    success: result.success,
    error: result.error,
    messageId: result.messageId,
  };
}

/**
 * Send order confirmation email using new template
 */
export async function sendOrderConfirmationEmail({
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
  const result = await DatabaseTemplateService.sendOrderConfirmationEmail(to, {
    customerName: shippingAddress.fullName,
    orderNumber,
    orderTotal,
    items,
    shippingAddress,
  });
  return {
    success: result.success,
    error: result.error,
    messageId: result.messageId,
  };
}

/**
 * Send password reset email using new template
 */
export async function sendPasswordResetEmail({
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
  const result = await DatabaseTemplateService.sendPasswordResetEmail(
    to,
    resetLink,
    userName
  );
  return {
    success: result.success,
    error: result.error,
    messageId: result.messageId,
  };
}

/**
 * Send bulk return notification email (admin)
 */
export async function sendBulkReturnNotificationEmail({
  to,
  customerName,
  customerEmail,
  orderNumber,
  returnItems,
  reason,
  details,
  returnIds,
}: {
  to: string;
  customerName: string;
  customerEmail: string;
  orderNumber: string;
  returnItems: Array<{
    name: string;
    quantity: number;
    sku?: string;
  }>;
  reason: string;
  details?: string;
  returnIds: string[];
}): Promise<{ success: boolean; jobId?: string; error?: string }> {
  const subject = `Bulk Return Request - Order #${orderNumber}`;

  const itemsHtml = returnItems
    .map(
      item => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #dee2e6;">${item.name}</td>
      <td style="padding: 10px; border-bottom: 1px solid #dee2e6; text-align: center;">${item.quantity}</td>
      <td style="padding: 10px; border-bottom: 1px solid #dee2e6;">${item.sku || "N/A"}</td>
    </tr>
  `
    )
    .join("");

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px;">
        Bulk Return Request
      </h2>
      
      <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #495057; margin-top: 0;">Order Details</h3>
        <p><strong>Order Number:</strong> ${orderNumber}</p>
        <p><strong>Customer:</strong> ${customerName} (${customerEmail})</p>
        <p><strong>Reason:</strong> ${reason}</p>
        ${details ? `<p><strong>Details:</strong> ${details}</p>` : ""}
      </div>
      
      <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
        <h3 style="color: #856404; margin-top: 0;">Return Items (${returnItems.length} items)</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background: #e9ecef;">
              <th style="padding: 10px; text-align: left; border-bottom: 2px solid #dee2e6;">Item</th>
              <th style="padding: 10px; text-align: center; border-bottom: 2px solid #dee2e6;">Qty</th>
              <th style="padding: 10px; text-align: left; border-bottom: 2px solid #dee2e6;">SKU</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
      </div>
      
      <div style="background: #d1ecf1; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #17a2b8;">
        <h3 style="color: #0c5460; margin-top: 0;">Action Required</h3>
        <p>Please review this bulk return request and take appropriate action.</p>
        <p><strong>Return IDs:</strong> ${returnIds.join(", ")}</p>
      </div>
      
      <p style="color: #6c757d; font-size: 14px; margin-top: 30px;">
        This is an automated notification from the TechTots STEM Store system.
      </p>
    </div>
  `;

  return sendEmailViaUnifiedSystem(to, subject, html, {
    template: "bulk-return-notification",
    variables: {
      customerName,
      customerEmail,
      orderNumber,
      returnItems,
      reason,
      details,
      returnIds,
    },
    priority: 1, // High priority for admin notifications
  });
}

/**
 * Send bulk return confirmation email (customer)
 */
export async function sendBulkReturnConfirmationEmail({
  to,
  customerName,
  orderNumber,
  returnItems,
  reason,
  details,
  returnIds,
}: {
  to: string;
  customerName: string;
  orderNumber: string;
  returnItems: Array<{
    name: string;
    quantity: number;
    sku?: string;
  }>;
  reason: string;
  details?: string;
  returnIds: string[];
}): Promise<{ success: boolean; jobId?: string; error?: string }> {
  const subject = `Bulk Return Request Received - Order #${orderNumber}`;

  const itemsHtml = returnItems
    .map(
      item => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #dee2e6;">${item.name}</td>
      <td style="padding: 10px; border-bottom: 1px solid #dee2e6; text-align: center;">${item.quantity}</td>
      <td style="padding: 10px; border-bottom: 1px solid #dee2e6;">${item.sku || "N/A"}</td>
    </tr>
  `
    )
    .join("");

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #333; text-align: center; margin-bottom: 30px;">
        Bulk Return Request Received
      </h1>
      
      <div style="background: #d4edda; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
        <h3 style="color: #155724; margin-top: 0;">✅ Request Confirmed</h3>
        <p>Hello ${customerName},</p>
        <p>We have received your bulk return request for ${returnItems.length} items from order <strong>#${orderNumber}</strong>.</p>
      </div>
      
      <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #495057; margin-top: 0;">Return Details</h3>
        <p><strong>Order Number:</strong> ${orderNumber}</p>
        <p><strong>Reason:</strong> ${reason}</p>
        ${details ? `<p><strong>Details:</strong> ${details}</p>` : ""}
        <p><strong>Return IDs:</strong> ${returnIds.join(", ")}</p>
      </div>
      
      <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
        <h3 style="color: #856404; margin-top: 0;">Items Being Returned (${returnItems.length} items)</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background: #e9ecef;">
              <th style="padding: 10px; text-align: left; border-bottom: 2px solid #dee2e6;">Item</th>
              <th style="padding: 10px; text-align: center; border-bottom: 2px solid #dee2e6;">Qty</th>
              <th style="padding: 10px; text-align: left; border-bottom: 2px solid #dee2e6;">SKU</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
      </div>
      
      <div style="background: #e2e3e5; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #383d41; margin-top: 0;">What's Next?</h3>
        <ul style="color: #495057;">
          <li>Our team will review your request within 1-2 business days</li>
          <li>You'll receive further instructions via email</li>
          <li>You can track your return status in your account</li>
        </ul>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.NEXTAUTH_URL}/account/returns" 
           style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
          Track Your Returns
        </a>
      </div>
      
      <p style="color: #6c757d; font-size: 14px; margin-top: 30px; text-align: center;">
        Thank you for shopping with TechTots STEM Store!<br>
        If you have any questions, please contact our support team.
      </p>
    </div>
  `;

  return sendEmailViaUnifiedSystem(to, subject, html, {
    template: "bulk-return-confirmation",
    variables: {
      customerName,
      orderNumber,
      returnItems,
      reason,
      details,
      returnIds,
    },
    priority: 2, // Normal priority for customer emails
  });
}

/**
 * Send welcome email using new template
 */
export async function sendWelcomeEmail({
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
  const result = await DatabaseTemplateService.sendWelcomeEmail(
    to,
    userName || "User",
    verificationLink
  );
  return {
    success: result.success,
    error: result.error,
    messageId: result.messageId,
  };
}
