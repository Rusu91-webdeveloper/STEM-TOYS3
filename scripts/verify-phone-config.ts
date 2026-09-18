/**
 * Phone Number Configuration Verification Script
 * 
 * Verifies that all phone number sources return the canonical +40771248029
 * Run this script to diagnose where the old phone number is coming from.
 * 
 * Usage:
 *   pnpm tsx scripts/verify-phone-config.ts
 */

import { PrismaClient } from "@prisma/client";
import { appConfig, getAppConfig, publicConfig } from "@/lib/config/app-config";

const CANONICAL_PHONE = "+40771248029";
const OLD_PHONE = "+40742552233";

async function main() {
  console.log("🔍 Phone Number Configuration Audit\n");
  console.log(`✅ Canonical phone: ${CANONICAL_PHONE}`);
  console.log(`❌ Old phone (should not appear): ${OLD_PHONE}\n`);

  const issues: string[] = [];

  // Check environment variables
  console.log("📋 Environment Variables:");
  const envVars = {
    FANCOURIER_SENDER_PHONE: process.env.FANCOURIER_SENDER_PHONE,
    NEXT_PUBLIC_STORE_PHONE: process.env.NEXT_PUBLIC_STORE_PHONE,
  };

  for (const [key, value] of Object.entries(envVars)) {
    if (value) {
      const status = value === CANONICAL_PHONE ? "✅" : value === OLD_PHONE ? "❌" : "⚠️";
      console.log(`  ${status} ${key}=${value}`);
      if (value === OLD_PHONE) {
        issues.push(`Environment variable ${key} is set to old phone number`);
      }
    } else {
      console.log(`  ℹ️  ${key} not set (will use code defaults)`);
    }
  }

  // Check code config defaults
  console.log("\n📋 Code Configuration Defaults:");
  console.log(`  ${appConfig.storePhone === CANONICAL_PHONE ? "✅" : "❌"} appConfig.storePhone = ${appConfig.storePhone}`);
  console.log(`  ${publicConfig.storePhone === CANONICAL_PHONE ? "✅" : "❌"} publicConfig.storePhone = ${publicConfig.storePhone}`);

  if (appConfig.storePhone === OLD_PHONE) {
    issues.push("appConfig.storePhone returns old phone number");
  }
  if (publicConfig.storePhone === OLD_PHONE) {
    issues.push("publicConfig.storePhone returns old phone number");
  }

  // Check database
  console.log("\n📋 Database (storeSettings table):");
  try {
    const prisma = new PrismaClient();
    const settings = await prisma.storeSettings.findFirst();
    
    if (settings?.contactPhone) {
      const status = settings.contactPhone === CANONICAL_PHONE ? "✅" : settings.contactPhone === OLD_PHONE ? "❌" : "⚠️";
      console.log(`  ${status} contactPhone = ${settings.contactPhone}`);
      if (settings.contactPhone === OLD_PHONE) {
        issues.push("Database storeSettings.contactPhone contains old phone number");
      }
    } else {
      console.log("  ℹ️  No contactPhone set in database (will use code defaults)");
    }

    await prisma.$disconnect();
  } catch (error) {
    console.log(`  ⚠️  Could not connect to database: ${error}`);
    console.log("     (This is expected if DATABASE_URL is not configured)");
  }

  // Check async config
  console.log("\n📋 Async Configuration (getAppConfig):");
  try {
    const config = await getAppConfig();
    const status = config.contactPhone === CANONICAL_PHONE ? "✅" : config.contactPhone === OLD_PHONE ? "❌" : "⚠️";
    console.log(`  ${status} getAppConfig().contactPhone = ${config.contactPhone}`);
    console.log(`  ${status} getAppConfig().storePhoneFormatted = ${config.storePhoneFormatted}`);
    
    if (config.contactPhone === OLD_PHONE) {
      issues.push("getAppConfig() returns old phone number");
    }
  } catch (error) {
    console.log(`  ⚠️  Could not load async config: ${error}`);
  }

  // Summary
  console.log("\n" + "=".repeat(60));
  if (issues.length === 0) {
    console.log("✅ ALL CHECKS PASSED - Phone configuration is correct!");
    console.log(`   All sources return canonical phone: ${CANONICAL_PHONE}`);
  } else {
    console.log("❌ ISSUES FOUND:\n");
    issues.forEach((issue, i) => {
      console.log(`   ${i + 1}. ${issue}`);
    });
    console.log("\n📝 Action required:");
    console.log("   - Update environment variables to use " + CANONICAL_PHONE);
    console.log("   - Update database storeSettings table");
    console.log("   - Clear cache and redeploy");
    process.exit(1);
  }
  console.log("=".repeat(60) + "\n");
}

main()
  .catch((error) => {
    console.error("Error running verification:", error);
    process.exit(1);
  });
