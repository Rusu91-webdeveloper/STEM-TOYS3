/**
 * Email service for NextCommerce
 * Uses Nodemailer for sending emails
 */

import { sendMail, emailTemplates as nodemailerTemplates } from "./nodemailer";
import { isDevelopment } from "./security";

// Email types
export type EmailTemplate =
  | "welcome"
  | "verification"
  | "password-reset"
  | "order-confirmation";

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
    // Check if email configuration is set
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log("⚠️ Email credentials are not set. Using development mode.");
      return true; // Return success in development mode
    }

    // Send the email using the appropriate template
    switch (options.template) {
      case "welcome":
        // Use the nodemailer welcome template
        await nodemailerTemplates.welcome({
          to: options.to,
          name: options.data.name as string,
        });
        break;

      case "verification":
        // Use the nodemailer verification template
        await nodemailerTemplates.verification({
          to: options.to,
          name: options.data.name as string,
          verificationLink: options.data.verificationLink as string,
          expiresIn: options.data.expiresIn as string,
        });
        break;

      case "password-reset":
        // Use the existing nodemailer template
        await nodemailerTemplates.passwordReset({
          to: options.to,
          resetLink: options.data.resetLink as string,
        });
        break;

      case "order-confirmation":
        // Use the existing nodemailer template
        await nodemailerTemplates.orderConfirmation({
          to: options.to,
          order: options.data.order,
        });
        break;

      default:
        throw new Error(`Unsupported email template: ${options.template}`);
    }

    return true;
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
  return sendEmail({
    to: email,
    subject: "Welcome to TeechTots!",
    template: "welcome",
    data: { name },
  });
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

  return sendEmail({
    to: email,
    subject: "Verify your email address",
    template: "verification",
    data: {
      name,
      verificationLink,
      expiresIn: "24 hours",
    },
  });
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

  return sendEmail({
    to: email,
    subject: "Reset your password",
    template: "password-reset",
    data: {
      resetLink,
      expiresIn: "1 hour",
    },
  });
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
