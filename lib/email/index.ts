/**
 * Email templates main index
 *
 * This file provides a unified interface for all email templates,
 * organized into modular categories for better maintainability.
 *
 * Replaces the original monolithic brevoTemplates.ts file.
 */

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

// Legacy compatibility: Export emailTemplates object for existing code
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
 * Legacy emailTemplates object for backward compatibility
 * @deprecated Use individual template functions instead
 */
export const emailTemplates = {
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
