#!/usr/bin/env tsx

/**
 * Seed Email Templates Script
 *
 * This script populates the database with pre-built email templates
 * from the template library.
 */

import { PrismaClient } from "@prisma/client";
import { EMAIL_TEMPLATES } from "../lib/email/template-library";

const prisma = new PrismaClient();

async function seedEmailTemplates() {
  console.log("🌱 Starting email template seeding...");

  try {
    // Check if templates already exist
    const existingTemplates = await prisma.emailTemplate.count();
    console.log(`📊 Found ${existingTemplates} existing templates`);

    // Insert new templates (skip if they already exist)
    console.log("📧 Inserting email templates...");

    for (const template of EMAIL_TEMPLATES) {
      const { metadata, ...templateData } = template;

      // Check if template already exists
      const existingTemplate = await prisma.emailTemplate.findUnique({
        where: { slug: template.slug },
      });

      if (existingTemplate) {
        console.log(`⏭️  Skipping existing template: ${template.name}`);
        continue;
      }

      await prisma.emailTemplate.create({
        data: {
          ...templateData,
          createdBy: "system", // System-generated templates
          metadata: metadata || {},
        },
      });

      console.log(`✅ Created template: ${template.name}`);
    }

    console.log(
      `🎉 Successfully seeded ${EMAIL_TEMPLATES.length} email templates!`
    );

    // Display summary
    const categories = EMAIL_TEMPLATES.reduce(
      (acc, template) => {
        acc[template.category] = (acc[template.category] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    console.log("\n📊 Template Summary:");
    Object.entries(categories).forEach(([category, count]) => {
      console.log(`  ${category}: ${count} templates`);
    });
  } catch (error) {
    console.error("❌ Error seeding email templates:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeding
if (require.main === module) {
  seedEmailTemplates();
}

export { seedEmailTemplates };
