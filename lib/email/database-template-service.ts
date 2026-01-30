import { prisma } from "@/lib/prisma";
import { EMAIL_TEMPLATES } from "./template-library";

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
      // Get template from database, fallback to bundled templates if missing
      const template =
        (await this.getTemplateBySlug(options.templateSlug)) ||
        EMAIL_TEMPLATES.find(
          fallback =>
            fallback.slug === options.templateSlug && fallback.isActive
        );

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
      templateSlug: "account-verification", // Fixed: Changed from "email-verification" to match database template
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
   * Send order confirmation email using database template.
   * Pass dynamic subtotal, tax, shipping, COD, discount so templates can show a full breakdown.
   */
  static async sendOrderConfirmationEmail(
    to: string,
    orderData: {
      customerName: string;
      orderNumber: string;
      orderTotal: number;
      items: Array<{ name: string; quantity: number; price: number }>;
      shippingAddress: any;
      subtotal?: number;
      tax?: number;
      shippingCost?: number;
      discountAmount?: number;
      codFee?: number;
      taxRatePercentage?: string;
    }
  ): Promise<{ success: boolean; error?: string; messageId?: string }> {
    const fmt = (n: number) =>
      new Intl.NumberFormat("ro-RO", { minimumFractionDigits: 2 }).format(n);
    const order = {
      number: orderData.orderNumber,
      total: orderData.orderTotal.toFixed(2) + " RON",
      subtotal:
        orderData.subtotal != null ? fmt(orderData.subtotal) + " RON" : undefined,
      tax: orderData.tax != null ? fmt(orderData.tax) + " RON" : undefined,
      shippingCost:
        orderData.shippingCost != null
          ? fmt(orderData.shippingCost) + " RON"
          : undefined,
      discountAmount:
        orderData.discountAmount != null && orderData.discountAmount > 0
          ? fmt(orderData.discountAmount) + " RON"
          : undefined,
      codFee:
        orderData.codFee != null && orderData.codFee > 0
          ? fmt(orderData.codFee) + " RON"
          : undefined,
      taxRatePercentage: orderData.taxRatePercentage ?? undefined,
    };

    return this.sendEmailWithTemplate({
      to,
      templateSlug: "order-confirmation",
      data: {
        orderNumber: orderData.orderNumber,
        orderTotal: orderData.orderTotal.toFixed(2) + " RON",
        order,
        items: orderData.items.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price:
            typeof item.price === "number"
              ? item.price.toFixed(2) + " RON"
              : String(item.price),
        })),
        customerName: orderData.customerName,
        orderDate: new Date().toLocaleDateString("ro-RO"),
        siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
        subtotal: order.subtotal,
        tax: order.tax,
        shippingCost: order.shippingCost,
        discountAmount: order.discountAmount,
        codFee: order.codFee,
        taxRatePercentage: order.taxRatePercentage,
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

  /**
   * Send shipping notification email using database template (FanCourier)
   */
  static async sendShippingNotificationEmail(
    to: string,
    shippingData: {
      customerName: string;
      orderNumber: string;
      trackingNumber: string;
      estimatedDelivery: string;
      courierName?: string;
    }
  ): Promise<{ success: boolean; error?: string; messageId?: string }> {
    // Try FanCourier-specific template first, fallback to generic
    const normalizedCourier = (shippingData.courierName || "")
      .toLowerCase()
      .replace(/\s+/g, "");
    const isFanCourier = normalizedCourier.includes("fancourier");
    const templateSlug = isFanCourier
      ? "order-shipped-fancourier"
      : "order-shipped";

    return this.sendEmailWithTemplate({
      to,
      templateSlug,
      data: {
        customerName: shippingData.customerName,
        orderNumber: shippingData.orderNumber,
        trackingNumber: shippingData.trackingNumber,
        estimatedDelivery: shippingData.estimatedDelivery,
        courierName: shippingData.courierName || "FanCourier",
        trackingUrl: isFanCourier
          ? `https://www.fancourier.ro/awb-tracking/?tracking=${shippingData.trackingNumber}`
          : undefined,
        siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
        storeName: "TechTots STEM Store",
        contactEmail: "webira.rem.srl@gmail.com",
        contactPhone: "+40 771 248 029",
      },
    });
  }

  /**
   * Send order cancelled email using database template
   */
  static async sendOrderCancelledEmail(
    to: string,
    orderData: {
      customerName: string;
      orderNumber: string;
      cancellationReason?: string;
      refundInfo?: string;
    }
  ): Promise<{ success: boolean; error?: string; messageId?: string }> {
    return this.sendEmailWithTemplate({
      to,
      templateSlug: "order-cancelled",
      data: {
        customerName: orderData.customerName,
        orderNumber: orderData.orderNumber,
        order: { number: orderData.orderNumber },
        cancellationReason: orderData.cancellationReason || "Cererea clientului",
        cancellationDate: new Date().toLocaleDateString("ro-RO"),
        refundInfo: orderData.refundInfo || "Rambursarea va fi procesată în 3-5 zile lucrătoare.",
        siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
      },
    });
  }

  /**
   * Send order delivered email using database template
   */
  static async sendOrderDeliveredEmail(
    to: string,
    orderData: {
      customerName: string;
      orderNumber: string;
      deliveryDate: string;
    }
  ): Promise<{ success: boolean; error?: string; messageId?: string }> {
    return this.sendEmailWithTemplate({
      to,
      templateSlug: "order-delivered",
      data: {
        customerName: orderData.customerName,
        orderNumber: orderData.orderNumber,
        order: { number: orderData.orderNumber },
        deliveryDate: orderData.deliveryDate,
        reviewUrl: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/account/orders`,
        siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
      },
    });
  }

  /**
   * Send newsletter welcome email using database template
   */
  static async sendNewsletterWelcomeEmail(
    to: string,
    data?: { firstName?: string }
  ): Promise<{ success: boolean; error?: string; messageId?: string }> {
    return this.sendEmailWithTemplate({
      to,
      templateSlug: "newsletter-welcome",
      data: {
        firstName: data?.firstName || "",
        siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
        unsubscribeUrl: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/newsletter/unsubscribe?email=${encodeURIComponent(to)}`,
      },
    });
  }

  /**
   * Send return confirmation to customer using database template
   */
  static async sendReturnConfirmationToCustomer(
    to: string,
    returnData: {
      customerName: string;
      orderNumber: string;
      returnId: string;
      productName: string;
      reason: string;
    }
  ): Promise<{ success: boolean; error?: string; messageId?: string }> {
    return this.sendEmailWithTemplate({
      to,
      templateSlug: "return-confirmation-customer",
      data: {
        customerName: returnData.customerName,
        orderNumber: returnData.orderNumber,
        returnId: returnData.returnId,
        productName: returnData.productName,
        reason: returnData.reason,
        siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
        storeName: "TechTots STEM Store",
        contactEmail: "webira.rem.srl@gmail.com",
        contactPhone: "+40 771 248 029",
      },
    });
  }
}
