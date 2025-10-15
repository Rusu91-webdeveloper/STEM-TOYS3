/**
 * Migration Script: Add Email Verification Trigger
 *
 * This script adds an EmailTrigger that automatically sends verification emails
 * when a new user registers. This provides redundancy and scalability for the
 * email verification system.
 *
 * Run: pnpm tsx scripts/add-verification-email-trigger.ts
 */

import {
  PrismaClient,
  EmailTriggerType,
  EmailTriggerStatus,
} from "@prisma/client";
import * as dotenv from "dotenv";
import * as path from "path";

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Starting Email Verification Trigger Migration...\n");

  try {
    // First, get the account-verification template ID
    const verificationTemplate = await prisma.emailTemplate.findUnique({
      where: { slug: "account-verification" },
      select: { id: true, name: true, slug: true },
    });

    if (!verificationTemplate) {
      throw new Error(
        "❌ Account verification email template not found. Please ensure the template exists with slug 'account-verification'"
      );
    }

    console.log("✅ Found verification template:");
    console.log(`   ID: ${verificationTemplate.id}`);
    console.log(`   Name: ${verificationTemplate.name}`);
    console.log(`   Slug: ${verificationTemplate.slug}\n`);

    // Check if trigger already exists
    const existingTrigger = await prisma.emailTrigger.findFirst({
      where: {
        name: "Email Verification - New User Registration",
      },
    });

    if (existingTrigger) {
      console.log("⚠️  Email verification trigger already exists:");
      console.log(`   ID: ${existingTrigger.id}`);
      console.log(`   Status: ${existingTrigger.status}`);
      console.log(`   Is Active: ${existingTrigger.isActive}\n`);

      // Ask if we should update it
      console.log(
        "✨ Updating existing trigger to ensure correct configuration...\n"
      );

      const updatedTrigger = await prisma.emailTrigger.update({
        where: { id: existingTrigger.id },
        data: {
          description:
            "Send verification email when user registers without email verification",
          type: EmailTriggerType.SEGMENT_ENTER,
          status: EmailTriggerStatus.ACTIVE,
          conditions: {
            segment: "NEW",
            emailVerified: null,
          },
          actionType: "send_email",
          actionData: {
            subject: "Confirmă-ți contul TechTots - Link de verificare",
            templateId: verificationTemplate.id,
          },
          priority: 99, // Higher priority than welcome email (which is 100)
          cooldownHours: 24,
          isActive: true,
          tags: ["verification", "onboarding", "automated"],
        },
      });

      console.log("✅ Trigger updated successfully:");
      console.log(`   ID: ${updatedTrigger.id}`);
      console.log(`   Name: ${updatedTrigger.name}`);
      console.log(`   Type: ${updatedTrigger.type}`);
      console.log(`   Status: ${updatedTrigger.status}`);
      console.log(`   Priority: ${updatedTrigger.priority}`);
      console.log(`   Is Active: ${updatedTrigger.isActive}\n`);

      return updatedTrigger;
    }

    // Create the new trigger
    console.log("📧 Creating new email verification trigger...\n");

    const newTrigger = await prisma.emailTrigger.create({
      data: {
        name: "Email Verification - New User Registration",
        description:
          "Send verification email when user registers without email verification",
        type: EmailTriggerType.SEGMENT_ENTER,
        status: EmailTriggerStatus.ACTIVE,
        conditions: {
          segment: "NEW",
          emailVerified: null,
        },
        actionType: "send_email",
        actionData: {
          subject: "Confirmă-ți contul TechTots - Link de verificare",
          templateId: verificationTemplate.id,
        },
        priority: 99, // Higher priority than welcome email (which is 100)
        cooldownHours: 24,
        maxExecutions: null, // No limit on executions
        isActive: true,
        segmentFilter: "NEW", // Only trigger for NEW segment users
        lifecycleFilter: null,
        tenantId: null,
        tags: ["verification", "onboarding", "automated"],
        createdBy: "system",
      },
    });

    console.log("✅ Email verification trigger created successfully!");
    console.log(`   ID: ${newTrigger.id}`);
    console.log(`   Name: ${newTrigger.name}`);
    console.log(`   Type: ${newTrigger.type}`);
    console.log(`   Status: ${newTrigger.status}`);
    console.log(`   Priority: ${newTrigger.priority}`);
    console.log(`   Is Active: ${newTrigger.isActive}\n`);

    // Verify the complete setup
    console.log("🔍 Verifying complete setup...\n");

    const allTriggers = await prisma.emailTrigger.findMany({
      where: {
        type: EmailTriggerType.SEGMENT_ENTER,
        isActive: true,
        segmentFilter: "NEW",
      },
      orderBy: { priority: "desc" },
      select: {
        id: true,
        name: true,
        priority: true,
        actionType: true,
        isActive: true,
      },
    });

    console.log("📋 Active triggers for NEW segment users:");
    allTriggers.forEach((trigger, index) => {
      console.log(
        `   ${index + 1}. ${trigger.name} (Priority: ${trigger.priority})`
      );
    });

    console.log("\n✨ Migration completed successfully!\n");
    console.log("📌 Next steps:");
    console.log("   1. Test user registration to verify both emails are sent");
    console.log("   2. Check EmailTriggerExecution table for execution logs");
    console.log("   3. Monitor email delivery in Brevo dashboard\n");

    return newTrigger;
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
main()
  .then(() => {
    console.log("🎉 Script execution completed!");
    process.exit(0);
  })
  .catch(error => {
    console.error("💥 Script execution failed:", error);
    process.exit(1);
  });
