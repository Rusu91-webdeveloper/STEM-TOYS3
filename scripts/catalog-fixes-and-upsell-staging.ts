/**
 * TechTots Catalog Fixes + Upsell Product Staging Script
 * 
 * Run with --dry-run to preview changes without applying them.
 * Run with --apply to execute the changes.
 * 
 * FIXES:
 * 1. Carson MicroFlip: Keep MP-250 plain (139 RON), deactivate MP-250BUN bundle
 * 2. Aqua Dragons: Deactivate mismatched refill AD4004
 * 
 * NEW PRODUCTS (staged as inactive, tracked by Boribon sync):
 * - 3x T&K Gecko Run expansions @ 103 RON each
 * - Djeco Zig & Go Cultubo 7 pieces @ 80 RON
 * - Cleverclixx mini tiles @ 126 RON
 * - Cleverclixx glitter tiles 16 pieces @ 164 RON
 * 
 * The 6 add-ons are added to lib/suppliers/boribon/portfolio.json
 * and will have images, stock, and price synced by the Boribon sync (06:00/18:00).
 */

import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

// Load environment variables
const envLocalPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath });
} else {
  dotenv.config();
}

const prisma = new PrismaClient();

const DRY_RUN = !process.argv.includes("--apply");
const BACKUP_DIR = path.join(process.cwd(), ".backups", `catalog-fixes-${Date.now()}`);

// Real supplier feed data from Boribon (2026-09-25)
// These products are added to lib/suppliers/boribon/portfolio.json
// and tracked by the Boribon sync (06:00/18:00) which will populate images, update stock and price
const NEW_PRODUCTS_DATA = [
  {
    sku: "K_550202",
    ean: "814743017887",
    name: "Kit STEM Trambulina - extindere pentru cursa cu obstacole cu bila metalica, Thames & Kosmos",
    brand: "Thames & Kosmos",
    price: 103,
    stock: 11,
    category: "Stiinta si Experimente (STEM)",
    age: "6 - 9 ani, 9 - 12 ani",
    supplierUrl: "https://www.boribon.ro/cumpara/kit-stem-trambulina-extindere-pentru-cursa-cu-obstacole-cu-bila-4406",
    pairsWithSku: "K_550201"
  },
  {
    sku: "K_550203",
    ean: "814743017894",
    name: "Kit STEM Bucla - extindere pentru cursa cu obstacole cu bilă metalica, Thames & Kosmos",
    brand: "Thames & Kosmos",
    price: 103,
    stock: 9,
    category: "Stiinta si Experimente (STEM)",
    age: "6 - 9 ani, 9 - 12 ani",
    supplierUrl: "https://www.boribon.ro/cumpara/kit-stem-bucla-extindere-pentru-cursa-cu-obstacole-cu-bila-metalica-4407",
    pairsWithSku: "K_550201"
  },
  {
    sku: "K_550204",
    ean: "814743018785",
    name: "Kit STEM Palnie - extindere pentru cursa cu obstacole cu bila metalica, Thames & Kosmos",
    brand: "Thames & Kosmos",
    price: 103,
    stock: 8,
    category: "Stiinta si Experimente (STEM)",
    age: "6 - 9 ani, 9 - 12 ani",
    supplierUrl: "https://www.boribon.ro/cumpara/kit-stem-palnie-extindere-pentru-cursa-cu-obstacole-cu-bila-metalica-4408",
    pairsWithSku: "K_550201"
  },
  {
    sku: "DJ05648",
    ean: "3070900056480",
    name: "Set de constructie trasee Zig & Go Cultubo 7 piese, Djeco",
    brand: "Djeco",
    price: 80,
    stock: 6,
    category: "Cuburi si blocuri",
    age: "6 - 9 ani, 9 - 12 ani",
    supplierUrl: "https://www.boribon.ro/cumpara/set-de-constructie-trasee-zig-go-cultubo-7-piese-djeco-2955",
    pairsWithSku: "DJ05640"
  },
  {
    sku: "CC-1027",
    ean: "6152121148100",
    name: "Set magnetic de construit cu placute mici, Cleverclixx",
    brand: "Cleverclixx",
    price: 126,
    stock: 39,
    category: "Constructie magnetica",
    age: "3 - 6 ani, 6 - 9 ani",
    supplierUrl: "https://www.boribon.ro/cumpara/set-magnetic-de-construit-cu-placute-mici-cleverclixx-8410",
    pairsWithSku: "CC- 1009" // Note: space in SKU as per live catalog
  },
  {
    sku: "CC-1029",
    ean: "6152121374356",
    name: "Set magnetic de construit cu placi stralucitoare, Cleverclixx",
    brand: "Cleverclixx",
    price: 164,
    stock: 15,
    category: "Constructie magnetica",
    age: "3 - 6 ani, 6 - 9 ani",
    supplierUrl: "https://www.boribon.ro/cumpara/set-magnetic-de-construit-cu-placi-stralucitoare-cleverclixx-8408",
    pairsWithSku: "CC-1004"
  }
];

interface FixResult {
  fixNumber: number;
  name: string;
  status: "success" | "skipped" | "error";
  details: string;
  filesChanged?: string[];
  skusOrSlugs?: string[];
  rootCause?: string;
}

interface ProductResult {
  sku: string;
  name: string;
  status: "created" | "exists" | "error";
  productId?: string;
  slug?: string;
  pairsWithProduct?: string;
  error?: string;
}

/**
 * Creates a backup of current state before any changes
 */
async function createBackup(): Promise<void> {
  if (DRY_RUN) return;
  
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  
  const products = await prisma.product.findMany({
    where: {
      OR: [
        { sku: { in: ["MP-250", "MP-250BUN"] } },
        { sku: { in: ["AD4004", "AD6102"] } },
        ...NEW_PRODUCTS_DATA.map(p => ({ sku: p.sku }))
      ]
    }
  });
  
  fs.writeFileSync(
    path.join(BACKUP_DIR, "products-before.json"),
    JSON.stringify(products, null, 2)
  );
  
  console.log(`✓ Backup created: ${BACKUP_DIR}/products-before.json`);
}

/**
 * FIX 1: Carson MicroFlip
 * Keep MP-250 plain (139 RON, lower entry price)
 * Deactivate MP-250BUN bundle (224 RON)
 */
async function fixMicroFlipDuplicate(): Promise<FixResult> {
  const result: FixResult = {
    fixNumber: 1,
    name: "Carson MicroFlip Duplicate",
    status: "success",
    details: "",
    skusOrSlugs: [],
    rootCause: "Two SKUs for same product line - MP-250 (plain, 139 RON) vs MP-250BUN (bundle with 24 slides, 224 RON). Keeping plain version as lower-priced entry point."
  };
  
  try {
    const plainMicroscope = await prisma.product.findFirst({
      where: { sku: "MP-250" }
    });
    
    const bundleMicroscope = await prisma.product.findFirst({
      where: { sku: "MP-250BUN" }
    });
    
    if (!plainMicroscope && !bundleMicroscope) {
      result.status = "skipped";
      result.details = "Neither MP-250 nor MP-250BUN found in database";
      return result;
    }
    
    if (!bundleMicroscope) {
      result.status = "skipped";
      result.details = "MP-250BUN not found, MP-250 is the only version (already correct)";
      result.skusOrSlugs = plainMicroscope ? [plainMicroscope.slug] : [];
      return result;
    }
    
    if (!plainMicroscope) {
      result.status = "skipped";
      result.details = "MP-250 not found but MP-250BUN exists - no deactivation needed";
      result.skusOrSlugs = [bundleMicroscope.slug];
      return result;
    }
    
    // Check if bundle is already inactive
    if (!bundleMicroscope.isActive) {
      result.status = "skipped";
      result.details = `MP-250BUN already inactive. MP-250 (${plainMicroscope.slug}) is active at ${plainMicroscope.price} RON.`;
      result.skusOrSlugs = [plainMicroscope.slug, bundleMicroscope.slug];
      return result;
    }
    
    // Deactivate the bundle, keep the plain one
    if (!DRY_RUN) {
      const currentMetadata = typeof bundleMicroscope.metadata === 'object' && bundleMicroscope.metadata !== null
        ? bundleMicroscope.metadata as Record<string, unknown>
        : {};
        
      await prisma.product.update({
        where: { id: bundleMicroscope.id },
        data: {
          isActive: false,
          featured: false,
          metadata: {
            ...currentMetadata,
            blocklistReason: "Duplicate - keeping plain MP-250 version instead of bundle",
            deactivatedAt: new Date().toISOString()
          }
        }
      });
    }
    
    result.details = `Deactivated MP-250BUN bundle (${bundleMicroscope.slug}, 224 RON). Kept MP-250 plain microscope (${plainMicroscope.slug}, 139 RON) as the single listing.`;
    result.skusOrSlugs = [plainMicroscope.slug, bundleMicroscope.slug];
    result.filesChanged = ["scripts/catalog-fixes-and-upsell-staging.ts", "Product table"];
    
  } catch (error) {
    result.status = "error";
    result.details = `Error: ${error instanceof Error ? error.message : String(error)}`;
  }
  
  return result;
}

/**
 * FIX 2: Aqua Dragons refill mismatch
 * AD4004 is for "Lumea subacvatica" line, not Vulcan (AD6102)
 * Correct Vulcan refill (AD6103) is out of stock
 */
async function fixAquaDragonsRefill(): Promise<FixResult> {
  const result: FixResult = {
    fixNumber: 2,
    name: "Aqua Dragons Refill Alignment",
    status: "success",
    details: "",
    skusOrSlugs: [],
    rootCause: "Refill AD4004 belongs to 'Lumea subacvatica' habitat line, not Vulcan (AD6102). Correct Vulcan refill is AD6103 (out of stock per Kidstory feed). Deactivating mismatched refill and staging correct one as inactive."
  };
  
  try {
    const refillAD4004 = await prisma.product.findFirst({
      where: { sku: "AD4004" }
    });
    
    const habitatVulcan = await prisma.product.findFirst({
      where: { sku: "AD6102" }
    });
    
    if (!refillAD4004) {
      result.status = "skipped";
      result.details = "Refill AD4004 not found in database";
      return result;
    }
    
    // Check if already inactive
    if (!refillAD4004.isActive) {
      result.status = "skipped";
      result.details = `AD4004 already inactive (${refillAD4004.slug})`;
      result.skusOrSlugs = [refillAD4004.slug];
      return result;
    }
    
    if (!DRY_RUN) {
      const currentMetadata = typeof refillAD4004.metadata === 'object' && refillAD4004.metadata !== null
        ? refillAD4004.metadata as Record<string, unknown>
        : {};
        
      // Deactivate AD4004 since it's for the wrong habitat line
      await prisma.product.update({
        where: { id: refillAD4004.id },
        data: {
          isActive: false,
          metadata: {
            ...currentMetadata,
            blocklistReason: "Refill incompatible with live Vulcan habitat - belongs to Lumea subacvatica line",
            deactivatedAt: new Date().toISOString(),
            correctVulcanRefill: "AD6103"
          }
        }
      });
    }
    
    const skuList = [refillAD4004.slug];
    if (habitatVulcan) skuList.push(habitatVulcan.slug);
    
    result.details = `Deactivated AD4004 (${refillAD4004.slug}) - it's for Lumea subacvatica, not Vulcan. Correct Vulcan refill AD6103 is out of stock, so staging it inactive (not added in this script - will be handled by supplier sync).`;
    result.skusOrSlugs = skuList;
    result.filesChanged = ["scripts/catalog-fixes-and-upsell-staging.ts", "Product table"];
    
  } catch (error) {
    result.status = "error";
    result.details = `Error: ${error instanceof Error ? error.message : String(error)}`;
  }
  
  return result;
}

