/**
 * Generates 2 SQL files for adding Boribon and Kidstory suppliers + products
 * to production Neon database. Run: pnpm exec tsx scripts/generate-supplier-seed-sql.ts
 */

import * as fs from "fs";
import * as path from "path";
import { slugify } from "../lib/utils";

function escapeSql(s: string): string {
  if (!s) return "";
  return s.replace(/'/g, "''").replace(/\\/g, "\\\\");
}

function parseCSV(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let currentVal = "";
  let insideQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];
    if (char === '"') {
      if (insideQuotes && next === '"') {
        currentVal += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === "," && !insideQuotes) {
      row.push(currentVal);
      currentVal = "";
    } else if ((char === "\n" || char === "\r") && !insideQuotes) {
      if (char === "\r" && next === "\n") i++;
      row.push(currentVal);
      rows.push(row);
      row = [];
      currentVal = "";
    } else {
      currentVal += char;
    }
  }
  if (currentVal.length > 0 || row.length > 0) {
    row.push(currentVal);
    rows.push(row);
  }
  if (rows.length < 2) return [];
  const headers = rows[0].map((h) => h.trim());
  const dataRows = rows.slice(1).filter((r) => r.some((cell) => cell.trim() !== ""));
  return dataRows.map((cols) => {
    const record: Record<string, string> = {};
    headers.forEach((header, idx) => {
      record[header] = (cols[idx] ?? "").trim();
    });
    return record;
  });
}

function boribonImages(row: Record<string, string>): string[] {
  const urls: string[] = [];
  const avatar = row.avatar?.trim();
  if (avatar) urls.push(avatar);
  for (let i = 1; i <= 4; i++) {
    const url = row[`image_additional${i}`]?.trim();
    if (url) urls.push(url);
  }
  return urls.filter(Boolean);
}

function kidstoryImages(row: Record<string, string>): string[] {
  const urls: string[] = [];
  const file = row.file?.trim();
  if (file) urls.push(file);
  for (let i = 2; i <= 10; i++) {
    const url = row[`image${i}`]?.trim();
    if (url) urls.push(url);
  }
  return urls.filter(Boolean);
}

function arrayToSql(arr: string[]): string {
  if (arr.length === 0) return "ARRAY[]::text[]";
  const escaped = arr.map((u) => `'${escapeSql(u)}'`).join(", ");
  return `ARRAY[${escaped}]::text[]`;
}

function generateBoribonSql(): string {
  const csvPath = path.resolve(process.cwd(), "feed_suppliers/boribon_dropshipping.csv");
  const content = fs.readFileSync(csvPath, "utf-8");
  const rows = parseCSV(content);

  const supplierId = "gen_random_uuid()";
  const lines: string[] = [
    "-- Boribon supplier + products for production Neon",
    "BEGIN;",
    "",
    "-- 1. Insert Boribon supplier (skip if exists)",
    `INSERT INTO "Supplier" (id, name, email, phone, "isActive", "createdAt", "updatedAt", "companySlug", status, "defaultMargin", "minimumMarginPercentage", "priceChangeThreshold")`,
    `VALUES (gen_random_uuid(), 'Boribon', 'contact@boribon.ro', '0723 753 360', true, NOW(), NOW(), 'boribon', 'APPROVED', 0.4, 0.2, 0.1)`,
    `ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, "companySlug" = EXCLUDED."companySlug", status = EXCLUDED.status;`,
    "",
    "-- 2. Get supplier ID (use subquery in inserts)",
    "",
    "-- 3. Insert Boribon products",
  ];

  for (const row of rows) {
    const name = row.name?.trim();
    if (!name) continue;
    const sku = row.model?.trim() || row.sup_sku?.trim() || row.id?.trim() || "";
    if (!sku) continue;
    const priceB2c = parseFloat(row.price_b2c || "0");
    if (!Number.isFinite(priceB2c) || priceB2c <= 0) continue;

    const costPrice = parseFloat(row.sup_dropshipping_with_VAT || "0") || null;
    const slug = `${slugify(name)}-${sku.replace(/[^a-zA-Z0-9-_]/g, "-")}`;
    const images = boribonImages(row);
    const desc = (row.description || "").slice(0, 5000);
    const ageGroup = row.ageGroup?.trim() || row.varsta?.trim() || null;
    const stemDiscipline = row.stemDiscipline?.trim() || null;
    const stock = Math.max(0, parseInt(row.quantity || "0", 10) || 0);
    const barcode = row.ean_filled?.trim() || row.sku?.trim() || null;
    const brand = row.brand?.trim() || null;
    const tags = brand ? `ARRAY['${escapeSql(brand)}']::text[]` : "ARRAY[]::text[]";

    lines.push(
      `INSERT INTO "Product" (id, name, slug, description, price, "costPrice", "stockQuantity", images, "isActive", status, tags, barcode, "ageGroup", "stemDiscipline", "supplierId", "createdAt", "updatedAt")`,
      `SELECT gen_random_uuid(), '${escapeSql(name)}', '${escapeSql(slug)}', ${desc ? `'${escapeSql(desc)}'` : "NULL"}, ${priceB2c}, ${costPrice || "NULL"}, ${stock}, ${arrayToSql(images)}, true, 'APPROVED', ${tags}, ${barcode ? `'${escapeSql(barcode)}'` : "NULL"}, ${ageGroup ? `'${escapeSql(ageGroup)}'` : "NULL"}, ${stemDiscipline ? `'${escapeSql(stemDiscipline)}'` : "NULL"}, s.id, NOW(), NOW()`,
      `FROM "Supplier" s WHERE s.email = 'contact@boribon.ro'`,
      `ON CONFLICT (slug) DO NOTHING;`,
      ""
    );
  }

  lines.push("COMMIT;");
  return lines.join("\n");
}

