/**
 * E-commerce Email Service
 *
 * Comprehensive email automation for all e-commerce business processes
 * Integrates with the existing email system and template library
 */

import { sendEmailViaUnifiedSystem } from "./migration-helper";
import { prisma } from "@/lib/prisma";

export interface EmailTrigger {
  type: "authentication" | "order" | "marketing" | "admin" | "support";
  event: string;
  userId?: string;
  orderId?: string;
  data: Record<string, any>;
}

export interface EmailContext {
  user?: {
    id: string;
    name: string;
    email: string;
  };
  order?: {
    id: string;
    number: string;
    total: number;
    status: string;
    items: Array<{
      name: string;
      quantity: number;
      price: number;
    }>;
  };
  admin?: {
    id: string;
    name: string;
    email: string;
  };
}

/**
 * E-commerce Email Service
 */
export class EcommerceEmailService {
  private readonly SITE_URL = process.env.NEXTAUTH_URL || "https://techtots.ro";

  /**
   * Send authentication-related emails
   */
  async sendAuthenticationEmail(
    type: "password-change" | "new-device-login" | "account-locked",
    userId: string,
    context: EmailContext
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const user = context.user || (await this.getUserById(userId));
      if (!user) {
        throw new Error("User not found");
      }

      const templates = {
        "password-change": "password-change-confirmation",
        "new-device-login": "new-device-login",
        "account-locked": "account-locked",
      };

      const template = templates[type];
      if (!template) {
        throw new Error(`Unknown authentication email type: ${type}`);
      }

      const variables = this.buildAuthenticationVariables(
        type,
        user,
        context.data
      );
      const subject = this.buildAuthenticationSubject(type, user);

      return await sendEmailViaUnifiedSystem(
        user.email,
        subject,
        "", // Content will be generated from template
        {
          template,
          variables,
          userId: user.id,
          personalization: true,
          priority: 1,
        }
      );
    } catch (error) {
      console.error(`❌ Error sending ${type} email:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Send order lifecycle emails
   */
  async sendOrderEmail(
    type: "processing" | "shipped" | "delivered" | "cancelled" | "failed",
    orderId: string,
    context: EmailContext
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const order = context.order || (await this.getOrderById(orderId));
      const user =
        context.user || (await this.getUserById(order?.userId || ""));

      if (!order || !user) {
        throw new Error("Order or user not found");
      }

      const templates = {
        processing: "order-processing",
        shipped: "order-shipped",
        delivered: "order-delivered",
        cancelled: "order-cancelled",
        failed: "order-failed",
      };

      const template = templates[type];
      if (!template) {
        throw new Error(`Unknown order email type: ${type}`);
      }

      const variables = this.buildOrderVariables(
        type,
        order,
        user,
        context.data
      );
      const subject = this.buildOrderSubject(type, order);

      return await sendEmailViaUnifiedSystem(
        user.email,
        subject,
        "", // Content will be generated from template
        {
          template,
          variables,
          userId: user.id,
          personalization: true,
          priority: 1,
        }
      );
    } catch (error) {
      console.error(`❌ Error sending ${type} email:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Send marketing emails
   */
  async sendMarketingEmail(
    type: "blog-post" | "coupon" | "flash-sale" | "newsletter",
    recipients: string[] | "all",
    context: EmailContext
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const templates = {
        "blog-post": "blog-post-notification",
        coupon: "coupon-distribution",
        "flash-sale": "flash-sale-alert",
        newsletter: "newsletter-welcome",
      };

      const template = templates[type];
      if (!template) {
        throw new Error(`Unknown marketing email type: ${type}`);
      }

      // Get recipients
      const emailList =
        recipients === "all"
          ? await this.getAllActiveSubscribers()
          : recipients;

      if (emailList.length === 0) {
        return { success: true, messageId: "no-recipients" };
      }

      const variables = this.buildMarketingVariables(type, context.data);
      const subject = this.buildMarketingSubject(type, context.data);

      // Send to all recipients
      const results = await Promise.allSettled(
        emailList.map(email =>
          sendEmailViaUnifiedSystem(
            email,
            subject,
            "", // Content will be generated from template
            {
              template,
              variables,
              personalization: true,
              priority: 2,
            }
          )
        )
      );

      const successful = results.filter(r => r.status === "fulfilled").length;
      const failed = results.filter(r => r.status === "rejected").length;

      return {
        success: successful > 0,
        messageId: `bulk-${type}-${Date.now()}`,
        error: failed > 0 ? `${failed} emails failed to send` : undefined,
      };
    } catch (error) {
      console.error(`❌ Error sending ${type} email:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Send admin notification emails
   */
  async sendAdminEmail(
    type: "new-order" | "high-value-order" | "return-request" | "low-inventory",
    context: EmailContext
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const adminEmails = await this.getAdminEmails();
      if (adminEmails.length === 0) {
        return { success: false, error: "No admin emails configured" };
      }

      const templates = {
        "new-order": "admin-new-order",
        "high-value-order": "admin-high-value-order",
        "return-request": "return-notification",
        "low-inventory": "admin-low-inventory",
      };

      const template = templates[type];
      if (!template) {
        throw new Error(`Unknown admin email type: ${type}`);
      }

      const variables = this.buildAdminVariables(type, context);
      const subject = this.buildAdminSubject(type, context);

      // Send to all admins
      const results = await Promise.allSettled(
        adminEmails.map(email =>
          sendEmailViaUnifiedSystem(
            email,
            subject,
            "", // Content will be generated from template
            {
              template,
              variables,
              priority: 1,
            }
          )
        )
      );

      const successful = results.filter(r => r.status === "fulfilled").length;
      const failed = results.filter(r => r.status === "rejected").length;

      return {
        success: successful > 0,
        messageId: `admin-${type}-${Date.now()}`,
        error: failed > 0 ? `${failed} admin emails failed to send` : undefined,
      };
    } catch (error) {
      console.error(`❌ Error sending admin ${type} email:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Send support emails
   */
  async sendSupportEmail(
    type: "ticket-created" | "ticket-updated" | "ticket-resolved",
    ticketId: string,
    context: EmailContext
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const user = context.user;
      if (!user) {
        throw new Error("User context required for support emails");
      }

      const templates = {
        "ticket-created": "support-ticket-created",
        "ticket-updated": "support-ticket-updated",
        "ticket-resolved": "support-ticket-resolved",
      };

      const template = templates[type];
      if (!template) {
        throw new Error(`Unknown support email type: ${type}`);
      }

      const variables = this.buildSupportVariables(
        type,
        ticketId,
        user,
        context.data
      );
      const subject = this.buildSupportSubject(type, ticketId);

      return await sendEmailViaUnifiedSystem(
        user.email,
        subject,
        "", // Content will be generated from template
        {
          template,
          variables,
          userId: user.id,
          personalization: true,
          priority: 2,
        }
      );
    } catch (error) {
      console.error(`❌ Error sending support ${type} email:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  // Helper methods for building email content

  private buildAuthenticationVariables(type: string, user: any, data: any) {
    const base = {
      userName: user.name || user.email,
      siteUrl: this.SITE_URL,
      ...data,
    };

    switch (type) {
      case "password-change":
        return {
          ...base,
          changeTime: data.changeTime || new Date().toLocaleString("ro-RO"),
          deviceInfo: data.deviceInfo || "Dispozitiv necunoscut",
          ipAddress: data.ipAddress || "IP necunoscut",
        };
      case "new-device-login":
        return {
          ...base,
          loginTime: data.loginTime || new Date().toLocaleString("ro-RO"),
          deviceInfo: data.deviceInfo || "Dispozitiv necunoscut",
          location: data.location || "Locație necunoscută",
          ipAddress: data.ipAddress || "IP necunoscut",
        };
      default:
        return base;
    }
  }

  private buildOrderVariables(type: string, order: any, user: any, data: any) {
    const base = {
      customerName: user.name || user.email,
      orderNumber: order.number || order.id,
      orderDate: order.createdAt
        ? new Date(order.createdAt).toLocaleDateString("ro-RO")
        : new Date().toLocaleDateString("ro-RO"),
      orderTotal: order.total || 0,
      siteUrl: this.SITE_URL,
      ...data,
    };

    switch (type) {
      case "processing":
        return {
          ...base,
          estimatedDelivery: data.estimatedDelivery || "3-5 zile lucrătoare",
        };
      case "shipped":
        return {
          ...base,
          trackingNumber: data.trackingNumber || "N/A",
          carrier: data.carrier || "Curier",
          shippingDate:
            data.shippingDate || new Date().toLocaleDateString("ro-RO"),
          trackingUrl:
            data.trackingUrl ||
            `${this.SITE_URL}/tracking/${data.trackingNumber}`,
        };
      default:
        return base;
    }
  }

  private buildMarketingVariables(type: string, data: any) {
    const base = {
      siteUrl: this.SITE_URL,
      unsubscribeUrl: `${this.SITE_URL}/unsubscribe`,
      ...data,
    };

    switch (type) {
      case "blog-post":
        return {
          ...base,
          subscriberName: data.subscriberName || "Prieten",
          blogTitle: data.blogTitle || "Nou articol",
          blogExcerpt: data.blogExcerpt || "Descoperă noul nostru articol...",
          blogUrl: data.blogUrl || this.SITE_URL,
        };
      case "coupon":
        return {
          ...base,
          customerName: data.customerName || "Prieten",
          couponCode: data.couponCode || "REDUCERE",
          discountAmount: data.discountAmount || "10%",
          expiryDate: data.expiryDate || "30 zile",
        };
      default:
        return base;
    }
  }

  private buildAdminVariables(type: string, context: EmailContext) {
    const base = {
      siteUrl: this.SITE_URL,
      ...context.data,
    };

    switch (type) {
      case "new-order":
        return {
          ...base,
          orderNumber: context.order?.number || context.data.orderNumber,
          customerName: context.user?.name || context.data.customerName,
          orderTotal: context.order?.total || context.data.orderTotal,
          orderItems: context.order?.items || context.data.orderItems,
        };
      case "return-request":
        return {
          ...base,
          orderNumber: context.data.orderNumber,
          customerName: context.data.customerName,
          customerEmail: context.data.customerEmail,
          reason: context.data.reason,
          returnId: context.data.returnId,
        };
      default:
        return base;
    }
  }

  private buildSupportVariables(
    type: string,
    ticketId: string,
    user: any,
    data: any
  ) {
    return {
      customerName: user.name || user.email,
      ticketNumber: ticketId,
      ticketSubject: data.subject || "Tichet de suport",
      ticketUrl: `${this.SITE_URL}/support/tickets/${ticketId}`,
      siteUrl: this.SITE_URL,
      ...data,
    };
  }

  // Subject line builders
  private buildAuthenticationSubject(type: string, user: any): string {
    const name = user.name || "Utilizator";
    switch (type) {
      case "password-change":
        return `Parola a fost schimbată cu succes - TechTots`;
      case "new-device-login":
        return `Conectare de pe dispozitiv nou - TechTots`;
      default:
        return `Notificare securitate - TechTots`;
    }
  }

  private buildOrderSubject(type: string, order: any): string {
    const orderNumber = order.number || order.id;
    switch (type) {
      case "processing":
        return `Comanda #${orderNumber} este în procesare - TechTots`;
      case "shipped":
        return `Comanda #${orderNumber} a fost expediată! 🚚`;
      case "delivered":
        return `Comanda #${orderNumber} a fost livrată! 📦`;
      default:
        return `Actualizare comandă #${orderNumber} - TechTots`;
    }
  }

  private buildMarketingSubject(type: string, data: any): string {
    switch (type) {
      case "blog-post":
        return `Nou articol: ${data.blogTitle || "Descoperă noul nostru conținut"} - TechTots`;
      case "coupon":
        return `🎁 Ofertă specială pentru tine! ${data.discountAmount || "10%"} reducere - TechTots`;
      case "flash-sale":
        return `⚡ Vânzare flash! ${data.saleTitle || "Oferte limitate"} - TechTots`;
      default:
        return `Noutăți TechTots - ${new Date().toLocaleDateString("ro-RO")}`;
    }
  }

  private buildAdminSubject(type: string, context: EmailContext): string {
    switch (type) {
      case "new-order":
        return `🛒 Comandă nouă #${context.order?.number || context.data.orderNumber} - TechTots Admin`;
      case "high-value-order":
        return `💰 Comandă de valoare mare #${context.order?.number || context.data.orderNumber} - TechTots Admin`;
      case "return-request":
        return `🔄 Cerere de returnare #${context.data.returnId} - TechTots Admin`;
      default:
        return `🔔 Notificare admin - TechTots`;
    }
  }

  private buildSupportSubject(type: string, ticketId: string): string {
    switch (type) {
      case "ticket-created":
        return `Tichet de suport creat #${ticketId} - TechTots`;
      case "ticket-updated":
        return `Tichet de suport actualizat #${ticketId} - TechTots`;
      case "ticket-resolved":
        return `Tichet de suport rezolvat #${ticketId} - TechTots`;
      default:
        return `Actualizare tichet de suport #${ticketId} - TechTots`;
    }
  }

  // Database helpers
  private async getUserById(userId: string) {
    return await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true },
    });
  }

  private async getOrderById(orderId: string) {
    return await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        number: true,
        total: true,
        status: true,
        userId: true,
        createdAt: true,
        items: {
          select: {
            name: true,
            quantity: true,
            price: true,
          },
        },
      },
    });
  }

  private async getAllActiveSubscribers(): Promise<string[]> {
    const subscribers = await prisma.newsletter.findMany({
      where: { isActive: true },
      select: { email: true },
    });
    return subscribers.map(s => s.email);
  }

  private async getAdminEmails(): Promise<string[]> {
    const admins = await prisma.user.findMany({
      where: { role: "ADMIN" },
      select: { email: true },
    });
    return admins.map(a => a.email);
  }
}