/**
 * Generate a deterministic slug from product name and SKU
 */
function generateSlug(name: string, sku: string): string {
  const slugBase = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  
  const skuSlug = sku.toLowerCase().replace(/[^a-z0-9]+/g, "");
  return `${slugBase}-${skuSlug}`;
}

/**
 * Add new upsell products as staged (inactive)
 */
async function addUpsellProducts(): Promise<ProductResult[]> {
  const results: ProductResult[] = [];
  
  // Get Boribon supplier
  const boribon = await prisma.supplier.findFirst({
    where: { companySlug: "boribon" }
  });
  
  if (!boribon) {
    console.error("⚠ Boribon supplier not found. Cannot add products.");
    return [];
  }
  
  for (const productData of NEW_PRODUCTS_DATA) {
    const result: ProductResult = {
      sku: productData.sku,
      name: productData.name,
      status: "created"
    };
    
    try {
      // Check if product already exists
      const existing = await prisma.product.findFirst({
        where: { sku: productData.sku }
      });
      
      if (existing) {
        result.status = "exists";
        result.productId = existing.id;
        result.slug = existing.slug;
        results.push(result);
        continue;
      }
      
      // Find base product this pairs with
      const pairsWithProduct = await prisma.product.findFirst({
        where: { sku: productData.pairsWithSku }
      });
      
      if (pairsWithProduct) {
        result.pairsWithProduct = `${pairsWithProduct.name} (${pairsWithProduct.slug})`;
      } else {
        result.error = `Warning: Base product ${productData.pairsWithSku} not found for pairing`;
      }
      
      // Find or use fallback category
      let categoryId: string | undefined;
      const matchingCategory = await prisma.category.findFirst({
        where: {
          name: { contains: productData.category.split("||")[0].trim(), mode: 'insensitive' }
        }
      });
      
      if (matchingCategory) {
        categoryId = matchingCategory.id;
      } else {
        // Fallback: use same category as base product
        if (pairsWithProduct?.categoryId) {
          categoryId = pairsWithProduct.categoryId;
        } else {
          result.status = "error";
          result.error = `Category '${productData.category}' not found and no base product to inherit from`;
          results.push(result);
          continue;
        }
      }
      
      const slug = generateSlug(productData.name, productData.sku);
      
      if (!DRY_RUN) {
        const newProduct = await prisma.product.create({
          data: {
            name: productData.name,
            slug,
            sku: productData.sku,
            barcode: productData.ean,
            description: `${productData.name}. ${productData.category}. ${productData.age}.`,
            price: productData.price,
            compareAtPrice: null,
            costPrice: null,
            categoryId,
            supplierId: boribon.id,
            images: [], // Will be populated by supplier sync
            isActive: false, // STAGED - not visible to customers
            featured: false,
            stockQuantity: productData.stock,
            reservedQuantity: 0,
            status: "APPROVED",
            attributes: {
              brand: productData.brand,
              supplierUrl: productData.supplierUrl,
              age: productData.age,
              category: productData.category
            },
            metadata: {
              staged: true,
              stagedAt: new Date().toISOString(),
              stagedReason: "Awaiting upsell pairing validation",
              upsellFor: productData.pairsWithSku,
              upsellForProductId: pairsWithProduct?.id
            },
            tags: ["upsell", "add-on", "expansion", "staged"]
          }
        });
        
        result.productId = newProduct.id;
        result.slug = newProduct.slug;
        
        // Create SupplierProduct for sync
        // Note: price field is purchase cost, not retail price. Left null for sync to fill.
        await prisma.supplierProduct.create({
          data: {
            supplierId: boribon.id,
            supplierSku: productData.sku,
            name: productData.name,
            description: `${productData.name}. ${productData.age}.`,
            currency: "RON",
            stock: productData.stock,
            images: [], // Boribon sync will populate from feed
            productId: newProduct.id,
            status: "MAPPED",
            attributes: {
              ean: productData.ean,
              brand: productData.brand,
              sourceUrl: productData.supplierUrl,
              age: productData.age,
              category: productData.category
            }
          }
        });
      } else {
        result.slug = slug;
      }
      
    } catch (error) {
      result.status = "error";
      result.error = error instanceof Error ? error.message : String(error);
    }
    
    results.push(result);
  }
  
  return results;
}

