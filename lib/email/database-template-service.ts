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
    // Helper to deeply resolve a path like "order.number" or "this.name"
    const resolvePath = (
      path: string,
      context: Record<string, any> | undefined,
      root: Record<string, any>
    ): any => {
      const trimmed = path.trim();
      const segments = trimmed.split(".");
      let current: any;

      if (segments[0] === "this") {
        current = context ?? {};
        segments.shift();
      } else {
        current =
          context && context[segments[0]] !== undefined ? context : root;
      }

      for (const segment of segments) {
        if (segment === "") continue;
        if (current == null) return "";
        current = current[segment];
      }
      return current ?? "";
    };

    // Normalize data to add common aliases (supports templates using nested notation)
    const normalizedData: Record<string, any> = { ...data };
    if (
      !normalizedData.order &&
      (normalizedData.orderNumber || normalizedData.orderTotal)
    ) {
      normalizedData.order = {
        number: normalizedData.orderNumber ?? normalizedData.order?.number,
        total: normalizedData.orderTotal ?? normalizedData.order?.total,
        date: normalizedData.orderDate ?? normalizedData.order?.date,
      };
    } else if (normalizedData.order) {
      normalizedData.order = {
        ...normalizedData.order,
        number: normalizedData.order.number ?? normalizedData.orderNumber,
        total: normalizedData.order.total ?? normalizedData.orderTotal,
        date: normalizedData.order.date ?? normalizedData.orderDate,
      };
    }

    // Process loops first to set correct context
    const loopRegex = /{{#each\s+([^}]+)}}([\s\S]*?){{\/each}}/g;
    let processedContent = content.replace(
      loopRegex,
      (full, iteratorName, inner) => {
        const items = normalizedData[iteratorName.trim()];
        if (!Array.isArray(items) || items.length === 0) return "";

        return items
          .map(item => {
            // Replace placeholders within loop with item as context
            return inner.replace(/{{\s*([^}]+?)\s*}}/g, (_m, token) => {
              const t = String(token).trim();
              if (t.startsWith("#") || t.startsWith("/")) return _m; // leave helpers
              const value = resolvePath(t, item, normalizedData);
              return value != null ? String(value) : "";
            });
          })
          .join("");
      }
    );

    // Process conditionals (supports nested paths and whitespace)
    const conditionalRegex = /{{#if\s+([^}]+)}}([\s\S]*?){{\/if}}/g;
    processedContent = processedContent.replace(
      conditionalRegex,
      (_full, cond, inner) => {
        const conditionValue = resolvePath(
          String(cond).trim(),
          undefined,
          normalizedData
        );
        return conditionValue ? inner : "";
      }
    );

    // Replace remaining simple/nested variables with whitespace tolerance
    processedContent = processedContent.replace(
      /{{\s*([^}#\/][^}]*)\s*}}/g,
      (_m, token) => {
        const t = String(token).trim();
        const value = resolvePath(t, undefined, normalizedData);
        return value != null ? String(value) : "";
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
        // Also provide nested structure for templates using dot-notation
        order: {
          number: orderData.orderNumber,
          total: orderData.orderTotal.toFixed(2) + " RON",
        },
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
        order: {
          number: returnData.orderNumber,
        },
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
