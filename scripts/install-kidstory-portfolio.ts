/** Live preview by default. --production --apply explicitly activates the reviewed portfolio. */
import fs from "fs";
import path from "path";
import os from "os";
import * as dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import {
  fetchKidstoryProducts,
  kidstoryContent,
  KIDSTORY_ID,
  KIDSTORY_SYNC_MODE,
  portfolio,
} from "../lib/suppliers/kidstory/feed";
const env = Object.assign(
  {},
  ...[".env", ".env.local"]
    .filter(fs.existsSync)
    .map(p => dotenv.parse(fs.readFileSync(p)))
);
const production = process.argv.includes("--production");
const apply = process.argv.includes("--apply");
const url = production ? env.DATABASE_URL_PRODUCTION : env.DATABASE_URL;
if (
  !url ||
  (!production && !["localhost", "127.0.0.1"].includes(new URL(url).hostname))
)
  throw new Error("Explicit --production required for remote database");
if (!env.KIDSTORY_FEED_URL) throw new Error("Missing live Kidstory source");
const db = new PrismaClient({ datasources: { db: { url } } });
const slug = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
const categorySlug = (theme: string) =>
  /Coding/.test(theme)
    ? "programming"
    : /Electronics|electronics/.test(theme)
      ? "electronics"
      : /Microscopy|Biology|Geology|Chemistry|Space science/.test(theme)
        ? "science-experiments"
        : /Optics/.test(theme)
          ? "puzzles-optics"
          : /accessory|refill/.test(theme)
            ? "accesorii"
            : "construction-sets";
