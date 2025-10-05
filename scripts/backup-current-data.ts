#!/usr/bin/env tsx

/**
 * Database Backup Seeding Script for TechTots STEM Store
 *
 * This script exports current database data and creates seeding functions
 * to restore the data if the database is lost.
 *
 * Run this script to backup your current critical data.
 */

import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";
import "dotenv/config";

const prisma = new PrismaClient();

// Tables to backup (in order of dependencies)
function getOrderByClause(tableName: string): any {
  // Tables with createdAt field
  const tablesWithCreatedAt = [
    "User",
    "PasswordResetToken",
    "Address",
    "PaymentCard",
    "Category",
    "Product",
    "MarketingCost",
    "Wishlist",
    "Blog",
    "Book",
    "DigitalFile",
    "Order",
    "OrderItem",
    "StoreSettings",
    "Return",
    "Review",
    "Newsletter",
    "DigitalDownload",
    "Coupon",
    "CouponUsage",
    "ContentVersion",
    "EmailTemplate",
    "EmailLog",
    "ProductCost",
    "SupplierOrder",
    "Supplier",
    "Ticket",
    "FacebookPixelEvent",
    "RomanianViralContent",
    "FacebookPixelConfig",
    "InstagramPixelConfig",
    "TikTokPixelConfig",
    "SEOAnalytics",
    "EmailCampaign",
    "EmailEvent",
    "EmailSequence",
    "EmailSequenceStep",
    "EmailSequenceUser",
    "SupplierAnnouncement",
    "SupplierInvoice",
    "SupplierMessage",
    "SupplierNotification",
    "SupplierSupportTicket",
    "SupplierTicketResponse",
    "SupplierPerformanceMetrics",
    "SupplierOrderTracking",
    "AutomationWorkflow",
    "Campaign",
    "CampaignApplication",
    "PerformanceMetric",
    "Session",
    "OrderStatusHistory",
    "ImageMetadata",
    "ImageProcessingLog",
  ];

  if (tablesWithCreatedAt.includes(tableName)) {
    return { createdAt: "asc" };
  }

  // Tables without createdAt (use id)
  return { id: "asc" };
}
const TABLES_TO_BACKUP = [
  "User", // Base users
  "Category", // Product categories
  "Language", // Languages for books
  "EmailTemplate", // Email templates
  "ConversionLog", // Analytics data
] as const;

async function backupCurrentData() {
  console.log("💾 Starting database backup process...\n");

  const backupData: Record<string, any[]> = {};

  try {
    // Export data from each table
    for (const tableName of TABLES_TO_BACKUP) {
      console.log(`📤 Exporting ${tableName}...`);

      const model = prisma[
        tableName.charAt(0).toLowerCase() + tableName.slice(1)
      ] as any;

      // Get all data from the table
      const data = await model.findMany();

      backupData[tableName] = data;
      console.log(`   ✅ Exported ${data.length} records from ${tableName}`);
    }

    // Generate the backup seeding script
    const backupScript = generateBackupScript(backupData);

    // Save to file
    const backupFilePath = path.join(
      process.cwd(),
      "scripts",
      "restore-database-backup.ts"
    );
    fs.writeFileSync(backupFilePath, backupScript);

    console.log(`\n💾 Backup script saved to: ${backupFilePath}`);
    console.log("🎉 Database backup completed successfully!");

    // Show summary
    console.log("\n📊 Backup Summary:");
    Object.entries(backupData).forEach(([table, records]) => {
      console.log(`   • ${table}: ${records.length} records`);
    });

    console.log(`\n🚀 To restore data in case of database loss, run:`);
    console.log(`   npx tsx scripts/restore-database-backup.ts`);
  } catch (error) {
    console.error("❌ Error during backup:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

function generateBackupScript(backupData: Record<string, any[]>): string {
  const script = `#!/usr/bin/env tsx

/**
 * Database Restore Script - Generated from Current Database State
 *
 * This script restores the backed up data to recreate the database state.
 * Generated on: ${new Date().toISOString()}
 */

import { PrismaClient } from "@prisma/client";
import "dotenv/config";

const prisma = new PrismaClient();

// Backup data from ${new Date().toISOString().split("T")[0]}
const BACKUP_DATA = ${JSON.stringify(backupData, null, 2)};

async function restoreDatabase() {
  console.log("🔄 Starting database restoration from backup...");

  try {
    // Restore data in dependency order
    const restoreOrder = [
      "User",
      "Category",
      "Language",
      "EmailTemplate",
      "ConversionLog",
    ];

    for (const tableName of restoreOrder) {
      const data = BACKUP_DATA[tableName];
      if (!data || data.length === 0) {
        console.log(\`⏭️  Skipping \${tableName} (no data)\`);
        continue;
      }

      console.log(\`📥 Restoring \${tableName} (\${data.length} records)...\`);

      const model = prisma[tableName.charAt(0).toLowerCase() + tableName.slice(1)] as any;

      for (const record of data) {
        try {
          // Remove id and timestamps to avoid conflicts
          const { id, createdAt, updatedAt, ...recordData } = record;

          await model.upsert({
            where: getUniqueWhereClause(tableName, record),
            update: recordData,
            create: recordData,
          });
        } catch (error) {
          console.error(\`   ❌ Error restoring \${tableName} record:\`, error);
        }
      }

      console.log(\`   ✅ Restored \${data.length} records to \${tableName}\`);
    }

    console.log("\\n🎉 Database restoration completed successfully!");
    console.log("\\n📊 Restoration Summary:");
    Object.entries(BACKUP_DATA).forEach(([table, records]) => {
      console.log(\`   • \${table}: \${records.length} records\`);
    });

  } catch (error) {
    console.error("❌ Error during restoration:", error);
    process.exit(1);
  } finally {
    await prisma.\$disconnect();
  }
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
    case "ConversionLog":
      return { id: record.id }; // Use id for logs as they don't have unique constraints
    default:
      return { id: record.id };
  }
}

// Run the restoration
restoreDatabase();
`;

  return script;
}

// Run the backup
backupCurrentData();
