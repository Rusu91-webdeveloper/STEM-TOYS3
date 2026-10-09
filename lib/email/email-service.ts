/**
 * Advanced Email Service
 * Comprehensive email service that integrates personalization, analytics,
 * automation, and performance optimization engines
 */

import { sendEmailWithBrevo } from "@/lib/brevo";
import { appConfig } from "@/lib/config/app-config";
import { db } from "@/lib/db";
import { getStoreSettings } from "@/lib/utils/store-settings";

import { emailAnalyticsEngine } from "./analytics-engine";
import { emailAutomationEngine } from "./automation-engine";
import { generateProfessionalEmail, generatePreviewText } from "./base";
import { emailPerformanceEngine } from "./performance-engine";
import { personalizationEngine } from "./personalization-engine";

export interface EmailServiceConfig {
  enablePersonalization: boolean;
  enableAnalytics: boolean;
  enableAutomation: boolean;
  enablePerformanceOptimization: boolean;
  defaultTemplate: string;
  fallbackEmail: string;
  maxRetries: number;
  timeout: number;
}

export interface EmailRequest {
  to: string;
  userId?: string;
  subject: string;
  template: string;
  data: Record<string, any>;
  priority?: number;
  scheduledAt?: Date;
  campaignId?: string;
  segmentId?: string;
  personalization?: boolean;
  tracking?: boolean;
}

export interface EmailResponse {
  success: boolean;
  emailId?: string;
  message?: string;
  error?: string;
  metrics?: {
    deliveryTime: number;
    size: number;
    optimized: boolean;
  };
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  variables: string[];
  category: string;
  isActive: boolean;
}

/**
 * Advanced Email Service
 */
export class EmailService {
  private config: EmailServiceConfig = {
    enablePersonalization: true,
    enableAnalytics: true,
    enableAutomation: true,
    enablePerformanceOptimization: true,
    defaultTemplate: "professional",
    fallbackEmail: appConfig.fromEmail,
    maxRetries: 3,
    timeout: 30000,
  };

