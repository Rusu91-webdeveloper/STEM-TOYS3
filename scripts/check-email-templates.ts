/**
 * Script to check existing email templates in the database
 */

import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";
import * as path from "path";

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const prisma = new PrismaClient();

async function main() {
  console.log("🔍 Checking Email Templates in Database...\n");

  try {
    const templates = await prisma.emailTemplate.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        category: true,
        isActive: true,
      },
      orderBy: { name: "asc" },
    });

    console.log(`Found ${templates.length} email templates:\n`);

    templates.forEach((template, index) => {
      console.log(`${index + 1}. ${template.name}`);
      console.log(`   Slug: ${template.slug}`);
      console.log(`   Category: ${template.category}`);
      console.log(`   Active: ${template.isActive}`);
      console.log(`   ID: ${template.id}\n`);
    });

    // Check specifically for verification-related templates
    const verificationTemplates = templates.filter(
      t =>
        t.slug.includes("verification") ||
        t.slug.includes("verify") ||
        t.slug.includes("account")
    );

    if (verificationTemplates.length > 0) {
      console.log("📧 Verification-related templates:");
      verificationTemplates.forEach(t => {
        console.log(`   - ${t.name} (${t.slug})`);
      });
    } else {
      console.log("⚠️  No verification-related templates found!");
    }
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
