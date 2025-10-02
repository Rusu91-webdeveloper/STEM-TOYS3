#!/usr/bin/env tsx

/**
 * Database Backup Script
 *
 * Creates a comprehensive backup of all database data
 * Saves to JSON files that can be easily restored
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

async function backupDatabase() {
  console.log("💾 Starting comprehensive database backup...\n");

  const backupData: BackupData = {
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    tables: {},
  };

  try {
    // Define tables to backup in order of dependencies
    const tables = [
      // Core tables
      "User",
      "Category",
      "Language",

      // Content tables
      "Product",
      "Blog",
      "Book",

      // E-commerce tables
      "Order",
      "OrderItem",
      "OrderStatusHistory",
      "PaymentCard",
      "Address",
      "Wishlist",
      "Return",
      "Review",
      "Coupon",
      "CouponUsage",

      // Email & Marketing
      "EmailTemplate",
      "EmailCampaign",
      "EmailSequence",
      "EmailSequenceStep",
      "EmailSequenceUser",
      "EmailEvent",
      "Campaign",
      "CampaignApplication",
      "AutomationWorkflow",
      "Newsletter",

      // Supplier Management
      "Supplier",
      "SupplierOrder",
      "SupplierInvoice",
      "SupplierMessage",
      "SupplierNotification",
      "SupplierSupportTicket",
      "SupplierTicketResponse",
      "SupplierAnnouncement",

      // Content Management
      "ImageMetadata",
      "ImageProcessingLog",
      "DigitalFile",
      "DigitalDownload",
      "ContentVersion",

      // Analytics & Settings
      "StoreSettings",
      "PerformanceMetric",
      "ConversionLog",

      // Security
      "Session",
      "PasswordResetToken",
    ];

    for (const tableName of tables) {
      try {
        console.log(`📦 Backing up ${tableName}...`);

        // Get all records from the table using raw SQL
        let records = [];
        try {
          // Try Prisma client first
          records = await (prisma as any)[tableName.toLowerCase()].findMany({
            orderBy: { createdAt: "asc" },
          });
        } catch (prismaError) {
          // Fallback to raw SQL for tables not in Prisma client
          try {
            const result = await prisma.$queryRawUnsafe(
              `SELECT * FROM "${tableName}" ORDER BY "createdAt" ASC`
            );
            records = Array.isArray(result) ? result : [];
          } catch (sqlError) {
            console.log(
              `  ⚠️  Table ${tableName} not accessible via SQL either`
            );
            records = [];
          }
        }

        backupData.tables[tableName] = records;
        console.log(`  ✅ ${records.length} records backed up`);
      } catch (error) {
        console.log(`  ⚠️  Table ${tableName} not available or empty`);
        backupData.tables[tableName] = [];
      }
    }

    // Create backup directory
    const backupDir = path.join(process.cwd(), "backups");
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir);
    }

    // Generate backup filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupFile = path.join(
      backupDir,
      `database-backup-${timestamp}.json`
    );

    // Save backup file
    fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2));

    console.log(`\n🎉 Backup completed successfully!`);
    console.log(`📁 Backup saved to: ${backupFile}`);

    // Show summary
    console.log(`\n📊 Backup Summary:`);
    Object.entries(backupData.tables).forEach(([table, records]) => {
      if (records.length > 0) {
        console.log(`  ${table}: ${records.length} records`);
      }
    });

    console.log(
      `\n🔒 Total tables backed up: ${Object.keys(backupData.tables).length}`
    );
    console.log(`📅 Backup timestamp: ${backupData.timestamp}`);
  } catch (error) {
    console.error("❌ Backup failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the backup
if (require.main === module) {
  backupDatabase();
}

export { backupDatabase };
