/**
 * TechTots Upsell Add-Ons Batch 2 Staging Script
 * 
 * Creates hidden (active=false) add-on products from research CSV
 * with images and descriptions from supplier feeds, paired to their
 * base products for the CompleteSetUpsell component.
 * 
 * Run with --dry-run (default) to preview changes.
 * Run with --apply to execute changes.
 * 
 * Requirements:
 * - Excludes the 6 add-ons from PR #31 (already in production)
 * - Excludes any products already active in catalog
 * - Validates against live feeds: still in stock, has images, not duplicate
 * - Creates products as active=false, status=APPROVED, featured=false
 * - Includes supplier images and descriptions from feeds
 * - Updates portfolio.json files to register for supplier syncs
 * - Idempotent: re-running skips existing SKUs
 * - Takes backup before any writes
 * - Prints clear dry-run report
 */

import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";
import * as XLSX from "xlsx";
import { fetchBoribonProducts, boribonContent } from "../lib/suppliers/boribon/feed";
import { fetchKidstoryProducts, kidstoryContent } from "../lib/suppliers/kidstory/feed";
import boribonPortfolio from "../lib/suppliers/boribon/portfolio.json";
import kidstoryPortfolio from "../lib/suppliers/kidstory/portfolio.json";

// Load environment variables
const envLocalPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath });
} else {
  dotenv.config();
}

const prisma = new PrismaClient();

const DRY_RUN = !process.argv.includes("--apply");
const BACKUP_DIR = path.join(process.cwd(), "backups", `upsell-batch-2_${Date.now()}`);
const CSV_PATH = process.argv.includes("--csv")
  ? process.argv[process.argv.indexOf("--csv") + 1]
  : path.join(process.cwd(), "data", "upsell", "upsell-candidates-batch-2.csv");

// SKUs already installed in PR #31 - exclude from this batch
const EXISTING_UPSELLS = ["K_550202", "K_550203", "K_550204", "DJ05648", "CC-1027", "CC-1029"];

// Supplier IDs (from feed files)
const BORIBON_ID = "ee75eea8-9f64-4076-96a2-52f5d6926c14";
const KIDSTORY_ID = "26f5418c-965d-4630-994c-b51947cdec04";

interface CandidateRow {
  supplier: string;
  base_sku: string;
  base_title: string;
  candidate_sku: string;
  candidate_title: string;
  feed_price: string;
  suggested_retail_if_known: string;
  stock: string;
  has_images: string;
  image_count: string;
  has_description: string;
  fit_reason: string;
  confidence: string;
}

interface ValidationResult {
  sku: string;
  name: string;
  supplier: "Boribon" | "Kidstory";
  baseSku: string;
  baseSkus?: string[]; // For deduped results with multiple base pairings
  status: "create" | "skip" | "reject";
  reason?: string;
  feedPrice?: number;
  feedStock?: number | string;
  images?: string[];
  description?: string;
  categoryId?: string;
  brand?: string;
  ean?: string;
  age?: string;
  ageGroup?: string | null;
}

interface ProductCreationResult {
  sku: string;
  status: "created" | "exists" | "error";
  productId?: string;
  slug?: string;
  pairings?: string[];
  error?: string;
}

/**
 * Map Kidstory age strings to standard ageGroup values
 * Based on common age ranges found in Kidstory feed
 */
