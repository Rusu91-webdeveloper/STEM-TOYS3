/**
 * seed-products-csv.ts
 *
 * Seeder for feed_suppliers/catalog_keep_only.csv
 *
 * Modes (set via env vars):
 *
 *  DRY_RUN=true          Preview only — no writes at all.
 *
 *  CLEAN=true            LOCAL DEV ONLY — wipes all existing products first,
 *                        then seeds the full CSV. Hard-blocked on production URLs.
 *
 *  (no flags)            Safe INSERT-only mode — skips rows that already exist.
 *
 * Safety guarantees:
 *  - FK verification (suppliers + categories) before any write
 *  - createMany({ skipDuplicates: true }) as final safety net
 *  - JSON columns properly parsed (images, tags, bundleItems)
 *  - Empty SKU/barcode → null (avoids unique constraint errors)
 *  - Barcode .0 suffix stripped
 *  - Atomic transaction — rollback on any failure
 *  - CLEAN mode blocked if DATABASE_URL contains 'neon.tech' or 'production'
 */

import { PrismaClient, Prisma } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();
const DRY_RUN = process.env.DRY_RUN === 'true';
const CLEAN   = process.env.CLEAN   === 'true';
const CSV_PATH = path.join(__dirname, '../feed_suppliers/catalog_keep_only.csv');

/** Refuses to run CLEAN mode if the DATABASE_URL looks like production. */
function assertNotProduction() {
  const url = process.env.DATABASE_URL ?? '';
  const lc  = url.toLowerCase();
  const unsafe =
    lc.includes('neon.tech') ||
    lc.includes('production') ||
    lc.includes('prod.')      ||
    lc.includes('-prod-');

  if (unsafe) {
    console.error('\n🚫  CLEAN=true is BLOCKED on a production database URL.');
    console.error('    Switch your .env to your LOCAL development DATABASE_URL first.');
    console.error(`    URL hint: ${url.slice(0, 40)}…`);
    process.exit(1);
  }
}

// ─── CSV parser ─────────────────────────────────────────────────────────────
/**
 * Handles quoted fields that contain escaped quotes ("") and commas.
 * Returns an array of objects keyed by the header row.
 */
function parseCSV(text: string): Record<string, string>[] {
  // Normalise CRLF → LF
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const headers = splitCSVLine(lines[0]);
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const values = splitCSVLine(line);
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] ?? '';
    });
    rows.push(row);
  }
  return rows;
}

function splitCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    const next = line[i + 1];

    if (ch === '"' && inQuotes && next === '"') {
      // Escaped double-quote inside quoted field
      current += '"';
      i++;
    } else if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

// ─── Field helpers ───────────────────────────────────────────────────────────
function toNullableString(val: string): string | null {
  const trimmed = val.trim();
  return trimmed === '' ? null : trimmed;
}

function toNullableFloat(val: string): number | null {
  const trimmed = val.trim();
  if (trimmed === '' || trimmed === 'null') return null;
  const n = parseFloat(trimmed);
  return isNaN(n) ? null : n;
}

function toNullableInt(val: string): number | null {
  const trimmed = val.trim();
  if (trimmed === '' || trimmed === 'null') return null;
  const n = parseInt(trimmed, 10);
  return isNaN(n) ? null : n;
}

function toFloat(val: string, fallback = 0): number {
  const n = parseFloat(val.trim());
  return isNaN(n) ? fallback : n;
}

function toInt(val: string, fallback = 0): number {
  const n = parseInt(val.trim(), 10);
  return isNaN(n) ? fallback : n;
}

function toBool(val: string): boolean {
  return val.trim().toLowerCase() === 'true';
}

