/**
 * Email templates main index
 *
 * This file provides a unified interface for all email templates,
 * organized into modular categories for better maintainability.
 *
 * Enterprise-grade email system with unified service integration.
 */

// Export unified email service
export { UnifiedEmailService } from "./unified-service";
export type {
  EmailProvider,
  EmailProviderSendResult,
  UnifiedEmailRequest,
  UnifiedEmailResponse,
  EmailServiceOptions,
} from "./types";

// Export provider implementations
export { ResendProvider } from "./providers/resend";
export { BrevoProvider } from "./providers/brevo";
export { GmailProvider } from "./providers/gmail";

// Export all authentication templates
export {
  sendWelcomeEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
} from "./auth-templates";

// Export all order templates
export {
  sendDigitalBookDeliveryEmail,
  sendOrderConfirmationEmail,
  sendShippingNotificationEmail,
} from "./order-templates";

// Export all coupon templates
export { sendCouponEmail } from "./coupon-templates";

// Export all return templates
export {
  sendReturnApprovedEmail,
  sendReturnRejectedEmail,
  sendBulkReturnApprovedEmail,
} from "./return-templates";

// Export base utilities for custom templates
export {
  getStoreSettings,
  getBaseUrl,
  formatPrice,
  generateEmailHeader,
  generateEmailFooter,
  generateEmailContainer,
  generateEmailHTML,
  type SEOMetadata,
  type BlogWithAuthorAndCategory,
} from "./base";

// Initialize unified email service
import { UnifiedEmailService } from "./unified-service";
import { ResendProvider } from "./providers/resend";
import { BrevoProvider } from "./providers/brevo";
import { GmailProvider } from "./providers/gmail";

/**
 * Enterprise Email Service Factory
 * Creates and configures the unified email service based on environment configuration
 */
export function createEmailService() {
  const providerType = process.env.EMAIL_PROVIDER || "resend";

  // Initialize primary provider
  let primaryProvider: any;
  let fallbackProvider: any;

  switch (providerType) {
    case "resend":
      primaryProvider = new ResendProvider();
      fallbackProvider = process.env.EMAIL_FALLBACK_API_KEY
        ? new BrevoProvider()
        : undefined;
      break;
    case "brevo":
      primaryProvider = new BrevoProvider();
      fallbackProvider = process.env.EMAIL_FALLBACK_API_KEY
        ? new ResendProvider()
        : undefined;
      break;
    case "gmail":
      primaryProvider = new GmailProvider();
      fallbackProvider = process.env.EMAIL_FALLBACK_API_KEY
        ? new ResendProvider()
        : undefined;
      break;
    default:
      throw new Error(`Unsupported email provider: ${providerType}`);
  }

  return new UnifiedEmailService({
    primaryProvider,
    fallbackProvider,
    fromEmail: process.env.EMAIL_FROM || process.env.SUPPORT_EMAIL || "noreply@techtots.ro",
    fromName: process.env.EMAIL_FROM_NAME || "TechTots STEM Store",
    replyTo: process.env.EMAIL_REPLY_TO,
  });
}

// Singleton instance for application-wide use
let emailServiceInstance: UnifiedEmailService | null = null;

/**
 * Get the global email service instance
 */
export function getEmailService(): UnifiedEmailService {
  if (!emailServiceInstance) {
    emailServiceInstance = createEmailService();
  }
  return emailServiceInstance;
}

// Legacy compatibility: Export sendEmailViaUnifiedSystem object for existing code
import {
  sendWelcomeEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
} from "./auth-templates";
import { sendCouponEmail } from "./coupon-templates";
import {
  sendDigitalBookDeliveryEmail,
  sendOrderConfirmationEmail,
  sendShippingNotificationEmail,
} from "./order-templates";

/**
 * Legacy sendEmailViaUnifiedSystem object for backward compatibility
 * @deprecated Use individual template functions instead
 */
export const sendEmailViaUnifiedSystem = {
  /**
   * @deprecated Use sendWelcomeEmail instead
   */
  welcome: sendWelcomeEmail,

  /**
   * @deprecated Use sendVerificationEmail instead
   */
  verification: sendVerificationEmail,

  /**
   * @deprecated Use sendPasswordResetEmail instead
   */
  passwordReset: sendPasswordResetEmail,

  /**
   * @deprecated Use sendDigitalBookDeliveryEmail instead
   */
  digitalBookDelivery: sendDigitalBookDeliveryEmail,

  /**
   * @deprecated Use sendOrderConfirmationEmail instead
   */
  orderConfirmation: sendOrderConfirmationEmail,

  /**
   * @deprecated Use sendShippingNotificationEmail instead
   */
  shippingNotification: sendShippingNotificationEmail,

  /**
   * @deprecated Use sendCouponEmail instead
   */
  coupon: sendCouponEmail,
};
