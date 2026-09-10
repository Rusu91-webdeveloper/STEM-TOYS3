/** Isolated PostgreSQL integration check; creates and removes its own local schema. */
import fs from "fs";
import * as dotenv from "dotenv";
import assert from "node:assert/strict";
import { PrismaClient, SupplierFeed } from "@prisma/client";
import { portfolio, BORIBON_ID } from "../lib/suppliers/boribon/feed";
import {
  syncBoribonPortfolio,
  closeBoribonStock,
} from "../lib/suppliers/boribon/sync";
const env = Object.assign(
  {},
  ...[".env", ".env.local"]
    .filter(fs.existsSync)
    .map(p => dotenv.parse(fs.readFileSync(p)))
);
const url = new URL(env.DATABASE_URL);
if (!["localhost", "127.0.0.1"].includes(url.hostname))
  throw new Error("Local database only");
const schema = `boribon_verify_${Date.now()}`;
const admin = new PrismaClient({
  datasources: { db: { url: url.toString() } },
});
url.searchParams.set("schema", schema);
const db = new PrismaClient({ datasources: { db: { url: url.toString() } } });
const originalFetch = global.fetch;
async function main() {
  await admin.$executeRawUnsafe(`CREATE SCHEMA "${schema}"`);
  for (const table of ["Product", "SupplierProduct"])
    await admin.$executeRawUnsafe(
      `CREATE TABLE "${schema}"."${table}" (LIKE public."${table}" INCLUDING ALL)`
    );
  for (const [table, type] of [
    ["Product", "ProductStatus"],
    ["SupplierProduct", "SupplierProductStatus"],
  ]) {
    const labels = await admin.$queryRawUnsafe<Array<{ enumlabel: string }>>(
      `SELECT enumlabel FROM pg_enum JOIN pg_type ON pg_type.oid = enumtypid JOIN pg_namespace ON pg_namespace.oid = typnamespace WHERE typname = '${type}' AND nspname = 'public' ORDER BY enumsortorder`
    );
    await admin.$executeRawUnsafe(
      `CREATE TYPE "${schema}"."${type}" AS ENUM (${labels.map(p => "'" + p.enumlabel + "'").join(",")})`
    );
    await admin.$executeRawUnsafe(
      `ALTER TABLE "${schema}"."${table}" ALTER COLUMN status DROP DEFAULT`
    );
    await admin.$executeRawUnsafe(
      `ALTER TABLE "${schema}"."${table}" ALTER COLUMN status TYPE "${schema}"."${type}" USING status::text::"${schema}"."${type}"`
    );
  }
  const csv = fs.readFileSync(process.argv[2], "utf8");
  global.fetch = async () => new Response(csv, { status: 200 });
  for (const p of portfolio) {
    await db.product.create({
      data: {
        id: p.sourceId,
        name: "Curated name",
        slug: p.sourceId,
        price: 999,
        costPrice: 42,
        compareAtPrice: 1000,
        supplierId: BORIBON_ID,
        barcode: p.ean,
        images: [],
        tags: [],
        reservedQuantity: 3,
        description: "Curated description",
      },
    });
    await db.supplierProduct.create({
      data: {
        supplierId: BORIBON_ID,
        supplierSku: p.model,
        productId: p.sourceId,
      },
    });
  }
  const feed = {
    id: "integration-feed",
    supplierId: BORIBON_ID,
  } as SupplierFeed;
  await syncBoribonPortfolio(db, feed);
  const p = await db.product.findUniqueOrThrow({
    where: { id: portfolio[0].sourceId },
  });
  const link = await db.supplierProduct.findFirstOrThrow({
    where: { productId: p.id },
  });
  assert.equal(p.stockQuantity, link.stock - 3);
  assert.equal(p.price, 184);
  assert.equal(p.compareAtPrice, null);
  assert.equal(p.costPrice, 42);
  assert.equal(p.name, "Curated name");
  assert.equal(p.description, "Curated description");
  // Simulate a customer reserving stock while a refresh waits on the row lock.
  let locked!: () => void;
  const lockReady = new Promise<void>(resolve => {
    locked = resolve;
  });
  let release!: () => void;
  const releaseLock = new Promise<void>(resolve => {
    release = resolve;
  });
  const reservation = db.$transaction(
    async tx => {
      await tx.product.update({
        where: { id: p.id },
        data: {
          stockQuantity: { decrement: 2 },
          reservedQuantity: { increment: 2 },
        },
      });
      locked();
      await releaseLock;
    },
    { timeout: 10000 }
  );
  await lockReady;
  const refresh = syncBoribonPortfolio(db, feed);
  release();
  await Promise.all([reservation, refresh]);
  const updated = await db.product.findUniqueOrThrow({ where: { id: p.id } });
  assert.equal(updated.stockQuantity, link.stock - 5);
  assert.equal(updated.reservedQuantity, 5);
  await closeBoribonStock(db);
  assert.equal(
    await db.product.count({ where: { stockQuantity: { gt: 0 } } }),
    0
  );
  assert.equal(
    await db.supplierProduct.count({ where: { status: "ERROR" } }),
    63
  );
  console.log(
    "PASS: 63 identities, direct B2C, curated content and cost preservation, concurrent reservation, fail-closed stock"
  );
}
main()
  .catch(e => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    global.fetch = originalFetch;
    await db.$disconnect();
    await admin.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
    await admin.$disconnect();
  });
