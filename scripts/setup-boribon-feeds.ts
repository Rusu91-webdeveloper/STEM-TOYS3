import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";
import * as XLSX from "xlsx";

import { PrismaClient, SupplierFeedType } from "@prisma/client";

const prisma = new PrismaClient();

const envLocalPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath });
} else {
  dotenv.config();
}

// Feed URLs contain supplier credentials. Configure them privately; no defaults.
const envFeedUrls = (process.env.BORIBON_FEED_URLS || "")
  .split(",")
  .map(url => url.trim())
  .filter(Boolean);

const FEEDS = envFeedUrls.map((url, index) => ({
  name: `Boribon Feed ${index + 1}`,
  sourceUrl: url,
}));

type LaunchPackRow = Record<string, string>;

function parseCSV(text: string): LaunchPackRow[] {
  const workbook = XLSX.read(text, { type: "string", raw: false });
  const firstSheet = workbook.SheetNames[0];
  if (!firstSheet) return [];
  return XLSX.utils.sheet_to_json<LaunchPackRow>(workbook.Sheets[firstSheet], {
    defval: "",
  });
}

const mapping = {
  sku: ["model", "sku", "id"],
  name: "name",
  description: "description",
  // Live feed doesn't include B2B, so we keep it from the local lookup file.
  // If B2B ever appears in the live feed, it will be used; otherwise lookup fills it.
  cost: "price_b2b",
  vat: "TVA",
  costVatMode: "net",
  retailPrice: "price_b2c",
  stock: "quantity",
  images: [
    "avatar",
    "image_additional1",
    "image_additional2",
    "image_additional3",
    "image_additional4",
  ],
  categoryPath: "categories",
  lookupMergeMode: "lookup-preferred",
  lookupMergeOverrideFields: [
    "price_b2c",
    "quantity",
    "avatar",
    "image_additional1",
    "image_additional2",
    "image_additional3",
    "image_additional4",
    "url",
    "ean",
    "ean_filled",
    "barcode",
  ],
  requiredFields: ["supplierSku", "retailPrice", "images"],
  enforceAllowedSkus: true,
};

async function main() {
  if (!FEEDS.length) throw new Error("Missing BORIBON_FEED_URLS env var.");
  const allowlistPath =
    process.env.BORIBON_ALLOWED_SKUS_FILE &&
    path.resolve(process.cwd(), process.env.BORIBON_ALLOWED_SKUS_FILE);
  const costLookupPath = process.env.BORIBON_COST_LOOKUP_FILE
    ? path.resolve(process.cwd(), process.env.BORIBON_COST_LOOKUP_FILE)
    : path.resolve(process.cwd(), "feed_suppliers/boribon_dropshipping.csv");
  let allowedSkus: string[] | undefined;
  if (allowlistPath && fs.existsSync(allowlistPath)) {
    const fileContent = fs.readFileSync(allowlistPath, "utf-8");
    const rows = parseCSV(fileContent);
    const skuFields = Array.isArray(mapping.sku)
      ? mapping.sku
      : mapping.sku
        ? [mapping.sku]
        : [];
    allowedSkus = rows
      .map(row => {
        for (const field of skuFields) {
          const value = row[field]?.trim();
          if (value) return value;
        }
        return "";
      })
      .filter((sku): sku is string => Boolean(sku));
  }

  const mappingWithLookup = {
    ...mapping,
    costLookupFile: costLookupPath,
    costLookupSku: "model",
    costLookupCost: "sup_dropshipping_with_VAT",
  };

  const supplier = await prisma.supplier.upsert({
    where: { email: "contact@boribon.ro" },
    update: {
      name: "Boribon",
      companySlug: "boribon",
      status: "APPROVED",
      defaultMargin: 0.4,
      minimumMarginPercentage: 0.2,
      priceChangeThreshold: 0.1,
      useSupplierRetailPriceAsBase: true,
      plannedPromoDiscountPercentage: 0.1,
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
      useSupplierRetailPriceAsBase: true,
      plannedPromoDiscountPercentage: 0.1,
    },
  });

  for (const feed of FEEDS) {
    const existing = await prisma.supplierFeed.findFirst({
      where: {
        supplierId: supplier.id,
        sourceUrl: feed.sourceUrl,
      },
    });

    if (existing) {
      await prisma.supplierFeed.update({
        where: { id: existing.id },
        data: {
          type: SupplierFeedType.CSV,
          mapping: allowedSkus
            ? { ...mappingWithLookup, allowedSkus }
            : mappingWithLookup,
          isActive: true,
        },
      });
      console.log(`Updated feed: ${feed.name}`);
    } else {
      await prisma.supplierFeed.create({
        data: {
          supplierId: supplier.id,
          name: feed.name,
          type: SupplierFeedType.CSV,
          sourceUrl: feed.sourceUrl,
          mapping: allowedSkus
            ? { ...mappingWithLookup, allowedSkus }
            : mappingWithLookup,
          isActive: true,
        },
      });
      console.log(`Created feed: ${feed.name}`);
    }
  }

  console.log("Boribon feeds setup complete.");
}

main()
  .catch(error => {
    console.error("Feed setup failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
