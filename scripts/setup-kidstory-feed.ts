import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

import { PrismaClient, SupplierFeedType } from "@prisma/client";

const prisma = new PrismaClient();

const envLocalPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath });
} else {
  dotenv.config();
}

const FEED_URL = process.env.KIDSTORY_FEED_URL;
const SUPPLIER_EMAIL = process.env.KIDSTORY_SUPPLIER_EMAIL;
const SUPPLIER_PHONE = process.env.KIDSTORY_SUPPLIER_PHONE || "0000000000";

const mapping = {
  sku: "sku",
  name: "name",
  description: "description",
  retailPrice: "base_price",
  discountFloorPct: 20,
  overrideMarginPct: 25,
  stock: "stock_status",
  currency: "currency",
  images: [
    "file",
    "image2",
    "image3",
    "image4",
    "image5",
    "image6",
    "image7",
    "image8",
    "image9",
    "image10",
  ],
  categoryPath: "category_name",
  lookupMergeMode: "lookup-preferred",
  lookupMergeOverrideFields: [
    "sku",
    "url",
    "file",
    "image2",
    "image3",
    "image4",
    "image5",
    "image6",
    "image7",
    "image8",
    "image9",
    "image10",
    "ean",
    "stock_status",
    "stock_status_string",
    "base_price",
    "currency",
  ],
  requiredFields: ["supplierSku", "retailPrice", "images"],
  enforceAllowedSkus: true,
};

type CsvRow = Record<string, string>;

function parseCSV(text: string): CsvRow[] {
  const lines = text.split("\n").filter(l => l.trim() !== "");
  const headers = lines[0].split(",").map(h => h.trim());
  const rows: CsvRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const row: CsvRow = {};
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

async function main() {
  if (!FEED_URL) {
    throw new Error("Missing KIDSTORY_FEED_URL env var.");
  }
  if (!SUPPLIER_EMAIL) {
    throw new Error("Missing KIDSTORY_SUPPLIER_EMAIL env var.");
  }

  const supplier = await prisma.supplier.upsert({
    where: { email: SUPPLIER_EMAIL },
    update: {
      name: "Kidstory",
      companySlug: "kidstory",
      status: "APPROVED",
      defaultMargin: 0.25,
      minimumMarginPercentage: 0.15,
      priceChangeThreshold: 0.1,
      useSupplierRetailPriceAsBase: true,
      plannedPromoDiscountPercentage: 0.1,
    },
    create: {
      name: "Kidstory",
      email: SUPPLIER_EMAIL,
      phone: SUPPLIER_PHONE,
      status: "APPROVED",
      companySlug: "kidstory",
      isActive: true,
      defaultMargin: 0.25,
      minimumMarginPercentage: 0.15,
      priceChangeThreshold: 0.1,
      useSupplierRetailPriceAsBase: true,
      plannedPromoDiscountPercentage: 0.1,
    },
  });

  const allowlistPath = process.env.KIDSTORY_ALLOWED_SKUS_FILE
    ? path.resolve(process.cwd(), process.env.KIDSTORY_ALLOWED_SKUS_FILE)
    : path.resolve(
        process.cwd(),
        "feed_suppliers/kidstory_STEM_winners_not_in_boribon_pricing_corrected_enriched_age_verified.csv"
      );

  let allowedSkus: string[] | undefined;
  if (allowlistPath && fs.existsSync(allowlistPath)) {
    const fileContent = fs.readFileSync(allowlistPath, "utf-8");
    const rows = parseCSV(fileContent);
    allowedSkus = rows
      .map(row => row.sku?.trim())
      .filter((sku): sku is string => Boolean(sku));
  }
  const mappingWithLookup = {
    ...mapping,
    costLookupFile: allowlistPath,
    costLookupSku: "sku",
    costLookupCost: "b2b_price_gross_RON",
    costLookupDiscount: "discount_pct",
  };

  const existing = await prisma.supplierFeed.findFirst({
    where: {
      supplierId: supplier.id,
      sourceUrl: FEED_URL,
    },
  });

  if (existing) {
    await prisma.supplierFeed.update({
      where: { id: existing.id },
      data: {
        name: "Kidstory Feed",
        type: SupplierFeedType.CSV,
        mapping: allowedSkus
          ? { ...mappingWithLookup, allowedSkus }
          : mappingWithLookup,
        isActive: true,
      },
    });
    console.log("Updated Kidstory feed.");
  } else {
    await prisma.supplierFeed.create({
      data: {
        supplierId: supplier.id,
        name: "Kidstory Feed",
        type: SupplierFeedType.CSV,
        sourceUrl: FEED_URL,
        mapping: allowedSkus
          ? { ...mappingWithLookup, allowedSkus }
          : mappingWithLookup,
        isActive: true,
      },
    });
    console.log("Created Kidstory feed.");
  }
}

main()
  .catch(error => {
    console.error("Kidstory feed setup failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
