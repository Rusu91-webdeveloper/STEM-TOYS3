/**
 * Advanced Email Service
 * Comprehensive email service that integrates personalization, analytics,
 * automation, and performance optimization engines
 */

import { sendMail } from "@/lib/brevo";
import { db } from "@/lib/db";
import { getStoreSettings } from "@/lib/utils/store-settings";

import { emailAnalyticsEngine } from "./analytics-engine";
import { emailAutomationEngine } from "./automation-engine";
import { generateProfessionalEmail, generatePreviewText } from "./base";
import {
  createHeroSection,
  createAlert,
  createFeatureGrid,
  createCTASection,
  createTestimonial,
} from "./components";
import { colors, gradients, typography, spacing } from "./design-system";
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
    fallbackEmail: "noreply@techtots.com",
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

      // Send email
      const emailId = this.generateEmailId();

      if (this.config.enablePerformanceOptimization && request.userId) {
        // Use performance engine for optimized delivery
        await emailPerformanceEngine.queueEmail(
          request.userId,
          request.to,
          personalizedSubject,
          html,
          request.priority || 1
        );
      } else {
        // Send immediately
        await sendMail({
          to: request.to,
          subject: personalizedSubject,
          html,
          from: storeSettings?.contactEmail || this.config.fallbackEmail,
          fromName: storeName,
        });
      }

      // Track analytics if enabled
      if (this.config.enableAnalytics && request.userId) {
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
          },
        });
      }

      // Trigger automation if enabled
      if (this.config.enableAutomation && request.userId) {
        await emailAutomationEngine.processUserAction(
          request.userId,
          "email_sent",
          {
            emailId,
            template: request.template,
            campaignId: request.campaignId,
          }
        );
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

      // Trigger welcome automation sequence
      if (this.config.enableAutomation) {
        await emailAutomationEngine.createWelcomeSeries(userId);
      }

      return await this.sendEmail({
        to: email,
        userId,
        subject: "Bine ai venit la TechTots! 🎉",
        template: "welcome",
        data: { user },
        priority: 1,
        campaignId: "welcome-series",
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

    // Replace variables in content and subject
    let content = template.content;
    let subject = template.subject;

    for (const [key, value] of Object.entries(request.data)) {
      const placeholder = `{{${key}}}`;
      content = content.replace(new RegExp(placeholder, "g"), String(value));
      subject = subject.replace(new RegExp(placeholder, "g"), String(value));
    }

    // Generate preview text
    const previewText = generatePreviewText(
      content.replace(/<[^>]*>/g, ""), // Remove HTML tags
      150
    );

    return { content, subject, previewText };
  }

  private async getEmailTemplate(
    templateId: string
  ): Promise<EmailTemplate | null> {
    // This would fetch template from database
    // For now, return mock templates
    const templates: Record<string, EmailTemplate> = {
      welcome: {
        id: "welcome",
        name: "Welcome Email",
        subject: "Bine ai venit la {{storeName}}! 🎉",
        content: `
          ${createHeroSection(
            "Bine ai venit în familia TechTots! 🎉",
            "Suntem încântați să te avem alături de noi în călătoria educațională STEM.",
            gradients.welcome
          )}
          
          <div style="text-align: center; margin: ${spacing.xl} 0;">
            <p style="font-size: ${typography.fontSize.lg}; color: ${colors.neutral[700]}; line-height: ${typography.lineHeight.relaxed};">
              Mulțumim că te-ai înregistrat la {{storeName}}! Suntem aici să te ajutăm să descoperi 
              lumea fascinantă a jucăriilor educaționale STEM.
            </p>
          </div>

          ${createFeatureGrid([
            {
              icon: "🎓",
              title: "Educație STEM",
              description:
                "Produse educaționale de calitate pentru dezvoltarea copiilor.",
              color: colors.primary[600],
            },
            {
              icon: "🚚",
              title: "Livrare Rapidă",
              description: "Livrare în toată România cu curieri de încredere.",
              color: colors.success[600],
            },
            {
              icon: "💎",
              title: "Calitate Premium",
              description:
                "Toate produsele sunt testate și aprobate pentru siguranță.",
              color: colors.accent.purple,
            },
            {
              icon: "🎯",
              title: "Dezvoltare Copii",
              description: "Împreună construim viitorul prin educația STEM.",
              color: colors.accent.orange,
            },
          ])}

          ${createCTASection(
            "Începe Să Explorezi",
            "Descoperă colecția noastră de jucării STEM și începe călătoria educațională!",
            {
              text: "🛒 Vezi Produsele",
              url: "{{baseUrl}}",
            },
            {
              text: "📚 Cărți Digitale",
              url: "{{baseUrl}}/digital-books",
            }
          )}
        `,
        variables: ["storeName", "baseUrl"],
        category: "onboarding",
        isActive: true,
      },
      "abandoned-cart": {
        id: "abandoned-cart",
        name: "Abandoned Cart Recovery",
        subject: "Ai uitat ceva în coșul tău! 🛒",
        content: `
          ${createHeroSection(
            "Ai uitat ceva în coșul tău! 🛒",
            "Văd că ai lăsat produse în coșul tău. Nu rata oportunitatea de a le achiziționa!",
            gradients.warning
          )}

          ${createAlert(
            "Produsele din coșul tău te așteaptă! Grăbește-te să finalizezi comanda înainte să se epuizeze stocul.",
            "warning",
            "⏰"
          )}

          ${createCTASection(
            "Finalizează Comanda",
            "Nu rata produsele din coșul tău! Finalizează comanda acum.",
            {
              text: "🛒 Finalizează Comanda",
              url: "{{baseUrl}}/cart",
            }
          )}
        `,
        variables: ["baseUrl"],
        category: "recovery",
        isActive: true,
      },
      "post-purchase": {
        id: "post-purchase",
        name: "Post Purchase",
        subject: "Mulțumim pentru comandă! 🎁",
        content: `
          ${createHeroSection(
            "Mulțumim pentru comandă! 🎁",
            "Comanda ta a fost confirmată și va fi procesată în cel mai scurt timp.",
            gradients.success
          )}

          ${createAlert(
            "Comanda ta va fi livrată în cel mai scurt timp posibil. Vei primi un email cu detalii despre livrare.",
            "success",
            "📦"
          )}

          ${createCTASection(
            "Urmărește Comanda",
            "Urmărește statusul comenzii tale și vezi când va ajunge la tine.",
            {
              text: "📦 Urmărește Comanda",
              url: "{{baseUrl}}/orders/{{orderId}}",
            }
          )}
        `,
        variables: ["baseUrl", "orderId"],
        category: "post-purchase",
        isActive: true,
      },
      "re-engagement": {
        id: "re-engagement",
        name: "Re-engagement",
        subject: "Ne-am dorit să te vedem din nou! 👋",
        content: `
          ${createHeroSection(
            "Ne-am dorit să te vedem din nou! 👋",
            "Îți dorim să revii în familia TechTots și să descoperi produsele noastre noi.",
            gradients.promotional
          )}

          ${createTestimonial(
            "Produsele STEM de la TechTots au transformat complet modul în care copilul meu învață. Recomand cu încredere!",
            "Maria Ionescu",
            "Mamă de 2 copii",
            5
          )}

          ${createCTASection(
            "Revino la TechTots",
            "Descoperă produsele noastre noi și bucură-te de oferte speciale!",
            {
              text: "🛒 Vezi Produsele Noi",
              url: "{{baseUrl}}",
            }
          )}
        `,
        variables: ["baseUrl"],
        category: "re-engagement",
        isActive: true,
      },
      "supplier-registration": {
        id: "supplier-registration",
        name: "Supplier Registration Confirmation",
        subject: "Aplicația ta de furnizor a fost primită! 📋",
        content: `
          ${createHeroSection(
            "Aplicația ta de furnizor a fost primită! 📋",
            "Vă mulțumim pentru înregistrarea ta la TechTots. Vom analiza aplicația ta și vom fi în contact cu tine în cel mai scurt timp.",
            gradients.primary
          )}

          ${createAlert(
            "Vă mulțumim că ne-ați ales pe TechTots! Vom analiza aplicația ta și vom fi în contact cu tine în cel mai scurt timp pentru a vă oferi mai multe detalii despre oportunitățile noastre.",
            "info",
            "ℹ️"
          )}

          ${createCTASection(
            "Urmărește Progresul",
            "Vă rugăm să urmăriți progresul aplicației tale și să fiți pregătiți să începem colaborarea.",
            {
              text: "Vezi Aplicația Mea",
              url: "{{baseUrl}}/suppliers/application/{{supplier.companySlug}}",
            }
          )}
        `,
        variables: ["baseUrl", "supplier"],
        category: "supplier",
        isActive: true,
      },
      "admin-supplier-notification": {
        id: "admin-supplier-notification",
        name: "Admin Supplier Notification",
        subject: "Nouă aplicație de furnizor! 🆕",
        content: `
          ${createHeroSection(
            "Nouă aplicație de furnizor! 🆕",
            "Ați primit o nouă aplicație de furnizor la TechTots. Vă rugăm să o revizuiți și să luați o decizie rapidă.",
            gradients.warning
          )}

          ${createAlert(
            "Ați primit o nouă aplicație de furnizor la TechTots. Vă rugăm să o revizuiți și să luați o decizie rapidă pentru a vă asigura că aceasta este o oportunitate de valoare pentru TechTots.",
            "warning",
            "⚠️"
          )}

          ${createCTASection(
            "Revizuiți Aplicația",
            "Vă rugăm să revizuiți aplicația furnizorului și să luați o decizie rapidă. Puteți accesa aplicația în următoarea adresă: {{reviewUrl}}",
            {
              text: "Vezi Aplicația",
              url: "{{reviewUrl}}",
            }
          )}
        `,
        variables: ["reviewUrl"],
        category: "admin",
        isActive: true,
      },
    };

    return templates[templateId] || null;
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

  private generateEmailId(): string {
    return `email-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export const emailService = new EmailService();
