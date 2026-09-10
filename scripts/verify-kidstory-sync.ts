/** Isolated PostgreSQL integration check; creates and removes its own local schema. */
import fs from "fs";
import * as dotenv from "dotenv";
import assert from "node:assert/strict";
import { PrismaClient, SupplierFeed } from "@prisma/client";
import {
  portfolio,
  KIDSTORY_ID,
  parseKidstoryCsv,
  kidstoryContent,
} from "../lib/suppliers/kidstory/feed";
import {
  syncKidstoryPortfolio,
  closeKidstoryStock,
} from "../lib/suppliers/kidstory/sync";
const env = Object.assign(
  {},
  ...[".env", ".env.local"]
    .filter(fs.existsSync)
    .map(p => dotenv.parse(fs.readFileSync(p)))
);
const url = new URL(env.DATABASE_URL);
if (!["localhost", "127.0.0.1"].includes(url.hostname))
  throw new Error("Local database only");
const schema = `kidstory_verify_${Date.now()}`;
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
  const items = parseKidstoryCsv(csv, portfolio);
  for (const p of portfolio) {
    await db.product.create({
      data: {
        id: p.sourceId,
        name: "Old name",
        slug: p.sourceId,
        price: 999,
        costPrice: 42,
        compareAtPrice: 1000,
        supplierId: KIDSTORY_ID,
        barcode: p.ean,
        images: [],
        tags: [],
        reservedQuantity: 0,
        description: "Old description",
      },
    });
    await db.supplierProduct.create({
      data: {
        supplierId: KIDSTORY_ID,
        supplierSku: p.sku,
        productId: p.sourceId,
      },
    });
  }
  const feed = {
    id: "integration-feed",
    supplierId: KIDSTORY_ID,
    sourceUrl: "https://example.test/feed",
  };
  await syncKidstoryPortfolio(db, feed);
  for (const item of items) {
    const p = await db.product.findUniqueOrThrow({
      where: { id: item.entry.sourceId },
    });
    assert.equal(p.price, item.retailPrice);
    assert.equal(p.name, item.row.name);
    assert.equal(p.description, item.row.description);
    assert.deepEqual(p.images, kidstoryContent(item.row).images);
    assert.equal(p.compareAtPrice, null);
    assert.equal(p.costPrice, 42);
    assert.equal(p.stockQuantity, item.available ? 1 : 0);
  }
  const first = portfolio[0].sourceId;
  await db.product.update({
    where: { id: first },
    data: { reservedQuantity: 1, stockQuantity: 0 },
  });
  await syncKidstoryPortfolio(db, feed);
  assert.equal(
    (await db.product.findUniqueOrThrow({ where: { id: first } }))
      .stockQuantity,
    0
  );
  // Invalid individual data closes its availability and fails the job.
  global.fetch = async () =>
    new Response(csv.replace(portfolio[0].ean, "wrong-ean"), { status: 200 });
  await assert.rejects(syncKidstoryPortfolio(db, feed));
  await closeKidstoryStock(db);
  assert.equal(
    await db.product.count({ where: { stockQuantity: { gt: 0 } } }),
    0
  );
  assert.equal(
    await db.supplierProduct.count({ where: { status: "ERROR" } }),
    25
  );
  global.fetch = async () => new Response("", { status: 503 });
  await assert.rejects(syncKidstoryPortfolio(db, feed), /HTTP 503/);
  console.log(
    "PASS: 25 exact identities, B2C, source content/images, preserved costs/reservations and failure closure"
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