function generateKidstorySql(): string {
  const csvPath = path.resolve(process.cwd(), "feed_suppliers/kidstory_dropshipping.csv");
  const content = fs.readFileSync(csvPath, "utf-8");
  const rows = parseCSV(content);

  const kidstoryEmail = "contact@kidstory.ro";

  const lines: string[] = [
    "-- Kidstory supplier + products for production Neon",
    "BEGIN;",
    "",
    "-- 1. Insert Kidstory supplier (skip if exists)",
    `INSERT INTO "Supplier" (id, name, email, phone, "isActive", "createdAt", "updatedAt", "companySlug", status, "defaultMargin", "minimumMarginPercentage", "priceChangeThreshold")`,
    `VALUES (gen_random_uuid(), 'Kidstory', '${kidstoryEmail}', '+40 21 123 4567', true, NOW(), NOW(), 'kidstory', 'APPROVED', 0.25, 0.15, 0.1)`,
    `ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, "companySlug" = EXCLUDED."companySlug", status = EXCLUDED.status;`,
    "",
    "-- 2. Insert Kidstory products",
  ];

  for (const row of rows) {
    const name = row.name?.trim();
    if (!name) continue;
    const sku = row.sku?.trim() || row.id?.trim() || "";
    if (!sku) continue;
    const priceVat = parseFloat(row.base_price || row.price_vat || "0");
    if (!Number.isFinite(priceVat) || priceVat <= 0) continue;

    const costPrice =
      parseFloat(row.b2b_price_gross_RON || row.b2b_price_net_RON || "0") || null;
    const slug = `${slugify(name)}-${sku.replace(/[^a-zA-Z0-9-_]/g, "-")}`;
    const images = kidstoryImages(row);
    const desc = (row.description || row.short_description || "").slice(0, 5000);
    const ageGroup = row.ageGroup?.trim() || row.varsta?.trim() || null;
    const stemDiscipline = row.stemDiscipline?.trim() || null;
    const stock = 99;
    const brand = row.brand_name?.trim() || null;
    const tags = brand ? `ARRAY['${escapeSql(brand)}']::text[]` : "ARRAY[]::text[]";

    lines.push(
      `INSERT INTO "Product" (id, name, slug, description, price, "costPrice", "stockQuantity", images, "isActive", status, tags, "ageGroup", "stemDiscipline", "supplierId", "createdAt", "updatedAt")`,
      `SELECT gen_random_uuid(), '${escapeSql(name)}', '${escapeSql(slug)}', ${desc ? `'${escapeSql(desc)}'` : "NULL"}, ${priceVat}, ${costPrice || "NULL"}, ${stock}, ${arrayToSql(images)}, true, 'APPROVED', ${tags}, ${ageGroup ? `'${escapeSql(ageGroup)}'` : "NULL"}, ${stemDiscipline ? `'${escapeSql(stemDiscipline)}'` : "NULL"}, s.id, NOW(), NOW()`,
      `FROM "Supplier" s WHERE s.email = '${kidstoryEmail}'`,
      `ON CONFLICT (slug) DO NOTHING;`,
      ""
    );
  }

  lines.push("COMMIT;");
  return lines.join("\n");
}

async function main() {
  const outDir = path.resolve(process.cwd(), "sql");
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const boribonSql = generateBoribonSql();
  const kidstorySql = generateKidstorySql();

  fs.writeFileSync(path.join(outDir, "seed-boribon-supplier-and-products.sql"), boribonSql);
  fs.writeFileSync(path.join(outDir, "seed-kidstory-supplier-and-products.sql"), kidstorySql);

  console.log("Generated:");
  console.log("  - sql/seed-boribon-supplier-and-products.sql");
  console.log("  - sql/seed-kidstory-supplier-and-products.sql");
  console.log("");
  console.log("Run against Neon production:");
  console.log('  psql "$DATABASE_URL" -f sql/seed-boribon-supplier-and-products.sql');
  console.log('  psql "$DATABASE_URL" -f sql/seed-kidstory-supplier-and-products.sql');
}

main().catch(console.error);
