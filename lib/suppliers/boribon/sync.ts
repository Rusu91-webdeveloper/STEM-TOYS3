import { Prisma, PrismaClient, SupplierFeed } from "@prisma/client";
import { BORIBON_ID, fetchBoribonProducts, portfolio } from "./feed";

export async function syncBoribonPortfolio(
  db: PrismaClient,
  feed: SupplierFeed
) {
  if (feed.supplierId !== BORIBON_ID)
    throw new Error("Boribon sync requires Boribon supplier");
  // Fetch before locking. Serialize updates with checkout's atomic product reservation.
  const items = await fetchBoribonProducts();
  const checkedAt = new Date();
  await db.$transaction(
    async tx => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(74261063)`;
      const links = await tx.supplierProduct.findMany({
        where: {
          supplierId: BORIBON_ID,
          supplierSku: { in: portfolio.map(p => p.model) },
        },
      });
      for (const item of items) {
        const link = links.find(p => p.supplierSku === item.entry.model);
        if (!link?.productId) {
          // UPSELL entries can be uninstalled without closing stock for the whole catalog.
          // Core catalog entries must be installed or the sync fails.
          if (item.entry.tier === "UPSELL") {
            console.warn(
              `[Boribon sync] Skipping uninstalled UPSELL: ${item.entry.model}`
            );
            continue;
          }
          throw new Error(`Portfolio is not installed: ${item.entry.model}`);
        }
        // stockQuantity is sellable stock; reservedQuantity is already deducted.
        // Preserve reservations until the existing order lifecycle releases them.
        const changed = await tx.$executeRaw(Prisma.sql`
        UPDATE "Product" SET "stockQuantity" = GREATEST(0, ${item.stock} - "reservedQuantity"),
          "price" = CASE WHEN ${item.valid} THEN ${item.price ?? 0} ELSE "price" END,
          "compareAtPrice" = NULL, "updatedAt" = ${checkedAt}
        WHERE id = ${link.productId} AND "supplierId" = ${BORIBON_ID} AND "barcode" = ${item.entry.ean}
      `);
        if (changed !== 1)
          throw new Error(`Product identity changed: ${item.entry.model}`);
        await tx.supplierProduct.update({
          where: { id: link.id },
          data: {
            feedId: feed.id,
            stock: item.stock,
            raw: item.row,
            lastSyncAt: checkedAt,
            status: item.valid ? "MAPPED" : "ERROR",
            lastError: item.error,
            // price on SupplierProduct is purchase cost; never put B2C into it.
          },
        });
      }
    },
    { timeout: 25000, maxWait: 5000 }
  );
  // Count failures, but exclude UPSELL entries from critical failures.
  // UPSELL entries failing validation should not close stock for the entire catalog.
  const failedCore = items.filter(
    item => !item.valid && item.entry.tier !== "UPSELL"
  );
  const failedUpsell = items.filter(
    item => !item.valid && item.entry.tier === "UPSELL"
  );
  
  if (failedUpsell.length > 0) {
    console.warn(
      `[Boribon sync] ${failedUpsell.length} UPSELL items failed validation:`,
      failedUpsell.map(i => i.entry.model).join(", ")
    );
  }
  
  if (failedCore.length > 0) {
    throw new Error(
      `${failedCore.length} core Boribon products unavailable because supplier data failed validation`
    );
  }
  
  return { imported: 0, updated: items.length - failedUpsell.length, failed: failedUpsell.length };
}

export async function closeBoribonStock(db: PrismaClient) {
  await db.product.updateMany({
    where: { supplierId: BORIBON_ID, isBundle: false },
    data: { stockQuantity: 0 },
  });
  await db.supplierProduct.updateMany({
    where: { supplierId: BORIBON_ID },
    data: {
      status: "ERROR",
      lastError:
        "Supplier sync failed; stock closed until next successful refresh",
    },
  });
}
