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

const DEFAULT_FEEDS = [
  {
    name: "Boribon General",
    sourceUrl: "https://www.boribon.ro/feed/products/6b4ddf7503cbf24a7fe711636e57d127",
  },
  {
    name: "Boribon Djeco",
    sourceUrl: "https://www.boribon.ro/feed/products/eede0e22ab27952666cabcdb8286a8f5",
  },
  {
    name: "Boribon Londji",
    sourceUrl: "https://www.boribon.ro/feed/products/ccd46761bcd1b8d7f9fbc285df4b0c87",
  },
  {
    name: "Boribon Egmont",
    sourceUrl: "https://www.boribon.ro/feed/products/02c7bdc8cdaadae49a162d1857ee38d5",
  },
  {
    name: "Boribon Fridolin",
    sourceUrl: "https://www.boribon.ro/feed/products/8e6b0708a46d57d49bf189f18156cd7c",
  },
  {
    name: "Boribon Creativamente",
    sourceUrl: "https://www.boribon.ro/feed/products/ef1948938b4414b1026d27f17254e7f7",
  },
  {
    name: "Boribon Clicstoys",
    sourceUrl: "https://www.boribon.ro/feed/products/2656fdf3dd7bc41d805f0f7a8bc24179",
  },
];

const BORIBON_FEED_NAME_BY_URL = new Map(
  DEFAULT_FEEDS.map(feed => [feed.sourceUrl, feed.name])
);

const envFeedUrls = (process.env.BORIBON_FEED_URLS || "")
  .split(",")
  .map(url => url.trim())
  .filter(Boolean);

const FEEDS =
  envFeedUrls.length > 0
    ? envFeedUrls.map((url, index) => ({
        name:
          BORIBON_FEED_NAME_BY_URL.get(url) ?? `Boribon Feed ${index + 1}`,
        sourceUrl: url,
      }))
    : DEFAULT_FEEDS;

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
          name: feed.name,
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
