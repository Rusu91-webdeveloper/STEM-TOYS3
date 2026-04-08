/**
 * Marketing Email Service
 * Integrates marketing settings with actual email functionality
 */

import {
  getEmailMarketingConfig,
  getEmailTemplate,
  isEmailMarketingEnabled,
} from "@/lib/utils/marketing-settings";
import { sendEmailWithBrevo } from "@/lib/brevo";
import { sendEmailViaUnifiedSystem } from "@/lib/email/migration-helper";

export interface MarketingEmailRequest {
  to: string | string[];
  templateType:
    | "welcome"
    | "abandonedCart"
    | "orderConfirmation"
    | "shippingUpdate"
    | "reviewRequest"
    | "birthday"
    | "reEngagement";
  variables?: Record<string, any>;
  subject?: string;
  customContent?: string;
  attachments?: Array<{
    filename: string;
    content: string;
    encoding?: string;
    contentType?: string;
  }>;
}

export interface MarketingEmailResponse {
  success: boolean;
  messageId?: string;
  error?: string;
  provider?: string;
}

export class MarketingEmailService {
  /**
   * Send marketing email using configured provider and templates
   */
  static async sendMarketingEmail(
    request: MarketingEmailRequest
  ): Promise<MarketingEmailResponse> {
    try {
      // Check if email marketing is enabled
      const isEnabled = await isEmailMarketingEnabled();
      if (!isEnabled) {
        return {
          success: false,
          error: "Email marketing is not enabled in settings",
        };
      }

      // Get email marketing configuration
      const config = await getEmailMarketingConfig();
      if (!config) {
        return {
          success: false,
          error: "Email marketing configuration not found",
        };
      }

      // Get email template
      const template = await getEmailTemplate(request.templateType);
      if (!template && !request.customContent) {
        return {
          success: false,
          error: `Email template '${request.templateType}' not found`,
        };
      }

      // Prepare email content
      const subject =
        request.subject ||
        this.generateSubject(request.templateType, request.variables);
      const content =
        request.customContent ||
        this.processTemplate(template, request.variables);

      // Send email based on configured provider
      switch (config.provider) {
        case "brevo":
          return await this.sendViaBrevo({
            to: request.to,
            subject,
            content,
            config,
            attachments: request.attachments,
          });

        case "sendgrid":
          return await this.sendViaSendGrid({
            to: request.to,
            subject,
            content,
            config,
            attachments: request.attachments,
          });

        case "mailchimp":
          return await this.sendViaMailchimp({
            to: request.to,
            subject,
            content,
            config,
            attachments: request.attachments,
          });

        case "custom":
          return await this.sendViaCustom({
            to: request.to,
            subject,
            content,
            config,
            attachments: request.attachments,
          });

        default:
          return {
            success: false,
            error: `Unsupported email provider: ${config.provider}`,
          };
      }
    } catch (error) {
      console.error("Error sending marketing email:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  /**
   * Send email via Brevo
   */
  private static async sendViaBrevo(params: {
    to: string | string[];
    subject: string;
    content: string;
    config: any;
    attachments?: any[];
  }): Promise<MarketingEmailResponse> {
    try {
      const result = await sendEmailWithBrevo({
        to: params.to,
        subject: params.subject,
        html: params.content,
        from: params.config.fromEmail,
        fromName: params.config.fromName,
        attachments: params.attachments || [],
      });

      if (!result.success) {
        return {
          success: false,
          error: "Brevo send failed",
          provider: "brevo",
        };
      }

      return {
        success: true,
        messageId: result.messageId || undefined,
        provider: "brevo",
      };
    } catch (error) {
      console.error("Error sending via Brevo:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Brevo send failed",
        provider: "brevo",
      };
    }
  }

  /**
   * Send email via SendGrid
   */
  private static async sendViaSendGrid(params: {
    to: string | string[];
    subject: string;
    content: string;
    config: any;
    attachments?: any[];
  }): Promise<MarketingEmailResponse> {
    try {
      // TODO: Implement SendGrid integration
      // For now, fallback to Brevo
      console.log(
        "SendGrid integration not yet implemented, falling back to Brevo"
      );
      return await this.sendViaBrevo(params);
    } catch (error) {
      console.error("Error sending via SendGrid:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "SendGrid send failed",
        provider: "sendgrid",
      };
    }
  }

  /**
   * Send email via Mailchimp
   */
  private static async sendViaMailchimp(params: {
    to: string | string[];
    subject: string;
    content: string;
    config: any;
    attachments?: any[];
  }): Promise<MarketingEmailResponse> {
    try {
      // TODO: Implement Mailchimp integration
      // For now, fallback to Brevo
      console.log(
        "Mailchimp integration not yet implemented, falling back to Brevo"
      );
      return await this.sendViaBrevo(params);
    } catch (error) {
      console.error("Error sending via Mailchimp:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Mailchimp send failed",
        provider: "mailchimp",
      };
    }
  }

  /**
   * Send email via custom provider
   */
  private static async sendViaCustom(params: {
    to: string | string[];
    subject: string;
    content: string;
    config: any;
    attachments?: any[];
  }): Promise<MarketingEmailResponse> {
    try {
      // Use the existing sendEmailViaUnifiedSystem function for custom providers
      const recipients = Array.isArray(params.to) ? params.to : [params.to];

      for (const recipient of recipients) {
        await sendEmailViaUnifiedSystem(
          recipient,
          params.subject,
          params.content,
          {
            from: params.config.fromEmail,
            replyTo: params.config.replyToEmail,
          }
        );
      }

      return {
        success: true,
        messageId: `custom-${Date.now()}`,
        provider: "custom",
      };
    } catch (error) {
      console.error("Error sending via custom provider:", error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Custom provider send failed",
        provider: "custom",
      };
    }
  }

  /**
   * Generate email subject based on template type
   */
  private static generateSubject(
    templateType: string,
    variables?: Record<string, any>
  ): string {
    const subjects = {
      welcome: "Welcome to TechTots!",
      abandonedCart: "Your cart is waiting for you",
      orderConfirmation: "Order Confirmation - TechTots",
      shippingUpdate: "Your order is on its way!",
      reviewRequest: "We'd love your feedback",
      birthday: "Happy Birthday from TechTots!",
      reEngagement: "We miss you at TechTots!",
    };

    let subject =
      subjects[templateType as keyof typeof subjects] ||
      "Message from TechTots";

    // Replace variables in subject
    if (variables) {
      Object.entries(variables).forEach(([key, value]) => {
        subject = subject.replace(new RegExp(`{{${key}}}`, "g"), String(value));
      });
    }

    return subject;
  }

  /**
   * Process email template with variables
   */
  private static processTemplate(
    template: string,
    variables?: Record<string, any>
  ): string {
    if (!template) return "";

    let processedTemplate = template;

    // Replace variables in template
    if (variables) {
      Object.entries(variables).forEach(([key, value]) => {
        processedTemplate = processedTemplate.replace(
          new RegExp(`{{${key}}}`, "g"),
          String(value)
        );
      });
    }

    // Add default variables if not provided
    const defaultVariables = {
      storeName: "TechTots",
      storeUrl: "https://techtots.com",
      supportEmail: appConfig.supportEmail,
      currentYear: new Date().getFullYear(),
    };

    Object.entries(defaultVariables).forEach(([key, value]) => {
      if (!variables || !variables[key]) {
        processedTemplate = processedTemplate.replace(
          new RegExp(`{{${key}}}`, "g"),
          String(value)
        );
      }
    });

    return processedTemplate;
  }

  /**
   * Send welcome email to new customer
   */
  static async sendWelcomeEmail(
    email: string,
    customerName?: string
  ): Promise<MarketingEmailResponse> {
    return this.sendMarketingEmail({
      to: email,
      templateType: "welcome",
      variables: {
        customerName: customerName || "Valued Customer",
        email: email,
      },
    });
  }

  /**
   * Send abandoned cart email
   */
  static async sendAbandonedCartEmail(
    email: string,
    cartItems: any[],
    cartTotal: number
  ): Promise<MarketingEmailResponse> {
    return this.sendMarketingEmail({
      to: email,
      templateType: "abandonedCart",
      variables: {
        email: email,
        cartItems: cartItems,
        cartTotal: cartTotal,
        cartUrl: `${process.env.NEXT_PUBLIC_APP_URL}/cart`,
      },
    });
  }

  /**
   * Send order confirmation email
   */
  static async sendOrderConfirmationEmail(
    email: string,
    order: any
  ): Promise<MarketingEmailResponse> {
    return this.sendMarketingEmail({
      to: email,
      templateType: "orderConfirmation",
      variables: {
        email: email,
        orderNumber: order.orderNumber,
        orderTotal: order.total,
        orderDate: order.createdAt,
        orderItems: order.items,
        trackingUrl: `${process.env.NEXT_PUBLIC_APP_URL}/orders/${order.id}`,
      },
    });
  }

  /**
   * Send shipping update email
   */
  static async sendShippingUpdateEmail(
    email: string,
    order: any,
    trackingInfo: any
  ): Promise<MarketingEmailResponse> {
    return this.sendMarketingEmail({
      to: email,
      templateType: "shippingUpdate",
      variables: {
        email: email,
        orderNumber: order.orderNumber,
        trackingNumber: trackingInfo.trackingNumber,
        carrier: trackingInfo.carrier,
        estimatedDelivery: trackingInfo.estimatedDelivery,
        trackingUrl: trackingInfo.trackingUrl,
      },
    });
  }

  /**
   * Send review request email
   */
  static async sendReviewRequestEmail(
    email: string,
    order: any,
    product: any
  ): Promise<MarketingEmailResponse> {
    return this.sendMarketingEmail({
      to: email,
      templateType: "reviewRequest",
      variables: {
        email: email,
        orderNumber: order.orderNumber,
        productName: product.name,
        productUrl: `${process.env.NEXT_PUBLIC_APP_URL}/products/${product.slug}`,
        reviewUrl: `${process.env.NEXT_PUBLIC_APP_URL}/products/${product.slug}/review`,
      },
    });
  }

  /**
   * Send birthday email
   */
  static async sendBirthdayEmail(
    email: string,
    customerName: string,
    discountCode?: string
  ): Promise<MarketingEmailResponse> {
    return this.sendMarketingEmail({
      to: email,
      templateType: "birthday",
      variables: {
        customerName: customerName,
        email: email,
        discountCode: discountCode,
        discountUrl: discountCode
          ? `${process.env.NEXT_PUBLIC_APP_URL}/?discount=${discountCode}`
          : undefined,
      },
    });
  }

  /**
   * Send re-engagement email
   */
  static async sendReEngagementEmail(
    email: string,
    customerName: string,
    lastOrderDate: string
  ): Promise<MarketingEmailResponse> {
    return this.sendMarketingEmail({
      to: email,
      templateType: "reEngagement",
      variables: {
        customerName: customerName,
        email: email,
        lastOrderDate: lastOrderDate,
        storeUrl: process.env.NEXT_PUBLIC_APP_URL,
        newProductsUrl: `${process.env.NEXT_PUBLIC_APP_URL}/products?sort=newest`,
      },
    });
  }
}
