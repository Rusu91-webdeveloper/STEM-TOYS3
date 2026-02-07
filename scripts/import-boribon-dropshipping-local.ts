/**
 * Import Boribon dropshipping CSV locally.
 *
 * Reads feed_suppliers/boribon_dropshipping_133_with_VAT21.csv and creates
 * Product + SupplierProduct records. Applies 10 RON weight surcharge for
 * products over 2 kg (baked into price).
 *
 * Mappings:
 * - price_b2c → Product.price (customer-facing, after weight surcharge)
 * - sup_dropshipping_with_VAT → Product.costPrice, SupplierProduct.price (COGS)
 * - model → supplierSku
 * - greutate → weight for surcharge
 */

import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

import { PrismaClient } from "@prisma/client";
import { slugify } from "../lib/utils";
import {
  parseWeightKg,
  applyWeightSurcharge,
  getWeightSurchargeRon,
  WEIGHT_SURCHARGE_CONFIG,
} from "../lib/pricing/weight-surcharge";

const prisma = new PrismaClient();

const CSV_PATH = path.resolve(
  process.cwd(),
  process.env.BORIBON_CSV_PATH ||
    "feed_suppliers/boribon_dropshipping_133_with_VAT21.csv"
);

const envLocalPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath });
} else {
  dotenv.config();
}

type BoribonRow = Record<string, string>;

function parseCSV(text: string): BoribonRow[] {
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

  const headers = rows[0].map(h => h.trim());
  const dataRows = rows.slice(1).filter(r =>
    r.some(cell => cell.trim() !== "")
  );

  return dataRows.map(cols => {
    const record: BoribonRow = {};
    headers.forEach((header, idx) => {
      record[header] = (cols[idx] ?? "").trim();
    });
    return record;
  });
}

function parseImages(row: BoribonRow): string[] {
  const urls: string[] = [];
  const avatar = row.avatar?.trim();
  if (avatar) urls.push(avatar);
  for (let i = 1; i <= 4; i++) {
    const url = row[`image_additional${i}`]?.trim();
    if (url) urls.push(url);
  }
  return urls.filter(Boolean);
}

function parseCategoryPath(value?: string): string[] {
  if (!value) return [];
  return value
    .split("||")
    .map(item => item.trim())
    .filter(Boolean);
}

function parseListField(value?: string): string[] {
  if (!value) return [];
  const raw = value.trim();
  if (!raw || raw === "[]") return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed))
      return parsed.map(v => String(v).trim()).filter(Boolean);
  } catch {
    // fall through to comma-split
  }
  return raw
    .split(",")
    .map(item => item.trim())
    .filter(Boolean);
}

function mapCategorySlug(categories: string[]): string {
  const text = categories.join(" ").toLowerCase();
  if (
    text.includes("robotics") ||
    text.includes("robotica") ||
    text.includes("robot") ||
    text.includes("coding") ||
    text.includes("codare")
  )
    return "technology";
  if (
    text.includes("electronics") ||
    text.includes("electronic") ||
    text.includes("electric") ||
    text.includes("electricitate") ||
    text.includes("circuit") ||
    text.includes("circuite")
  )
    return "technology";
  if (
    text.includes("engineering") ||
    text.includes("inginerie") ||
    text.includes("construct") ||
    text.includes("construit") ||
    text.includes("constructie") ||
    text.includes("construc") ||
    text.includes("magnet") ||
    text.includes("magnetic")
  )
    return "engineering";
  if (
    text.includes("science") ||
    text.includes("stiinta") ||
    text.includes("știin") ||
    text.includes("fizica") ||
    text.includes("chimie") ||
    text.includes("biologie") ||
    text.includes("stem") ||
    text.includes("steam") ||
    text.includes("experimente") ||
    text.includes("experiment")
  )
    return "science";
  if (
    text.includes("mathemat") ||
    text.includes("matematic") ||
    text.includes("logic") ||
    text.includes("logica") ||
    text.includes("sudoku") ||
    text.includes("tangram") ||
    text.includes("puzzle")
  )
    return "mathematics";
  return "science";
}

/** Map Boribon categories to productType for filter compatibility */
function mapProductType(categories: string[], name: string): string | undefined {
  const text = (categories.join(" ") + " " + name).toLowerCase();
  if (
    text.includes("robot") ||
    text.includes("robotica") ||
    text.includes("coding") ||
    text.includes("codare") ||
    text.includes("micro:bit")
  )
    return "ROBOTICS";
  if (
    text.includes("puzzle") ||
    text.includes("tangram") ||
    text.includes("sudoku") ||
    text.includes("logica") ||
    text.includes("iq ")
  )
    return "PUZZLES";
  if (
    text.includes("construit") ||
    text.includes("constructie") ||
    text.includes("constructii") ||
    text.includes("construct") ||
    text.includes("magnetic") ||
    text.includes("magnet") ||
    text.includes("cleverclixx") ||
    text.includes("magformers") ||
    text.includes("clics")
  )
    return "CONSTRUCTION_SETS";
  if (
    text.includes("kit stem") ||
    text.includes("experiment") ||
    text.includes("circuit") ||
    text.includes("electricitate") ||
    text.includes("fizica")
  )
    return "EXPERIMENT_KITS";
  if (text.includes("joc") && (text.includes("masa") || text.includes("societate")))
    return "BOARD_GAMES";
  return "CONSTRUCTION_SETS"; // Default for STEM toys
}

/** Infer learning outcomes from product type and categories */
function mapLearningOutcomes(productType: string, categories: string[]): string[] {
  const outcomes: string[] = ["CREATIVITY", "PROBLEM_SOLVING"];
  if (productType === "PUZZLES" || categories.some(c => /logica|logic/i.test(c))) {
    outcomes.push("LOGIC", "CRITICAL_THINKING");
  }
  if (
    productType === "CONSTRUCTION_SETS" ||
    productType === "EXPERIMENT_KITS" ||
    productType === "ROBOTICS"
  ) {
    outcomes.push("MOTOR_SKILLS", "CRITICAL_THINKING");
  }
  return [...new Set(outcomes)];
}

async function ensureCategory(slug: string) {
  const existing = await prisma.category.findUnique({ where: { slug } });
  if (existing) return existing;

  const nameMap: Record<string, string> = {
    science: "Science",
    technology: "Technology",
    engineering: "Engineering",
    mathematics: "Mathematics",
  };

  const name = nameMap[slug] || slug.replace(/-/g, " ");
  return prisma.category.create({
    data: {
      name,
      slug,
      description: `Category for ${name}`,
      isActive: true,
    },
  });
}

function mapAgeGroup(varsta?: string): string | undefined {
  if (!varsta) return undefined;
  const normalized = varsta.replace(/\s+/g, " ").trim();
  if (normalized.includes("13+") || normalized.includes("12+"))
    return "TEENS_13_PLUS";
  if (normalized.includes("9+")) return "MIDDLE_SCHOOL_9_12";
  if (normalized.includes("6 - 9") || normalized.includes("6-9")) return "ELEMENTARY_6_8";
  if (normalized.includes("3 - 6") || normalized.includes("3-6")) return "PRESCHOOL_3_5";
  if (
    normalized.includes("1 - 3") ||
    normalized.includes("0 - 1") ||
    normalized.includes("1-3")
  )
    return "TODDLERS_1_3";
  return undefined;
}

function mapSpecialCategories(categories: string[]): string[] {
  const text = categories.join(" ").toLowerCase();
  const specials: string[] = [];

  if (text.includes("noutati") || text.includes("nou")) {
    specials.push("NEW_ARRIVALS");
  }
  if (text.includes("promotii") || text.includes("promo") || text.includes("outlet")) {
    specials.push("SALE_ITEMS");
  }
  if (text.includes("cadouri") || text.includes("gift") || text.includes("cadori")) {
    specials.push("GIFT_IDEAS");
  }
  if (text.includes("bestseller") || text.includes("best sellers")) {
    specials.push("BEST_SELLERS");
  }

  return [...new Set(specials)];
}

async function main() {
  if (!fs.existsSync(CSV_PATH)) {
    throw new Error(`CSV not found at ${CSV_PATH}`);
  }

  const fileContent = fs.readFileSync(CSV_PATH, "utf-8");
  const rows = parseCSV(fileContent);

  console.log(`Found ${rows.length} rows in Boribon CSV.`);

  const supplier = await prisma.supplier.upsert({
    where: { email: "contact@boribon.ro" },
    update: {
      name: "Boribon",
      companySlug: "boribon",
      status: "APPROVED",
      defaultMargin: 0.4,
      minimumMarginPercentage: 0.2,
      priceChangeThreshold: 0.1,
    },
    create: {
      name: "Boribon",
      email: "contact@boribon.ro",
      phone: "0723 753 360",
      status: "APPROVED",
      companySlug: "boribon",
      isActive: true,
      defaultMargin: 0.4,
      minimumMarginPercentage: 0.2,
      priceChangeThreshold: 0.1,
    },
  });

  let imported = 0;
  let updated = 0;
  let skipped = 0;
  let surcharged = 0;

  for (const row of rows) {
    const name = row.name?.trim();
    if (!name) {
      skipped++;
      continue;
    }

    const supplierSku =
      row.model?.trim() || row.id?.trim() || row.ean_filled?.trim() || row.sup_sku?.trim();
    if (!supplierSku) {
      console.warn(`Skipping row without SKU: ${name}`);
      skipped++;
      continue;
    }

    const priceB2cRaw = row.price_b2c?.trim();
    const priceB2c = priceB2cRaw ? Number(priceB2cRaw) : NaN;
    if (!Number.isFinite(priceB2c) || priceB2c <= 0) {
      skipped++;
      continue;
    }

    const costPriceRaw = row.sup_dropshipping_with_VAT?.trim();
    const costPrice = costPriceRaw ? Number(costPriceRaw) : 0;

    const weightKg = parseWeightKg(row.greutate);
    const surcharge = getWeightSurchargeRon(weightKg);
    const finalPrice = applyWeightSurcharge(priceB2c, weightKg);

    if (surcharge > 0) surcharged++;

    const slug = `${slugify(name)}-${supplierSku.replace(/[^a-zA-Z0-9-_]/g, "-")}`;
    const images = parseImages(row);
    const categoryPath = parseCategoryPath(row.categories);
    const categorySlug = mapCategorySlug(categoryPath);
    const category = await ensureCategory(categorySlug);
    const stock = Math.max(0, parseInt(row.quantity || "0", 10) || 0);
    const barcode = row.ean_filled?.trim() || row.sku?.trim() || undefined;
    const ageGroup = row.ageGroup?.trim() || mapAgeGroup(row.varsta);
    const productType = row.productType?.trim() || mapProductType(categoryPath, name);
    const learningOutcomesFromCsv = parseListField(row.learningOutcomes);
    const specialCategoriesFromCsv = parseListField(row.specialCategories);
    const learningOutcomes =
      learningOutcomesFromCsv.length > 0
        ? learningOutcomesFromCsv
        : mapLearningOutcomes(productType || "", categoryPath);
    const specialCategories =
      specialCategoriesFromCsv.length > 0
        ? specialCategoriesFromCsv
        : mapSpecialCategories(categoryPath);
    const stemDiscipline = row.stemDiscipline?.trim() || categorySlug.toUpperCase();

    const metadata = {
      source: path.basename(CSV_PATH),
      boribonId: row.id || null,
      brand: row.brand || null,
      supplierUrl: row.url || null,
      categoryPath,
      weightSurchargeApplied: surcharge > 0,
      productType: productType || null,
      learningOutcomes,
      specialCategories,
    };

    const productData = {
      name,
      slug,
      sku: supplierSku,
      description: row.description?.trim() || null,
      price: Math.round(finalPrice * 100) / 100,
      costPrice: costPrice > 0 ? costPrice : null,
      stockQuantity: stock,
      images,
      isActive: true,
      status: "APPROVED" as const,
      tags: [row.brand?.trim()].filter(Boolean),
      weight: weightKg ?? undefined,
      barcode,
      ageGroup,
      stemDiscipline,
      metadata,
      supplierId: supplier.id,
      categoryId: category.id,
    };

    const existing = await prisma.product.findFirst({
      where: {
        OR: [{ sku: supplierSku }, { slug }],
      },
    });

    if (existing) {
      await prisma.product.update({
        where: { id: existing.id },
        data: productData,
      });
      updated++;

      await prisma.supplierProduct.upsert({
        where: {
          supplierId_supplierSku: {
            supplierId: supplier.id,
            supplierSku,
          },
        },
        update: {
          productId: existing.id,
          name,
          description: row.description?.trim() || null,
          price: costPrice > 0 ? costPrice : null,
          stock,
          images,
          categoryPath,
          lastSyncAt: new Date(),
          status: "MAPPED",
        },
        create: {
          supplierId: supplier.id,
          supplierSku,
          productId: existing.id,
          name,
          description: row.description?.trim() || null,
          price: costPrice > 0 ? costPrice : null,
          stock,
          images,
          categoryPath,
          lastSyncAt: new Date(),
          status: "MAPPED",
        },
      });
    } else {
      const created = await prisma.product.create({ data: productData });
      imported++;

      await prisma.supplierProduct.upsert({
        where: {
          supplierId_supplierSku: {
            supplierId: supplier.id,
            supplierSku,
          },
        },
        update: {
          productId: created.id,
          name,
          description: row.description?.trim() || null,
          price: costPrice > 0 ? costPrice : null,
          stock,
          images,
          categoryPath,
          lastSyncAt: new Date(),
          status: "MAPPED",
        },
        create: {
          supplierId: supplier.id,
          supplierSku,
          productId: created.id,
          name,
          description: row.description?.trim() || null,
          price: costPrice > 0 ? costPrice : null,
          stock,
          images,
          categoryPath,
          lastSyncAt: new Date(),
          status: "MAPPED",
        },
      });
    }

    const surchargeInfo = surcharge > 0 ? ` (+${surcharge} RON surcharge)` : "";
    console.log(
      `[${existing ? "UPD" : "NEW"}] ${supplierSku} - ${name} | ${finalPrice} RON${surchargeInfo}`
    );
  }

  console.log("\n--- Import complete ---");
  console.log(`Imported: ${imported}, Updated: ${updated}, Skipped: ${skipped}`);
  console.log(
    `Weight surcharge (${WEIGHT_SURCHARGE_CONFIG.thresholdKg} kg threshold, +${WEIGHT_SURCHARGE_CONFIG.surchargeRon} RON): applied to ${surcharged} products`
  );
}

main()
  .catch(error => {
    console.error("Import failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
