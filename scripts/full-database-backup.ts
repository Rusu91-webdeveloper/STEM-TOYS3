#!/usr/bin/env tsx

/**
 * Complete Database Backup & Restore System for TechTots STEM Store
 *
 * This script provides comprehensive backup and restore functionality for:
 * 1. All table schemas (via Prisma migrations)
 * 2. All data from tables that contain records
 * 3. Proper restoration order respecting foreign key constraints
 *
 * Usage:
 * - Backup: npx tsx scripts/full-database-backup.ts
 * - Restore: npx tsx scripts/full-database-restore.ts
 */

import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";
import "dotenv/config";

const prisma = new PrismaClient();

// All tables in dependency order (parent tables first)
const ALL_TABLES = [
  // Core authentication & user management
  "User",
  "PasswordResetToken",
  "Session",

  // User data
  "Address",
  "PaymentCard",
  "Wishlist",

  // Content management
  "Category",
  "Product",
  "MarketingCost",
  "ProductCost",
  "Review",

  // Blog system
  "Blog",
  "ContentVersion",

  // Book system
  "Book",
  "DigitalFile",
  "Language",
  "DigitalDownload",

  // Order management
  "Order",
  "OrderItem",
  "OrderStatusHistory",
  "Return",

  // Store settings
  "StoreSettings",

  // Marketing & subscriptions
  "Newsletter",
  "Coupon",
  "CouponUsage",
  "EmailTemplate",
  "EmailLog",
  "EmailCampaign",
  "EmailEvent",
  "EmailSequence",
  "EmailSequenceStep",
  "EmailSequenceUser",

  // Analytics & tracking
  "ConversionLog",
  "FacebookPixelEvent",
  "RomanianViralContent",
  "FacebookPixelConfig",
  "InstagramPixelConfig",
  "TikTokPixelConfig",
  "SEOAnalytics",
  "PerformanceMetric",

  // Supplier management
  "Supplier",
  "SupplierOrder",
  "SupplierOrderTracking",
  "SupplierInvoice",
  "SupplierMessage",
  "SupplierNotification",
  "SupplierSupportTicket",
  "SupplierTicketResponse",
  "SupplierAnnouncement",
  "SupplierPerformanceMetrics",

  // Support system
  "Ticket",

  // Automation & campaigns
  "AutomationWorkflow",
  "Campaign",
  "CampaignApplication",

  // Image processing
  "ImageMetadata",
  "ImageProcessingLog",
] as const;