async function main() {
  const items = await fetchKidstoryProducts(env.KIDSTORY_FEED_URL);
  if (items.length !== 25 || items.some(p => !p.valid))
    throw new Error("All 25 source identities and prices must validate");
  items.forEach(p => kidstoryContent(p.row));
  const [products, links, feeds, categories] = await Promise.all([
    db.product.findMany({ where: { supplierId: KIDSTORY_ID } }),
    db.supplierProduct.findMany({ where: { supplierId: KIDSTORY_ID } }),
    db.supplierFeed.findMany({ where: { supplierId: KIDSTORY_ID } }),
    db.category.findMany(),
  ]);
  const feed = feeds.find(f => f.isActive);
  if (!feed || feeds.filter(f => f.isActive).length !== 1)
    throw new Error("Expected one active Kidstory feed");
  const collisions = await db.product.count({
    where: {
      OR: [
        { sku: { in: portfolio.map(p => p.sku) } },
        { barcode: { in: portfolio.map(p => p.ean) } },
      ],
      NOT: { supplierId: KIDSTORY_ID },
    },
  });
  if (collisions) throw new Error("Identity belongs to another supplier");
  const retained: string[] = [];
  for (const item of items) {
    const matches = products.filter(p => p.barcode === item.entry.ean);
    if (matches.length > 1) throw new Error(`Duplicate EAN ${item.entry.sku}`);
    const existing = matches[0];
    if (existing) retained.push(existing.id);
    const link = links.find(p => p.supplierSku === item.entry.sku);
    if (link?.productId && link.productId !== existing?.id)
      throw new Error(`Mapping conflict ${item.entry.sku}`);
    const theme = portfolio.find(p => p.sku === item.entry.sku)!.theme;
    if (!categories.some(c => c.slug === categorySlug(theme)))
      throw new Error(`Missing category ${theme}`);
  }
  const backupDir = path.join(
    os.homedir(),
    ".codex",
    "backups",
    `kidstory-portfolio-${Date.now()}`
  );
  fs.mkdirSync(backupDir, { recursive: true, mode: 0o700 });
  const preview = {
    selected: items.length,
    retain: retained.length,
    create: items.length - retained.length,
    deactivate: products.filter(p => p.isActive && !retained.includes(p.id))
      .length,
    available: items.filter(p => p.available).length,
    sourceQuantityKnown: false,
    checkoutCapacityPerSku: 1,
  };
  fs.writeFileSync(
    path.join(backupDir, "preview.json"),
    JSON.stringify(preview, null, 2),
    { mode: 0o600 }
  );
  console.log(JSON.stringify({ ...preview, backupDir }));
  if (!apply) return;
  fs.writeFileSync(
    path.join(backupDir, "before.json"),
    JSON.stringify({ products, links, feeds }, null, 2),
    { mode: 0o600 }
  );
  await db.$transaction(
    async tx => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(74261025)`;
      const keep: string[] = [];
      for (const item of items) {
        const entry = portfolio.find(p => p.sku === item.entry.sku)!;
        const existing = products.find(p => p.barcode === entry.ean);
        const content = kidstoryContent(item.row);
        const category = categories.find(
          c => c.slug === categorySlug(entry.theme)
        )!;
        const data = {
          ...content,
          price: item.retailPrice!,
          compareAtPrice: null,
          barcode: entry.ean,
          isActive: true,
          status: "APPROVED" as const,
          categoryId: category.id,
          metadata: {
            kidstory: {
              sourceId: entry.sourceId,
              ean: entry.ean,
              role: entry.role,
              sourceUrl: item.row.url,
              inventoryMode: "supplier-availability",
              checkoutCapacity: 1,
            },
          },
          // Broad source bands remain verbatim in attributes; do not infer exact recommended ages.
          ageGroup: null,
          stemDiscipline: /Coding|electronics|Electronics/.test(entry.theme)
            ? "TECHNOLOGY"
            : /Biology|Microscopy|Geology|Chemistry|Optics|Space science/.test(
                  entry.theme
                )
              ? "SCIENCE"
              : "ENGINEERING",
        };
        const product = existing
          ? await tx.product.update({ where: { id: existing.id }, data })
          : await tx.product.create({
              data: {
                ...data,
                sku: entry.sku,
                slug: slug(content.name) + "-" + slug(entry.sku),
                supplierId: KIDSTORY_ID,
                costPrice: null,
                stockQuantity: 0,
              },
            });
        keep.push(product.id);
        await tx.$executeRaw`UPDATE "Product" SET "stockQuantity" = GREATEST(0, ${item.available ? 1 : 0} - "reservedQuantity") WHERE id = ${product.id}`;
        const linkData = {
          feedId: feed.id,
          productId: product.id,
          name: content.name,
          description: content.description,
          images: content.images,
          stock: 0,
          raw: item.row,
          attributes: {
            availabilityFlag: item.available,
            quantityKnown: false,
            retailReferenceRon: item.retailPrice,
          },
          status: "MAPPED" as const,
          lastSyncAt: new Date(),
          lastError: null,
        };
        // Retire obsolete aliases so an old mapping cannot make stale data appear fresh.
        await tx.supplierProduct.updateMany({
          where: {
            supplierId: KIDSTORY_ID,
            productId: product.id,
            supplierSku: { not: entry.sku },
          },
          data: {
            productId: null,
            status: "DISABLED",
            lastError: "Replaced by exact live supplier SKU",
          },
        });
        await tx.supplierProduct.upsert({
          where: {
            supplierId_supplierSku: {
              supplierId: KIDSTORY_ID,
              supplierSku: entry.sku,
            },
          },
          create: {
            supplierId: KIDSTORY_ID,
            supplierSku: entry.sku,
            ...linkData,
          },
          update: linkData,
        });
      }
      await tx.product.updateMany({
        where: {
          supplierId: KIDSTORY_ID,
          id: { notIn: keep },
          isBundle: false,
        },
        data: { isActive: false, featured: false, stockQuantity: 0 },
      });
      await tx.supplierFeed.update({
        where: { id: feed.id },
        data: {
          name: "Kidstory — curated 25, live B2C and availability",
          sourceUrl: env.KIDSTORY_FEED_URL,
          pollingIntervalMinutes: 720,
          mapping: {
            syncMode: KIDSTORY_SYNC_MODE,
            allowedSkus: portfolio.map(p => p.sku),
            enforceAllowedSkus: true,
            autoCreateProducts: false,
          },
          lastSyncAt: new Date(),
          lastSyncStatus: "SUCCESS",
          lastError: null,
        },
      });
    },
    { timeout: 60000, maxWait: 10000 }
  );
  console.log(`Applied; recovery: ${backupDir}/before.json`);
}
main()
  .catch(e => {
    console.error(e.message);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
