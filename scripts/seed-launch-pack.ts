import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

import { PrismaClient } from "@prisma/client";
import { calculateDropshippingPrice } from "../lib/pricing/dropshipping-pricing";

const prisma = new PrismaClient();

const DEFAULT_MARGIN = 0.4; // 40% target margin
const DEFAULT_SHIPPING_COST = 15; // RON

const envLocalPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath });
} else {
  dotenv.config();
}

type LaunchPackRow = Record<string, string>;

function parseCSV(text: string): LaunchPackRow[] {
  const lines = text.split("\n").filter(l => l.trim() !== "");
  const headers = lines[0].split(",").map(h => h.trim());
  const rows: LaunchPackRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const row: LaunchPackRow = {};
    let currentVal = "";
    let insideQuotes = false;
    let colIndex = 0;

    for (let charIndex = 0; charIndex < line.length; charIndex++) {
      const char = line[charIndex];

      if (char === '"') {
        insideQuotes = !insideQuotes;
      } else if (char === "," && !insideQuotes) {
        row[headers[colIndex]] = currentVal
          .trim()
          .replace(/^"|"$/g, "")
          .replace(/""/g, '"');
        currentVal = "";
        colIndex++;
      } else {
        currentVal += char;
      }
    }

    row[headers[colIndex]] = currentVal
      .trim()
      .replace(/^"|"$/g, "")
      .replace(/""/g, '"');

    rows.push(row);
  }

  return rows;
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseList(value?: string): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map(item => item.trim())
    .filter(Boolean);
}

function parseImages(value?: string): string[] {
  if (!value) return [];
  return value
    .split("|")
    .map(item => item.trim())
    .filter(Boolean);
}

function mapStemDiscipline(productType: string): string {
  const normalized = productType.toLowerCase();
  if (normalized.includes("robotics") || normalized.includes("coding")) {
    return "TECHNOLOGY";
  }
  if (normalized.includes("electronics") || normalized.includes("circuits")) {
    return "TECHNOLOGY";
  }
  if (normalized.includes("engineering") || normalized.includes("logic")) {
    return "ENGINEERING";
  }
  if (normalized.includes("renewable")) {
    return "SCIENCE";
  }
  if (normalized.includes("science") || normalized.includes("lab")) {
    return "SCIENCE";
  }
  if (normalized.includes("mathemat")) {
    return "MATHEMATICS";
  }
  return "GENERAL";
}

function mapCategorySlug(productType: string): string {
  const normalized = productType.toLowerCase();
  if (normalized.includes("robotics") || normalized.includes("coding")) {
    return "technology";
  }
  if (normalized.includes("electronics") || normalized.includes("circuits")) {
    return "technology";
  }
  if (normalized.includes("engineering") || normalized.includes("logic")) {
    return "engineering";
  }
  if (normalized.includes("renewable")) {
    return "science";
  }
  if (normalized.includes("science") || normalized.includes("lab")) {
    return "science";
  }
  if (normalized.includes("mathemat")) {
    return "mathematics";
  }
  return "science";
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

function mapAgeGroup(ageRange: string | undefined): string | undefined {
  if (!ageRange) return undefined;
  const normalized = ageRange.replace(/\s+/g, " ").trim();
  if (normalized.includes("9+")) return "MIDDLE_SCHOOL_9_12";
  if (normalized.includes("6 - 9")) return "ELEMENTARY_6_8";
  if (normalized.includes("3 - 6")) return "PRESCHOOL_3_5";
  if (normalized.includes("1 - 3") || normalized.includes("0 - 1"))
    return "TODDLERS_1_3";
  return "ELEMENTARY_6_8";
}

function parseBundleItems(value?: string) {
  if (!value) return [];
  return value
    .split(";")
    .map(item => item.trim())
    .filter(Boolean)
    .map(item => {
      const match = item.match(/^(.*)\(([^)]+)\)\s*$/);
      if (match) {
        return { title: match[1].trim(), sku: match[2].trim() };
      }
      return { title: item, sku: "" };
    });
}

