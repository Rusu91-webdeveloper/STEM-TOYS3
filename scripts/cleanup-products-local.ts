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
  if (process.env.ALLOW_LOCAL_PRODUCT_PURGE !== "true") {
    throw new Error(
      "Safety check failed: set ALLOW_LOCAL_PRODUCT_PURGE=true to continue."
    );
  }

  const dbUrl = process.env.DATABASE_URL || "";
  const dbHost = dbUrl ? dbUrl.split("@").pop()?.split("/")[0] : "unknown";
  console.log(`Database: ${dbHost}`);

  const productCount = await prisma.product.count();
  const orderItemLinked = await prisma.orderItem.count({
    where: { productId: { not: null } },
  });
  const reviewCount = await prisma.review.count();
  const supplierProductLinked = await prisma.supplierProduct.count({
    where: { productId: { not: null } },
  });

  console.log(
    `Before purge: products=${productCount}, orderItemsLinked=${orderItemLinked}, reviews=${reviewCount}, supplierProductsLinked=${supplierProductLinked}`
  );

  await prisma.orderItem.updateMany({
    where: { productId: { not: null } },
    data: { productId: null },
  });

  await prisma.supplierProduct.updateMany({
    where: { productId: { not: null } },
    data: { productId: null },
  });

  await prisma.review.deleteMany({});

  const deleted = await prisma.product.deleteMany({});

  const remainingProducts = await prisma.product.count();
  console.log(
    `Deleted products=${deleted.count}. Remaining products=${remainingProducts}. SupplierProduct records kept.`
  );
}

main()
  .catch(error => {
    console.error("Product purge failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
