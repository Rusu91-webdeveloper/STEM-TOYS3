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
   * Replace variables in template content
   */
  static replaceVariables(content: string, data: Record<string, any>): string {
    let processedContent = content;

    // Replace all variables in the format {{variableName}}
    Object.entries(data).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, "g");
      processedContent = processedContent.replace(regex, String(value || ""));
    });

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
        "user.firstName": userName,
        userName, // Keep both for compatibility
        verificationLink,
        expiresIn: "24 ore", // Default expiration time
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
        // Map to the variables expected by the template
        "order.id": orderData.orderNumber,
        "order.total": orderData.orderTotal.toFixed(2) + " RON",
        "order.items": orderData.items.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price.toFixed(2) + " RON",
        })),
        // Keep original variables for compatibility
        customerName: orderData.customerName,
        orderNumber: orderData.orderNumber,
        orderDate: new Date().toLocaleDateString("ro-RO"),
        orderTotal: orderData.orderTotal.toString(),
        items: orderData.items.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price.toFixed(2) + " RON",
        })),
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
      orderItems: Array<{ name: string; quantity: number; price: number }>;
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
        })),
        adminUrl:
          (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000") +
          "/admin",
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
