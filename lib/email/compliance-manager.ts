/**
 * Email Compliance Manager
 *
 * Handles GDPR compliance, consent management, and unsubscribe functionality
 * for email marketing and communications
 */

import { prisma } from "@/lib/prisma";
import { sendEmailViaUnifiedSystem } from "./migration-helper";

export interface ConsentRecord {
  id: string;
  userId: string;
  email: string;
  consentType: "marketing" | "newsletter" | "transactional" | "all";
  granted: boolean;
  grantedAt: Date;
  revokedAt?: Date;
  source: string; // 'registration', 'newsletter_signup', 'manual', 'api'
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

export interface UnsubscribeRequest {
  email: string;
  token: string;
  reason?: string;
  preferences?: {
    marketing: boolean;
    newsletter: boolean;
    transactional: boolean;
  };
}

export interface ComplianceReport {
  totalConsents: number;
  activeConsents: number;
  revokedConsents: number;
  consentBreakdown: {
    marketing: number;
    newsletter: number;
    transactional: number;
  };
  recentRevocations: ConsentRecord[];
  complianceScore: number; // 0-100
}

/**
 * Email Compliance Manager
 */
export class EmailComplianceManager {
  private readonly UNSUBSCRIBE_TOKEN_LENGTH = 32;
  private readonly CONSENT_EXPIRY_DAYS = 365; // 1 year

  /**
   * Record user consent for email communications
   */
  async recordConsent(
    userId: string,
    email: string,
    consentType: ConsentRecord["consentType"],
    source: string,
    metadata?: Record<string, any>
  ): Promise<ConsentRecord> {
    try {
      // Check if consent already exists
      const existingConsent = await prisma.consentRecord.findFirst({
        where: {
          userId,
          email,
          consentType,
        },
        orderBy: { grantedAt: "desc" },
      });

      if (existingConsent && existingConsent.granted) {
        // Update existing consent
        return await prisma.consentRecord.update({
          where: { id: existingConsent.id },
          data: {
            granted: true,
            grantedAt: new Date(),
            source,
            metadata,
          },
        });
      }

      // Create new consent record
      return await prisma.consentRecord.create({
        data: {
          userId,
          email,
          consentType,
          granted: true,
          grantedAt: new Date(),
          source,
          metadata,
        },
      });
    } catch (error) {
      console.error("❌ Error recording consent:", error);
      throw new Error("Failed to record consent");
    }
  }

  /**
   * Revoke user consent
   */
  async revokeConsent(
    userId: string,
    email: string,
    consentType: ConsentRecord["consentType"],
    reason?: string
  ): Promise<ConsentRecord> {
    try {
      const consent = await prisma.consentRecord.findFirst({
        where: {
          userId,
          email,
          consentType,
          granted: true,
        },
        orderBy: { grantedAt: "desc" },
      });

      if (!consent) {
        throw new Error("No active consent found to revoke");
      }

      return await prisma.consentRecord.update({
        where: { id: consent.id },
        data: {
          granted: false,
          revokedAt: new Date(),
          metadata: {
            ...consent.metadata,
            revocationReason: reason,
          },
        },
      });
    } catch (error) {
      console.error("❌ Error revoking consent:", error);
      throw new Error("Failed to revoke consent");
    }
  }

  /**
   * Check if user has consent for specific email type
   */
  async hasConsent(
    userId: string,
    email: string,
    consentType: ConsentRecord["consentType"]
  ): Promise<boolean> {
    try {
      const consent = await prisma.consentRecord.findFirst({
        where: {
          userId,
          email,
          consentType,
          granted: true,
        },
        orderBy: { grantedAt: "desc" },
      });

      if (!consent) return false;

      // Check if consent has expired
      const expiryDate = new Date(consent.grantedAt);
      expiryDate.setDate(expiryDate.getDate() + this.CONSENT_EXPIRY_DAYS);

      return new Date() <= expiryDate;
    } catch (error) {
      console.error("❌ Error checking consent:", error);
      return false; // Fail safe - assume no consent
    }
  }

  /**
   * Generate unsubscribe token
   */
  generateUnsubscribeToken(email: string): string {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2);
    return Buffer.from(`${email}:${timestamp}:${random}`).toString("base64");
  }

  /**
   * Validate unsubscribe token
   */
  validateUnsubscribeToken(token: string): { email: string; valid: boolean } {
    try {
      const decoded = Buffer.from(token, "base64").toString("utf-8");
      const [email, timestamp, random] = decoded.split(":");

      // Check if token is not too old (30 days)
      const tokenAge = Date.now() - parseInt(timestamp);
      const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days

      return {
        email,
        valid: tokenAge <= maxAge && email.includes("@"),
      };
    } catch (error) {
      return { email: "", valid: false };
    }
  }

