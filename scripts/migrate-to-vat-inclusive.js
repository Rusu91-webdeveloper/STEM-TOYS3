#!/usr/bin/env node

/**
 * Migration Script: Convert Product Prices to VAT-Inclusive
 *
 * This script converts existing product prices from VAT-exclusive to VAT-inclusive
 * to comply with Romanian/EU law requiring B2C prices to include VAT.
 *
 * Usage: node scripts/migrate-to-vat-inclusive.js [--dry-run] [--vat-rate=21]
 *
 * --dry-run: Preview changes without applying them
 * --vat-rate: VAT rate percentage (default: 21%)
 *
 * IMPORTANT:
 * - Back up your database before running this script
 * - This script assumes current prices are VAT-exclusive
 * - Run with --dry-run first to review changes
 */

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

// Parse command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes("--dry-run");
const vatRateArg = args.find(arg => arg.startsWith("--vat-rate="));
const vatRate = vatRateArg ? parseFloat(vatRateArg.split("=")[1]) : 21;

console.log(`🔄 VAT-Inclusive Price Migration Script`);
console.log(`📊 VAT Rate: ${vatRate}%`);
console.log(`🔍 Mode: ${isDryRun ? "DRY RUN (preview only)" : "LIVE UPDATE"}`);
console.log("=".repeat(60));

async function migrateProductPrices() {
  try {
    // Fetch all products
    const products = await prisma.product.findMany({
      select: {
        id: true,
        name: true,
        price: true,
        compareAtPrice: true,
        sku: true,
      },
    });

    console.log(`📦 Found ${products.length} products to process`);
    console.log("");

    const vatMultiplier = 1 + vatRate / 100;
    let updatedCount = 0;
    const updates = [];

    for (const product of products) {
      const currentPrice = product.price;
      const newPrice = Math.round(currentPrice * vatMultiplier * 100) / 100; // Round to 2 decimals

      let newCompareAtPrice = null;
      if (product.compareAtPrice) {
        newCompareAtPrice =
          Math.round(product.compareAtPrice * vatMultiplier * 100) / 100;
      }

      const priceChange = newPrice - currentPrice;
      const percentIncrease = ((priceChange / currentPrice) * 100).toFixed(1);

      console.log(`📋 ${product.name} (${product.sku || product.id})`);
      console.log(`   Current: ${currentPrice.toFixed(2)} lei (excl. VAT)`);
      console.log(`   New:     ${newPrice.toFixed(2)} lei (incl. VAT)`);
      console.log(
        `   Change:  +${priceChange.toFixed(2)} lei (+${percentIncrease}%)`
      );

      if (product.compareAtPrice) {
        console.log(
          `   Compare: ${product.compareAtPrice.toFixed(2)} → ${newCompareAtPrice.toFixed(2)} lei`
        );
      }
      console.log("");

      if (!isDryRun) {
        updates.push({
          id: product.id,
          price: newPrice,
          compareAtPrice: newCompareAtPrice,
        });
      }

      updatedCount++;
    }

    if (!isDryRun && updates.length > 0) {
      console.log(`💾 Applying updates to ${updates.length} products...`);

      // Use transaction for safety
      await prisma.$transaction(async tx => {
        for (const update of updates) {
          await tx.product.update({
            where: { id: update.id },
            data: {
              price: update.price,
              compareAtPrice: update.compareAtPrice,
            },
          });
        }

        // Update store settings to reflect VAT-inclusive pricing
        await tx.storeSettings.upsert({
          where: { id: "default" },
          create: {
            id: "default",
            taxSettings: {
              rate: vatRate.toString(),
              active: true,
              includeInPrice: true,
            },
          },
          update: {
            taxSettings: {
              rate: vatRate.toString(),
              active: true,
              includeInPrice: true,
            },
          },
        });
      });

      console.log(
        `✅ Successfully updated ${updates.length} products to VAT-inclusive pricing`
      );
      console.log(
        `⚙️  Updated store settings to reflect VAT-inclusive pricing`
      );
    } else if (isDryRun) {
      console.log(`👀 DRY RUN: Would update ${updatedCount} products`);
      console.log(`💡 Run without --dry-run to apply changes`);
    }

    console.log("");
    console.log("=".repeat(60));
    console.log(`📊 Migration Summary:`);
    console.log(`   Products processed: ${updatedCount}`);
    console.log(`   VAT rate applied: ${vatRate}%`);
    console.log(`   Price increase: ~${vatRate}%`);

    if (!isDryRun) {
      console.log(`   Status: ✅ COMPLETED`);
      console.log("");
      console.log(`🎉 Your store is now VAT-compliant!`);
      console.log(
        `📋 All prices now include ${vatRate}% VAT as required by Romanian/EU law`
      );
      console.log(`💰 Checkout will show VAT breakdown for transparency`);
    } else {
      console.log(`   Status: 👀 PREVIEW ONLY`);
    }
  } catch (error) {
    console.error(`❌ Migration failed:`, error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Confirmation prompt for live updates
async function confirmMigration() {
  if (isDryRun) {
    return true;
  }

  console.log(
    `⚠️  WARNING: This will modify all product prices in your database!`
  );
  console.log(`📦 Backup your database before proceeding`);
  console.log(`💡 Run with --dry-run first to preview changes`);
  console.log("");

  // In a real script, you'd want to use readline for interactive confirmation
  // For now, we'll assume the user has reviewed the dry run
  console.log(`🚀 Proceeding with migration...`);
  return true;
}

// Main execution
async function main() {
  try {
    const confirmed = await confirmMigration();

    if (!confirmed) {
      console.log(`❌ Migration cancelled by user`);
      process.exit(0);
    }

    await migrateProductPrices();

    console.log(`✨ Migration completed successfully!`);
    process.exit(0);
  } catch (error) {
    console.error(`💥 Migration failed:`, error.message);
    process.exit(1);
  }
}

// Handle unhandled promises
process.on("unhandledRejection", error => {
  console.error("Unhandled promise rejection:", error);
  process.exit(1);
});

main();
