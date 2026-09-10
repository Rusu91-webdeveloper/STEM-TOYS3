/** Run without --apply for a live-feed preview. Production requires --production explicitly. */
import fs from "fs";
import path from "path";
import os from "os";
import * as dotenv from "dotenv";
import { PrismaClient, Prisma } from "@prisma/client";
import {
  BORIBON_ID,
  BORIBON_FEED_URL,
  BORIBON_SYNC_MODE,
  fetchBoribonProducts,
  parseBoribonCsv,
} from "../lib/suppliers/boribon/feed";

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
  throw new Error("Explicit --production required for a remote database");
const db = new PrismaClient({ datasources: { db: { url } } });
const slug = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
const discipline = (category: string) =>
  category === "Math and logic"
    ? "MATHEMATICS"
    : category === "Science and nature"
      ? "SCIENCE"
      : ["Coding and robotics", "Electronics"].includes(category)
        ? "TECHNOLOGY"
        : "ENGINEERING";
const categorySlug = (category: string) =>
  category === "Math and logic"
    ? "logic-games"
    : category === "Science and nature"
      ? "science-experiments"
      : category === "Magnetic construction"
        ? "magnetic-building"
        : category === "Electronics"
          ? "electronics"
          : category === "Coding and robotics"
            ? "robotics"
            : "construction-sets";

