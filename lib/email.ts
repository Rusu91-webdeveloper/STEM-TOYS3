/**
 * Email service for NextCommerce
 * Uses Nodemailer for sending emails
 */

export { getEmailService } from "./email";

import {
  sendEmailViaUnifiedSystem,
  emailTemplates as nodemailerTemplates,
} from "./nodemailer";
import { isDevelopment } from "./security";
import { DatabaseTemplateService } from "./email/database-template-service";

// Email types
export type EmailTemplate =
  | "welcome"
  | "verification"
  | "password-reset"
  | "order-confirmation"
  | "order-fulfilled";

interface EmailOptions {
  to: string;
  subject: string;
  template: EmailTemplate;
  data: Record<string, any>;
}

/**
 * Send an email
 * @param options Email options including recipient, subject, template and data
 * @returns Promise that resolves when the email is sent
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  // In development, we'll log the email details
  if (isDevelopment()) {
    console.log("\n------- EMAIL SENDING SIMULATION -------");
    console.log(`To: ${options.to}`);
    console.log(`Subject: ${options.subject}`);
    console.log(`Template: ${options.template}`);
    console.log("Data:", options.data);
    console.log("---------------------------------------\n");
  }

  try {
    // Map old template names to new template slugs
    const templateMapping: Record<string, string> = {
      welcome: "welcome",
      verification: "email-verification",
      "password-reset": "password-reset",
      "order-confirmation": "order-confirmation",
      "order-fulfilled": "order-fulfilled",
    };

    const templateSlug = templateMapping[options.template];

    if (!templateSlug) {
      throw new Error(`Unsupported email template: ${options.template}`);
    }

    // Use the database template service
    const result = await DatabaseTemplateService.sendEmailWithTemplate({
      to: options.to,
      templateSlug: templateSlug,
      data: options.data,
      subject: options.subject,
    });

    return result.success;
  } catch (error) {
    console.error("Failed to send email:", error);

    // If we're in development mode, we'll simulate a successful email delivery
    if (isDevelopment()) {
      console.log("📧 DEV MODE: Email would have been sent successfully.");

      // Print the verification link for easy testing if available
      if (
        options.template === "verification" &&
        options.data.verificationLink
      ) {
        console.log(`\n🔗 Verification Link for testing:`);
        console.log(options.data.verificationLink);
      }

      if (options.template === "password-reset" && options.data.resetLink) {
        console.log(`\n🔗 Password Reset Link for testing:`);
        console.log(options.data.resetLink);
      }

      return true; // Simulate success
    }

    return false;
  }
}

/**
 * Generate a verification email link
 * @param email User's email address
 * @param token Verification token
 * @returns The verification URL
 */
export function generateVerificationLink(email: string, token: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return `${baseUrl}/auth/verify?token=${token}&email=${encodeURIComponent(email)}`;
}

/**
 * Generate a password reset link
 * @param email User's email address
 * @param token Reset token
 * @returns The password reset URL
 */
export function generatePasswordResetLink(
  email: string,
  token: string
): string {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return `${baseUrl}/auth/reset-password?token=${token}&email=${encodeURIComponent(email)}`;
}

/**
 * Send a welcome email
 * @param email User's email address
 * @param name User's name
 * @returns Promise that resolves when the email is sent
 */
export async function sendWelcomeEmail(
  email: string,
  name: string
): Promise<boolean> {
  const result = await DatabaseTemplateService.sendWelcomeEmail(email, name);
  return result.success;
}

/**
 * Send a verification email
 * @param email User's email address
 * @param name User's name
 * @param token Verification token
 * @returns Promise that resolves when the email is sent
 */
export async function sendVerificationEmail(
  email: string,
  name: string,
  token: string
): Promise<boolean> {
  const verificationLink = generateVerificationLink(email, token);
  const result = await DatabaseTemplateService.sendVerificationEmail(
    email,
    name,
    verificationLink
  );
  return result.success;
}

/**
 * Send a password reset email
 * @param email User's email address
 * @param token Reset token
 * @returns Promise that resolves when the email is sent
 */
export async function sendPasswordResetEmail(
  email: string,
  token: string
): Promise<boolean> {
  const resetLink = generatePasswordResetLink(email, token);
  const result = await DatabaseTemplateService.sendPasswordResetEmail(
    email,
    resetLink
  );
  return result.success;
}

/**
 * Send all necessary emails for a new user
 * @param email User's email address
 * @param name User's name
 * @param verificationToken Verification token
 * @returns Promise that resolves when all emails are sent
 */
export async function sendUserVerificationEmails(
  email: string,
  name: string,
  verificationToken: string
): Promise<boolean> {
  try {
    // Send welcome email
    await sendWelcomeEmail(email, name);

    // Send verification email
    await sendVerificationEmail(email, name, verificationToken);

    return true;
  } catch (error) {
    console.error("Failed to send user verification emails:", error);
    return false;
  }
}
