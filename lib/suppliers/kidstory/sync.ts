import { PrismaClient } from "@prisma/client";

import { fetchKidstoryProducts, kidstoryContent, KIDSTORY_ID } from "./feed";

export async function syncKidstoryPortfolio(
  db: PrismaClient,
  feed: { id: string; supplierId: string; sourceUrl: string | null }
) {
  if (feed.supplierId !== KIDSTORY_ID)
    throw new Error("Kidstory supplier required");
  if (!feed.sourceUrl) throw new Error("Missing Kidstory feed URL");
  const items = await fetchKidstoryProducts(feed.sourceUrl);
  const checkedAt = new Date();
  let updated = 0;
  await db.$transaction(
    async tx => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(74261025)`;
      for (const item of items) {
        const link = await tx.supplierProduct.findUnique({
          where: {
            supplierId_supplierSku: {
              supplierId: KIDSTORY_ID,
              supplierSku: item.entry.sku,
            },
          },
        });
        if (!link?.productId) {
          // UPSELL entries can be uninstalled without closing stock for the whole catalog.
          // Core catalog entries must be installed or the sync fails.
          if (item.entry.role === "UPSELL") {
            console.warn(
              `[Kidstory sync] Skipping uninstalled UPSELL: ${item.entry.sku}`
            );
            continue;
          }
          throw new Error(`Portfolio not installed: ${item.entry.sku}`);
        }
        const changed = await tx.product.updateMany({
          where: {
            id: link.productId,
            supplierId: KIDSTORY_ID,
            barcode: item.entry.ean,
          },
          data: item.valid
            ? {
                ...kidstoryContent(item.row),
                price: item.retailPrice!,
                compareAtPrice: null,
              }
            : { stockQuantity: 0 },
        });
        if (changed.count !== 1)
          throw new Error(`Kidstory identity changed: ${item.entry.sku}`);
        // A capacity of one is a conservative store limit, not supplier unit stock.
        // Pending reservations remain deducted until fulfillment reconciles them.
        await tx.$executeRaw`UPDATE "Product" SET "stockQuantity" = GREATEST(0, ${item.available ? 1 : 0} - "reservedQuantity") WHERE id = ${link.productId}`;
        if (item.valid) updated++;
        await tx.supplierProduct.update({
          where: { id: link.id },
          data: {
            ...(item.valid
              ? {
                  name: item.row.name,
                  description: item.row.description,
                  images: kidstoryContent(item.row).images,
                }
              : {}),
            feedId: feed.id,
            raw: item.row,
            stock: 0,
            attributes: {
              availabilityFlag: item.available,
              quantityKnown: false,
              retailReferenceRon: item.retailPrice,
            },
            lastSyncAt: checkedAt,
            status: item.valid ? "MAPPED" : "ERROR",
            lastError: item.error,
          },
        });
      }
    },
    { timeout: 25000 }
  );
  // Count failures, but exclude UPSELL entries from critical failures.
  // UPSELL entries failing validation should not close stock for the entire catalog.
  const failedCore = items.filter(
    item => !item.valid && item.entry.role !== "UPSELL"
  );
  const failedUpsell = items.filter(
    item => !item.valid && item.entry.role === "UPSELL"
  );

  if (failedUpsell.length > 0) {
    console.warn(
      `[Kidstory sync] ${failedUpsell.length} UPSELL items failed validation:`,
      failedUpsell.map(i => i.entry.sku).join(", ")
    );
  }

  if (failedCore.length > 0) {
    throw new Error(
      `${failedCore.length} core Kidstory products unavailable because supplier data failed validation`
    );
  }

  return { imported: 0, updated, failed: failedUpsell.length };
}

export async function closeKidstoryStock(db: PrismaClient) {
  await db.product.updateMany({
    where: { supplierId: KIDSTORY_ID, isBundle: false },
    data: { stockQuantity: 0 },
  });
  await db.supplierProduct.updateMany({
    where: { supplierId: KIDSTORY_ID },
    data: {
      status: "ERROR",
      lastError:
        "Supplier sync failed; availability closed until next successful refresh",
    },
  });
}
