/**
 * Unified Email Service
 *
 * This service uses the new template library for all email sending
 */

import { EMAIL_TEMPLATES, getTemplateBySlug } from "./template-library";
import { sendEmailViaUnifiedSystem } from "../nodemailer";

export interface EmailData {
  [key: string]: any;
}

export interface SendEmailOptions {
  to: string;
  templateSlug: string;
  data: EmailData;
  subject?: string; // Optional override
}

/**
 * Send email using the new template library
 */
export async function sendEmailWithTemplate(
  options: SendEmailOptions
): Promise<boolean> {
  try {
    // Get the template from our library
    const template = getTemplateBySlug(options.templateSlug);

    if (!template) {
      console.error(`❌ Template not found: ${options.templateSlug}`);
      return false;
    }

    if (!template.isActive) {
      console.error(`❌ Template is inactive: ${options.templateSlug}`);
      return false;
    }

    // Replace variables in subject and content
    const processedSubject = replaceVariables(template.subject, options.data);
    const processedContent = replaceVariables(template.content, options.data);

    // Use the subject override if provided
    const finalSubject = options.subject || processedSubject;

    console.log(`📧 Sending email with template: ${template.name}`);
    console.log(`   To: ${options.to}`);
    console.log(`   Subject: ${finalSubject}`);
    console.log(`   Template: ${template.slug}`);

    // Send via the unified email system
    const result = await sendEmailViaUnifiedSystem({
      to: options.to,
      subject: finalSubject,
      html: processedContent,
    });

    if (result.success) {
      console.log(`✅ Email sent successfully: ${template.name}`);
      return true;
    } else {
      console.error(`❌ Failed to send email: ${result.error}`);
      return false;
    }
  } catch (error) {
    console.error(
      `❌ Error sending email with template ${options.templateSlug}:`,
      error
    );
    return false;
  }
}

/**
 * Replace variables in template content
 */
function replaceVariables(content: string, data: EmailData): string {
  let result = content;

  // Replace simple variables
  Object.entries(data).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, "g");
    result = result.replace(regex, String(value));
  });

  // Handle special cases for arrays
  if (data.items && Array.isArray(data.items)) {
    const itemsHtml = data.items
      .map(
        item => `
      <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; margin-bottom: 10px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <h4 style="margin: 0 0 5px 0; color: #1f2937; font-size: 16px;">${item.name || "Product"}</h4>
            <p style="margin: 0; color: #6b7280; font-size: 14px;">Cantitate: ${item.quantity || 1}</p>
          </div>
          <div style="text-align: right;">
            <p style="margin: 0; font-weight: 600; color: #1f2937; font-size: 16px;">${item.price || "0"} RON</p>
          </div>
        </div>
      </div>
    `
      )
      .join("");

    result = result.replace(
      /\{\{#each items\}\}[\s\S]*?\{\{\/each\}\}/g,
      itemsHtml
    );
  }

  if (data.downloadLinks && Array.isArray(data.downloadLinks)) {
    const linksHtml = data.downloadLinks
      .map(
        link => `
      <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; margin-bottom: 10px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <h4 style="margin: 0 0 5px 0; color: #1f2937; font-size: 16px;">${link.format || "Download"}</h4>
            <p style="margin: 0; color: #6b7280; font-size: 14px;">${link.language || "Română"}</p>
          </div>
          <div>
            <a href="${link.url || "#"}" style="background: #3b82f6; color: white; padding: 8px 16px; border-radius: 6px; text-decoration: none; font-weight: 500;">Descarcă</a>
          </div>
        </div>
      </div>
    `
      )
      .join("");

    result = result.replace(
      /\{\{#each downloadLinks\}\}[\s\S]*?\{\{\/each\}\}/g,
      linksHtml
    );
  }

  return result;
}

/**
 * Send welcome email using new template
 */
export async function sendWelcomeEmailNew(
  email: string,
  name: string
): Promise<boolean> {
  return sendEmailWithTemplate({
    to: email,
    templateSlug: "welcome",
    data: {
      userName: name,
      siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
    },
  });
}

/**
 * Send verification email using new template
 */
export async function sendVerificationEmailNew(
  email: string,
  name: string,
  verificationLink: string
): Promise<boolean> {
  return sendEmailWithTemplate({
    to: email,
    templateSlug: "email-verification",
    data: {
      userName: name,
      verificationLink: verificationLink,
    },
  });
}

/**
 * Send password reset email using new template
 */
export async function sendPasswordResetEmailNew(
  email: string,
  resetLink: string
): Promise<boolean> {
  return sendEmailWithTemplate({
    to: email,
    templateSlug: "password-reset",
    data: {
      resetLink: resetLink,
    },
  });
}

/**
 * Send order confirmation email using new template
 */
export async function sendOrderConfirmationEmailNew(
  email: string,
  orderData: any
): Promise<boolean> {
  return sendEmailWithTemplate({
    to: email,
    templateSlug: "order-confirmation",
    data: {
      customerName: orderData.customerName || "Client",
      orderNumber: orderData.orderNumber || orderData.id,
      orderDate: orderData.orderDate || new Date().toLocaleDateString("ro-RO"),
      orderTotal: orderData.total || orderData.orderTotal,
      items: orderData.items || [],
      siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
    },
  });
}
