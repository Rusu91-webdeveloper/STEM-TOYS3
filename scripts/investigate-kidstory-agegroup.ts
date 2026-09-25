/**
 * Diagnostic script to investigate Kidstory products with null ageGroup
 * This script reads products to understand the age range data available
 */

import { db } from "../lib/db";

async function investigateKidstoryProducts() {
  console.log("🔍 Investigating Kidstory products with null ageGroup...\n");

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
      attributes: true,
      stockQuantity: true,
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

  console.log(`Found ${productsWithNullAgeGroup.length} products with null ageGroup\n`);

  // Group by supplier
  const bySupplier = productsWithNullAgeGroup.reduce((acc, product) => {
    const supplierName = product.supplier?.companyName || "Unknown";
    if (!acc[supplierName]) {
      acc[supplierName] = [];
    }
    acc[supplierName].push(product);
    return acc;
  }, {} as Record<string, typeof productsWithNullAgeGroup>);

  console.log("📊 Breakdown by supplier:");
  for (const [supplierName, products] of Object.entries(bySupplier)) {
    console.log(`  ${supplierName}: ${products.length} products`);
  }
  console.log();

  // Check Kidstory products specifically
  const kidstoryProducts = productsWithNullAgeGroup.filter(
    (p) => p.supplier?.companyName?.toLowerCase().includes("kidstory")
  );

  console.log(`\n🎯 Kidstory products with null ageGroup: ${kidstoryProducts.length}`);
  console.log("\nSample of age range data from attributes:\n");

  for (let i = 0; i < Math.min(10, kidstoryProducts.length); i++) {
    const product = kidstoryProducts[i];
    const attrs = product.attributes as any;
    const ageRange = attrs?.ageRange || attrs?.age || null;
    
    console.log(`${i + 1}. ${product.name.substring(0, 60)}...`);
    console.log(`   Slug: ${product.slug.substring(0, 60)}...`);
    console.log(`   Stock: ${product.stockQuantity}`);
    console.log(`   Age Range: ${ageRange || "N/A"}`);
    console.log();
  }

  // Count all active products by ageGroup
  console.log("\n📊 All active products by ageGroup:");
  const allActiveProducts = await db.product.findMany({
    where: {
      isActive: true,
    },
    select: {
      ageGroup: true,
    },
  });

  const groupedByAge = allActiveProducts.reduce((acc, p) => {
    const key = p.ageGroup || "null";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  for (const [ageGroup, count] of Object.entries(groupedByAge).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${ageGroup}: ${count}`);
  }

  const totalNonNull = Object.entries(groupedByAge)
    .filter(([key]) => key !== "null")
    .reduce((sum, [, count]) => sum + count, 0);

  console.log(`\n  Total with ageGroup: ${totalNonNull}`);
  console.log(`  Total with null: ${groupedByAge["null"] || 0}`);
  console.log(`  Grand total: ${allActiveProducts.length}`);

  await db.$disconnect();
}

investigateKidstoryProducts()
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });
