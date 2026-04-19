/**
 * Create Product Bundles Script
 *
 * This script creates curated product bundles as separate bundle products to raise AOV.
 *
 * Usage:
 *   pnpm tsx scripts/create-bundles.ts [--dry-run]
 *
 * Bundle Structure:
 *   - Bundle is a separate Product with isBundle = true
 *   - bundleItems contains array of product IDs
 *   - Bundle price = sum of items with discount applied
 *   - Bundle supplierId is derived from bundle items (must all match)
 *
 * Notes:
 *   - Source Product.csv remains unchanged; bundles are created as new Product rows.
 */

import { PrismaClient } from "@prisma/client";

import { legacyBundleItemSlugById } from "@/lib/bundles/legacy-item-slugs";

const prisma = new PrismaClient();
const dryRun = process.argv.includes("--dry-run");

interface BundleDefinition {
  name: string;
  description: string;
  productIds: string[]; // Array of product IDs to include
  discountPercent: number; // Discount percentage (e.g., 15 for 15% off)
  category: string;
  stemDiscipline: "SCIENCE" | "TECHNOLOGY" | "ENGINEERING" | "MATHEMATICS" | "GENERAL";
  ageGroup?: string;
  images?: string[];
  supplierId?: string; // Optional explicit supplier check (recommended)
}

const SUPPLIER_A = "26f5418c-965d-4630-994c-b51947cdec04";
const SUPPLIER_B = "ee75eea8-9f64-4076-96a2-52f5d6926c14";

