#!/usr/bin/env tsx

/**
 * Database Restore Script
 *
 * Restores database from a comprehensive backup JSON file
 * Handles dependencies and data integrity
 */

import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

const prisma = new PrismaClient();

// Load environment variables
const envLocalPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath });
} else {
  dotenv.config();
}

interface BackupData {
  timestamp: string;
  version: string;
  tables: {
    [key: string]: any[];
  };
}

async function restoreDatabase(backupFilePath?: string) {
  console.log("🔄 Starting database restoration...\n");

  try {
    // Find the most recent backup if no specific file provided
    let backupFile = backupFilePath;
    if (!backupFile) {
      const backupDir = path.join(process.cwd(), "backups");
      if (fs.existsSync(backupDir)) {
        const files = fs
          .readdirSync(backupDir)
          .filter(
            file =>
              file.startsWith("database-backup-") && file.endsWith(".json")
          )
          .sort()
          .reverse();

        if (files.length > 0) {
          backupFile = path.join(backupDir, files[0]);
          console.log(`📁 Using most recent backup: ${files[0]}`);
        }
      }
    }

    if (!backupFile || !fs.existsSync(backupFile)) {
      console.error("❌ No backup file found!");
      console.log(
        "Usage: npx tsx scripts/restore-database.ts [backup-file-path]"
      );
      process.exit(1);
    }

    // Load backup data
    console.log(`📖 Loading backup from: ${backupFile}`);
    const backupData: BackupData = JSON.parse(
      fs.readFileSync(backupFile, "utf8")
    );

    console.log(`📅 Backup created: ${backupData.timestamp}`);
    console.log(
      `📦 Tables to restore: ${Object.keys(backupData.tables).length}\n`
    );

    // Define restoration order (reverse of dependencies)
    const restoreOrder = [
      // Security tables (no dependencies)
      "PasswordResetToken",
      "Session",

      // Core reference tables
      "Language",
      "Category",

      // User data
      "User",
      "Address",
      "PaymentCard",

      // Content
      "ImageMetadata",
      "ImageProcessingLog",
      "DigitalFile",
      "ContentVersion",

      // Products
      "Product",

      // Blogs & Books
      "Blog",
      "Book",

      // E-commerce
      "Coupon",
      "CouponUsage",
      "Order",
      "OrderItem",
      "OrderStatusHistory",
      "Wishlist",
      "Return",
      "Review",

      // Email & Marketing
      "EmailTemplate",
      "EmailSequence",
      "EmailSequenceStep",
      "EmailSequenceUser",
      "EmailEvent",
      "EmailCampaign",
      "Campaign",
      "CampaignApplication",
      "AutomationWorkflow",
      "Newsletter",

      // Suppliers
      "Supplier",
      "SupplierOrder",
      "SupplierInvoice",
      "SupplierMessage",
      "SupplierNotification",
      "SupplierSupportTicket",
      "SupplierTicketResponse",
      "SupplierAnnouncement",

      // Digital downloads
      "DigitalDownload",

      // Analytics & Settings
      "StoreSettings",
      "PerformanceMetric",
      "ConversionLog",
    ];

    // Clear existing data (optional - ask user)
    const shouldClear =
      process.argv.includes("--clear") || process.argv.includes("--fresh");
    if (shouldClear) {
      console.log("🧹 Clearing existing data...");
      for (const tableName of restoreOrder.reverse()) {
        try {
          await (prisma as any)[tableName.toLowerCase()].deleteMany();
          console.log(`  🗑️  Cleared ${tableName}`);
        } catch (error) {
          // Table might not exist, continue
        }
      }
      restoreOrder.reverse(); // Restore original order
    }

    // Restore data
    let totalRecords = 0;
    for (const tableName of restoreOrder) {
      const records = backupData.tables[tableName] || [];

      if (records.length === 0) {
        console.log(`⏭️  ${tableName}: No data to restore`);
        continue;
      }

      console.log(`📝 Restoring ${tableName} (${records.length} records)...`);

      try {
        // Use createMany for better performance
        if (records.length > 0) {
          await (prisma as any)[tableName.toLowerCase()].createMany({
            data: records,
            skipDuplicates: true,
          });
          totalRecords += records.length;
          console.log(`  ✅ Restored ${records.length} records`);
        }
      } catch (error) {
        console.log(`  ⚠️  Error restoring ${tableName}:`, error.message);
        // Try individual inserts for problematic records
        console.log(`  🔄 Trying individual inserts for ${tableName}...`);
        let successCount = 0;
        for (const record of records) {
          try {
            await (prisma as any)[tableName.toLowerCase()].create({
              data: record,
            });
            successCount++;
          } catch (err) {
            // Skip duplicates or invalid records
          }
        }
        console.log(`  ✅ Restored ${successCount} records individually`);
        totalRecords += successCount;
      }
    }

    console.log(`\n🎉 Database restoration completed!`);
    console.log(`📊 Total records restored: ${totalRecords}`);
    console.log(`⏰ Restoration completed at: ${new Date().toISOString()}`);
  } catch (error) {
    console.error("❌ Restoration failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the restoration
if (require.main === module) {
  const backupFile = process.argv[2];
  restoreDatabase(backupFile);
}

export { restoreDatabase };
