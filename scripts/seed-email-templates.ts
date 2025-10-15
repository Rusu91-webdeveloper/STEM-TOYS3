/**
 * Seed Email Templates from JSON file
 *
 * This script imports email templates from the EmailTemplate.json file
 * into the database.
 *
 * Run: pnpm tsx scripts/seed-email-templates.ts
 */

import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding Email Templates from JSON...\n");

  try {
    // Read the JSON file - user should have this file
    const jsonPath = path.resolve(__dirname, "../EmailTemplate.json");

    if (!fs.existsSync(jsonPath)) {
      console.log("⚠️  EmailTemplate.json not found at project root.");
      console.log("   Looking in Downloads folder...");

      const downloadsPath = path.resolve(
        process.env.HOME || "",
        "Downloads/EmailTemplate.json"
      );
      if (!fs.existsSync(downloadsPath)) {
        throw new Error(
          "EmailTemplate.json not found. Please place it in the project root or Downloads folder."
        );
      }

      console.log("✅ Found in Downloads folder\n");
      const fileContent = fs.readFileSync(downloadsPath, "utf-8");
      const templates = JSON.parse(fileContent);

      await seedTemplates(templates);
    } else {
      console.log("✅ Found EmailTemplate.json in project root\n");
      const fileContent = fs.readFileSync(jsonPath, "utf-8");
      const templates = JSON.parse(fileContent);

      await seedTemplates(templates);
    }
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

async function seedTemplates(templates: any[]) {
  console.log(`Found ${templates.length} templates to seed\n`);

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const template of templates) {
    try {
      // Check if template exists
      const existing = await prisma.emailTemplate.findUnique({
        where: { slug: template.slug },
      });

      if (existing) {
        // Update existing template
        await prisma.emailTemplate.update({
          where: { slug: template.slug },
          data: {
            name: template.name,
            subject: template.subject,
            content: template.content,
            category: template.category,
            isActive: template.isActive,
            variables: template.variables || [],
            metadata: template.metadata,
            updatedAt: new Date(),
            createdBy: template.createdBy || "system",
          },
        });
        console.log(`✅ Updated: ${template.name} (${template.slug})`);
        updated++;
      } else {
        // Create new template
        await prisma.emailTemplate.create({
          data: {
            id: template.id,
            name: template.name,
            slug: template.slug,
            subject: template.subject,
            content: template.content,
            category: template.category,
            isActive: template.isActive,
            variables: template.variables || [],
            metadata: template.metadata,
            createdBy: template.createdBy || "system",
            createdAt: template.createdAt
              ? new Date(template.createdAt)
              : new Date(),
            updatedAt: template.updatedAt
              ? new Date(template.updatedAt)
              : new Date(),
          },
        });
        console.log(`✅ Created: ${template.name} (${template.slug})`);
        created++;
      }
    } catch (error) {
      console.error(`❌ Failed to process ${template.name}:`, error);
      skipped++;
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Created: ${created}`);
  console.log(`   Updated: ${updated}`);
  console.log(`   Skipped: ${skipped}`);
  console.log(`   Total: ${templates.length}\n`);

  // Verify important templates exist
  console.log("🔍 Verifying important templates...\n");

  const welcomeTemplate = await prisma.emailTemplate.findUnique({
    where: { slug: "welcome" },
  });

  const verificationTemplate = await prisma.emailTemplate.findUnique({
    where: { slug: "account-verification" },
  });

  if (welcomeTemplate) {
    console.log(`✅ Welcome template exists: ${welcomeTemplate.name}`);
  } else {
    console.log(`⚠️  Welcome template NOT found`);
  }

  if (verificationTemplate) {
    console.log(
      `✅ Verification template exists: ${verificationTemplate.name}`
    );
  } else {
    console.log(`⚠️  Verification template NOT found`);
  }

  console.log("\n✨ Seeding completed!\n");
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch(error => {
    console.error("💥 Script failed:", error);
    process.exit(1);
  });
