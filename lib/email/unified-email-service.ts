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

  // Handle special cases for arrays - use template engine approach
  if (data.items && Array.isArray(data.items)) {
    // Process each loop with proper template engine logic
    const eachRegex = /\{\{#each\s+([\w.]+)\}\}([\s\S]*?)\{\{\/each\}\}/g;
    result = result.replace(eachRegex, (match, path: string, block: string) => {
      if (path === "items" && Array.isArray(data.items)) {
        return data.items
          .map((item: any) => {
            // Replace {{this.property}} with item.property
            let itemBlock = block;
            Object.entries(item).forEach(([key, value]) => {
              const regex = new RegExp(`\\{\\{this\\.${key}\\}\\}`, "g");
              itemBlock = itemBlock.replace(regex, String(value || ""));
            });
            return itemBlock;
          })
          .join("");
      }
      return match; // Return original if not items array
    });
  }

  if (data.downloadLinks && Array.isArray(data.downloadLinks)) {
    // Process downloadLinks with template engine approach
    const eachRegex = /\{\{#each\s+([\w.]+)\}\}([\s\S]*?)\{\{\/each\}\}/g;
    result = result.replace(eachRegex, (match, path: string, block: string) => {
      if (path === "downloadLinks" && Array.isArray(data.downloadLinks)) {
        return data.downloadLinks
          .map((link: any) => {
            // Replace {{this.property}} with link.property
            let linkBlock = block;
            Object.entries(link).forEach(([key, value]) => {
              const regex = new RegExp(`\\{\\{this\\.${key}\\}\\}`, "g");
              linkBlock = linkBlock.replace(regex, String(value || ""));
            });
            return linkBlock;
          })
          .join("");
      }
      return match; // Return original if not downloadLinks array
    });
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
