/**
 * Email Configuration Verification Script
 *
 * This script checks if your email service is properly configured
 * and can send test emails.
 *
 * Usage:
 *   npx tsx scripts/verify-email-config.ts
 */

// Load environment variables from .env.local
import { config } from "dotenv";
import { resolve } from "path";

// Load .env.local first, then .env
config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

import { getEmailService } from "@/lib/email";
import { serviceConfig } from "@/lib/config";

async function verifyEmailConfiguration() {
  console.log("🔍 Verifying Email Configuration...\n");

  // Check 1: Email service enabled
  console.log("1️⃣ Checking if email service is enabled...");
  const isEnabled = serviceConfig.isEmailServiceEnabled();
  console.log(
    `   ${isEnabled ? "✅" : "❌"} Email service: ${isEnabled ? "ENABLED" : "DISABLED"}`
  );

  if (!isEnabled) {
    console.log("\n⚠️  Email service is not enabled!");
    console.log("\nPlease set one of the following environment variables:");
    console.log("  - RESEND_API_KEY (for Resend)");
    console.log("  - BREVO_API_KEY (for Brevo)");
    console.log("  - GMAIL_USER + GMAIL_APP_PASSWORD (for Gmail)");
    console.log("\nAnd also set:");
    console.log("  - EMAIL_FROM (e.g., noreply@techtots.ro)");
    console.log("  - EMAIL_FROM_NAME (e.g., TechTots STEM Store)");
    process.exit(1);
  }

  // Check 2: Environment variables
  console.log("\n2️⃣ Checking environment variables...");
  const envVars = {
    EMAIL_PROVIDER: process.env.EMAIL_PROVIDER || "resend (default)",
    EMAIL_FROM: process.env.EMAIL_FROM || "❌ NOT SET",
    EMAIL_FROM_NAME:
      process.env.EMAIL_FROM_NAME || "TechTots STEM Store (default)",
    RESEND_API_KEY: process.env.RESEND_API_KEY ? "✅ SET" : "❌ NOT SET",
    BREVO_API_KEY: process.env.BREVO_API_KEY ? "✅ SET" : "❌ NOT SET",
    GMAIL_USER: process.env.GMAIL_USER ? "✅ SET" : "❌ NOT SET",
  };

  for (const [key, value] of Object.entries(envVars)) {
    console.log(`   ${key}: ${value}`);
  }

  // Check 3: Test email send
  console.log("\n3️⃣ Testing email send...");
  const testEmail = process.env.TEST_EMAIL || "test@example.com";

  if (testEmail === "test@example.com") {
    console.log("\n⚠️  No test email provided.");
    console.log("To test email sending, set TEST_EMAIL environment variable:");
    console.log(
      "   TEST_EMAIL=your-email@example.com npx tsx scripts/verify-email-config.ts"
    );
    console.log("\n✅ Configuration check complete!");
    process.exit(0);
  }

  try {
    console.log(`   Sending test email to: ${testEmail}`);
    const emailService = getEmailService();

    const result = await emailService.sendEmail({
      to: testEmail,
      subject: "Test Email from TechTots - Email Service Verification",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">🎉 Email Service Working!</h2>
          <p>This is a test email from your TechTots application.</p>
          <p>If you received this email, your email service is configured correctly.</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="color: #6b7280; font-size: 14px;">
            <strong>Configuration Details:</strong><br>
            Provider: ${process.env.EMAIL_PROVIDER || "resend"}<br>
            From: ${process.env.EMAIL_FROM}<br>
            Time: ${new Date().toISOString()}
          </p>
        </div>
      `,
    });

    if (result.success) {
      console.log(`   ✅ Email sent successfully!`);
      console.log(`   📧 Message ID: ${result.messageId || "N/A"}`);
      console.log(`   🔌 Provider: ${result.provider}`);
      console.log(`   ⏱️  Delivery Time: ${result.metrics?.deliveryTime}ms`);
      console.log(`\n✅ Email configuration is working correctly!`);
    } else {
      console.log(`   ❌ Failed to send email!`);
      console.log(`   Error: ${result.error}`);
      console.log("\n❌ Email service is not working correctly.");
      process.exit(1);
    }
  } catch (error) {
    console.log(`   ❌ Error sending test email:`);
    console.error(error);
    console.log("\n❌ Email service is not working correctly.");
    process.exit(1);
  }
}

// Run the verification
verifyEmailConfiguration()
  .then(() => {
    console.log("\n✅ All checks passed!");
    process.exit(0);
  })
  .catch(error => {
    console.error("\n❌ Verification failed:");
    console.error(error);
    process.exit(1);
  });
