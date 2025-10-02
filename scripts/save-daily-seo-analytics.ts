#!/usr/bin/env tsx

/**
 * Daily SEO Analytics Data Collection Script
 *
 * This script collects and saves daily SEO analytics data including:
 * - Keyword rankings and positions
 * - Click and impression data
 * - CTR trends
 * - Competitor analysis
 *
 * Should be run daily via cron job at 2 AM
 *
 * Usage:
 * npm run seo-analytics:daily
 * or
 * npx tsx scripts/save-daily-seo-analytics.ts
 */

import { gscService } from "../lib/services/google-search-console-service";

async function main() {
  console.log("🚀 Starting daily SEO analytics data collection...");
  console.log(`📅 Date: ${new Date().toISOString()}`);

  try {
    // Collect and save SEO analytics data
    const result = await gscService.saveDailySEOAnalytics();

    if (result.success) {
      console.log("✅ Daily SEO analytics data saved successfully!");
      console.log(`📊 Records saved: ${result.recordsSaved}`);

      // Log summary of what was saved
      console.log("\n📈 SEO Analytics Summary:");
      console.log("- Keyword rankings updated");
      console.log("- Performance metrics recorded");
      console.log("- Historical trends maintained");

      process.exit(0);
    } else {
      console.error("❌ Failed to save daily SEO analytics data");
      console.error("Errors:", result.errors);
      console.log(`📊 Records attempted: ${result.recordsSaved}`);

      process.exit(1);
    }
  } catch (error) {
    console.error("💥 Critical error during SEO analytics collection:", error);
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("💥 Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on("uncaughtException", error => {
  console.error("💥 Uncaught Exception:", error);
  process.exit(1);
});

// Run the script
main().catch(error => {
  console.error("💥 Script execution failed:", error);
  process.exit(1);
});
