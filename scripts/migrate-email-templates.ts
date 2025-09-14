#!/usr/bin/env tsx

/**
 * Script to migrate hardcoded email templates to database
 * This will populate the EmailTemplate table with all the templates from template-library.ts
 */

import { PrismaClient } from "@prisma/client";
import { EMAIL_TEMPLATES } from "../lib/email/template-library";
import { ADDITIONAL_EMAIL_TEMPLATES } from "../lib/email/additional-templates";

const prisma = new PrismaClient();

async function migrateEmailTemplates() {
  console.log("🚀 Starting email template migration...");

  try {
    // First, check if templates already exist
    const existingTemplates = await prisma.emailTemplate.count();
    console.log(`📊 Found ${existingTemplates} existing templates in database`);

    if (existingTemplates > 0) {
      console.log(
        "⚠️  Templates already exist in database. Skipping migration."
      );
      console.log(
        "   If you want to re-migrate, please clear the EmailTemplate table first."
      );
      return;
    }

    // Combine all templates
    const allTemplates = [...EMAIL_TEMPLATES, ...ADDITIONAL_EMAIL_TEMPLATES];
    console.log(`📝 Found ${allTemplates.length} templates to migrate`);

    // Migrate each template
    let successCount = 0;
    let errorCount = 0;

    for (const template of allTemplates) {
      try {
        await prisma.emailTemplate.create({
          data: {
            id: template.id,
            name: template.name,
            slug: template.slug,
            subject: template.subject,
            content: template.content,
            variables: template.variables || [],
            category: template.category,
            isActive: template.isActive !== false, // Default to true
            createdBy: template.createdBy || "system",
            metadata: template.metadata || {},
          },
        });

        console.log(`✅ Migrated: ${template.name} (${template.slug})`);
        successCount++;
      } catch (error) {
        console.error(`❌ Failed to migrate ${template.name}:`, error);
        errorCount++;
      }
    }

    console.log("\n📊 Migration Summary:");
    console.log(`   ✅ Successfully migrated: ${successCount} templates`);
    console.log(`   ❌ Failed to migrate: ${errorCount} templates`);
    console.log(`   📝 Total processed: ${allTemplates.length} templates`);

    if (successCount > 0) {
      console.log(
        "\n🎉 Email templates have been successfully migrated to the database!"
      );
      console.log(
        "   You can now view and edit them in the admin dashboard at /admin/email-templates"
      );
    }
  } catch (error) {
    console.error("💥 Migration failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
migrateEmailTemplates().catch(console.error);
