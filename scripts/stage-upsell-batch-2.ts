/** Reviewed compatible add-ons. Dry-run by default; --production --apply --activate publishes only launch-selection.json. */
import fs from "fs";
import os from "os";
import path from "path";
import * as dotenv from "dotenv";
import { Prisma, PrismaClient } from "@prisma/client";
import {
  BORIBON_ID,
  fetchBoribonProducts,
  boribonContent,
} from "../lib/suppliers/boribon/feed";
import {
  KIDSTORY_ID,
  fetchKidstoryProducts,
  kidstoryContent,
} from "../lib/suppliers/kidstory/feed";
import {
  launchSelection,
  jsonObject,
  rolloutMetadata,
  rolloutAgeGroup,
  validateRolloutIdentity,
} from "../lib/upsell/rollout";

const env = Object.assign(
  {},
  ...[".env", ".env.local"]
    .filter(fs.existsSync)
    .map(p => dotenv.parse(fs.readFileSync(p))),
  process.env
);
const production = process.argv.includes("--production");
const apply = process.argv.includes("--apply");
const activate = process.argv.includes("--activate");
const url = production ? env.DATABASE_URL_PRODUCTION : env.DATABASE_URL;
if (
  !url ||
  (!production && !["localhost", "127.0.0.1"].includes(new URL(url).hostname))
) {
  throw new Error("Explicit --production required for remote database");
}
const db = new PrismaClient({ datasources: { db: { url } } });
const slug = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

