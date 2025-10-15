/**
 * Seed Email Triggers from JSON file
 *
 * This script imports email triggers from the EmailTrigger.json file
 * into the database.
 *
 * Run: pnpm tsx scripts/seed-email-triggers.ts
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
  console.log("🌱 Seeding Email Triggers from JSON...\n");

  try {
    // Read the JSON file - user should have this file
    const jsonPath = path.resolve(__dirname, "../EmailTrigger.json");

    if (!fs.existsSync(jsonPath)) {
      console.log("⚠️  EmailTrigger.json not found at project root.");
      console.log("   Looking in Downloads folder...");

      const downloadsPath = path.resolve(
        process.env.HOME || "",
        "Downloads/EmailTrigger.json"
      );
      if (!fs.existsSync(downloadsPath)) {
        throw new Error(
          "EmailTrigger.json not found. Please place it in the project root or Downloads folder."
        );
      }

      console.log("✅ Found in Downloads folder\n");
      const fileContent = fs.readFileSync(downloadsPath, "utf-8");
      const triggers = JSON.parse(fileContent);

      await seedTriggers(triggers);
    } else {
      console.log("✅ Found EmailTrigger.json in project root\n");
      const fileContent = fs.readFileSync(jsonPath, "utf-8");
      const triggers = JSON.parse(fileContent);

      await seedTriggers(triggers);
    }
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

async function seedTriggers(triggers: any[]) {
  console.log(`Found ${triggers.length} triggers to seed\n`);

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const trigger of triggers) {
    try {
      // Check if trigger exists by name
      const existing = await prisma.emailTrigger.findFirst({
        where: { name: trigger.name },
      });

      if (existing) {
        // Update existing trigger
        await prisma.emailTrigger.update({
          where: { id: existing.id },
          data: {
            description: trigger.description,
            type: trigger.type,
            status: trigger.status,
            conditions: trigger.conditions,
            actionType: trigger.actionType,
            actionData: trigger.actionData,
            priority: trigger.priority,
            cooldownHours: trigger.cooldownHours,
            maxExecutions: trigger.maxExecutions,
            isActive: trigger.isActive,
            segmentFilter: trigger.segmentFilter,
            lifecycleFilter: trigger.lifecycleFilter,
            tenantId: trigger.tenantId,
            tags: trigger.tags || [],
            updatedAt: new Date(),
          },
        });
        console.log(`✅ Updated: ${trigger.name}`);
        updated++;
      } else {
        // Create new trigger
        await prisma.emailTrigger.create({
          data: {
            id: trigger.id,
            name: trigger.name,
            description: trigger.description,
            type: trigger.type,
            status: trigger.status,
            conditions: trigger.conditions,
            actionType: trigger.actionType,
            actionData: trigger.actionData,
            priority: trigger.priority,
            cooldownHours: trigger.cooldownHours,
            maxExecutions: trigger.maxExecutions,
            isActive: trigger.isActive,
            segmentFilter: trigger.segmentFilter,
            lifecycleFilter: trigger.lifecycleFilter,
            tenantId: trigger.tenantId,
            tags: trigger.tags || [],
            createdBy: trigger.createdBy || "system",
            createdAt: trigger.createdAt
              ? new Date(trigger.createdAt)
              : new Date(),
            updatedAt: trigger.updatedAt
              ? new Date(trigger.updatedAt)
              : new Date(),
          },
        });
        console.log(`✅ Created: ${trigger.name}`);
        created++;
      }
    } catch (error) {
      console.error(`❌ Failed to process ${trigger.name}:`, error);
      skipped++;
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Created: ${created}`);
  console.log(`   Updated: ${updated}`);
  console.log(`   Skipped: ${skipped}`);
  console.log(`   Total: ${triggers.length}\n`);

  // List all active triggers
  const activeTriggers = await prisma.emailTrigger.findMany({
    where: { isActive: true },
    orderBy: { priority: "desc" },
    select: {
      name: true,
      type: true,
      priority: true,
      segmentFilter: true,
    },
  });

  console.log("📋 Active triggers:");
  activeTriggers.forEach((trigger, index) => {
    console.log(
      `   ${index + 1}. ${trigger.name} (Priority: ${trigger.priority}, Type: ${trigger.type})`
    );
    if (trigger.segmentFilter) {
      console.log(`      Segment: ${trigger.segmentFilter}`);
    }
  });

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
