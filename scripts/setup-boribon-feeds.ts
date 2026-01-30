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

const FEEDS = [
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

const mapping = {
  sku: "sku",
  name: "name",
  description: "description",
  price: "price_b2c",
  stock: "quantity",
  images: [
    "avatar",
    "image_additional1",
    "image_additional2",
    "image_additional3",
    "image_additional4",
  ],
  categoryPath: "categories",
};

async function main() {
  const csvPath = path.resolve(process.cwd(), "launch_pack_50.csv");
  if (!fs.existsSync(csvPath)) {
    throw new Error(`launch_pack_50.csv not found at ${csvPath}`);
  }

  const fileContent = fs.readFileSync(csvPath, "utf-8");
  const rows = parseCSV(fileContent);
  const allowedSkus = rows
    .map(row => row.sku?.trim())
    .filter((sku): sku is string => Boolean(sku));

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
          mapping: { ...mapping, allowedSkus },
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
          mapping: { ...mapping, allowedSkus },
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
