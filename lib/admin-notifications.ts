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

interface TicketNotification {
  ticketId: string;
  ticketNumber: string;
  subject: string;
  description: string;
  priority: string;
  category: string;
  supplierName: string;
  supplierEmail: string;
  hasAttachments: boolean;
  attachmentCount: number;
  attachments?: Array<{
    url: string;
    name: string;
    size: number;
  }>;
}

interface TicketResponseNotification {
  ticketId: string;
  ticketNumber: string;
  subject: string;
  responderName: string;
  responderEmail: string;
  responderType: "SUPPLIER" | "ADMIN";
  content: string;
  isInternal: boolean;
  hasAttachments: boolean;
  attachmentCount: number;
  attachments?: Array<{
    url: string;
    name: string;
    size: number;
  }>;
}

interface TicketStatusNotification {
  ticketId: string;
  ticketNumber: string;
  subject: string;
  oldStatus: string;
  newStatus: string;
  updatedBy: string;
  updatedByEmail: string;
  note?: string;
}

interface TicketAssignmentNotification {
  ticketId: string;
  ticketNumber: string;
  subject: string;
  assignedToName: string;
  assignedToEmail: string;
  assignedByName: string;
  assignedByEmail: string;
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

/**
 * Send notification to admin team about new support ticket
 */
export async function sendNewTicketNotification(
  notification: TicketNotification
): Promise<boolean> {
  try {
    const priorityColor = getPriorityColor(notification.priority);
    const categoryLabel = getCategoryLabel(notification.category);

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>New Support Ticket - ${notification.subject}</title>
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
          .ticket-number { background: #e3f2fd; padding: 8px 12px; border-radius: 4px; font-family: monospace; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>🎫 New Support Ticket</h2>
            <p><strong>Ticket:</strong> <span class="ticket-number">${notification.ticketNumber}</span></p>
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
            <h3>Ticket Description:</h3>
            <div style="white-space: pre-wrap;">${notification.description}</div>
          </div>
          
          <div class="footer">
            <p>This ticket was created from the TechTots Supplier Portal.</p>
            <p>Ticket ID: ${notification.ticketId}</p>
            <p>
              <a href="${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/admin/tickets" class="button">
                View Tickets in Admin Dashboard
              </a>
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
New Support Ticket

Ticket: ${notification.ticketNumber}
From: ${notification.supplierName} (${notification.supplierEmail})
Subject: ${notification.subject}
Priority: ${notification.priority.toUpperCase()}
Category: ${categoryLabel}
${notification.hasAttachments ? `Attachments: ${notification.attachmentCount} file(s)` : ""}

Description:
${notification.description}

Ticket ID: ${notification.ticketId}
View Tickets in Admin Dashboard: ${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/admin/tickets
    `;

    // Send to admin email
    await sendMail({
      to: ADMIN_EMAIL,
      subject: `[${notification.priority.toUpperCase()}] New Support Ticket: ${notification.subject}`,
      html,
      text,
    });

    // Also send to support email if different from admin
    if (SUPPORT_EMAIL !== ADMIN_EMAIL) {
      await sendMail({
        to: SUPPORT_EMAIL,
        subject: `[${notification.priority.toUpperCase()}] New Support Ticket: ${notification.subject}`,
        html,
        text,
      });
    }

    logger.info("Admin notification sent for new support ticket", {
      ticketId: notification.ticketId,
      ticketNumber: notification.ticketNumber,
      supplierName: notification.supplierName,
      priority: notification.priority,
    });

    return true;
  } catch (error) {
    logger.error("Failed to send admin notification for new support ticket", {
      error: error instanceof Error ? error.message : "Unknown error",
      ticketId: notification.ticketId,
    });
    return false;
  }
}

/**
 * Send notification to supplier about ticket response
 */
export async function sendTicketResponseNotification(
  notification: TicketResponseNotification
): Promise<boolean> {
  try {
    const responderLabel = notification.responderType === "ADMIN" ? "TechTots Support Team" : "You";
    const isInternalNote = notification.isInternal ? " (Internal Note)" : "";

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Ticket Response - ${notification.subject}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
          .ticket-number { background: #e3f2fd; padding: 8px 12px; border-radius: 4px; font-family: monospace; font-weight: bold; }
          .content { background: #fff; padding: 20px; border: 1px solid #dee2e6; border-radius: 8px; margin: 20px 0; }
          .attachments { background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; font-size: 14px; color: #6c757d; }
          .button { display: inline-block; padding: 10px 20px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>💬 New Response to Your Ticket</h2>
            <p><strong>Ticket:</strong> <span class="ticket-number">${notification.ticketNumber}</span></p>
            <p><strong>Subject:</strong> ${notification.subject}</p>
            <p><strong>From:</strong> ${notification.responderName}${isInternalNote}</p>
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
            <h3>Response:</h3>
            <div style="white-space: pre-wrap;">${notification.content}</div>
          </div>
          
          <div class="footer">
            <p>This response was sent regarding your support ticket.</p>
            <p>Ticket ID: ${notification.ticketId}</p>
            <p>
              <a href="${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/supplier/support" class="button">
                View Ticket in Supplier Portal
              </a>
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
New Response to Your Ticket

Ticket: ${notification.ticketNumber}
Subject: ${notification.subject}
From: ${notification.responderName}${isInternalNote}
${notification.hasAttachments ? `Attachments: ${notification.attachmentCount} file(s)` : ""}

Response:
${notification.content}

Ticket ID: ${notification.ticketId}
View Ticket in Supplier Portal: ${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/supplier/support
    `;

    // Send to supplier email
    await sendMail({
      to: notification.responderEmail,
      subject: `Re: [${notification.ticketNumber}] ${notification.subject}`,
      html,
      text,
    });

    logger.info("Supplier notification sent for ticket response", {
      ticketId: notification.ticketId,
      ticketNumber: notification.ticketNumber,
      responderType: notification.responderType,
      isInternal: notification.isInternal,
    });

    return true;
  } catch (error) {
    logger.error("Failed to send supplier notification for ticket response", {
      error: error instanceof Error ? error.message : "Unknown error",
      ticketId: notification.ticketId,
    });
    return false;
  }
}

/**
 * Send notification about ticket status change
 */
export async function sendTicketStatusNotification(
  notification: TicketStatusNotification
): Promise<boolean> {
  try {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Ticket Status Updated - ${notification.subject}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
          .ticket-number { background: #e3f2fd; padding: 8px 12px; border-radius: 4px; font-family: monospace; font-weight: bold; }
          .status-change { background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; font-size: 14px; color: #6c757d; }
          .button { display: inline-block; padding: 10px 20px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>🔄 Ticket Status Updated</h2>
            <p><strong>Ticket:</strong> <span class="ticket-number">${notification.ticketNumber}</span></p>
            <p><strong>Subject:</strong> ${notification.subject}</p>
            <p><strong>Updated by:</strong> ${notification.updatedBy}</p>
          </div>
          
          <div class="status-change">
            <h3>Status Change:</h3>
            <p><strong>From:</strong> ${notification.oldStatus}</p>
            <p><strong>To:</strong> ${notification.newStatus}</p>
            ${notification.note ? `<p><strong>Note:</strong> ${notification.note}</p>` : ""}
          </div>
          
          <div class="footer">
            <p>This status update was made by the TechTots Support Team.</p>
            <p>Ticket ID: ${notification.ticketId}</p>
            <p>
              <a href="${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/admin/tickets" class="button">
                View Ticket in Admin Dashboard
              </a>
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
Ticket Status Updated

Ticket: ${notification.ticketNumber}
Subject: ${notification.subject}
Updated by: ${notification.updatedBy}

Status Change:
From: ${notification.oldStatus}
To: ${notification.newStatus}
${notification.note ? `Note: ${notification.note}` : ""}

Ticket ID: ${notification.ticketId}
View Ticket in Admin Dashboard: ${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/admin/tickets
    `;

    // Send to admin email
    await sendMail({
      to: ADMIN_EMAIL,
      subject: `[STATUS UPDATE] ${notification.ticketNumber}: ${notification.subject}`,
      html,
      text,
    });

    logger.info("Status notification sent for ticket", {
      ticketId: notification.ticketId,
      ticketNumber: notification.ticketNumber,
      oldStatus: notification.oldStatus,
      newStatus: notification.newStatus,
    });

    return true;
  } catch (error) {
    logger.error("Failed to send status notification for ticket", {
      error: error instanceof Error ? error.message : "Unknown error",
      ticketId: notification.ticketId,
    });
    return false;
  }
}

/**
 * Send notification about ticket assignment
 */
export async function sendTicketAssignmentNotification(
  notification: TicketAssignmentNotification
): Promise<boolean> {
  try {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Ticket Assigned - ${notification.subject}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
          .ticket-number { background: #e3f2fd; padding: 8px 12px; border-radius: 4px; font-family: monospace; font-weight: bold; }
          .assignment { background: #e8f5e8; padding: 15px; border-radius: 8px; margin: 20px 0; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; font-size: 14px; color: #6c757d; }
          .button { display: inline-block; padding: 10px 20px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>👤 Ticket Assigned</h2>
            <p><strong>Ticket:</strong> <span class="ticket-number">${notification.ticketNumber}</span></p>
            <p><strong>Subject:</strong> ${notification.subject}</p>
            <p><strong>Assigned by:</strong> ${notification.assignedByName}</p>
          </div>
          
          <div class="assignment">
            <h3>Assignment Details:</h3>
            <p><strong>Assigned to:</strong> ${notification.assignedToName}</p>
            <p><strong>Email:</strong> ${notification.assignedToEmail}</p>
          </div>
          
          <div class="footer">
            <p>This ticket has been assigned to you for handling.</p>
            <p>Ticket ID: ${notification.ticketId}</p>
            <p>
              <a href="${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/admin/tickets" class="button">
                View Ticket in Admin Dashboard
              </a>
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
Ticket Assigned

Ticket: ${notification.ticketNumber}
Subject: ${notification.subject}
Assigned by: ${notification.assignedByName}

Assignment Details:
Assigned to: ${notification.assignedToName}
Email: ${notification.assignedToEmail}

Ticket ID: ${notification.ticketId}
View Ticket in Admin Dashboard: ${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/admin/tickets
    `;

    // Send to assigned admin
    await sendMail({
      to: notification.assignedToEmail,
      subject: `[ASSIGNED] ${notification.ticketNumber}: ${notification.subject}`,
      html,
      text,
    });

    logger.info("Assignment notification sent for ticket", {
      ticketId: notification.ticketId,
      ticketNumber: notification.ticketNumber,
      assignedTo: notification.assignedToName,
      assignedBy: notification.assignedByName,
    });

    return true;
  } catch (error) {
    logger.error("Failed to send assignment notification for ticket", {
      error: error instanceof Error ? error.message : "Unknown error",
      ticketId: notification.ticketId,
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