async function main() {
  const feeds = await db.supplierFeed.findMany({
    where: { supplierId: { in: [BORIBON_ID, KIDSTORY_ID] }, isActive: true },
  });
  const bFeed = feeds.filter(f => f.supplierId === BORIBON_ID);
  const kFeed = feeds.filter(f => f.supplierId === KIDSTORY_ID);
  if (bFeed.length !== 1 || kFeed.length !== 1 || !kFeed[0].sourceUrl)
    throw new Error("Expected one active feed per supplier");
  const [boribon, kidstory] = await Promise.all([
    fetchBoribonProducts(),
    fetchKidstoryProducts(kFeed[0].sourceUrl),
  ]);
  const checkedAt = new Date();
  const skus = launchSelection.map(p => p.sku);
  if (new Set(skus).size !== skus.length)
    throw new Error("Duplicate launch SKU");
  const state = await db.$transaction(async tx => {
    await tx.$executeRawUnsafe("SET TRANSACTION READ ONLY");
    return {
      products: await tx.product.findMany({
        where: { supplierId: { in: [BORIBON_ID, KIDSTORY_ID] } },
      }),
      links: await tx.supplierProduct.findMany({
        where: { supplierId: { in: [BORIBON_ID, KIDSTORY_ID] } },
      }),
    };
  });
  const plan = launchSelection.map(selected => {
    const isKidstory = selected.supplier === "Kidstory";
    const supplierId = isKidstory ? KIDSTORY_ID : BORIBON_ID;
    const b = boribon.find(p => p.entry.model === selected.sku);
    const k = kidstory.find(p => p.entry.sku === selected.sku);
    const item = isKidstory ? k : b;
    if (!item?.valid || (isKidstory ? !k?.available : !b?.stock))
      throw new Error(`Unavailable or invalid feed identity: ${selected.sku}`);
    const content = isKidstory
      ? kidstoryContent(k!.row)
      : boribonContent(b!.row);
    const supplierQuantity = isKidstory ? 1 : b!.stock;
    const price = isKidstory ? k!.retailPrice! : b!.price!;
    const ean = item.entry.ean;
    const existing = state.products.find(p => p.sku === selected.sku);
    const link = state.links.find(
      p => p.supplierId === supplierId && p.supplierSku === selected.sku
    );
    validateRolloutIdentity(selected.sku, supplierId, ean, existing, link);
    const bases = selected.baseSkus.map(sku => {
      const p = state.products.find(p => p.sku === sku);
      if (!p?.isActive || p.status !== "APPROVED" || !p.categoryId)
        throw new Error(`Base not available: ${sku}`);
      return p;
    });
    if (
      existing?.reservedQuantity &&
      supplierQuantity <= existing.reservedQuantity
    )
      throw new Error(`No sellable stock: ${selected.sku}`);
    const identity = isKidstory
      ? {
          sourceId: k!.entry.sourceId,
          ean,
          role: "UPSELL",
          sourceUrl: k!.row.url,
          inventoryMode: "supplier-availability",
          checkoutCapacity: 1,
        }
      : {
          sourceId: b!.entry.sourceId,
          ean,
          tier: "UPSELL",
          sourceUrl: b!.row.url,
          recommendedAge: content.attributes.age,
        };
    const active = activate || existing?.isActive || false;
    const metadata = rolloutMetadata(
      existing?.metadata,
      selected.supplier,
      identity,
      selected.baseSkus,
      active
    );
    const data = {
      name: existing?.name || content.name,
      description: content.description,
      images: content.images,
      attributes: {
        ...jsonObject(existing?.attributes),
        ...content.attributes,
      },
      ageGroup: rolloutAgeGroup(
        content.attributes.age,
        existing?.ageGroup || null
      ),
      price,
      compareAtPrice: null,
      barcode: ean,
      categoryId: existing?.categoryId || bases[0].categoryId!,
      status: "APPROVED" as const,
      isActive: active,
      metadata,
    };
    return {
      selected,
      supplierId,
      existing,
      link,
      data,
      content,
      row: item.row,
      supplierQuantity,
      price,
      ean,
      feedId: isKidstory ? kFeed[0].id : bFeed[0].id,
      isKidstory,
    };
  });
  // Reject cross-supplier SKU/EAN collisions, not just records in our supplier snapshot.
  const collisions = await db.product.findMany({
    where: {
      OR: [{ sku: { in: skus } }, { barcode: { in: plan.map(p => p.ean) } }],
    },
  });
  for (const p of plan) {
    const matches = collisions.filter(
      c => c.sku === p.selected.sku || c.barcode === p.ean
    );
    if (matches.some(c => c.id !== p.existing?.id))
      throw new Error(`SKU/EAN collision: ${p.selected.sku}`);
  }
  const backupDir = path.join(
    os.homedir(),
    ".codex",
    "backups",
    `upsell-rollout-${Date.now()}`
  );
  fs.mkdirSync(backupDir, { recursive: true, mode: 0o700 });
  const preview = plan.map(p => ({
    sku: p.selected.sku,
    name: p.data.name,
    action: p.existing ? "update" : "create",
    active: p.data.isActive,
    price: p.price,
    stock: p.supplierQuantity,
    imageCount: p.content.images.length,
    baseSkus: p.selected.baseSkus,
  }));
  fs.writeFileSync(
    path.join(backupDir, "preview.json"),
    JSON.stringify(preview, null, 2),
    { mode: 0o600 }
  );
  console.log(
    JSON.stringify(
      { production, apply, activate, backupDir, products: preview },
      null,
      2
    )
  );
  if (!apply) return;
  // Roll back the entire batch on any conflict; share supplier locks with scheduled syncs.
  await db.$transaction(
    async tx => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(74261025)`;
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(74261063)`;
      const beforeProducts = await tx.product.findMany({
        where: { sku: { in: skus } },
      });
      const beforeLinks = await tx.supplierProduct.findMany({
        where: {
          supplierId: { in: [BORIBON_ID, KIDSTORY_ID] },
          supplierSku: { in: skus },
        },
      });
      fs.writeFileSync(
        path.join(backupDir, "before.json"),
        JSON.stringify(
          { products: beforeProducts, links: beforeLinks, preview },
          null,
          2
        ),
        { mode: 0o600 }
      );
      for (const p of plan) {
        const current = beforeProducts.find(c => c.sku === p.selected.sku);
        if (current?.updatedAt.getTime() !== p.existing?.updatedAt.getTime())
          throw new Error(`Product changed after preview: ${p.selected.sku}`);
        validateRolloutIdentity(
          p.selected.sku,
          p.supplierId,
          p.ean,
          current,
          beforeLinks.find(
            l =>
              l.supplierId === p.supplierId && l.supplierSku === p.selected.sku
          )
        );
        const product = current
          ? await tx.product.update({ where: { id: current.id }, data: p.data })
          : await tx.product.create({
              data: {
                ...p.data,
                sku: p.selected.sku,
                slug: `${slug(p.content.name)}-${slug(p.selected.sku)}`,
                supplierId: p.supplierId,
                costPrice: null,
                featured: false,
                stockQuantity: 0,
              },
            });
        await tx.$executeRaw`UPDATE "Product" SET "stockQuantity" = GREATEST(0, ${p.supplierQuantity} - "reservedQuantity") WHERE id = ${product.id}`;
        const linkData = {
          feedId: p.feedId,
          productId: product.id,
          name: p.content.name,
          description: p.content.description,
          images: p.content.images,
          stock: p.isKidstory ? 0 : p.supplierQuantity,
          raw: p.row,
          status: "MAPPED" as const,
          lastSyncAt: checkedAt,
          lastError: null,
          attributes: p.isKidstory
            ? {
                availabilityFlag: true,
                quantityKnown: false,
                retailReferenceRon: p.price,
              }
            : { ean: p.ean },
        };
        await tx.supplierProduct.upsert({
          where: {
            supplierId_supplierSku: {
              supplierId: p.supplierId,
              supplierSku: p.selected.sku,
            },
          },
          create: {
            ...linkData,
            supplierId: p.supplierId,
            supplierSku: p.selected.sku,
            currency: "RON",
          },
          update: linkData,
        });
      }
    },
    { timeout: 45000, maxWait: 10000 }
  );
  console.log(`Applied ${plan.length} reviewed add-ons. Backup: ${backupDir}`);
}
main()
  .catch(error => {
    console.error(error instanceof Error ? error.message : "Rollout failed");
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
