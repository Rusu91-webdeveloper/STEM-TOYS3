import { prisma } from "@/lib/prisma";

export interface DatabaseEmailTemplate {
  id: string;
  name: string;
  slug: string;
  subject: string;
  content: string;
  variables: string[];
  category: string;
  isActive: boolean;
  metadata?: any;
}

export interface SendEmailWithDatabaseTemplateOptions {
  to: string;
  templateSlug: string;
  data: Record<string, any>;
  subject?: string;
  priority?: number;
}

/**
 * Database Template Service
 *
 * This service handles all email sending using templates stored in the database
 * instead of hardcoded file templates.
 */
export class DatabaseTemplateService {
  /**
   * Get template by slug from database
   */
  static async getTemplateBySlug(
    slug: string
  ): Promise<DatabaseEmailTemplate | null> {
    try {
      const template = await prisma.emailTemplate.findUnique({
        where: {
          slug,
          isActive: true,
        },
      });

      if (!template) {
        console.warn(`⚠️ Template not found: ${slug}`);
        return null;
      }

      return template as DatabaseEmailTemplate;
    } catch (error) {
      console.error(`❌ Error fetching template ${slug}:`, error);
      return null;
    }
  }

  /**
   * Get all active templates by category
   */
  static async getTemplatesByCategory(
    category: string
  ): Promise<DatabaseEmailTemplate[]> {
    try {
      const templates = await prisma.emailTemplate.findMany({
        where: {
          category,
          isActive: true,
        },
        orderBy: { name: "asc" },
      });

      return templates as DatabaseEmailTemplate[];
    } catch (error) {
      console.error(
        `❌ Error fetching templates for category ${category}:`,
        error
      );
      return [];
    }
  }

  /**
   * Get all active templates
   */
  static async getAllActiveTemplates(): Promise<DatabaseEmailTemplate[]> {
    try {
      const templates = await prisma.emailTemplate.findMany({
        where: { isActive: true },
        orderBy: { category: "asc" },
      });

      return templates as DatabaseEmailTemplate[];
    } catch (error) {
      console.error("❌ Error fetching all templates:", error);
      return [];
    }
  }

