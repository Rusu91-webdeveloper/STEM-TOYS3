import { prisma } from "@/lib/prisma";

import { sendMail } from "../brevo";

/**
 * Service for sending emails using Email Templates from the database
 */
export class EmailTemplateService {
  /**
   * Send an email using a template from the database
   */
  static async sendTemplateEmail(
    templateSlug: string,
    to: string,
    variables: Record<string, unknown>
  ) {
    try {
      // Get the template from database
      const template = await prisma.emailTemplate.findUnique({
        where: { slug: templateSlug, isActive: true },
      });

      if (!template) {
        throw new Error(
          `Email template '${templateSlug}' not found or inactive`
        );
      }

      // Debug logging for development
      if (process.env.NODE_ENV === "development") {
        console.log("📧 EmailTemplateService found template:", {
          id: template.id,
          name: template.name,
          slug: template.slug,
          subject: template.subject,
          contentLength: template.content.length,
          contentPreview: template.content.substring(0, 200) + "...",
          category: template.category,
          isActive: template.isActive,
          metadata: template.metadata,
        });
      }

      // Replace variables in subject and content
      console.log("📧 Variables being passed to template:", variables);
      const subject = this.replaceVariables(template.subject, variables);
      let content = this.replaceVariables(template.content, variables);
      console.log("📧 Content after variable replacement:", {
        originalLength: template.content.length,
        processedLength: content.length,
        contentPreview: content.substring(0, 200),
      });

      // Process images from metadata
      if (
        template.metadata &&
        typeof template.metadata === "object" &&
        "images" in template.metadata
      ) {
        const images = (template.metadata as any).images || [];
        content = this.processImagesInContent(content, images);
      }

      // Debug logging for development
      if (process.env.NODE_ENV === "development") {
        console.log("📧 EmailTemplateService sending email:", {
          to,
          subject,
          contentLength: content.length,
          contentPreview: content.substring(0, 200) + "...",
          templateSlug,
        });
      }

      // Send the email
      const result = await sendMail({
        to,
        subject,
        html: content,
        params: { email: to },
      });

      // Debug logging for development
      if (process.env.NODE_ENV === "development") {
        console.log("📧 EmailTemplateService result:", result);
      }

      return result;
    } catch (error) {
      console.error(`Error sending template email '${templateSlug}':`, error);
      throw error;
    }
  }

  /**
   * Process images in email content
   */
  private static processImagesInContent(
    content: string,
    images: any[]
  ): string {
    if (!images || images.length === 0) {
      return content;
    }

    let processedContent = content;

    // Replace image placeholders with actual image URLs
    images.forEach((image, index) => {
      const placeholder = `{{image.${index}}}`;
      const imageHtml = `<img src="${image.url}" alt="${image.alt || image.name}" style="max-width: 100%; height: auto;" />`;
      processedContent = processedContent.replace(
        new RegExp(placeholder, "g"),
        imageHtml
      );
    });

    // Also handle generic image placeholders
    images.forEach(image => {
      const placeholder = `{{image.${image.id}}}`;
      const imageHtml = `<img src="${image.url}" alt="${image.alt || image.name}" style="max-width: 100%; height: auto;" />`;
      processedContent = processedContent.replace(
        new RegExp(placeholder, "g"),
        imageHtml
      );
    });

    return processedContent;
  }

