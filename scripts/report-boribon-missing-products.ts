import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const envLocalPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath });
} else {
  dotenv.config();
}

async function main() {
  const csvPath =
    process.env.BORIBON_ALLOWED_SKUS_FILE ||
    "feed_suppliers/boribon_dropshipping_133_with_VAT21_enriched_v2.csv";
  const resolvedPath = path.resolve(process.cwd(), csvPath);
  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`CSV not found: ${resolvedPath}`);
  }

  const fileContent = fs.readFileSync(resolvedPath, "utf-8");
  const records = parseCSV(fileContent);

  const localSkus = new Set(
    records
      .map(row => (row.model || row.sku || row.id || "").trim())
      .filter(Boolean)
  );

  const supplier =
    (await prisma.supplier.findFirst({
      where: {
        OR: [
          { email: "contact@boribon.ro" },
          { companySlug: "boribon" },
          { name: { contains: "boribon", mode: "insensitive" } },
        ],
      },
      select: { id: true, name: true, email: true },
    })) || null;

  if (!supplier) {
    throw new Error("Boribon supplier not found in DB.");
  }

  const supplierProducts = await prisma.supplierProduct.findMany({
    where: { supplierId: supplier.id },
    select: { supplierSku: true, productId: true },
  });

  const skuWithProduct = new Set(
    supplierProducts
      .filter(sp => sp.productId)
      .map(sp => sp.supplierSku)
  );

  const missing = Array.from(localSkus).filter(sku => !skuWithProduct.has(sku));

  console.log(
    `Local SKUs: ${localSkus.size} | With product: ${skuWithProduct.size} | Missing products: ${missing.length}`
  );
  missing.sort().forEach(sku => console.log(sku));
}

main()
  .catch(error => {
    console.error("Report failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
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
