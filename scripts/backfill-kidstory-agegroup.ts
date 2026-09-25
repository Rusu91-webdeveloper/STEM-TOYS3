/**
 * Backfill script: Set ageGroup for Kidstory products with null ageGroup
 * 
 * This script:
 * 1. Finds all active products where ageGroup is null and attributes.ageRange exists
 * 2. Maps the ageRange to standard AgeGroup enum values
 * 3. Creates a JSON backup before making changes
 * 4. Updates the products with the derived ageGroup
 * 
 * Usage:
 *   Dry run (default): pnpm exec tsx --env-file=.env.production.local scripts/backfill-kidstory-agegroup.ts
 *   Apply changes:    pnpm exec tsx --env-file=.env.production.local scripts/backfill-kidstory-agegroup.ts --apply
 */

import { db } from "../lib/db";
import { mapAgeRangeToAgeGroup, explainAgeGroupMapping } from "../lib/suppliers/kidstory/age-mapper";
import * as fs from "fs";
import * as path from "path";

interface ProductToUpdate {
  id: string;
  name: string;
  slug: string;
  ageGroup: string | null;
  ageRange: string | null;
  supplierId: string | null;
  supplierName: string | null;
  newAgeGroup: string | null;
  explanation: string;
}

async function backfillKidstoryAgeGroup() {
  const isDryRun = !process.argv.includes("--apply");

  console.log("🔧 Kidstory AgeGroup Backfill Script");
  console.log("====================================\n");
  console.log(`Mode: ${isDryRun ? "DRY RUN (no changes will be made)" : "APPLY (changes will be written to database)"}\n`);

  // Find all active products with null ageGroup
  const productsWithNullAgeGroup = await db.product.findMany({
    where: {
      isActive: true,
      ageGroup: null,
    },
    select: {
      id: true,
      name: true,
      slug: true,
      ageGroup: true,
      attributes: true,
      supplierId: true,
      supplier: {
        select: {
          companyName: true,
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });

  console.log(`📊 Found ${productsWithNullAgeGroup.length} products with null ageGroup\n`);

  // Extract age range from attributes and map to ageGroup
  const productsToUpdate: ProductToUpdate[] = [];

  for (const product of productsWithNullAgeGroup) {
    const attrs = product.attributes as any;
    const ageRange = attrs?.ageRange || attrs?.age || null;
    const newAgeGroup = mapAgeRangeToAgeGroup(ageRange);
    const explanation = explainAgeGroupMapping(ageRange, newAgeGroup);

    productsToUpdate.push({
      id: product.id,
      name: product.name,
      slug: product.slug,
      ageGroup: product.ageGroup,
      ageRange: ageRange,
      supplierId: product.supplierId,
      supplierName: product.supplier?.companyName || null,
      newAgeGroup: newAgeGroup,
      explanation: explanation,
    });
  }

  // Filter to only products where we can derive an ageGroup
  const updatable = productsToUpdate.filter(p => p.newAgeGroup !== null);
  const notUpdatable = productsToUpdate.filter(p => p.newAgeGroup === null);

  console.log(`✅ Can update: ${updatable.length} products`);
  console.log(`⚠️  Cannot determine ageGroup: ${notUpdatable.length} products\n`);

  // Show breakdown by supplier
  const bySupplier = updatable.reduce((acc, p) => {
    const supplier = p.supplierName || "Unknown";
    if (!acc[supplier]) {
      acc[supplier] = [];
    }
    acc[supplier].push(p);
    return acc;
  }, {} as Record<string, ProductToUpdate[]>);

  console.log("📦 Breakdown by supplier:");
  for (const [supplier, products] of Object.entries(bySupplier)) {
    console.log(`  ${supplier}: ${products.length} products`);
  }
  console.log();

  // Show breakdown by new ageGroup
  const byAgeGroup = updatable.reduce((acc, p) => {
    const ageGroup = p.newAgeGroup || "null";
    acc[ageGroup] = (acc[ageGroup] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  console.log("🎯 Breakdown by new ageGroup:");
  for (const [ageGroup, count] of Object.entries(byAgeGroup).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${ageGroup}: ${count}`);
  }
  console.log();

  // Show sample of products to be updated
  console.log(`📋 All products to be updated (${updatable.length} total):\n`);
  for (let i = 0; i < updatable.length; i++) {
    const p = updatable[i];
    console.log(`${i + 1}. ${p.name.substring(0, 60)}...`);
    console.log(`   Slug: ${p.slug.substring(0, 60)}...`);
    console.log(`   Old ageGroup: ${p.ageGroup || "null"}`);
    console.log(`   New ageGroup: ${p.newAgeGroup}`);
    console.log(`   Mapping: ${p.explanation}`);
    console.log();
  }

  // Show products that cannot be updated
  if (notUpdatable.length > 0) {
    console.log(`⚠️  Products without ageRange (${notUpdatable.length}):\n`);
    for (let i = 0; i < Math.min(5, notUpdatable.length); i++) {
      const p = notUpdatable[i];
      console.log(`${i + 1}. ${p.name.substring(0, 60)}...`);
      console.log(`   Age Range: ${p.ageRange || "N/A"}`);
      console.log(`   Explanation: ${p.explanation}`);
      console.log();
    }
  }

  // Create backup before any action (both dry-run and apply)
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupDir = path.join(process.cwd(), "backups", `kidstory-agegroup_${timestamp}`);
  const backupFile = path.join(backupDir, "affected-products-backup.json");

  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  // Backup full affected rows (id, slug, ageGroup, attributes)
  const backupData = updatable.map(p => {
    const fullProduct = productsWithNullAgeGroup.find(prod => prod.id === p.id);
    return {
      id: p.id,
      slug: p.slug,
      ageGroup: p.ageGroup,
      attributes: fullProduct?.attributes || {},
      derivedAgeGroup: p.newAgeGroup,
      ageRange: p.ageRange,
    };
  });

  fs.writeFileSync(
    backupFile,
    JSON.stringify({
      timestamp: new Date().toISOString(),
      totalProducts: updatable.length,
      products: backupData,
    }, null, 2)
  );

  console.log(`💾 Backup created: ${backupFile}\n`);

  if (isDryRun) {
    console.log("🔍 DRY RUN: No changes made. Run with --apply to execute updates.\n");
    await db.$disconnect();
    return;
  }

  // Apply updates
  console.log("🚀 Applying updates...\n");

  let successCount = 0;
  let errorCount = 0;

  for (const product of updatable) {
    try {
      await db.product.update({
        where: { id: product.id },
        data: { ageGroup: product.newAgeGroup },
      });
      successCount++;
      console.log(`✓ Updated: ${product.name.substring(0, 60)}... → ${product.newAgeGroup}`);
    } catch (error) {
      errorCount++;
      console.error(`✗ Failed: ${product.name.substring(0, 60)}...`);
      console.error(`  Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  console.log(`\n✅ Successfully updated: ${successCount} products`);
  if (errorCount > 0) {
    console.log(`❌ Failed to update: ${errorCount} products`);
  }

  console.log("\n📊 Final statistics:");
  const finalStats = await db.product.groupBy({
    by: ["ageGroup"],
    where: {
      isActive: true,
    },
    _count: true,
  });

  for (const stat of finalStats.sort((a, b) => b._count - a._count)) {
    console.log(`  ${stat.ageGroup || "null"}: ${stat._count}`);
  }

  await db.$disconnect();
}

backfillKidstoryAgeGroup()
  .catch((error) => {
    console.error("\n❌ Error:", error);
    process.exit(1);
  });