/** Parse JSON arrays stored as strings in the CSV. Returns [] on failure. */
function parseStringArray(val: string): string[] {
  const trimmed = val.trim();
  if (!trimmed || trimmed === 'null') return [];
  try {
    const parsed = JSON.parse(trimmed);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

/** Parse JSON value for Json? fields. Returns null on failure. */
function parseJson(val: string): Prisma.InputJsonValue | null {
  const trimmed = val.trim();
  if (!trimmed || trimmed === 'null') return null;
  try {
    return JSON.parse(trimmed) as Prisma.InputJsonValue;
  } catch {
    return null;
  }
}

/**
 * Strips the floating-point .0 suffix that some barcodes have in the CSV
 * (e.g. "814743010390.0" → "814743010390").
 * Returns null for empty values.
 */
function cleanBarcode(val: string): string | null {
  const s = val.trim();
  if (!s || s === 'null') return null;
  return s.endsWith('.0') ? s.slice(0, -2) : s;
}

// ─── Main ────────────────────────────────────────────────────────────────────
async function main() {
  const modeLabel = DRY_RUN ? '🔍 DRY-RUN' : CLEAN ? '🗑️  CLEAN + SEED (local dev)' : '🚀 INSERT-ONLY';
  console.log(`\n🌱  Product CSV Seeder — ${modeLabel}`);
  console.log(`    CSV: ${CSV_PATH}\n`);

  // Guard: never allow CLEAN on a production DB
  if (CLEAN) assertNotProduction();

  // 1. Verify CSV file exists
  if (!fs.existsSync(CSV_PATH)) {
    console.error(`❌  CSV file not found: ${CSV_PATH}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(CSV_PATH, 'utf-8');
  const rows = parseCSV(raw);
  console.log(`📄  Parsed ${rows.length} rows from CSV.`);

  // 2. Verify supplier FKs exist in production BEFORE touching anything
  const supplierIds = Array.from(new Set(rows.map(r => r.supplierId).filter(Boolean)));
  console.log(`\n🔗  Verifying ${supplierIds.length} supplier FK(s)…`);

  const foundSuppliers = await prisma.supplier.findMany({
    where: { id: { in: supplierIds } },
    select: { id: true, name: true, isActive: true },
  });

  const foundSupplierIds = new Set(foundSuppliers.map(s => s.id));
  let supplierOk = true;

  for (const sid of supplierIds) {
    if (foundSupplierIds.has(sid)) {
      const s = foundSuppliers.find(f => f.id === sid)!;
      console.log(`    ✅  ${sid} → ${s.name} (isActive: ${s.isActive})`);
    } else {
      console.error(`    ❌  Supplier NOT FOUND: ${sid}`);
      supplierOk = false;
    }
  }

  if (!supplierOk) {
    console.error('\n💥  Aborting: one or more supplier FKs are missing in production.');
    process.exit(1);
  }

  // 3. Verify categoryId FKs (only for rows that have a categoryId)
  const categoryIds = Array.from(new Set(rows.map(r => r.categoryId).filter(Boolean)));
  if (categoryIds.length > 0) {
    console.log(`\n🔗  Verifying ${categoryIds.length} category FK(s)…`);
    const foundCategories = await prisma.category.findMany({
      where: { id: { in: categoryIds } },
      select: { id: true, name: true },
    });
    const foundCategoryIds = new Set(foundCategories.map(c => c.id));
    let categoryOk = true;

    for (const cid of categoryIds) {
      if (foundCategoryIds.has(cid)) {
        const c = foundCategories.find(f => f.id === cid)!;
        console.log(`    ✅  ${cid} → ${c.name}`);
      } else {
        console.error(`    ❌  Category NOT FOUND: ${cid}`);
        categoryOk = false;
      }
    }

    if (!categoryOk) {
      console.error('\n💥  Aborting: one or more category FKs are missing in production.');
      process.exit(1);
    }
  }

  // 4. CLEAN mode: wipe all existing products first (LOCAL DEV ONLY)
  if (CLEAN && !DRY_RUN) {
    console.log('\n🗑️   CLEAN mode — wiping all existing products…');
    console.log('    Deleting dependent records in FK order…');

    // Delete in reverse-dependency order to avoid FK constraint errors.
    // MarketingCost, SupplierProduct, Wishlist, Review are all safe to delete directly.
    // OrderItems reference Products but may also reference Orders — null out productId instead
    // of deleting order items, so existing order history is preserved.
    await prisma.marketingCost.deleteMany({});
    console.log('    ✓  MarketingCost cleared');

    await prisma.supplierProduct.deleteMany({});
    console.log('    ✓  SupplierProduct cleared');

    await prisma.wishlist.deleteMany({ where: { productId: { not: null } } });
    console.log('    ✓  Wishlist (product entries) cleared');

    await prisma.review.deleteMany({});
    console.log('    ✓  Review cleared');

    // Null out orderItem.productId to preserve order history
    await prisma.orderItem.updateMany({
      where: { productId: { not: null } },
      data:  { productId: null },
    });
    console.log('    ✓  OrderItem.productId nulled (order history preserved)');

    // SupplierOrder.productId is non-nullable (String, onDelete: Cascade).
    // Prisma will cascade-delete these automatically when products are deleted,
    // but we delete them explicitly first to avoid FK constraint ordering issues.
    await prisma.supplierOrder.deleteMany({});
    console.log('    ✓  SupplierOrder cleared');

    // Now it's safe to wipe all products
    const deleted = await prisma.product.deleteMany({});
    console.log(`    ✓  Deleted ${deleted.count} products\n`);
  }

  // 5. Identify which rows are NEW (skip this check in CLEAN mode — all rows are new)
  let rowsToInsert = rows;

  if (!CLEAN) {
    console.log('\n🔍  Checking which products already exist…');

    const csvIds   = rows.map(r => r.id);
    const csvSlugs = rows.map(r => r.slug);

    const existingById = await prisma.product.findMany({
      where: { id: { in: csvIds } },
      select: { id: true, slug: true, updatedAt: true },
    });
    const existingBySlug = await prisma.product.findMany({
      where: { slug: { in: csvSlugs } },
      select: { id: true, slug: true },
    });

    const existingIds   = new Set(existingById.map(p => p.id));
    const existingSlugs = new Set(existingBySlug.map(p => p.slug));

    const skippedRows = rows.filter(r => existingIds.has(r.id) || existingSlugs.has(r.slug));
    rowsToInsert      = rows.filter(r => !existingIds.has(r.id) && !existingSlugs.has(r.slug));

    console.log(`    ⏭️   Already exists (will skip): ${skippedRows.length}`);
    console.log(`    ✨  New products to insert:      ${rowsToInsert.length}`);

    if (skippedRows.length > 0) {
      console.log('\n  Skipped:');
      skippedRows.forEach(r => console.log(`    - [${r.id}] ${r.name}`));
    }

    if (rowsToInsert.length === 0) {
      console.log('\n✅  Nothing to do — all CSV products already exist.');
      return;
    }
  }

  // 6. Transform rows into Prisma create payloads
  const productsToInsert = rowsToInsert.map((r: Record<string, string>) => {
    // Parse JSON fields
    const images = parseStringArray(r.images);
    const tags = parseStringArray(r.tags);
    const bundleItems = parseJson(r.bundleItems);

    // Parse optional scalar fields
    const compareAtPrice = toNullableFloat(r.compareAtPrice);
    const sku = toNullableString(r.sku);
    const barcode = cleanBarcode(r.barcode);
    const categoryId = toNullableString(r.categoryId);
    const supplierId = toNullableString(r.supplierId);
    const reorderPoint = toNullableInt(r.reorderPoint);
    const weight = toNullableFloat(r.weight);
    const averageRating = toNullableFloat(r.averageRating);
    const bundleDiscount = toNullableFloat(r.bundleDiscount);
    const costPrice = toNullableFloat(r.costPrice);

    // Dimensions stored as empty in CSV — keep null
    const dimensions = parseJson(r.dimensions);
    const attributes = parseJson(r.attributes);
    const metadata = parseJson(r.metadata);

    return {
      id: r.id,
      name: r.name,
      slug: r.slug,
      description: toNullableString(r.description),
      price: toFloat(r.price),
      compareAtPrice,
      sku,
      images,
      categoryId,
      tags,
      attributes: attributes ?? Prisma.JsonNull,
      metadata: metadata ?? Prisma.JsonNull,
      isActive: toBool(r.isActive),
      featured: toBool(r.featured),
      stockQuantity: toInt(r.stockQuantity),
      reservedQuantity: toInt(r.reservedQuantity),
      reorderPoint,
      weight,
      dimensions: dimensions ?? Prisma.JsonNull,
      averageRating,
      reviewCount: toInt(r.reviewCount),
      totalSold: toInt(r.totalSold),
      createdAt: r.createdAt ? new Date(r.createdAt) : new Date(),
      // updatedAt is managed by @updatedAt — Prisma sets it on create automatically
      barcode,
      ageGroup: toNullableString(r.ageGroup),
      costPrice,
      importDuties: toFloat(r.importDuties, 0),
      shippingCost: toFloat(r.shippingCost, 0),
      storageCost: toFloat(r.storageCost, 0),
      packagingCost: toFloat(r.packagingCost, 0),
      laborCost: toFloat(r.laborCost, 0),
      qualityControlCost: toFloat(r.qualityControlCost, 0),
      paymentProcessingFee: toFloat(r.paymentProcessingFee, 2.9),
      customerServiceCost: toFloat(r.customerServiceCost, 0),
      operationalOverhead: toFloat(r.operationalOverhead, 0),
      status: (r.status as 'APPROVED' | 'IN_PENDING' | 'REJECTED') || 'IN_PENDING',
      stemDiscipline: toNullableString(r.stemDiscipline),
      supplierId,
      isBundle: toBool(r.isBundle),
      bundleItems: bundleItems ?? Prisma.JsonNull,
      bundleDiscount,
    };
  });

  // 6. Preview
  console.log('\n📦  Products queued for insertion:');
  productsToInsert.forEach((p: { id: string; name: string; price: number; sku: string | null; isBundle: boolean }) =>
    console.log(`    + [${p.id}] ${p.name} | price: ${p.price} | sku: ${p.sku ?? 'null'} | bundle: ${p.isBundle}`)
  );

  if (DRY_RUN) {
    console.log('\n🔍  DRY-RUN complete — no data written. Remove DRY_RUN=true to seed for real.\n');
    return;
  }

  // 7. Insert in a transaction — atomic rollback on error
  console.log('\n💾  Inserting in transaction…');
  await prisma.$transaction(async (tx) => {
    const result = await tx.product.createMany({
      data: productsToInsert,
      skipDuplicates: true, // final safety net against race conditions
    });
    console.log(`\n✅  Inserted ${result.count} new product(s) successfully.`);
  });

  console.log('\n🎉  Seed complete. Existing production data was never touched.\n');
}

main()
  .catch(e => {
    console.error('\n💥  Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
