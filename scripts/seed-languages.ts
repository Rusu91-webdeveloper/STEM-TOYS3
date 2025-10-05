#!/usr/bin/env tsx

/**
 * Language Seeding Script for TechTots STEM Store
 *
 * Seeds the Language table with basic languages for digital files
 */

import { PrismaClient } from "@prisma/client";
import "dotenv/config";

const prisma = new PrismaClient();

// Basic languages for digital files
const basicLanguages = [
  {
    code: "en",
    name: "English",
    nativeName: "English",
    isAvailable: true,
  },
  {
    code: "ro",
    name: "Romanian",
    nativeName: "Română",
    isAvailable: true,
  },
];

async function seedLanguages() {
  console.log("🌱 Starting language seeding...");

  try {
    // Check existing languages
    const existingCount = await prisma.language.count();
    console.log(`📊 Found ${existingCount} existing languages`);

    if (existingCount >= basicLanguages.length) {
      console.log("⚠️  Languages already exist. Skipping seeding.");
      return;
    }

    // Create basic languages
    console.log("📂 Creating basic languages...");

    for (const language of basicLanguages) {
      const existingLanguage = await prisma.language.findUnique({
        where: { code: language.code },
      });

      if (!existingLanguage) {
        const createdLanguage = await prisma.language.create({
          data: language,
        });
        console.log(
          `✅ Created language: ${createdLanguage.name} (${createdLanguage.code})`
        );
      } else {
        console.log(`⏭️  Language ${language.name} already exists`);
        // Ensure it's available
        if (!existingLanguage.isAvailable) {
          await prisma.language.update({
            where: { code: language.code },
            data: { isAvailable: true },
          });
          console.log(`✅ Updated language ${language.name} to available`);
        }
      }
    }

    // Verify the seeding
    const totalLanguages = await prisma.language.count();
    console.log(`\n🎉 Successfully seeded languages!`);
    console.log(`📊 Total languages: ${totalLanguages}`);

    // List all languages
    const languages = await prisma.language.findMany({
      select: { name: true, code: true, nativeName: true, isAvailable: true },
      orderBy: { name: "asc" },
    });

    console.log("\n📋 All Languages:");
    languages.forEach(lang => {
      console.log(
        `  • ${lang.name} (${lang.code}) - ${lang.nativeName} - ${lang.isAvailable ? "Available" : "Unavailable"}`
      );
    });
  } catch (error) {
    console.error("❌ Error seeding languages:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeding
seedLanguages();