  /**
   * Replace variables in template content with enhanced support for:
   * - Simple variables {{variable}}
   * - Nested object properties {{object.property}}
   * - Loops {{#each items}}...{{/each}}
   * - Conditionals {{#if condition}}...{{/if}}
   */
  static replaceVariables(content: string, data: Record<string, any>): string {
    let processedContent = content;

    // Step 1: Process simple variables in the format {{variableName}}
    Object.entries(data).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, "g");
      processedContent = processedContent.replace(regex, String(value || ""));
    });

    // Step 2: Process nested object variables in the format {{object.property}}
    for (const [key, value] of Object.entries(data)) {
      if (value && typeof value === "object" && !Array.isArray(value)) {
        for (const [nestedKey, nestedValue] of Object.entries(value)) {
          const regex = new RegExp(`{{${key}\\.${nestedKey}}}`, "g");
          processedContent = processedContent.replace(
            regex,
            String(nestedValue || "")
          );
        }
      }
    }

    // Step 3: Process loops
    const loopRegex = /{{#each\s+([^}]+)}}([\s\S]*?){{\/each}}/g;
    let match;

    // We need to use a while loop because the content may have multiple loops
    let lastProcessedContent = "";
    while (processedContent !== lastProcessedContent) {
      lastProcessedContent = processedContent;

      processedContent = processedContent.replace(
        loopRegex,
        (fullMatch, iteratorName, loopContent) => {
          const items = data[iteratorName];

          if (!Array.isArray(items) || items.length === 0) {
            return ""; // Empty string if the array doesn't exist or is empty
          }

          return items
            .map(item => {
              let itemContent = loopContent;

              // Replace item properties
              for (const [key, value] of Object.entries(item)) {
                const regex = new RegExp(`{{${key}}}`, "g");
                itemContent = itemContent.replace(regex, String(value || ""));
              }

              return itemContent;
            })
            .join("");
        }
      );
    }

    // Step 4: Process conditionals
    const conditionalRegex = /{{#if\s+([^}]+)}}([\s\S]*?){{\/if}}/g;
    processedContent = processedContent.replace(
      conditionalRegex,
      (fullMatch, conditionName, conditionalContent) => {
        const condition = data[conditionName];
        return condition ? conditionalContent : "";
      }
    );

    return processedContent;
  }

  /**
   * Send email using database template
   */
  static async sendEmailWithTemplate(
    options: SendEmailWithDatabaseTemplateOptions
  ): Promise<{
    success: boolean;
    error?: string;
    messageId?: string;
  }> {
    try {
      // Get template from database
      const template = await this.getTemplateBySlug(options.templateSlug);

      if (!template) {
        return {
          success: false,
          error: `Template '${options.templateSlug}' not found or inactive`,
        };
      }

      // Replace variables in subject and content
      const processedSubject = this.replaceVariables(
        template.subject,
        options.data
      );
      const processedContent = this.replaceVariables(
        template.content,
        options.data
      );

      // Use provided subject or processed subject
      const finalSubject = options.subject || processedSubject;

      // Import the email sending function
      const { sendEmailViaUnifiedSystem } = await import("../nodemailer");

      // Send the email
      const result = await sendEmailViaUnifiedSystem({
        to: options.to,
        subject: finalSubject,
        html: processedContent,
        priority: options.priority,
      });

      return {
        success: result.success,
        error: result.error,
        messageId: result.messageId,
      };
    } catch (error) {
      console.error("❌ Error sending email with database template:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Send welcome email using database template
   */
  static async sendWelcomeEmail(
    to: string,
    userName: string,
    verificationLink?: string
  ): Promise<{ success: boolean; error?: string; messageId?: string }> {
    return this.sendEmailWithTemplate({
      to,
      templateSlug: "welcome",
      data: {
        userName,
        siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
        verificationLink: verificationLink || "",
      },
    });
  }

  /**
   * Send verification email using database template
   */
  static async sendVerificationEmail(
    to: string,
    userName: string,
    verificationLink: string
  ): Promise<{ success: boolean; error?: string; messageId?: string }> {
    return this.sendEmailWithTemplate({
      to,
      templateSlug: "email-verification",
      data: {
        userName, // Use only userName instead of user.firstName
        verificationLink,
        expiresIn: "24 ore", // Default expiration time
        siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
      },
    });
  }

  /**
   * Send password reset email using database template
   */
  static async sendPasswordResetEmail(
    to: string,
    resetLink: string,
    userName?: string
  ): Promise<{ success: boolean; error?: string; messageId?: string }> {
    return this.sendEmailWithTemplate({
      to,
      templateSlug: "password-reset",
      data: {
        resetLink,
        userName: userName || "User",
        expiresIn: "1 oră", // Default expiration time
        siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
      },
    });
  }

  /**
   * Send order confirmation email using database template
   */
  static async sendOrderConfirmationEmail(
    to: string,
    orderData: {
      customerName: string;
      orderNumber: string;
      orderTotal: number;
      items: Array<{ name: string; quantity: number; price: number }>;
      shippingAddress: any;
    }
  ): Promise<{ success: boolean; error?: string; messageId?: string }> {
    return this.sendEmailWithTemplate({
      to,
      templateSlug: "order-confirmation",
      data: {
        // Use simple variables instead of nested properties
        orderNumber: orderData.orderNumber, // Instead of order.id
        orderTotal: orderData.orderTotal.toFixed(2) + " RON",
        items: orderData.items.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price.toFixed(2) + " RON",
        })),
        customerName: orderData.customerName,
        orderDate: new Date().toLocaleDateString("ro-RO"),
        siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
      },
    });
  }

  /**
   * Send return confirmation email using database template
   */
  static async sendReturnConfirmationEmail(
    to: string,
    returnData: {
      returnId: string;
      orderNumber: string;
      reason?: string;
    }
  ): Promise<{ success: boolean; error?: string; messageId?: string }> {
    return this.sendEmailWithTemplate({
      to,
      templateSlug: "return-request-confirmation",
      data: {
        customerName: "Client",
        returnId: returnData.returnId,
        orderNumber: returnData.orderNumber,
        reason: returnData.reason || "Return requested",
        requestDate: new Date().toLocaleDateString("ro-RO"),
        siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
      },
    });
  }

  /**
   * Send admin new order notification using database template
   */
  static async sendAdminNewOrderEmail(
    to: string,
    orderData: {
      orderNumber: string;
      customerName: string;
      customerEmail: string;
      orderTotal: number;
      orderItems: Array<{
        name: string;
        quantity: number;
        price: number;
        sku?: string;
      }>;
    }
  ): Promise<{ success: boolean; error?: string; messageId?: string }> {
    return this.sendEmailWithTemplate({
      to,
      templateSlug: "admin-new-order",
      data: {
        orderNumber: orderData.orderNumber,
        customerName: orderData.customerName,
        customerEmail: orderData.customerEmail,
        orderTotal: orderData.orderTotal.toString(),
        orderItems: orderData.orderItems.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price.toFixed(2) + " RON",
          sku: item.sku || "N/A",
        })),
        adminUrl:
          (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000") +
          "/admin",
        siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
      },
    });
  }

  /**
   * Send supplier registration confirmation using database template
   */
  static async sendSupplierRegistrationEmail(
    to: string,
    supplierData: {
      companyName: string;
      contactPersonName: string;
      contactPersonEmail: string;
    }
  ): Promise<{ success: boolean; error?: string; messageId?: string }> {
    return this.sendEmailWithTemplate({
      to,
      templateSlug: "supplier-registration-confirmation",
      data: {
        companyName: supplierData.companyName,
        contactPersonName: supplierData.contactPersonName,
        contactPersonEmail: supplierData.contactPersonEmail,
        registrationDate: new Date().toLocaleDateString("ro-RO"),
        siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
      },
    });
  }

  /**
   * Send supplier approval email using database template
   */
  static async sendSupplierApprovalEmail(
    to: string,
    supplierData: {
      companyName: string;
      contactPersonName: string;
      commissionRate: string;
      paymentTerms: string;
      minimumOrderValue: string;
    }
  ): Promise<{ success: boolean; error?: string; messageId?: string }> {
    return this.sendEmailWithTemplate({
      to,
      templateSlug: "supplier-approval",
      data: {
        companyName: supplierData.companyName,
        contactPersonName: supplierData.contactPersonName,
        commissionRate: supplierData.commissionRate,
        paymentTerms: supplierData.paymentTerms,
        minimumOrderValue: supplierData.minimumOrderValue,
        siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
      },
    });
  }

  /**
   * Send supplier rejection email using database template
   */
  static async sendSupplierRejectionEmail(
    to: string,
    supplierData: {
      companyName: string;
      contactPersonName: string;
      rejectionReason: string;
    }
  ): Promise<{ success: boolean; error?: string; messageId?: string }> {
    return this.sendEmailWithTemplate({
      to,
      templateSlug: "supplier-rejection",
      data: {
        companyName: supplierData.companyName,
        contactPersonName: supplierData.contactPersonName,
        rejectionReason: supplierData.rejectionReason,
        siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
      },
    });
  }
}