// Curated bundle definitions based on Product.csv (same-supplier only)
const bundleDefinitions: BundleDefinition[] = [
  {
    name: "Solar Robots Trio Bundle",
    description: "Build three solar models and explore renewable energy through play.",
    productIds: [
      "f7d2fe64-6cfa-4353-989a-adc129943d38",
      "a4b052bf-6a5e-4cbc-91f3-29004ee50fbf",
      "9e5884a7-4907-49c6-8629-ec998d3b0728",
    ],
    discountPercent: 10,
    category: "Science & Experiments",
    stemDiscipline: "SCIENCE",
    ageGroup: "ELEMENTARY_6_8",
    supplierId: SUPPLIER_A,
  },
  {
    name: "Space & Orbits STEM Pack",
    description: "Hands-on astronomy and space science set with planetary and rocket builds.",
    productIds: [
      "ca59e2e0-30fb-4cd3-b9e1-86a71518fa81",
      "7ef54a14-a9b3-4c33-a949-c587777b6d2d",
      "81c98796-f3c3-4b4a-bd15-42ee58c58bc0",
    ],
    discountPercent: 10,
    category: "Science & Experiments",
    stemDiscipline: "SCIENCE",
    ageGroup: "ELEMENTARY_6_8",
    supplierId: SUPPLIER_A,
  },
  {
    name: "Spy & Security STEM Pack",
    description: "A logic and gadget set for kids who love spy missions and engineering puzzles.",
    productIds: [
      "0b640779-a1d0-44c1-8046-737af3e9f97b",
      "1d11dd52-6652-4248-8bed-d59fc0bb6962",
      "333fcc89-b53a-4ce5-91f1-f97b90a233d8",
    ],
    discountPercent: 10,
    category: "Science & Experiments",
    stemDiscipline: "SCIENCE",
    ageGroup: "ELEMENTARY_6_8",
    supplierId: SUPPLIER_A,
  },
  {
    name: "Crystals & Geology Mini Lab Bundle",
    description: "Grow, dig, and crack crystal experiments in one compact starter bundle.",
    productIds: [
      "0dedfb02-186b-44c3-a1fd-a6f709af7b59",
      "34c20ad1-679e-44a1-8b5f-0d8da7a08dba",
      "17b1ac62-9b9c-4a36-8d97-3a1e0ec07f61",
    ],
    discountPercent: 12,
    category: "Science & Experiments",
    stemDiscipline: "SCIENCE",
    ageGroup: "MIDDLE_SCHOOL_9_12",
    supplierId: SUPPLIER_A,
  },
  {
    name: "Dino Dig Mega Pack Bundle",
    description: "Four dinosaur dig kits for a complete junior paleontology adventure.",
    productIds: [
      "08fcc22d-2367-41c7-880c-d070ea8b2182",
      "39231a01-1622-40c2-b976-4119a577ed58",
      "682ccbc9-692b-4a96-b0b2-52fb4df681b9",
      "f8888ef9-e927-434d-9dd9-40c9fde8f5ce",
    ],
    discountPercent: 12,
    category: "Science & Experiments",
    stemDiscipline: "SCIENCE",
    ageGroup: "PRESCHOOL_3_5",
    supplierId: SUPPLIER_A,
  },
  {
    name: "Cleverclixx Starter Shapes Bundle",
    description: "A balanced magnetic building starter combining tiles and dome structures.",
    productIds: [
      "2ba9915a-f62a-428f-8390-e59935a25cff",
      "6c368f15-6406-49b1-b50e-3dc08a7239e0",
    ],
    discountPercent: 10,
    category: "Magnetic Building",
    stemDiscipline: "ENGINEERING",
    ageGroup: "TODDLERS_1_3",
    supplierId: SUPPLIER_B,
  },
  {
    name: "Cleverclixx Ball Run Starter Bundle",
    description: "Start magnetic marble run play with one core circuit plus extension tiles.",
    productIds: [
      "adc0aac3-5805-4220-b0e1-184a61d23a3f",
      "2ba9915a-f62a-428f-8390-e59935a25cff",
    ],
    discountPercent: 9,
    category: "Magnetic Building",
    stemDiscipline: "ENGINEERING",
    ageGroup: "ELEMENTARY_6_8",
    supplierId: SUPPLIER_B,
  },
  {
    name: "Clicformers Builder Variety Bundle",
    description: "Creative construction bundle combining insects, animals, and advanced nano pieces.",
    productIds: [
      "1bdd5572-8c47-4a8f-be0f-f4bc695cc6f2",
      "662a2814-dbd1-4834-9570-075b867e8c6e",
      "3b21e993-1834-450e-9076-ecb8264976f3",
    ],
    discountPercent: 11,
    category: "Magnetic Building",
    stemDiscipline: "ENGINEERING",
    ageGroup: "ELEMENTARY_6_8",
    supplierId: SUPPLIER_B,
  },
  {
    name: "Djeco Logic Trio Bundle",
    description: "Three top logic games for spatial reasoning, sequencing, and problem solving.",
    productIds: [
      "0542c6b5-bc2e-46a5-8ac2-e4a0925fa58d",
      "0e3a0bc2-bfa7-4314-b747-44bb04592ed1",
      "545124d8-9a14-4cba-9e91-82fb0bbe2f82",
    ],
    discountPercent: 10,
    category: "Logic Games",
    stemDiscipline: "MATHEMATICS",
    ageGroup: "ELEMENTARY_6_8",
    supplierId: SUPPLIER_B,
  },
  {
    name: "Londji Puzzle & Optical Bundle",
    description: "A premium puzzle plus optical toys bundle for curiosity and imaginative play.",
    productIds: [
      "08b2c5fe-b8d6-49a6-946b-bf3d21b00759",
      "37763e24-9240-4a2e-a7d8-7b18649b0298",
      "18337bd9-43a9-4da2-820e-7b4a41416139",
      "10d5c3f6-b9ad-4f74-b4a4-7d520ab02221",
    ],
    discountPercent: 12,
    category: "Puzzles & Optics",
    stemDiscipline: "SCIENCE",
    ageGroup: "ELEMENTARY_6_8",
    supplierId: SUPPLIER_B,
  },
  {
    name: "Fridolin IQ Challenge Bundle",
    description: "Rope and 3D puzzles for concentration, patience, and advanced thinking.",
    productIds: [
      "09f378d6-17a8-45b5-b7a0-14cb25164b64",
      "35ef74ba-e208-40ca-9706-d21fe617629d",
      "26f222e4-1ed7-4363-9ab3-befb99b2c2cc",
      "3330e08b-bfdf-4f75-b06c-dddc20534e01",
      "2433f701-233d-443e-8978-f2430fa378d7",
    ],
    discountPercent: 15,
    category: "Logic Games",
    stemDiscipline: "MATHEMATICS",
    ageGroup: "ELEMENTARY_6_8",
    supplierId: SUPPLIER_B,
  },
  {
    name: "Thames Energy & Physics Lab Bundle",
    description: "Advanced STEM lab bundle focused on energy systems, electricity, and physics.",
    productIds: [
      "055c7518-8567-4500-bed1-f25cc391bc02",
      "e65a9160-441a-4d17-9137-703e5d900588",
      "28e2825d-091a-4019-8263-e63a08331da0",
    ],
    discountPercent: 9,
    category: "Science & Experiments",
    stemDiscipline: "TECHNOLOGY",
    ageGroup: "MIDDLE_SCHOOL_9_12",
    supplierId: SUPPLIER_B,
  },
  {
    name: "Egmont Magnetic Games Trio Bundle",
    description: "Three compact magnetic logic games ideal for travel and quick brain practice.",
    productIds: [
      "4c660443-eda6-4983-a9b4-3e640ba90acd",
      "667b3cfe-8a1c-40bd-8bea-9755809fa89d",
      "5cd32c03-6754-435f-8e9f-3bb1d88b105d",
    ],
    discountPercent: 12,
    category: "Logic Games",
    stemDiscipline: "MATHEMATICS",
    ageGroup: "ELEMENTARY_6_8",
    supplierId: SUPPLIER_B,
  },
];

