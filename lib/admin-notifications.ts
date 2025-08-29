import { sendMail } from "./nodemailer";
import { logger } from "./logger";

// Admin email configuration
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@techtots.com";
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || "support@techtots.com";

interface SupplierMessageNotification {
  supplierName: string;
  supplierEmail: string;
  subject: string;
  content: string;
  priority: string;
  category: string;
  messageId: string;
  hasAttachments: boolean;
  attachmentCount: number;
  attachments?: Array<{
    url: string;
    name: string;
    size: number;
  }>;
}

/**
 * Send notification to admin team about new supplier message
 */
export async function sendSupplierMessageNotification(
  notification: SupplierMessageNotification
): Promise<boolean> {
  try {
    const priorityColor = getPriorityColor(notification.priority);
    const categoryLabel = getCategoryLabel(notification.category);

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>New Supplier Message - ${notification.subject}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
          .priority { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; }
          .category { display: inline-block; padding: 4px 8px; background: #e9ecef; border-radius: 4px; font-size: 12px; }
          .content { background: #fff; padding: 20px; border: 1px solid #dee2e6; border-radius: 8px; margin: 20px 0; }
          .attachments { background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; font-size: 14px; color: #6c757d; }
          .button { display: inline-block; padding: 10px 20px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>📧 New Supplier Message</h2>
            <p><strong>From:</strong> ${notification.supplierName} (${notification.supplierEmail})</p>
            <p><strong>Subject:</strong> ${notification.subject}</p>
            <p>
              <span class="priority" style="background: ${priorityColor}; color: white;">
                ${notification.priority.toUpperCase()}
              </span>
              <span class="category">${categoryLabel}</span>
            </p>
            ${
              notification.hasAttachments
                ? `
              <div class="attachments">
                <strong>📎 Attachments (${notification.attachmentCount} file(s)):</strong>
                ${
                  notification.attachments
                    ? notification.attachments
                        .map(
                          attachment => `
                  <div style="margin: 10px 0; padding: 10px; background: #f8f9fa; border-radius: 4px;">
                    <a href="${attachment.url}" target="_blank" style="color: #007bff; text-decoration: none;">
                      📄 ${attachment.name}
                    </a>
                    <span style="color: #6c757d; font-size: 12px; margin-left: 10px;">
                      (${(attachment.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  </div>
                `
                        )
                        .join("")
                    : `
                  <div style="margin: 10px 0; padding: 10px; background: #f8f9fa; border-radius: 4px;">
                    <span style="color: #6c757d;">${notification.attachmentCount} file(s) attached</span>
                  </div>
                `
                }
              </div>
            `
                : ""
            }
          </div>
          
          <div class="content">
            <h3>Message Content:</h3>
            <div style="white-space: pre-wrap;">${notification.content}</div>
          </div>
          
          <div class="footer">
            <p>This message was sent from the TechTots Supplier Portal.</p>
            <p>Message ID: ${notification.messageId}</p>
            <p>
              <a href="${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/admin/messages" class="button">
                View Messages in Admin Dashboard
              </a>
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
New Supplier Message

From: ${notification.supplierName} (${notification.supplierEmail})
Subject: ${notification.subject}
Priority: ${notification.priority.toUpperCase()}
Category: ${categoryLabel}
${notification.hasAttachments ? `Attachments: ${notification.attachmentCount} file(s)` : ""}

Message Content:
${notification.content}

Message ID: ${notification.messageId}
View Messages in Admin Dashboard: ${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/admin/messages
    `;

    // Send to admin email
    await sendMail({
      to: ADMIN_EMAIL,
      subject: `[${notification.priority.toUpperCase()}] New Supplier Message: ${notification.subject}`,
      html,
      text,
    });

    // Also send to support email if different from admin
    if (SUPPORT_EMAIL !== ADMIN_EMAIL) {
      await sendMail({
        to: SUPPORT_EMAIL,
        subject: `[${notification.priority.toUpperCase()}] New Supplier Message: ${notification.subject}`,
        html,
        text,
      });
    }

    logger.info("Admin notification sent for supplier message", {
      messageId: notification.messageId,
      supplierName: notification.supplierName,
      priority: notification.priority,
    });

    return true;
  } catch (error) {
    logger.error("Failed to send admin notification for supplier message", {
      error: error instanceof Error ? error.message : "Unknown error",
      messageId: notification.messageId,
    });
    return false;
  }
}

function getPriorityColor(priority: string): string {
  switch (priority.toLowerCase()) {
    case "urgent":
      return "#dc3545";
    case "high":
      return "#fd7e14";
    case "normal":
      return "#007bff";
    case "low":
      return "#6c757d";
    default:
      return "#007bff";
  }
}

function getCategoryLabel(category: string): string {
  switch (category.toLowerCase()) {
    case "general":
      return "General";
    case "account":
      return "Account";
    case "order":
      return "Order";
    case "support":
      return "Support";
    case "marketing":
      return "Marketing";
    case "announcement":
      return "Announcement";
    default:
      return category;
  }
}
