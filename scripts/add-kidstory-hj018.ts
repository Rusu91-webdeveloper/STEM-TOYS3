/**
 * Preview: pnpm exec tsx scripts/add-kidstory-hj018.ts [--production]
 * Write only this product and its supplier link: add --apply explicitly.
 * Uses .env/.env.local or injected environment variables; never changes feed settings.
 */
import fs from "fs";

import { Prisma, PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";

import {
  fetchKidstoryProducts,
  kidstoryContent,
  KIDSTORY_ID,
  KIDSTORY_SYNC_MODE,
  portfolio,
} from "../lib/suppliers/kidstory/feed";

const entry = portfolio.find(p => p.sourceId === "31216" && p.sku === "HJ018")!;
const object = (value: Prisma.JsonValue | undefined): Prisma.InputJsonObject =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Prisma.InputJsonObject)
    : {};
const slug = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export async function installKidstoryHJ018(db: PrismaClient, apply = false) {
  // The preview is enforced read-only by PostgreSQL, including the initial feed lookup.
  const feed = await db.$transaction(async tx => {
    await tx.$executeRaw`SET TRANSACTION READ ONLY`;
    const feeds = await tx.supplierFeed.findMany({
      where: { supplierId: KIDSTORY_ID, isActive: true },
    });
    if (
      feeds.length !== 1 ||
      !feeds[0].sourceUrl ||
      object(feeds[0].mapping).syncMode !== KIDSTORY_SYNC_MODE
    )
      throw new Error(
        "Expected one active curated Kidstory feed with a source URL"
      );
    return feeds[0];
  });
  const [item] = await fetchKidstoryProducts(feed.sourceUrl!, [entry]);
  if (!item?.valid || item.retailPrice !== 112)
    throw new Error(
      "HJ018 must validate against the live feed at exactly 112 RON"
    );
  const retailPrice = item.retailPrice;
  const content = kidstoryContent(item.row);
  const checkedAt = new Date();

  return db.$transaction(
    async tx => {
      if (apply) await tx.$executeRaw`SELECT pg_advisory_xact_lock(74261025)`;
      else await tx.$executeRaw`SET TRANSACTION READ ONLY`;
      const currentFeed = await tx.supplierFeed.findUnique({
        where: { id: feed.id },
      });
      if (
        !currentFeed?.isActive ||
        currentFeed.supplierId !== KIDSTORY_ID ||
        currentFeed.sourceUrl !== feed.sourceUrl ||
        object(currentFeed.mapping).syncMode !== KIDSTORY_SYNC_MODE
      )
        throw new Error("Kidstory feed changed during preview; retry");
      const products = await tx.product.findMany({
        where: { OR: [{ sku: entry.sku }, { barcode: entry.ean }] },
      });
      const existing = products[0];
      if (
        products.length > 1 ||
        (existing &&
          (existing.sku !== entry.sku ||
            existing.barcode !== entry.ean ||
            existing.supplierId !== KIDSTORY_ID ||
            existing.isBundle))
      )
        throw new Error("HJ018 SKU/EAN identity collision");
      const link = await tx.supplierProduct.findUnique({
        where: {
          supplierId_supplierSku: {
            supplierId: KIDSTORY_ID,
            supplierSku: entry.sku,
          },
        },
      });
      if (link?.productId && link.productId !== existing?.id)
        throw new Error("HJ018 supplier mapping conflict");
      const metadata = object(existing?.metadata);
      const previousIdentity = object(metadata.kidstory as Prisma.JsonValue);
      if (
        previousIdentity.sourceId &&
        previousIdentity.sourceId !== entry.sourceId
      )
        throw new Error("HJ018 source identity conflict");
      if (
        existing &&
        (await tx.supplierProduct.count({
          where: { productId: existing.id, NOT: { id: link?.id ?? "" } },
        })) > 0
      )
        throw new Error(
          "HJ018 has another supplier mapping; review before installing"
        );
      const category = await tx.category.findUnique({
        where: { slug: "logic-games" },
      });
      const categoryId = existing?.categoryId ?? category?.id;
      if (!categoryId) throw new Error("Missing logic-games category");
      const data = {
        ...content,
        price: retailPrice,
        compareAtPrice: null,
        sku: entry.sku,
        barcode: entry.ean,
        categoryId,
        isActive: true,
        status: "APPROVED" as const,
        metadata: {
          ...metadata,
          kidstory: {
            ...previousIdentity,
            sourceId: entry.sourceId,
            ean: entry.ean,
            role: entry.role,
            sourceUrl: item.row.url,
            inventoryMode: "supplier-availability",
            checkoutCapacity: 1,
          },
        },
      };
      const create = {
        ...data,
        slug: `${slug(content.name)}-${slug(entry.sku)}`,
        supplierId: KIDSTORY_ID,
        costPrice: null,
        stockQuantity: 0,
      };
      const linkData = {
        feedId: feed.id,
        name: content.name,
        description: content.description,
        images: content.images,
        raw: item.row,
        stock: 0,
        attributes: {
          availabilityFlag: item.available,
          quantityKnown: false,
          retailReferenceRon: retailPrice,
        },
        status: "MAPPED" as const,
        lastSyncAt: checkedAt,
        lastError: null,
      };
      const plan = {
        mode: apply ? "APPLY" : "DRY RUN",
        product: {
          action: existing ? "update" : "create",
          where: { sku: entry.sku },
          data: existing ? data : create,
        },
        supplierProduct: {
          action: link ? "update" : "create",
          where: {
            supplierId_supplierSku: {
              supplierId: KIDSTORY_ID,
              supplierSku: entry.sku,
            },
          },
          data: {
            ...(!link
              ? { supplierId: KIDSTORY_ID, supplierSku: entry.sku }
              : {}),
            ...linkData,
            productId: existing?.id ?? "<created Product.id>",
          },
        },
        stockQuantityRefresh: {
          productId: existing?.id ?? "<created Product.id>",
          formula: `GREATEST(0, ${item.available ? 1 : 0} - reservedQuantity)`,
          previewQuantity: Math.max(
            0,
            (item.available ? 1 : 0) - (existing?.reservedQuantity ?? 0)
          ),
        },
      };
      console.log(JSON.stringify(plan, null, 2));
      if (!apply) return plan;
      const product = await tx.product.upsert({
        where: { sku: entry.sku },
        create,
        update: data,
      });
      // Match nightly sync: subtract current reservations atomically, not a stale snapshot.
      await tx.$executeRaw`UPDATE "Product" SET "stockQuantity" = GREATEST(0, ${item.available ? 1 : 0} - "reservedQuantity") WHERE id = ${product.id}`;
      await tx.supplierProduct.upsert({
        where: plan.supplierProduct.where,
        create: {
          supplierId: KIDSTORY_ID,
          supplierSku: entry.sku,
          ...linkData,
          productId: product.id,
        },
        update: { ...linkData, productId: product.id },
      });
      return plan;
    },
    { timeout: 25000 }
  );
}

async function main() {
  const args = process.argv.slice(2);
  if (args.some(arg => !["--apply", "--production"].includes(arg)))
    throw new Error("Usage: add-kidstory-hj018.ts [--production] [--apply]");
  const env = Object.assign(
    {},
    ...[".env", ".env.local"]
      .filter(fs.existsSync)
      .map(p => dotenv.parse(fs.readFileSync(p))),
    process.env
  );
  const production = args.includes("--production");
  const url = production ? env.DATABASE_URL_PRODUCTION : env.DATABASE_URL;
  if (
    !url ||
    (!production &&
      !["localhost", "127.0.0.1", "[::1]"].includes(new URL(url).hostname))
  )
    throw new Error(
      "Explicit --production required for a remote database preview/apply"
    );
  const db = new PrismaClient({ datasources: { db: { url } } });
  try {
    await installKidstoryHJ018(db, args.includes("--apply"));
  } finally {
    await db.$disconnect();
  }
}

if (require.main === module)
  main().catch(error => {
    console.error(error.message);
    process.exitCode = 1;
  });