  /**
   * Send email with full integration of all engines
   */
  async sendEmail(request: EmailRequest): Promise<EmailResponse> {
    const startTime = Date.now();

    try {
      console.log(`📧 Sending email to: ${request.to}`);

      // Get store settings
      const storeSettings = await getStoreSettings();
      const storeName = storeSettings.storeName;
      // const baseUrl = storeSettings.storeUrl; // commented out as not used

      // Generate email content
      const { content, subject, previewText } = await this.generateEmailContent(
        request,
        storeSettings
      );

      // Optimize content if enabled
      let optimizedContent = content;
      if (this.config.enablePerformanceOptimization) {
        optimizedContent =
          await emailPerformanceEngine.optimizeEmailContent(content);
      }

      // Personalize content if enabled and user ID provided
      let personalizedContent = optimizedContent;
      let personalizedSubject = subject;

      if (this.config.enablePersonalization && request.userId) {
        const userProfile = await personalizationEngine.getUserProfile(
          request.userId
        );
        const context = await personalizationEngine.getPersonalizationContext(
          request.userId
        );

        if (userProfile && context) {
          personalizedContent =
            await personalizationEngine.generatePersonalizedContent(
              optimizedContent,
              userProfile,
              context
            );

          personalizedSubject =
            await personalizationEngine.getPersonalizedSubject(
              subject,
              userProfile,
              context
            );
        }
      }

      // Generate final email HTML
      const html = generateProfessionalEmail(
        personalizedContent,
        storeSettings,
        "Email",
        previewText
      );

      // The old performance queue only logged a send. Require actual provider
      // acceptance before returning success or creating a SENT event.
      const delivery = await sendEmailWithBrevo({
        to: request.to,
        subject: personalizedSubject,
        html,
        from: storeSettings?.contactEmail || this.config.fallbackEmail,
        fromName: storeName,
        audit: { campaignId: request.campaignId },
      });
      if (!delivery.success || !delivery.messageId)
        throw new Error(delivery.error || "Furnizorul nu a acceptat emailul");
      const emailId = delivery.messageId;

      // Track analytics if enabled
      if (this.config.enableAnalytics && request.userId) {
        try {
          await emailAnalyticsEngine.trackEmailEvent({
            emailId,
            userId: request.userId,
            email: request.to,
            eventType: "sent",
            metadata: {
              template: request.template,
              subject: personalizedSubject,
              campaignId: request.campaignId,
              segmentId: request.segmentId,
              personalization: request.personalization,
              tracking: request.tracking,
              providerAccepted: true,
            },
          });
        } catch (error) {
          console.error("Email accepted; analytics could not be saved", error);
        }
      }

      // Trigger automation if enabled
      if (this.config.enableAutomation && request.userId) {
        try {
          await emailAutomationEngine.processUserAction(
            request.userId,
            "email_sent",
            {
              emailId,
              template: request.template,
              campaignId: request.campaignId,
            }
          );
        } catch (error) {
          console.error("Email accepted; automation follow-up failed", error);
        }
      }

      const deliveryTime = Date.now() - startTime;

      return {
        success: true,
        emailId,
        message: "Email sent successfully",
        metrics: {
          deliveryTime,
          size: html.length,
          optimized: this.config.enablePerformanceOptimization,
        },
      };
    } catch (error) {
      console.error("Error sending email:", error);

      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        metrics: {
          deliveryTime: Date.now() - startTime,
          size: 0,
          optimized: false,
        },
      };
    }
  }

  /**
   * Send order status email with advanced features
   */
  async sendOrderStatusEmail(
    orderId: string,
    status: string,
    userId: string,
    email: string,
    additionalData?: Record<string, any>
  ): Promise<EmailResponse> {
    try {
      const order = await db.order.findUnique({
        where: { id: orderId },
        include: {
          items: {
            include: {
              product: true,
            },
          },
          user: true,
        },
      });

      if (!order) {
        throw new Error("Order not found");
      }

      const template = this.getOrderStatusTemplate(status);
      const data = {
        order,
        status,
        ...additionalData,
      };

      return await this.sendEmail({
        to: email,
        userId,
        subject: template.subject,
        template: template.id,
        data,
        priority: 2, // High priority for order status emails
        campaignId: `order-status-${status.toLowerCase()}`,
        personalization: true,
        tracking: true,
      });
    } catch (error) {
      console.error("Error sending order status email:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Send welcome email with personalization
   */
  async sendWelcomeEmail(
    userId: string,
    email: string
  ): Promise<EmailResponse> {
    try {
      const user = await db.user.findUnique({
        where: { id: userId },
        include: {
          orders: {
            take: 5,
            orderBy: { createdAt: "desc" },
          },
        },
      });

      if (!user) {
        throw new Error("User not found");
      }

      const welcomeTemplate = await db.emailTemplate.findFirst({
        where: { category: "welcome", isActive: true },
        orderBy: { updatedAt: "desc" },
      });
      if (!welcomeTemplate)
        throw new Error("Nu există un șablon welcome activ");
      return this.sendEmail({
        to: email,
        userId,
        subject: welcomeTemplate.subject,
        template: welcomeTemplate.slug,
        data: { user, userName: user.name ?? "", userEmail: email },
        priority: 1,
        personalization: true,
        tracking: true,
      });
    } catch (error) {
      console.error("Error sending welcome email:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Send abandoned cart recovery email
   */
  async sendAbandonedCartEmail(
    userId: string,
    email: string,
    cartData: any
  ): Promise<EmailResponse> {
    try {
      // Trigger abandoned cart automation sequence
      if (this.config.enableAutomation) {
        await emailAutomationEngine.createAbandonedCartSequence(
          userId,
          cartData
        );
      }

      return await this.sendEmail({
        to: email,
        userId,
        subject: "Ai uitat ceva în coșul tău! 🛒",
        template: "abandoned-cart",
        data: { cartData },
        priority: 2,
        campaignId: "abandoned-cart-recovery",
        personalization: true,
        tracking: true,
      });
    } catch (error) {
      console.error("Error sending abandoned cart email:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Send post-purchase email sequence
   */
  async sendPostPurchaseEmail(
    userId: string,
    email: string,
    orderData: any
  ): Promise<EmailResponse> {
    try {
      // Trigger post-purchase automation sequence
      if (this.config.enableAutomation) {
        await emailAutomationEngine.createPostPurchaseSequence(
          userId,
          orderData
        );
      }

      return await this.sendEmail({
        to: email,
        userId,
        subject: "Mulțumim pentru comandă! 🎁",
        template: "post-purchase",
        data: { orderData },
        priority: 2,
        campaignId: "post-purchase-series",
        personalization: true,
        tracking: true,
      });
    } catch (error) {
      console.error("Error sending post-purchase email:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Send re-engagement email for inactive users
   */
  async sendReEngagementEmail(
    userId: string,
    email: string
  ): Promise<EmailResponse> {
    try {
      // Trigger re-engagement automation sequence
      if (this.config.enableAutomation) {
        await emailAutomationEngine.createReEngagementSequence(userId);
      }

      return await this.sendEmail({
        to: email,
        userId,
        subject: "Ne-am dorit să te vedem din nou! 👋",
        template: "re-engagement",
        data: {},
        priority: 1,
        campaignId: "re-engagement-series",
        personalization: true,
        tracking: true,
      });
    } catch (error) {
      console.error("Error sending re-engagement email:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Get email performance metrics
   */
  async getEmailMetrics(
    userId?: string,
    timeRange?: { start: Date; end: Date }
  ): Promise<any> {
    try {
      if (!this.config.enableAnalytics) {
        throw new Error("Analytics is disabled");
      }

      const metrics = await emailPerformanceEngine.getPerformanceMetrics(
        userId,
        timeRange
      );
      const insights = await emailAnalyticsEngine.getEmailInsights(
        userId,
        timeRange
      );

      return {
        metrics,
        insights,
        recommendations: await this.generateRecommendations(metrics, insights),
      };
    } catch (error) {
      console.error("Error getting email metrics:", error);
      throw error;
    }
  }

  /**
   * Update email service configuration
   */
  updateConfig(config: Partial<EmailServiceConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): EmailServiceConfig {
    return { ...this.config };
  }

  // Private helper methods

  private async generateEmailContent(
    request: EmailRequest,
    storeSettings: any
  ): Promise<{ content: string; subject: string; previewText: string }> {
    const template = await this.getEmailTemplate(request.template);

    if (!template) {
      throw new Error(`Template ${request.template} not found`);
    }

    const variables = {
      storeName: storeSettings.storeName,
      baseUrl: storeSettings.storeUrl,
      site: { name: storeSettings.storeName, url: storeSettings.storeUrl },
      ...request.data,
    };
    const replace = (value: string) =>
      value.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (placeholder, path: string) => {
        let resolved: unknown = variables;
        for (const key of path.trim().split("."))
          resolved =
            resolved && typeof resolved === "object"
              ? (resolved as Record<string, unknown>)[key]
              : undefined;
        return resolved == null || typeof resolved === "object"
          ? placeholder
          : String(resolved);
      });
    const content = replace(template.content);
    const subject = replace(template.subject);
    if (/\{\{[^}]+\}\}/.test(subject + content))
      throw new Error("Variabilele șablonului nu sunt completate");

    // Generate preview text
    const previewText = generatePreviewText(
      content.replace(/<[^>]*>/g, ""), // Remove HTML tags
      150
    );

    return { content, subject, previewText };
  }

  private getEmailTemplate(
    templateId: string
  ): Promise<EmailTemplate | null> {
    return db.emailTemplate.findFirst({
      where: { isActive: true, OR: [{ id: templateId }, { slug: templateId }] },
    });
  }

  private getOrderStatusTemplate(status: string): {
    id: string;
    subject: string;
  } {
    const templates: Record<string, { id: string; subject: string }> = {
      CANCELLED: {
        id: "order-cancelled",
        subject: "Comanda ta a fost anulată",
      },
      COMPLETED: {
        id: "order-completed",
        subject: "Comanda ta a fost finalizată cu succes! 🎉",
      },
      DELIVERED: {
        id: "order-delivered",
        subject: "Comanda ta a fost livrată! 📦",
      },
    };

    return (
      templates[status] || {
        id: "order-status-update",
        subject: "Actualizare status comandă",
      }
    );
  }

  private async generateRecommendations(
    metrics: any,
    insights: any
  ): Promise<string[]> {
    const recommendations: string[] = [];

    // Analyze metrics and generate recommendations
    if (metrics.openRate < 20) {
      recommendations.push(
        "Considerați optimizarea subiectelor email-urilor pentru a îmbunătăți rata de deschidere"
      );
    }

    if (metrics.clickRate < 3) {
      recommendations.push(
        "Optimizați call-to-action-urile și link-urile din email-uri"
      );
    }

    if (metrics.bounceRate > 5) {
      recommendations.push(
        "Verificați și curățați lista de email-uri pentru a reduce rata de bounce"
      );
    }

    if (metrics.unsubscribeRate > 2) {
      recommendations.push(
        "Reduceți frecvența email-urilor și îmbunătățiți relevanța conținutului"
      );
    }

    return recommendations;
  }
}

// Export singleton instance
export const emailService = new EmailService();
