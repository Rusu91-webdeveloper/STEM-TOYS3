import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";
import * as XLSX from "xlsx";

import { PrismaClient, SupplierProductStatus } from "@prisma/client";

const prisma = new PrismaClient();

const envLocalPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath });
} else {
  dotenv.config();
}

const FEED_DEFAULT_PATH = "feed_suppliers/boribon_dropshipping.csv";

type CleanupMode = "delete" | "disable";

function parseDelimitedText(text: string, delimiter: string) {
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
    } else if (char === delimiter && !insideQuotes) {
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
    r.some(cell => String(cell).trim() !== "")
  );

  return dataRows.map(cols => {
    const record: Record<string, any> = {};
    headers.forEach((header, idx) => {
      if (!header) return;
      record[header] = (cols[idx] ?? "").trim();
    });
    return record;
  });
}

function parseRowsFromText(text: string) {
  const firstLine = text.split(/\r?\n/, 1)[0] || "";
  const usePipeDelimiter = firstLine.includes("|") && !firstLine.includes(",");

  if (usePipeDelimiter) {
    return parseDelimitedText(text, "|");
  }

  const workbook = XLSX.read(text, { type: "string" });
  const firstSheet = workbook.SheetNames[0];
  if (!firstSheet) return [];
  return XLSX.utils.sheet_to_json<Record<string, any>>(
    workbook.Sheets[firstSheet],
    { defval: "" }
  );
}

function resolveSku(row: Record<string, any>) {
  const model = String(row.model ?? "").trim();
  if (model) return model;
  const sku = String(row.sku ?? "").trim();
  if (sku) return sku;
  const id = String(row.id ?? "").trim();
  if (id) return id;
  return "";
}

function loadAllowedSkus() {
  const allowlistPath = process.env.BORIBON_ALLOWED_SKUS_FILE
    ? path.resolve(process.cwd(), process.env.BORIBON_ALLOWED_SKUS_FILE)
    : path.resolve(process.cwd(), FEED_DEFAULT_PATH);

  if (!fs.existsSync(allowlistPath)) {
    throw new Error(`Allowlist file not found: ${allowlistPath}`);
  }

  const text = fs.readFileSync(allowlistPath, "utf-8");
  const rows = parseRowsFromText(text);
  const allowed = rows
    .map(row => resolveSku(row))
    .filter(Boolean);
  return new Set(allowed);
}

async function main() {
  if (process.env.ALLOW_BORIBON_CLEANUP !== "true") {
    throw new Error(
      "Safety check failed: set ALLOW_BORIBON_CLEANUP=true to continue."
    );
  }

  const mode = (process.env.BORIBON_CLEANUP_MODE || "delete") as CleanupMode;
  if (!["delete", "disable"].includes(mode)) {
    throw new Error(
      "Invalid BORIBON_CLEANUP_MODE. Use \"delete\" or \"disable\"."
    );
  }

  const dbUrl = process.env.DATABASE_URL || "";
  const dbHost = dbUrl ? dbUrl.split("@").pop()?.split("/")[0] : "unknown";
  console.log(`Database: ${dbHost}`);
  console.log(`Mode: ${mode}`);

  const allowedSkus = loadAllowedSkus();
  console.log(`Allowed SKUs (from allowlist): ${allowedSkus.size}`);

  const supplier = await prisma.supplier.findFirst({
    where: {
      OR: [
        { email: "contact@boribon.ro" },
        { companySlug: "boribon" },
        { name: { contains: "boribon", mode: "insensitive" } },
      ],
    },
  });

  if (!supplier) {
    throw new Error("Boribon supplier not found in DB.");
  }

  const supplierProducts = await prisma.supplierProduct.findMany({
    where: {
      supplierId: supplier.id,
      supplierSku: { notIn: Array.from(allowedSkus) },
    },
    select: { id: true, supplierSku: true, productId: true },
  });

  console.log(`Supplier products not in allowlist: ${supplierProducts.length}`);
  if (supplierProducts.length === 0) return;

  const productIds = Array.from(
    new Set(
      supplierProducts
        .map(sp => sp.productId)
        .filter((id): id is string => Boolean(id))
    )
  );

  if (mode === "disable") {
    await prisma.supplierProduct.updateMany({
      where: { id: { in: supplierProducts.map(sp => sp.id) } },
      data: {
        status: SupplierProductStatus.DISABLED,
        lastError: "Disabled: not in allowlist",
      },
    });

    if (productIds.length > 0) {
      await prisma.product.updateMany({
        where: { id: { in: productIds }, supplierId: supplier.id },
        data: { isActive: false },
      });
    }

    console.log(
      `Disabled ${supplierProducts.length} supplier products and deactivated ${productIds.length} products.`
    );
    return;
  }

  const orderItems = await prisma.orderItem.findMany({
    where: { productId: { in: productIds } },
    select: { productId: true },
  });
  const reviews = await prisma.review.findMany({
    where: { productId: { in: productIds } },
    select: { productId: true },
  });

  const blockedProductIds = new Set([
    ...orderItems.map(item => item.productId).filter(Boolean),
    ...reviews.map(review => review.productId).filter(Boolean),
  ]);
  const deletableProductIds = productIds.filter(
    id => !blockedProductIds.has(id)
  );

  if (blockedProductIds.size > 0) {
    console.log(
      `Skipping ${blockedProductIds.size} products with order/review references.`
    );
  }

  if (deletableProductIds.length > 0) {
    const deletedProducts = await prisma.product.deleteMany({
      where: { id: { in: deletableProductIds }, supplierId: supplier.id },
    });
    console.log(`Deleted products: ${deletedProducts.count}`);
  } else {
    console.log("No products eligible for deletion.");
  }

  const deletedSupplierProducts = await prisma.supplierProduct.deleteMany({
    where: { id: { in: supplierProducts.map(sp => sp.id) } },
  });
  console.log(`Deleted supplier products: ${deletedSupplierProducts.count}`);
}

main()
  .catch(error => {
    console.error("Boribon cleanup failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