async function main() {
  const csvPath = path.resolve(process.cwd(), "launch_pack_50.csv");
  if (!fs.existsSync(csvPath)) {
    throw new Error(`launch_pack_50.csv not found at ${csvPath}`);
  }

  const fileContent = fs.readFileSync(csvPath, "utf-8");
  const rows = parseCSV(fileContent);

  console.log(`Found ${rows.length} products in launch pack.`);

  const supplier = await prisma.supplier.upsert({
    where: { email: "contact@boribon.ro" },
    update: {
      name: "Boribon",
      companySlug: "boribon",
      status: "APPROVED",
      defaultMargin: DEFAULT_MARGIN,
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
      defaultMargin: DEFAULT_MARGIN,
      minimumMarginPercentage: 0.2,
      priceChangeThreshold: 0.1,
    },
  });

  let imported = 0;
  let updated = 0;

  for (const row of rows) {
    const sku = row.sku?.trim();
    if (!sku) {
      console.warn("Skipping row without SKU", row);
      continue;
    }

    const name = row.title?.trim() || "";
    const slug = `${slugify(name)}-${sku}`;

    const supplierPrice = Number(row.supplier_price_b2c_ron || 0);
    const supplierQty = Number.parseInt(row.supplier_qty || "0", 10) || 0;

    const pricing =
      supplierPrice > 0
        ? calculateDropshippingPrice({
            cogs: supplierPrice,
            shipping: DEFAULT_SHIPPING_COST,
            targetMargin: DEFAULT_MARGIN,
          })
        : null;

    const images = parseImages(row.image_urls || "");
    const mainImage = row.main_image?.trim();
    if (mainImage && !images.includes(mainImage)) {
      images.unshift(mainImage);
    }

    const tags = [
      ...(parseList(row.product_type) || []),
      ...(parseList(row.skills) || []),
      row.vendor?.trim(),
      row.launch_role?.trim(),
      "launch-pack",
    ]
      .filter(Boolean)
      .map(tag => String(tag).trim())
      .filter(Boolean);

    const ageGroup = mapAgeGroup(row.age_range);
    const stemDiscipline = mapStemDiscipline(row.product_type || "");
    const categorySlug = mapCategorySlug(row.product_type || "");
    const category = await ensureCategory(categorySlug);

    const weightKg = row.weight_kg ? Number(row.weight_kg) : undefined;
    const lengthCm = row.length_cm ? Number(row.length_cm) : undefined;
    const widthCm = row.width_cm ? Number(row.width_cm) : undefined;

    const metadata = {
      source: "launch_pack_50.csv",
      vendor: row.vendor || null,
      productType: row.product_type || null,
      ageRange: row.age_range || null,
      launchRole: row.launch_role || null,
      shortAngleRO: row.short_angle_ro || null,
      keyBenefits: parseList(row.key_benefits),
      skills: parseList(row.skills),
      supplierUrl: row.supplier_url || null,
      bundle: {
        theme: row.bundle_theme || null,
        discount: row.bundle_discount || null,
        items: parseBundleItems(row.bundle_items),
      },
    };

    const data = {
      name,
      slug,
      sku,
      description: row.description || null,
      price: pricing?.finalPrice ?? 0,
      costPrice: supplierPrice || 0,
      stockQuantity: supplierQty,
      images,
      isActive: supplierPrice > 0,
      featured: row.launch_role === "HERO",
      status: "APPROVED" as const,
      stemDiscipline,
      ageGroup,
      tags,
      weight: weightKg,
      dimensions:
        lengthCm || widthCm
          ? {
              lengthCm: lengthCm ?? null,
              widthCm: widthCm ?? null,
            }
          : undefined,
      metadata,
      supplierId: supplier.id,
      categoryId: category.id,
    };

    const existing = await prisma.product.findUnique({ where: { sku } });

    if (existing) {
      await prisma.product.update({
        where: { id: existing.id },
        data,
      });
      updated += 1;

      await prisma.supplierProduct.upsert({
        where: {
          supplierId_supplierSku: {
            supplierId: supplier.id,
            supplierSku: sku,
          },
        },
        update: {
          productId: existing.id,
          name,
          description: row.description || null,
          price: supplierPrice || 0,
          stock: supplierQty,
          images,
          categoryPath: parseImages(row.product_type || ""),
          lastSyncAt: new Date(),
          status: "MAPPED",
        },
        create: {
          supplierId: supplier.id,
          supplierSku: sku,
          productId: existing.id,
          name,
          description: row.description || null,
          price: supplierPrice || 0,
          stock: supplierQty,
          images,
          categoryPath: parseImages(row.product_type || ""),
          lastSyncAt: new Date(),
          status: "MAPPED",
        },
      });
    } else {
      const created = await prisma.product.create({ data });
      imported += 1;

      await prisma.supplierProduct.upsert({
        where: {
          supplierId_supplierSku: {
            supplierId: supplier.id,
            supplierSku: sku,
          },
        },
        update: {
          productId: created.id,
          name,
          description: row.description || null,
          price: supplierPrice || 0,
          stock: supplierQty,
          images,
          categoryPath: parseImages(row.product_type || ""),
          lastSyncAt: new Date(),
          status: "MAPPED",
        },
        create: {
          supplierId: supplier.id,
          supplierSku: sku,
          productId: created.id,
          name,
          description: row.description || null,
          price: supplierPrice || 0,
          stock: supplierQty,
          images,
          categoryPath: parseImages(row.product_type || ""),
          lastSyncAt: new Date(),
          status: "MAPPED",
        },
      });
    }

    console.log(`Imported ${sku} - ${name}`);
  }

  console.log(`Launch pack seed complete. Imported: ${imported}, Updated: ${updated}`);
}

main()
  .catch(error => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