async function createFullBackup() {
  console.log("🔄 Starting COMPLETE database backup process...\n");

  const backupData: Record<string, any[]> = {};
  let totalRecords = 0;

  try {
    // Export data from all tables
    for (const tableName of ALL_TABLES) {
      console.log(`📤 Exporting ${tableName}...`);

      try {
        const model = prisma[
          tableName.charAt(0).toLowerCase() + tableName.slice(1)
        ] as any;

        // Get all data from the table
        const data = await model.findMany();
        backupData[tableName] = data;

        if (data.length > 0) {
          totalRecords += data.length;
          console.log(
            `   ✅ Exported ${data.length} records from ${tableName}`
          );
        } else {
          console.log(`   ⏭️  ${tableName} is empty (0 records)`);
        }
      } catch (error) {
        console.log(`   ⚠️  Error exporting ${tableName}:`, error.message);
        backupData[tableName] = [];
      }
    }

    // Generate the complete restore script
    const restoreScript = generateFullRestoreScript(backupData, totalRecords);

    // Save to file
    const restoreFilePath = path.join(
      process.cwd(),
      "scripts",
      "full-database-restore.ts"
    );
    fs.writeFileSync(restoreFilePath, restoreScript);

    // Also create a schema-only backup (for documentation)
    await createSchemaBackup();

    console.log(`\n💾 Complete backup created successfully!`);
    console.log(`📊 Total records backed up: ${totalRecords}`);
    console.log(`📁 Restore script: ${restoreFilePath}`);

    // Show summary
    console.log("\n📊 Backup Summary:");
    const tablesWithData = Object.entries(backupData).filter(
      ([_, records]) => records.length > 0
    );
    console.log(`   • Tables with data: ${tablesWithData.length}`);
    console.log(
      `   • Tables empty: ${ALL_TABLES.length - tablesWithData.length}`
    );
    console.log(`   • Total tables: ${ALL_TABLES.length}`);

    if (tablesWithData.length > 0) {
      console.log("\n📦 Data backed up from:");
      tablesWithData.forEach(([table, records]) => {
        console.log(`   • ${table}: ${records.length} records`);
      });
    }

    console.log("\n🚀 To restore the complete database, run:");
    console.log(`   npx tsx scripts/full-database-restore.ts`);
  } catch (error) {
    console.error("❌ Error during backup:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

async function createSchemaBackup() {
  try {
    // Create a schema backup using Prisma
    const schemaPath = path.join(process.cwd(), "prisma", "schema.prisma");
    const backupSchemaPath = path.join(
      process.cwd(),
      "scripts",
      "schema-backup.prisma"
    );

    if (fs.existsSync(schemaPath)) {
      fs.copyFileSync(schemaPath, backupSchemaPath);
      console.log(`📋 Schema backup created: ${backupSchemaPath}`);
    }
  } catch (error) {
    console.log(`⚠️  Could not create schema backup:`, error.message);
  }
}

function generateFullRestoreScript(
  backupData: Record<string, any[]>,
  totalRecords: number
): string {
  const timestamp = new Date().toISOString();
  const date = timestamp.split("T")[0];

  return `#!/usr/bin/env tsx

/**
 * COMPLETE Database Restore Script - TechTots STEM Store
 *
 * This script restores the ENTIRE database from backup, including:
 * - All table schemas (via Prisma migrations)
 * - All data from all tables
 * - Proper restoration order respecting foreign key constraints
 *
 * Generated on: ${timestamp}
 * Total records: ${totalRecords}
 * Tables with data: ${Object.values(backupData).filter(arr => arr.length > 0).length}
 *
 * ⚠️  WARNING: This will REPLACE all existing data!
 */

import { PrismaClient } from "@prisma/client";
import { execSync } from "child_process";
import "dotenv/config";

const prisma = new PrismaClient();

// Complete backup data from ${date}
const BACKUP_DATA = ${JSON.stringify(backupData, null, 2)};

// Tables in dependency order (DO NOT CHANGE)
const RESTORE_ORDER = ${JSON.stringify(ALL_TABLES, null, 2)};

async function restoreCompleteDatabase() {
  console.log("🔄 Starting COMPLETE database restoration...");
  console.log("⚠️  This will replace ALL existing data!");
  console.log("");

  try {
    // Step 1: Reset database (optional - uncomment if needed)
    console.log("📋 Step 1: Preparing database...");

    // Uncomment the next line if you want to completely reset the database
    // WARNING: This will DELETE ALL EXISTING DATA!
    // await resetDatabase();

    // Step 2: Ensure schema is up to date
    console.log("📋 Step 2: Ensuring schema is current...");
    try {
      execSync('npx prisma db push --accept-data-loss', {
        stdio: 'inherit',
        cwd: process.cwd()
      });
      console.log("   ✅ Schema updated successfully");
    } catch (error) {
      console.log("   ⚠️  Schema update may have issues, continuing...");
    }

    // Step 3: Restore data in dependency order
    console.log("\\n📋 Step 3: Restoring data...");

    let totalRestored = 0;

    for (const tableName of RESTORE_ORDER) {
      const data = BACKUP_DATA[tableName];
      if (!data || data.length === 0) {
        console.log(\`   ⏭️  Skipping \${tableName} (no data)\`);
        continue;
      }

      console.log(\`   📥 Restoring \${tableName} (\${data.length} records)...\`);

      const model = prisma[tableName.charAt(0).toLowerCase() + tableName.slice(1)] as any;
      let restoredCount = 0;

      for (const record of data) {
        try {
          // Remove id, createdAt, updatedAt to avoid conflicts
          const { id, createdAt, updatedAt, ...recordData } = record;

          await model.upsert({
            where: getUniqueWhereClause(tableName, record),
            update: recordData,
            create: recordData,
          });
          restoredCount++;
        } catch (error) {
          console.error(\`     ❌ Error restoring \${tableName} record:\`, error.message);
        }
      }

      totalRestored += restoredCount;
      console.log(\`     ✅ Restored \${restoredCount} records to \${tableName}\`);
    }

    // Step 4: Verification
    console.log("\\n📋 Step 4: Verification...");
    const verificationResults = await verifyRestoration(BACKUP_DATA);

    console.log("\\n🎉 Database restoration completed!");
    console.log(\`📊 Total records restored: \${totalRestored}\`);

    if (verificationResults.issues.length > 0) {
      console.log("\\n⚠️  Some tables had restoration issues:");
      verificationResults.issues.forEach(issue => {
        console.log(\`   • \${issue}\`);
      });
    }

    console.log("\\n✅ Restoration Summary:");
    console.log(\`   • Expected records: ${totalRecords}\`);
    console.log(\`   • Restored records: \${totalRestored}\`);
    console.log(\`   • Tables processed: \${RESTORE_ORDER.length}\`);

  } catch (error) {
    console.error("❌ Error during restoration:", error);
    process.exit(1);
  } finally {
    await prisma.\$disconnect();
  }
}

async function resetDatabase() {
  console.log("🗑️  Resetting database (this will delete ALL data)...");

  // Delete all data in reverse dependency order
  const reverseOrder = [...RESTORE_ORDER].reverse();

  for (const tableName of reverseOrder) {
    try {
      const model = prisma[tableName.charAt(0).toLowerCase() + tableName.slice(1)] as any;
      await model.deleteMany();
      console.log(\`   🗑️  Cleared \${tableName}\`);
    } catch (error) {
      console.log(\`   ⚠️  Could not clear \${tableName}:\`, error.message);
    }
  }

  console.log("✅ Database reset complete");
}

async function verifyRestoration(backupData: Record<string, any[]>): Promise<{ issues: string[] }> {
  const issues: string[] = [];

  for (const tableName of RESTORE_ORDER) {
    try {
      const model = prisma[tableName.charAt(0).toLowerCase() + tableName.slice(1)] as any;
      const currentCount = await model.count();
      const expectedCount = backupData[tableName]?.length || 0;

      if (currentCount !== expectedCount) {
        issues.push(\`\${tableName}: Expected \${expectedCount}, got \${currentCount}\`);
      }
    } catch (error) {
      issues.push(\`\${tableName}: Could not verify (\${error.message})\`);
    }
  }

  return { issues };
}

function getUniqueWhereClause(tableName: string, record: any) {
  switch (tableName) {
    case "User":
      return { email: record.email };
    case "Category":
      return { slug: record.slug };
    case "Language":
      return { code: record.code };
    case "EmailTemplate":
      return { slug: record.slug };
    case "Product":
      return record.sku ? { sku: record.sku } : { id: record.id };
    case "Book":
      return { slug: record.slug };
    case "Order":
      return { orderNumber: record.orderNumber };
    case "Coupon":
      return { code: record.code };
    case "Supplier":
      return { email: record.email };
    case "Session":
      return { sessionToken: record.sessionToken };
    // Add more unique constraints as needed
    default:
      return { id: record.id };
  }
}

// Run the restoration
if (require.main === module) {
  // Simple confirmation prompt
  console.log("⚠️  DATABASE RESTORATION WARNING ⚠️");
  console.log("This will replace ALL data in your database!");
  console.log("Make sure you have a backup of current data if needed.");
  console.log("");
  console.log("Press Ctrl+C to cancel, or wait 5 seconds to continue...");

  setTimeout(() => {
    restoreCompleteDatabase();
  }, 5000);
}
`;
}

// Run the backup
createFullBackup();