  /**
   * Replace variables in a string using {{variable}} syntax
   */
  private static replaceVariables(
    template: string,
    variables: Record<string, unknown>
  ): string {
    let result = template;

    // Replace simple variables {{variable}}
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{${key}}}`, "g");
      result = result.replace(regex, String(value ?? ""));
    }

    // Replace nested variables {{object.property}}
    for (const [key, value] of Object.entries(variables)) {
      if (value && typeof value === "object" && value !== null) {
        for (const [nestedKey, nestedValue] of Object.entries(
          value as Record<string, unknown>
        )) {
          const regex = new RegExp(`{{${key}\\.${nestedKey}}}`, "g");
          result = result.replace(regex, String(nestedValue ?? ""));
        }
      }
    }

    // Handle conditional blocks {{#if variable}}...{{/if}}
    result = this.processConditionals(result, variables);

    return result;
  }

  /**
   * Process conditional blocks in templates
   */
  private static processConditionals(
    template: string,
    variables: Record<string, unknown>
  ): string {
    const conditionalRegex = /\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g;

    return template.replace(conditionalRegex, (match, condition, content) => {
      const value = variables[condition];
      if (value && value !== "" && value !== null && value !== undefined) {
        // Replace variables inside the conditional content
        return this.replaceVariables(content, variables);
      }
      return "";
    });
  }

  /**
   * Send welcome email using template
   */
  static sendWelcomeEmail({
    to,
    name,
    storeName,
    baseUrl,
  }: {
    to: string;
    name: string;
    storeName: string;
    baseUrl: string;
  }) {
    return this.sendTemplateEmail("welcome-email", to, {
      name,
      storeName,
      baseUrl,
    });
  }

  /**
   * Send email verification using template
   */
  static sendVerificationEmail({
    to,
    name,
    verificationLink,
    expiresIn = "24 ore",
    storeName,
    baseUrl,
  }: {
    to: string;
    name: string;
    verificationLink: string;
    expiresIn?: string;
    storeName: string;
    baseUrl: string;
  }) {
    return this.sendTemplateEmail("email-verification", to, {
      name,
      storeName,
      verificationLink,
      expiresIn,
      baseUrl,
    });
  }

  /**
   * Send password reset email using template
   */
  static sendPasswordResetEmail({
    to,
    resetLink,
    expiresIn = "1 oră",
    storeName,
  }: {
    to: string;
    resetLink: string;
    expiresIn?: string;
    storeName: string;
  }) {
    return this.sendTemplateEmail("password-reset", to, {
      storeName,
      resetLink,
      expiresIn,
    });
  }

  /**
   * Send order confirmation email using template
   */
  static sendOrderConfirmationEmail({
    to,
    order,
    baseUrl,
    storeName,
  }: {
    to: string;
    order: {
      id: string;
      items: Array<{
        name: string;
        quantity: number;
        price: number;
      }>;
      total: number;
      subtotal?: number;
      tax?: number;
      shippingCost?: number;
      discountAmount?: number;
      couponCode?: string;
      shippingAddress?: Record<string, unknown>;
      shippingMethod?: Record<string, unknown>;
      orderDate?: string;
      taxRatePercentage?: string;
      isFreeShippingActive?: boolean;
      freeShippingThreshold?: number;
    };
    baseUrl: string;
    storeName: string;
  }) {
    // Build order items HTML
    const orderItems = order.items
      .map(
        item =>
          `<tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 12px 8px; color: #374151;">${item.name}</td>
            <td style="padding: 12px 8px; text-align: center; color: #374151;">${item.quantity}</td>
            <td style="padding: 12px 8px; text-align: right; color: #374151;">${item.price.toFixed(2)} Lei</td>
            <td style="padding: 12px 8px; text-align: right; font-weight: 600; color: #374151;">${(item.price * item.quantity).toFixed(2)} Lei</td>
          </tr>`
      )
      .join("");

    return this.sendTemplateEmail("order-confirmation", to, {
      orderId: order.id,
      orderDate: order.orderDate
        ? new Date(order.orderDate).toLocaleDateString("ro-RO")
        : new Date().toLocaleDateString("ro-RO"),
      orderItems,
      subtotal: order.subtotal?.toFixed(2) ?? "0.00",
      tax: order.tax?.toFixed(2) ?? "0.00",
      taxRatePercentage: order.taxRatePercentage ?? "0%",
      shippingCost: order.shippingCost?.toFixed(2) ?? "0.00",
      discountAmount: order.discountAmount?.toFixed(2) ?? "0.00",
      couponCode: order.couponCode ?? "",
      total: order.total.toFixed(2),
      shippingAddress: order.shippingAddress,
      baseUrl,
      storeName,
    });
  }
}