  /**
   * Process unsubscribe request
   */
  async processUnsubscribe(request: UnsubscribeRequest): Promise<{
    success: boolean;
    message: string;
    preferences?: any;
  }> {
    try {
      const { email, valid } = this.validateUnsubscribeToken(request.token);

      if (!valid) {
        return {
          success: false,
          message: "Invalid or expired unsubscribe link",
        };
      }

      // Find user by email
      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        return {
          success: false,
          message: "User not found",
        };
      }

      // Revoke all marketing consents
      await this.revokeConsent(user.id, email, "marketing", request.reason);
      await this.revokeConsent(user.id, email, "newsletter", request.reason);

      // If specific preferences provided, handle them
      if (request.preferences) {
        if (!request.preferences.marketing) {
          await this.revokeConsent(
            user.id,
            email,
            "marketing",
            "User preference"
          );
        }
        if (!request.preferences.newsletter) {
          await this.revokeConsent(
            user.id,
            email,
            "newsletter",
            "User preference"
          );
        }
        if (!request.preferences.transactional) {
          await this.revokeConsent(
            user.id,
            email,
            "transactional",
            "User preference"
          );
        }
      }

      // Send confirmation email
      await this.sendUnsubscribeConfirmation(email, user.name || "User");

      return {
        success: true,
        message: "Successfully unsubscribed from marketing emails",
        preferences: request.preferences,
      };
    } catch (error) {
      console.error("❌ Error processing unsubscribe:", error);
      return {
        success: false,
        message: "Failed to process unsubscribe request",
      };
    }
  }

  /**
   * Send unsubscribe confirmation email
   */
  private async sendUnsubscribeConfirmation(
    email: string,
    userName: string
  ): Promise<void> {
    const subject = "You've been unsubscribed - TechTots STEM Store";

    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #333; text-align: center; margin-bottom: 30px;">
          Unsubscribe Confirmation
        </h1>
        
        <div style="background: #d4edda; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
          <h3 style="color: #155724; margin-top: 0;">✅ Successfully Unsubscribed</h3>
          <p>Hello ${userName},</p>
          <p>You have been successfully unsubscribed from our marketing emails.</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #495057; margin-top: 0;">What This Means</h3>
          <ul style="color: #495057;">
            <li>You will no longer receive promotional emails</li>
            <li>You will still receive important transactional emails (order confirmations, etc.)</li>
            <li>You can resubscribe anytime by visiting our website</li>
          </ul>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXTAUTH_URL}/newsletter/subscribe" 
             style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Resubscribe to Newsletter
          </a>
        </div>
        
        <p style="color: #6c757d; font-size: 14px; margin-top: 30px; text-align: center;">
          Thank you for being part of the TechTots community!<br>
          If you have any questions, please contact our support team.
        </p>
      </div>
    `;

    await sendEmailViaUnifiedSystem(email, subject, html, {
      template: "unsubscribe-confirmation",
      variables: { userName },
      priority: 2,
    });
  }

  /**
   * Get compliance report
   */
  async getComplianceReport(): Promise<ComplianceReport> {
    try {
      const totalConsents = await prisma.consentRecord.count();
      const activeConsents = await prisma.consentRecord.count({
        where: { granted: true },
      });
      const revokedConsents = await prisma.consentRecord.count({
        where: { granted: false },
      });

      const consentBreakdown = {
        marketing: await prisma.consentRecord.count({
          where: { consentType: "marketing", granted: true },
        }),
        newsletter: await prisma.consentRecord.count({
          where: { consentType: "newsletter", granted: true },
        }),
        transactional: await prisma.consentRecord.count({
          where: { consentType: "transactional", granted: true },
        }),
      };

      const recentRevocations = await prisma.consentRecord.findMany({
        where: { granted: false },
        orderBy: { revokedAt: "desc" },
        take: 10,
      });

      // Calculate compliance score (simplified)
      const complianceScore =
        totalConsents > 0
          ? Math.round((activeConsents / totalConsents) * 100)
          : 100;

      return {
        totalConsents,
        activeConsents,
        revokedConsents,
        consentBreakdown,
        recentRevocations,
        complianceScore,
      };
    } catch (error) {
      console.error("❌ Error generating compliance report:", error);
      throw new Error("Failed to generate compliance report");
    }
  }

  /**
   * Clean up expired consents
   */
  async cleanupExpiredConsents(): Promise<number> {
    try {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() - this.CONSENT_EXPIRY_DAYS);

      const result = await prisma.consentRecord.updateMany({
        where: {
          granted: true,
          grantedAt: { lt: expiryDate },
        },
        data: {
          granted: false,
          revokedAt: new Date(),
          metadata: {
            reason: "expired",
          },
        },
      });

      return result.count;
    } catch (error) {
      console.error("❌ Error cleaning up expired consents:", error);
      return 0;
    }
  }
}
