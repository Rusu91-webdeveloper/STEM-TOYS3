/**
 * Create 10 Product Bundles Script
 * 
 * This script creates 10 product bundles as separate bundle products to raise AOV.
 * 
 * Usage:
 *   pnpm tsx scripts/create-bundles.ts
 * 
 * Bundle Structure:
 *   - Bundle is a separate Product with isBundle = true
 *   - bundleItems contains array of product IDs
 *   - Bundle price = sum of items with discount applied
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface BundleDefinition {
  name: string;
  description: string;
  productIds: string[]; // Array of product IDs to include
  discountPercent: number; // Discount percentage (e.g., 15 for 15% off)
  category: string;
  stemDiscipline: "SCIENCE" | "TECHNOLOGY" | "ENGINEERING" | "MATHEMATICS" | "GENERAL";
  ageGroup?: string;
  images?: string[];
}

// Example bundle definitions - update with actual product IDs after importing products
const bundleDefinitions: BundleDefinition[] = [
  {
    name: "Magnetic Building Starter Bundle",
    description: "Complete magnetic building set with multiple components for endless creativity",
    productIds: [], // Will be populated with actual product IDs
    discountPercent: 15,
    category: "Magnetic Building",
    stemDiscipline: "ENGINEERING",
    ageGroup: "6-10",
  },
  {
    name: "Coding & Robotics Essentials Bundle",
    description: "Everything needed to start coding and robotics journey",
    productIds: [],
    discountPercent: 20,
    category: "Coding & Robotics",
    stemDiscipline: "TECHNOLOGY",
    ageGroup: "9-12",
  },
  {
    name: "Science Experiments Lab Bundle",
    description: "Complete science lab kit with multiple experiment sets",
    productIds: [],
    discountPercent: 18,
    category: "Science & Experiments",
    stemDiscipline: "SCIENCE",
    ageGroup: "8-12",
  },
  // Add 7 more bundle definitions...
];

async function createBundles() {
  console.log("📦 Starting bundle creation...");

  // Get all active products to use in bundles
  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      isBundle: false, // Don't include other bundles
    },
    select: {
      id: true,
      name: true,
      price: true,
      categoryId: true,
      category: {
        select: {
          name: true,
        },
      },
    },
  });

  if (products.length < 3) {
    console.error("❌ Need at least 3 products to create bundles");
    await prisma.$disconnect();
    process.exit(1);
  }

  console.log(`Found ${products.length} products to use in bundles`);

  // Group products by category for bundle creation
  const productsByCategory = products.reduce((acc, product) => {
    const categoryName = product.category?.name || "General";
    if (!acc[categoryName]) {
      acc[categoryName] = [];
    }
    acc[categoryName].push(product);
    return acc;
  }, {} as Record<string, typeof products>);

  const results = {
    created: 0,
    failed: 0,
    errors: [] as string[],
  };

  for (const bundleDef of bundleDefinitions) {
    try {
      // Find products for this bundle
      let bundleProducts = productsByCategory[bundleDef.category] || [];
      
      // If bundle definition has specific product IDs, use those
      if (bundleDef.productIds.length > 0) {
        bundleProducts = products.filter(p => bundleDef.productIds.includes(p.id));
      }

      // If no products found, skip this bundle
      if (bundleProducts.length < 2) {
        console.log(`⚠️  Skipping bundle "${bundleDef.name}" - not enough products in category`);
        results.failed++;
        results.errors.push(`${bundleDef.name}: Not enough products in category`);
        continue;
      }

      // Take first 2-4 products for bundle (or use specified IDs)
      const selectedProducts = bundleDef.productIds.length > 0
        ? bundleProducts
        : bundleProducts.slice(0, Math.min(4, bundleProducts.length));

      // Calculate bundle price
      const itemsTotal = selectedProducts.reduce((sum, p) => sum + p.price, 0);
      const discountAmount = itemsTotal * (bundleDef.discountPercent / 100);
      const bundlePrice = itemsTotal - discountAmount;

      // Find or create category
      let category = await prisma.category.findFirst({
        where: {
          name: { equals: bundleDef.category, mode: "insensitive" },
        },
      });

      if (!category) {
        const slug = bundleDef.category
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "");
        
        category = await prisma.category.create({
          data: {
            name: bundleDef.category,
            slug,
            description: `Category for ${bundleDef.category}`,
            isActive: true,
          },
        });
      }

      // Generate slug
      const slug = bundleDef.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

      // Check if bundle already exists
      const existing = await prisma.product.findFirst({
        where: { slug },
      });

      if (existing) {
        console.log(`⚠️  Bundle already exists: ${bundleDef.name}`);
        results.failed++;
        results.errors.push(`${bundleDef.name}: Already exists`);
        continue;
      }

      // Create bundle product
      const bundle = await prisma.product.create({
        data: {
          name: bundleDef.name,
          slug,
          description: bundleDef.description,
          price: bundlePrice,
          compareAtPrice: itemsTotal, // Show original total as compare price
          isBundle: true,
          bundleItems: selectedProducts.map(p => p.id),
          bundleDiscount: bundleDef.discountPercent,
          categoryId: category.id,
          stemDiscipline: bundleDef.stemDiscipline,
          ageGroup: bundleDef.ageGroup,
          images: bundleDef.images || selectedProducts[0]?.images || [],
          tags: [bundleDef.category, "Bundle", bundleDef.stemDiscipline],
          isActive: true,
          featured: true, // Feature bundles
          stockQuantity: Math.min(...selectedProducts.map(p => p.stockQuantity || 0)),
          // Calculate cost price from bundle items
          costPrice: selectedProducts.reduce((sum, p) => sum + (p.costPrice || 0), 0),
        },
      });

      console.log(`✅ Created bundle: ${bundleDef.name} (${selectedProducts.length} items, ${bundleDef.discountPercent}% off)`);
      results.created++;
    } catch (error) {
      console.error(`❌ Failed to create bundle "${bundleDef.name}":`, error);
      results.failed++;
      results.errors.push(`${bundleDef.name}: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  console.log("\n📊 Bundle Creation Summary:");
  console.log(`  ✅ Created: ${results.created}`);
  console.log(`  ❌ Failed: ${results.failed}`);
  if (results.errors.length > 0) {
    console.log("\n❌ Errors:");
    results.errors.forEach(err => console.log(`  - ${err}`));
  }

  await prisma.$disconnect();
}

// Run if called directly
if (require.main === module) {
  createBundles()
    .then(() => {
      console.log("✅ Bundle creation completed");
      process.exit(0);
    })
    .catch(error => {
      console.error("❌ Bundle creation failed:", error);
      process.exit(1);
    });
}

export { createBundles };