async function createBundles() {
  console.log("📦 Starting bundle creation...");
  if (dryRun) {
    console.log("🧪 Dry run mode enabled (no DB writes)");
  }

  // Get all active products to use in bundles
  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      isBundle: false, // Don't include other bundles
    },
    select: {
      id: true,
      slug: true,
      name: true,
      price: true,
      costPrice: true,
      stockQuantity: true,
      images: true,
      supplierId: true,
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
    updated: 0,
    failed: 0,
    errors: [] as string[],
  };
  const supplierIdAliases = new Map<string, string>();

  for (const bundleDef of bundleDefinitions) {
    try {
      let selectedProducts: typeof products = [];

      // Resolve explicit bundle product references by ID first, then slug fallback.
      if (bundleDef.productIds.length > 0) {
        const productById = new Map(products.map(p => [p.id, p]));
        const productBySlug = new Map(products.map(p => [p.slug, p]));
        const resolvedProducts = bundleDef.productIds.map(id => {
          const byId = productById.get(id);
          if (byId) return byId;
          const fallbackSlug = legacyBundleItemSlugById[id];
          if (!fallbackSlug) return undefined;
          return productBySlug.get(fallbackSlug);
        });

        const missingIds = bundleDef.productIds.filter(
          (_id, index) => !resolvedProducts[index]
        );

        if (missingIds.length > 0) {
          console.log(
            `⚠️  Skipping bundle "${bundleDef.name}" - missing product references: ${missingIds.join(", ")}`
          );
          results.failed++;
          results.errors.push(
            `${bundleDef.name}: Missing product references (${missingIds.join(", ")})`
          );
          continue;
        }

        selectedProducts = resolvedProducts.filter(Boolean) as typeof products;
      } else {
        const bundleProducts = productsByCategory[bundleDef.category] || [];
        selectedProducts = bundleProducts.slice(0, Math.min(4, bundleProducts.length));
      }

      if (selectedProducts.length < 2) {
        console.log(
          `⚠️  Skipping bundle "${bundleDef.name}" - not enough products after resolution`
        );
        results.failed++;
        results.errors.push(`${bundleDef.name}: Not enough resolved products`);
        continue;
      }

      // Validate supplier consistency: all items must come from one supplier
      const supplierIds = [...new Set(selectedProducts.map((p) => p.supplierId).filter(Boolean))];
      if (supplierIds.length !== 1) {
        console.log(
          `⚠️  Skipping bundle "${bundleDef.name}" - bundle items must belong to exactly one supplier`
        );
        results.failed++;
        results.errors.push(`${bundleDef.name}: Mixed/invalid supplierIds in bundle items`);
        continue;
      }

      const inferredSupplierId = supplierIds[0] as string;
      if (bundleDef.supplierId) {
        const mappedSupplierId = supplierIdAliases.get(bundleDef.supplierId);

        // First bundle for this legacy supplier id establishes a runtime alias.
        // This supports environments where supplier IDs differ from CSV exports.
        if (!mappedSupplierId) {
          supplierIdAliases.set(bundleDef.supplierId, inferredSupplierId);
        } else if (mappedSupplierId !== inferredSupplierId) {
          console.log(
            `⚠️  Skipping bundle "${bundleDef.name}" - supplier mismatch (expected-mapped ${mappedSupplierId}, got ${inferredSupplierId})`
          );
          results.failed++;
          results.errors.push(
            `${bundleDef.name}: Supplier mismatch (${mappedSupplierId} vs ${inferredSupplierId})`
          );
          continue;
        }
      }

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

      const bundleData = {
        name: bundleDef.name,
        slug,
        description: bundleDef.description,
        price: bundlePrice,
        compareAtPrice: itemsTotal, // Show original total as compare price
        isBundle: true,
        bundleItems: selectedProducts.map(p => p.id),
        bundleDiscount: bundleDef.discountPercent,
        supplierId: inferredSupplierId,
        categoryId: category.id,
        stemDiscipline: bundleDef.stemDiscipline,
        ageGroup: bundleDef.ageGroup,
        images: bundleDef.images || selectedProducts[0]?.images || [],
        tags: [bundleDef.category, "Bundle", bundleDef.stemDiscipline],
        isActive: true,
        status: "APPROVED" as const,
        featured: true, // Feature bundles
        stockQuantity: Math.min(...selectedProducts.map(p => p.stockQuantity || 0)),
        // Calculate cost price from bundle items
        costPrice: selectedProducts.reduce((sum, p) => sum + (p.costPrice || 0), 0),
      };

      // Check if bundle already exists and update idempotently
      const existing = await prisma.product.findFirst({
        where: { slug },
        select: { id: true, isBundle: true },
      });

      if (existing && !existing.isBundle) {
        console.log(`⚠️  Slug conflict with non-bundle product: ${bundleDef.name}`);
        results.failed++;
        results.errors.push(`${bundleDef.name}: Slug conflict with non-bundle product`);
        continue;
      }

      if (dryRun) {
        if (existing?.isBundle) {
          console.log(
            `📝 [DRY RUN] Would update bundle: ${bundleDef.name} (${selectedProducts.length} items, supplier ${inferredSupplierId}, ${bundleDef.discountPercent}% off)`
          );
          results.updated++;
        } else {
          console.log(
            `📝 [DRY RUN] Would create bundle: ${bundleDef.name} (${selectedProducts.length} items, supplier ${inferredSupplierId}, ${bundleDef.discountPercent}% off)`
          );
          results.created++;
        }
        continue;
      }

      if (existing?.isBundle) {
        await prisma.product.update({
          where: { id: existing.id },
          data: bundleData,
        });
        console.log(`♻️  Updated bundle: ${bundleDef.name}`);
        results.updated++;
      } else {
        await prisma.product.create({ data: bundleData });
        console.log(`✅ Created bundle: ${bundleDef.name}`);
        results.created++;
      }
    } catch (error) {
      console.error(`❌ Failed to create bundle "${bundleDef.name}":`, error);
      results.failed++;
      results.errors.push(`${bundleDef.name}: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  console.log("\n📊 Bundle Creation Summary:");
  console.log(`  ✅ Created: ${results.created}`);
  console.log(`  ♻️  Updated: ${results.updated}`);
  console.log(`  ❌ Failed: ${results.failed}`);
  if (results.errors.length > 0) {
    console.log("\n❌ Errors:");
    results.errors.forEach(err => console.log(`  - ${err}`));
  }
  if (supplierIdAliases.size > 0) {
    console.log("\n🔎 Supplier ID aliases resolved:");
    for (const [legacyId, runtimeId] of supplierIdAliases.entries()) {
      console.log(`  - ${legacyId} -> ${runtimeId}`);
    }
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