/**
 * Main execution
 */
async function main() {
  console.log("🔧 TechTots Catalog Fixes + Upsell Staging\n");
  console.log(`Mode: ${DRY_RUN ? "DRY RUN (preview only)" : "APPLY (executing changes)"}\n`);
  
  if (!DRY_RUN) {
    await createBackup();
  }
  
  // Execute two fixes
  console.log("📋 EXECUTING FIXES:\n");
  
  const fix1 = await fixMicroFlipDuplicate();
  console.log(`\nFix #1: ${fix1.name}`);
  console.log(`Status: ${fix1.status.toUpperCase()}`);
  console.log(`Details: ${fix1.details}`);
  if (fix1.rootCause) console.log(`Root Cause: ${fix1.rootCause}`);
  if (fix1.skusOrSlugs?.length) console.log(`SKUs/Slugs: ${fix1.skusOrSlugs.join(", ")}`);
  
  const fix2 = await fixAquaDragonsRefill();
  console.log(`\nFix #2: ${fix2.name}`);
  console.log(`Status: ${fix2.status.toUpperCase()}`);
  console.log(`Details: ${fix2.details}`);
  if (fix2.rootCause) console.log(`Root Cause: ${fix2.rootCause}`);
  if (fix2.skusOrSlugs?.length) console.log(`SKUs/Slugs: ${fix2.skusOrSlugs.join(", ")}`);
  
  // Add new upsell products
  console.log("\n\n📦 STAGING NEW UPSELL PRODUCTS:\n");
  
  const productResults = await addUpsellProducts();
  productResults.forEach((result, index) => {
    console.log(`\n${index + 1}. ${result.name} (${result.sku})`);
    console.log(`   Status: ${result.status.toUpperCase()}`);
    if (result.slug) console.log(`   Slug: ${result.slug}`);
    if (result.productId) console.log(`   Product ID: ${result.productId}`);
    if (result.pairsWithProduct) console.log(`   Pairs with: ${result.pairsWithProduct}`);
    if (result.error) console.log(`   Error/Warning: ${result.error}`);
  });
  
  // Summary
  console.log("\n\n📊 SUMMARY:\n");
  console.log(`Fixes Applied: ${[fix1, fix2].filter(f => f.status === "success").length}/2`);
  console.log(`Products Created: ${productResults.filter(p => p.status === "created").length}/${productResults.length}`);
  console.log(`Products Already Exist: ${productResults.filter(p => p.status === "exists").length}`);
  console.log(`Errors: ${productResults.filter(p => p.status === "error").length}`);
  
  if (!DRY_RUN) {
    console.log(`\n✅ Changes applied successfully!`);
    console.log(`📁 Backup location: ${BACKUP_DIR}`);
    
    // Write summary to gitignored temp location
    const summary = {
      mode: "applied",
      timestamp: new Date().toISOString(),
      fixes: [fix1, fix2],
      newProducts: productResults,
      backupDir: BACKUP_DIR
    };
    
    fs.writeFileSync(
      path.join("/tmp", "catalog-fixes-summary.json"),
      JSON.stringify(summary, null, 2)
    );
    console.log(`📄 Summary written to /tmp/catalog-fixes-summary.json`);
  } else {
    console.log(`\n✨ This was a DRY RUN. No changes were made.`);
    console.log(`   Run with --apply to execute changes.`);
  }
}

main()
  .catch((error) => {
    console.error("❌ Fatal error:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