async function main() {
  const fixtureIndex = process.argv.indexOf("--fixture");
  if (production && fixtureIndex !== -1)
    throw new Error("Fixtures cannot be used in production");
  const items =
    fixtureIndex !== -1
      ? parseBoribonCsv(fs.readFileSync(process.argv[fixtureIndex + 1], "utf8"))
      : await fetchBoribonProducts();
  if (items.some(p => !p.valid))
    throw new Error(
      items
        .filter(p => !p.valid)
        .map(p => p.error)
        .join("; ")
    );
  const [products, links, feeds, categories] = await Promise.all([
    db.product.findMany({ where: { supplierId: BORIBON_ID } }),
    db.supplierProduct.findMany({ where: { supplierId: BORIBON_ID } }),
    db.supplierFeed.findMany({ where: { supplierId: BORIBON_ID } }),
    db.category.findMany(),
  ]);
  const collisions = await db.product.findMany({
    where: {
      sku: { in: items.map(p => p.entry.model) },
      OR: [{ supplierId: { not: BORIBON_ID } }, { supplierId: null }],
    },
    select: { sku: true },
  });
  if (collisions.length)
    throw new Error(
      `SKU belongs to another supplier: ${collisions.map(p => p.sku).join(", ")}`
    );
  const selectedIds: string[] = [];
  for (const { entry, row } of items) {
    if (
      ![
        row.avatar,
        row.image_additional1,
        row.image_additional2,
        row.image_additional3,
        row.image_additional4,
      ].some(v => v && /^https:\/\//.test(v))
    )
      throw new Error(`Missing images: ${entry.model}`);
    if (!categories.some(c => c.slug === categorySlug(entry.learningCategory)))
      throw new Error(`Missing category: ${entry.learningCategory}`);
    const existing = products.find(
      p =>
        p.id === entry.existingProductId ||
        (p.sku === entry.model && p.barcode === entry.ean)
    );
    if (entry.existingProductId && !existing)
      throw new Error(`Missing existing product ${entry.model}`);
    if (
      existing &&
      (existing.barcode !== entry.ean || existing.supplierId !== BORIBON_ID)
    )
      throw new Error(`Identity mismatch ${entry.model}`);
    const link = links.find(p => p.supplierSku === entry.model);
    if (link?.productId && link.productId !== existing?.id)
      throw new Error(`Conflicting supplier mapping ${entry.model}`);
    if (existing) selectedIds.push(existing.id);
  }
  const feed = feeds.find(f => f.isActive);
  if (!feed || feeds.filter(f => f.isActive).length !== 1)
    throw new Error("Expected one active Boribon feed");
  const preview = {
    environment: production ? "production" : "local",
    selected: items.length,
    retain: selectedIds.length,
    create: items.length - selectedIds.length,
    deactivate: products.filter(p => p.isActive && !selectedIds.includes(p.id))
      .length,
    products: items.map(p => ({
      model: p.entry.model,
      name: p.entry.name,
      b2c: p.price,
      supplierStock: p.stock,
    })),
  };
  const backupDir = path.join(
    os.homedir(),
    ".codex",
    "backups",
    `boribon-portfolio-${Date.now()}`
  );
  fs.mkdirSync(backupDir, { recursive: true, mode: 0o700 });
  fs.writeFileSync(
    path.join(backupDir, "preview.json"),
    JSON.stringify(preview, null, 2),
    { mode: 0o600 }
  );
  console.log(
    JSON.stringify({
      ...preview,
      products: undefined,
      preview: path.join(backupDir, "preview.json"),
    })
  );
  if (!apply) return;
  fs.writeFileSync(
    path.join(backupDir, "before.json"),
    JSON.stringify({ products, links, feeds }, null, 2),
    { mode: 0o600 }
  );
  await db.$transaction(
    async tx => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(74261063)`;
      const keep: string[] = [];
      for (const item of items) {
        const { entry, row } = item;
        const existing = products.find(
          p =>
            p.id === entry.existingProductId ||
            (p.sku === entry.model && p.barcode === entry.ean)
        );
        const images = [
          row.avatar,
          row.image_additional1,
          row.image_additional2,
          row.image_additional3,
          row.image_additional4,
        ].filter(v => v && /^https:\/\//.test(v));
        if (!images.length) throw new Error(`Missing images: ${entry.model}`);
        const category = categories.find(
          c => c.slug === categorySlug(entry.learningCategory)
        );
        if (!category)
          throw new Error(`Missing category: ${entry.learningCategory}`);
        const data = {
          name: entry.name,
          barcode: entry.ean,
          price: item.price!,
          compareAtPrice: null,
          isActive: true,
          status: "APPROVED" as const,
          categoryId: category.id,
          ageGroup:
            entry.minAge <= 5
              ? "PRESCHOOL_3_5"
              : entry.minAge <= 8
                ? "ELEMENTARY_6_8"
                : entry.minAge <= 12
                  ? "MIDDLE_SCHOOL_9_12"
                  : "TEENS_13_PLUS",
          stemDiscipline: discipline(entry.learningCategory),
          metadata: {
            ...((existing?.metadata as Record<string, unknown>) || {}),
            boribon: {
              sourceId: entry.sourceId,
              ean: entry.ean,
              tier: entry.tier,
              recommendedAge: entry.recommendedAge,
              sourceUrl: entry.url,
            },
          } as Prisma.InputJsonValue,
        };
        const product = existing
          ? await tx.product.update({ where: { id: existing.id }, data })
          : await tx.product.create({
              data: {
                ...data,
                sku: entry.model,
                slug: slug(entry.name) + "-" + slug(entry.model),
                supplierId: BORIBON_ID,
                description: row.description,
                images,
                tags: [entry.brand, entry.learningCategory],
                stockQuantity: 0,
                costPrice: null,
              },
            });
        keep.push(product.id);
        await tx.$executeRaw`UPDATE "Product" SET "stockQuantity" = GREATEST(0, ${item.stock} - "reservedQuantity") WHERE id = ${product.id}`;
        await tx.supplierProduct.upsert({
          where: {
            supplierId_supplierSku: {
              supplierId: BORIBON_ID,
              supplierSku: entry.model,
            },
          },
          create: {
            supplierId: BORIBON_ID,
            supplierSku: entry.model,
            feedId: feed.id,
            productId: product.id,
            name: entry.name,
            images,
            stock: item.stock,
            raw: row,
            status: "MAPPED",
            lastSyncAt: new Date(),
          },
          update: {
            feedId: feed.id,
            productId: product.id,
            stock: item.stock,
            raw: row,
            status: "MAPPED",
            lastError: null,
            lastSyncAt: new Date(),
          },
        });
      }
      await tx.product.updateMany({
        where: { supplierId: BORIBON_ID, id: { notIn: keep }, isBundle: false },
        data: { isActive: false, featured: false, stockQuantity: 0 },
      });
      await tx.supplierFeed.update({
        where: { id: feed.id },
        data: {
          name: "Boribon — curated 63, live B2C and stock",
          sourceUrl: BORIBON_FEED_URL,
          pollingIntervalMinutes: 720,
          mapping: {
            syncMode: BORIBON_SYNC_MODE,
            sku: "model",
            retailPrice: "price_b2c",
            stock: "quantity",
            allowedSkus: items.map(p => p.entry.model),
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
  console.log(`Applied portfolio; recovery snapshot: ${backupDir}/before.json`);
}
main()
  .catch(e => {
    console.error(e.message);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
