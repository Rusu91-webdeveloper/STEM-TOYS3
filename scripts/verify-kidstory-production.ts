/** Read-only public/database parity audit; use --sync to invoke the authorized common supplier cron first. */
import fs from "fs";
import * as dotenv from "dotenv";
import assert from "node:assert/strict";
import { PrismaClient } from "@prisma/client";
import {
  fetchKidstoryProducts,
  kidstoryContent,
  KIDSTORY_ID,
} from "../lib/suppliers/kidstory/feed";
const env = Object.assign(
  {},
  ...[".env", ".env.local"]
    .filter(fs.existsSync)
    .map(p => dotenv.parse(fs.readFileSync(p)))
);
const db = new PrismaClient({
  datasources: { db: { url: env.DATABASE_URL_PRODUCTION } },
});
async function main() {
  let sync: unknown;
  if (process.argv.includes("--sync")) {
    const token = env.CRON_SECRET || env.CRON_SECRET_TOKEN;
    assert(token, "Cron token required");
    const response = await fetch("https://www.techtots.ro/api/cron/suppliers", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(65000),
    });
    sync = await response.json();
    assert(response.ok, `Common supplier cron failed: ${JSON.stringify(sync)}`);
    console.log(JSON.stringify({ sync }));
  }
  const source = await fetchKidstoryProducts(env.KIDSTORY_FEED_URL);
  const state = await db.$transaction(async tx => {
    await tx.$executeRawUnsafe("SET TRANSACTION READ ONLY");
    return {
      products: await tx.product.findMany({
        where: { supplierId: KIDSTORY_ID, isActive: true },
      }),
      boribonActive: await tx.product.count({
        where: {
          supplierId: "ee75eea8-9f64-4076-96a2-52f5d6926c14",
          isActive: true,
        },
      }),
    };
  });
  assert.equal(state.products.length, 25);
  assert.equal(state.boribonActive, 63);
  let checked = 0;
  for (const item of source) {
    assert(item.valid);
    const product = state.products.find(p => p.barcode === item.entry.ean);
    assert(product, `Missing ${item.entry.sku}`);
    const expected = kidstoryContent(item.row);
    assert.equal(product.price, item.retailPrice);
    assert.equal(product.compareAtPrice, null);
    assert.equal(product.name, expected.name);
    assert.equal(product.description, expected.description);
    assert.deepEqual(product.images, expected.images);
    assert.deepEqual(product.attributes, expected.attributes);
    assert.equal(
      product.stockQuantity,
      Math.max(0, (item.available ? 1 : 0) - product.reservedQuantity)
    );
    const response = await fetch(
      `https://www.techtots.ro/api/products/combined/${encodeURIComponent(product.slug)}`,
      { cache: "no-store" }
    );
    assert(response.ok, `Public API unavailable ${item.entry.sku}`);
    const publicProduct = await response.json();
    for (const key of ["name", "description", "price"] as const)
      assert.equal(
        publicProduct[key],
        product[key],
        `Public ${key} mismatch ${item.entry.sku}`
      );
    assert.deepEqual(publicProduct.images, product.images);
    const stockResponse = await fetch(
      "https://www.techtots.ro/api/products/stock",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: [{ productId: product.id }] }),
      }
    );
    assert(stockResponse.ok);
    assert.equal(
      (await stockResponse.json())[product.id],
      product.stockQuantity
    );
    checked++;
  }
  const output = {
    verifiedAt: new Date().toISOString(),
    checked,
    activeKidstory: state.products.length,
    activeBoribon: state.boribonActive,
    sync,
  };
  const index = process.argv.indexOf("--output");
  if (index !== -1)
    fs.writeFileSync(process.argv[index + 1], JSON.stringify(output, null, 2), {
      mode: 0o600,
    });
  console.log(JSON.stringify(output));
}
main()
  .catch(e => {
    console.error(e.message);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