function mapKidstoryAgeGroup(age: string | undefined): string | null {
  if (!age) return null;
  
  const ageLower = age.toLowerCase().trim();
  
  // Extract numbers from strings like "3+", "6-8", "8-12 ani", etc.
  const match = ageLower.match(/(\d+)[\s\-+]*(?:(\d+))?/);
  if (!match) return null;
  
  const minAge = parseInt(match[1]);
  const maxAge = match[2] ? parseInt(match[2]) : minAge;
  
  // Map to standard age groups
  if (maxAge <= 3) return "TODDLERS_1_3";
  if (maxAge <= 5) return "PRESCHOOL_3_5";
  if (maxAge <= 8 || (minAge >= 6 && maxAge <= 10)) return "ELEMENTARY_6_8";
  if (maxAge <= 12 || (minAge >= 9 && maxAge <= 14)) return "MIDDLE_SCHOOL_9_12";
  if (minAge >= 13) return "TEENS_13_PLUS";
  
  // Default for unclear ranges
  if (minAge >= 6 && maxAge >= 8) return "ELEMENTARY_6_8";
  
  return null;
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
 * Parse the research CSV
 */
function parseResearchCsv(csvPath: string): CandidateRow[] {
  if (!fs.existsSync(csvPath)) {
    throw new Error(`CSV file not found: ${csvPath}`);
  }
  
  const csvContent = fs.readFileSync(csvPath, "utf-8");
  const workbook = XLSX.read(csvContent, { type: "string", raw: false });
  const rows = XLSX.utils.sheet_to_json<CandidateRow>(
    workbook.Sheets[workbook.SheetNames[0]],
    { raw: false }
  );
  
  // Filter to high and medium confidence (case-insensitive), exclude already-installed SKUs
  // Accept "med" as synonym for "medium"
  return rows.filter(row => {
    const confidence = row.confidence?.toLowerCase() || "";
    const isHighOrMed = confidence === "high" || confidence === "medium" || confidence === "med";
    return isHighOrMed && !EXISTING_UPSELLS.includes(row.candidate_sku);
  });
}

/**
 * Validate candidates against live feeds
 */
async function validateCandidates(candidates: CandidateRow[]): Promise<{
  results: ValidationResult[];
  boribonFeed: any[];
  kidstoryFeed: any[];
}> {
  console.log("\n📋 Validating candidates against live feeds...\n");
  
  // Fetch both feeds
  let boribonFeed: Awaited<ReturnType<typeof fetchBoribonProducts>> = [];
  let kidstoryFeed: Awaited<ReturnType<typeof fetchKidstoryProducts>> = [];
  
  try {
    console.log("  Fetching Boribon feed...");
    boribonFeed = await fetchBoribonProducts();
    console.log(`  ✓ Boribon feed fetched (${boribonFeed.length} portfolio items)`);
  } catch (error) {
    console.error(`  ✗ Failed to fetch Boribon feed: ${error}`);
    throw error;
  }
  
  try {
    console.log("  Fetching Kidstory feed...");
    const kidstoryFeedRecord = await prisma.supplierFeed.findFirst({
      where: { supplierId: KIDSTORY_ID },
      select: { sourceUrl: true },
    });
    if (kidstoryFeedRecord?.sourceUrl) {
      kidstoryFeed = await fetchKidstoryProducts(kidstoryFeedRecord.sourceUrl);
      console.log(`  ✓ Kidstory feed fetched (${kidstoryFeed.length} portfolio items)`);
    } else {
      console.warn("  ⚠ Kidstory feed URL not configured");
    }
  } catch (error) {
    console.error(`  ✗ Failed to fetch Kidstory feed: ${error}`);
    // Continue without Kidstory - will reject those candidates
  }
  
  // Check existing products in database
  const existingProducts = await prisma.product.findMany({
    where: {
      OR: [
        { isActive: true },
        { sku: { in: candidates.map(c => c.candidate_sku) } },
      ],
    },
    select: { id: true, sku: true, name: true, slug: true, isActive: true },
  });
  
  const existingSkuSet = new Set(existingProducts.filter(p => p.isActive).map(p => p.sku));
  const existingStagedSkuSet = new Set(
    existingProducts.filter(p => !p.isActive).map(p => p.sku)
  );
  
  // Get base products for category inheritance
  const baseSkus = [...new Set(candidates.map(c => c.base_sku))];
  const baseProducts = await prisma.product.findMany({
    where: { sku: { in: baseSkus }, isActive: true },
    select: { sku: true, categoryId: true, category: { select: { name: true } } },
  });
  
  const baseProductMap = new Map(baseProducts.map(p => [p.sku, p]));
  
  const results: ValidationResult[] = [];
  
  for (const candidate of candidates) {
    const result: ValidationResult = {
      sku: candidate.candidate_sku,
      name: candidate.candidate_title,
      supplier: candidate.supplier as "Boribon" | "Kidstory",
      baseSku: candidate.base_sku,
      status: "create",
    };
    
    // Check if already active
    if (existingSkuSet.has(candidate.candidate_sku)) {
      result.status = "skip";
      result.reason = "Already active in catalog";
      results.push(result);
      continue;
    }
    
    // Check if already staged
    if (existingStagedSkuSet.has(candidate.candidate_sku)) {
      result.status = "skip";
      result.reason = "Already staged (inactive product exists)";
      results.push(result);
      continue;
    }
    
    // Validate against appropriate feed
    if (candidate.supplier === "Boribon") {
      const feedItem = boribonFeed.find(
        item => item.entry.model === candidate.candidate_sku
      );
      
      if (!feedItem) {
        result.status = "reject";
        result.reason = "Not found in Boribon feed";
        results.push(result);
        continue;
      }
      
      if (!feedItem.valid || feedItem.stock <= 0) {
        result.status = "reject";
        result.reason = `Out of stock or invalid in feed (stock: ${feedItem.stock})`;
        results.push(result);
        continue;
      }
      
      // Extract content from Boribon feed (images, description)
      try {
        const content = boribonContent(feedItem.row);
        result.feedPrice = feedItem.price;
        result.feedStock = feedItem.stock;
        result.images = content.images;
        result.description = content.description;
        result.ean = feedItem.entry.ean;
        result.brand = content.attributes.brand;
        result.age = content.attributes.age;
        
        if (!result.images.length) {
          result.status = "reject";
          result.reason = "No images in feed";
          results.push(result);
          continue;
        }
      } catch (error) {
        result.status = "reject";
        result.reason = `Failed to extract content: ${error}`;
        results.push(result);
        continue;
      }
      
      // Check for duplicate with base product (name similarity)
      const baseName = candidate.base_title.toLowerCase();
      const candName = candidate.candidate_title.toLowerCase();
      if (baseName === candName) {
        result.status = "reject";
        result.reason = "Near-duplicate of base product (same name)";
        results.push(result);
        continue;
      }
      
    } else if (candidate.supplier === "Kidstory") {
      const feedItem = kidstoryFeed.find(
        item => item.entry.sku === candidate.candidate_sku
      );
      
      if (!feedItem) {
        result.status = "reject";
        result.reason = "Not found in Kidstory feed";
        results.push(result);
        continue;
      }
      
      if (!feedItem.valid || !feedItem.available) {
        result.status = "reject";
        result.reason = `Not available in feed (available: ${feedItem.available})`;
        results.push(result);
        continue;
      }
      
      // Extract content from Kidstory feed
      try {
        const content = kidstoryContent(feedItem.row);
        result.feedPrice = feedItem.retailPrice;
        result.feedStock = "instock"; // Kidstory doesn't provide quantity
        result.images = content.images;
        result.description = content.description;
        result.ean = feedItem.entry.ean;
        result.brand = content.attributes.brand;
        result.age = content.attributes.age || content.attributes.ageRange;
        result.ageGroup = mapKidstoryAgeGroup(result.age);
        
        if (!result.images.length) {
          result.status = "reject";
          result.reason = "No images in feed";
          results.push(result);
          continue;
        }
      } catch (error) {
        result.status = "reject";
        result.reason = `Failed to extract content: ${error}`;
        results.push(result);
        continue;
      }
    }
    
    // Get category from base product
    const baseProduct = baseProductMap.get(candidate.base_sku);
    if (baseProduct?.categoryId) {
      result.categoryId = baseProduct.categoryId;
    } else {
      result.status = "reject";
      result.reason = `Base product ${candidate.base_sku} not found or has no category`;
      results.push(result);
      continue;
    }
    
    results.push(result);
  }
  
  return { results, boribonFeed, kidstoryFeed };
}

/**
 * Deduplicate validation results by candidate SKU, merging base SKUs into arrays
 * when a candidate pairs with multiple base products.
 */
function deduplicateResults(results: ValidationResult[]): ValidationResult[] {
  const dedupedMap = new Map<string, ValidationResult>();
  
  for (const result of results) {
    const existing = dedupedMap.get(result.sku);
    
    if (!existing) {
      // First occurrence: initialize baseSkus array
      dedupedMap.set(result.sku, {
        ...result,
        baseSkus: [result.baseSku],
      });
    } else if (existing.status === "create" && result.status === "create") {
      // Duplicate candidate SKU - merge base SKUs
      if (!existing.baseSkus!.includes(result.baseSku)) {
        existing.baseSkus!.push(result.baseSku);
      }
    }
    // If status differs (e.g., one is "skip", one is "create"), keep the first one
  }
  
  return Array.from(dedupedMap.values());
}

/**
 * Create backup (in both dry-run and apply modes)
 */
async function createBackup(mode: "dry-run" | "apply"): Promise<void> {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  
  // Backup Boribon and Kidstory products that might be affected
  const products = await prisma.product.findMany({
    where: {
      OR: [
        { supplierId: BORIBON_ID },
        { supplierId: KIDSTORY_ID },
      ],
    },
  });
  
  // Backup SupplierProduct rows
  const supplierProducts = await prisma.supplierProduct.findMany({
    where: {
      OR: [
        { supplierId: BORIBON_ID },
        { supplierId: KIDSTORY_ID },
      ],
    },
  });
  
  const backup = {
    mode,
    timestamp: new Date().toISOString(),
    products,
    supplierProducts,
  };
  
  fs.writeFileSync(
    path.join(BACKUP_DIR, `backup-${mode}.json`),
    JSON.stringify(backup, null, 2)
  );
  
  console.log(`✓ Backup created: ${BACKUP_DIR}/backup-${mode}.json`);
}

/**
 * Create products in database
 */
async function createProducts(results: ValidationResult[]): Promise<ProductCreationResult[]> {
  const createResults = results.filter(r => r.status === "create");
  const productResults: ProductCreationResult[] = [];
  
  for (const item of createResults) {
    const result: ProductCreationResult = {
      sku: item.sku,
      status: "created",
    };
    
    try {
      // Get supplier
      const supplierId = item.supplier === "Boribon" ? BORIBON_ID : KIDSTORY_ID;
      const supplier = await prisma.supplier.findUnique({
        where: { id: supplierId },
      });
      
      if (!supplier) {
        result.status = "error";
        result.error = `Supplier not found: ${item.supplier}`;
        productResults.push(result);
        continue;
      }
      
      // Find base product(s) for pairing - use baseSkus array if available
      const baseSkusToQuery = item.baseSkus || [item.baseSku];
      const baseProducts = await prisma.product.findMany({
        where: { sku: { in: baseSkusToQuery } },
      });
      
      if (baseProducts.length === 0) {
        result.status = "error";
        result.error = `Base product(s) not found: ${baseSkusToQuery.join(", ")}`;
        productResults.push(result);
        continue;
      }
      
      const slug = generateSlug(item.name, item.sku);
      
      if (!DRY_RUN) {
        // Prepare metadata with backwards-compatible format:
        // - Single base: upsellFor as string (legacy format)
        // - Multiple bases: upsellFor as array (new format)
        const upsellForValue = baseSkusToQuery.length === 1 
          ? baseSkusToQuery[0] 
          : baseSkusToQuery;
        
        // Create product
        const newProduct = await prisma.product.create({
          data: {
            name: item.name,
            slug,
            sku: item.sku,
            barcode: item.ean,
            description: item.description || item.name,
            price: item.feedPrice || 0,
            compareAtPrice: null,
            costPrice: null,
            categoryId: item.categoryId,
            supplierId: supplier.id,
            images: item.images || [],
            isActive: false, // HIDDEN - not visible to customers
            featured: false,
            stockQuantity: typeof item.feedStock === "number" ? item.feedStock : 1,
            reservedQuantity: 0,
            status: "APPROVED",
            ageGroup: item.ageGroup || null,
            attributes: {
              brand: item.brand || "",
              age: item.age || "",
            },
            metadata: {
              staged: true,
              stagedAt: new Date().toISOString(),
              stagedReason: "Upsell add-on batch 2 - awaiting activation",
              upsellFor: upsellForValue,
              upsellForProductIds: baseProducts.map(p => p.id),
              supplier: item.supplier,
            },
            tags: ["upsell", "add-on", "expansion", "staged", "batch-2"],
          },
        });
        
        result.productId = newProduct.id;
        result.slug = newProduct.slug;
        result.pairings = baseProducts.map(p => `${p.name} (${p.sku})`);
        
        // Create SupplierProduct for sync
        await prisma.supplierProduct.create({
          data: {
            supplierId: supplier.id,
            supplierSku: item.sku,
            name: item.name,
            description: item.description || item.name,
            currency: "RON",
            stock: typeof item.feedStock === "number" ? item.feedStock : 0,
            images: item.images || [],
            productId: newProduct.id,
            status: "MAPPED",
            attributes: {
              ean: item.ean,
              brand: item.brand || "",
              age: item.age || "",
            },
          },
        });
      } else {
        result.slug = slug;
        result.pairings = baseProducts.map(p => `${p.name} (${p.sku})`);
      }
      
    } catch (error) {
      result.status = "error";
      result.error = error instanceof Error ? error.message : String(error);
    }
    
    productResults.push(result);
  }
  
  return productResults;
}

/**
 * Main execution
 */
async function main() {
  console.log("🎯 TechTots Upsell Add-Ons Batch 2 Staging\n");
  console.log(`Mode: ${DRY_RUN ? "DRY RUN (preview only)" : "APPLY (executing changes)"}\n`);
  console.log(`CSV: ${CSV_PATH}\n`);
  
  // Parse research CSV
  console.log("📄 Parsing research CSV...\n");
  const candidates = parseResearchCsv(CSV_PATH);
  console.log(`  Found ${candidates.length} high/medium confidence candidates (excluding ${EXISTING_UPSELLS.length} already-installed SKUs)\n`);
  
  // Validate against live feeds
  const { results: rawValidationResults, boribonFeed, kidstoryFeed } = await validateCandidates(candidates);
  
  // Deduplicate by candidate SKU, merging base SKUs for multi-pairing add-ons
  const validationResults = deduplicateResults(rawValidationResults);
  
  // Print validation summary
  console.log("\n📊 VALIDATION SUMMARY:\n");
  console.log(`  Raw CSV rows (high/med): ${candidates.length}`);
  console.log(`  Unique candidate SKUs: ${validationResults.length}`);
  
  const toCreate = validationResults.filter(r => r.status === "create");
  const toSkip = validationResults.filter(r => r.status === "skip");
  const toReject = validationResults.filter(r => r.status === "reject");
  
  console.log(`  ✅ Create: ${toCreate.length}`);
  console.log(`  ⏭️  Skip: ${toSkip.length}`);
  console.log(`  ❌ Reject: ${toReject.length}`);
  
  if (toSkip.length > 0) {
    console.log("\n  Skipped (already exist):");
    toSkip.forEach(r => {
      console.log(`    - ${r.sku}: ${r.reason}`);
    });
  }
  
  if (toReject.length > 0) {
    console.log("\n  Rejected (failed validation):");
    toReject.forEach(r => {
      console.log(`    - ${r.sku}: ${r.reason}`);
    });
  }
  
  if (toCreate.length > 0) {
    console.log(`\n  ✅ Products ${DRY_RUN ? "that WOULD BE created" : "to create"}:`);
    toCreate.forEach(r => {
      const bases = r.baseSkus || [r.baseSku];
      console.log(`\n    ${r.sku} (${r.supplier})`);
      console.log(`      Name: ${r.name}`);
      console.log(`      Base SKUs: ${bases.join(", ")}`);
      console.log(`      Price: ${r.feedPrice} RON`);
      console.log(`      Stock: ${r.feedStock}`);
      console.log(`      Images: ${r.images?.length || 0}`);
      console.log(`      AgeGroup: ${r.ageGroup || "null"}`);
      console.log(`      Description: ${(r.description || "").substring(0, 100)}...`);
    });
  }
  
  if (toCreate.length === 0) {
    console.log("\n✨ Nothing to create. Done!");
    return;
  }
  
  // Create backup
  console.log("\n💾 Creating backup...\n");
  await createBackup(DRY_RUN ? "dry-run" : "apply");
  
  // Create products
  console.log(`\n📦 ${DRY_RUN ? "Simulating product creation..." : "Creating products..."}\n`);
  const productResults = await createProducts(validationResults);
  
  productResults.forEach((result, index) => {
    const statusLabel = DRY_RUN 
      ? (result.status === "created" ? "WOULD CREATE" : result.status.toUpperCase())
      : result.status.toUpperCase();
    console.log(`\n  ${index + 1}. ${result.sku}`);
    console.log(`     Status: ${statusLabel}`);
    if (result.slug) console.log(`     Slug: ${result.slug}`);
    if (result.productId && !DRY_RUN) console.log(`     Product ID: ${result.productId}`);
    if (result.pairings?.length) {
      console.log(`     Pairs with: ${result.pairings.join(", ")}`);
    }
    if (result.error) console.log(`     Error: ${result.error}`);
  });
  
  // Final summary
  console.log("\n\n🎉 FINAL SUMMARY:\n");
  console.log(`  Validated: ${validationResults.length} candidates`);
  console.log(`  To create: ${toCreate.length}`);
  console.log(`  Skipped: ${toSkip.length}`);
  console.log(`  Rejected: ${toReject.length}`);
  console.log(`  Successfully created: ${productResults.filter(p => p.status === "created").length}`);
  console.log(`  Errors: ${productResults.filter(p => p.status === "error").length}`);
  
  if (!DRY_RUN) {
    console.log(`\n✅ Changes applied successfully!`);
    console.log(`📁 Backup location: ${BACKUP_DIR}`);
    
    // Write summary
    const summary = {
      mode: "applied",
      timestamp: new Date().toISOString(),
      validation: validationResults,
      products: productResults,
      backupDir: BACKUP_DIR,
    };
    
    fs.writeFileSync(
      path.join("/tmp", "upsell-batch-2-summary.json"),
      JSON.stringify(summary, null, 2)
    );
    console.log(`📄 Summary written to /tmp/upsell-batch-2-summary.json`);
  } else {
    console.log(`\n✨ This was a DRY RUN. No changes were made.`);
    console.log(`   Run with --apply to execute changes.`);
  }
  
  console.log("\n⚠️  IMPORTANT:");
  console.log("   - All products created as active=false (HIDDEN)");
  console.log("   - They will appear in CompleteSetUpsell only after manual activation");
  console.log("   - Portfolio files already updated in this PR - syncs will maintain price and stock");
  console.log("   - Run dry-run command: pnpm exec tsx --env-file=.env.production.local scripts/stage-upsell-batch-2.ts");
  console.log("   - Run apply command: pnpm exec tsx --env-file=.env.production.local scripts/stage-upsell-batch-2.ts --apply");
  console.log(`   - Backup location: ${BACKUP_DIR}`);
}

main()
  .catch((error) => {
    console.error("\n❌ Fatal error:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
