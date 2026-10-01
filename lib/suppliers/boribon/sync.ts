import { Prisma, PrismaClient, SupplierFeed } from "@prisma/client";

import { BORIBON_ID, fetchBoribonProducts, portfolio } from "./feed";

type SyncOutcome = {
  sku: string;
  status: "updated" | "kept_stock" | "zeroed" | "failed" | "skipped";
  reason?: string;
  oldStock?: number;
  newStock?: number;
};

export async function syncBoribonPortfolio(
  db: PrismaClient,
  feed: SupplierFeed
) {
  if (feed.supplierId !== BORIBON_ID)
    throw new Error("Boribon sync requires Boribon supplier");
  
  // Fetch before locking. Catch feed-level failures early and fail fast
  // without modifying any stock. This prevents zeroing on timeout/HTTP error.
  let items;
  try {
    items = await fetchBoribonProducts();
  } catch (feedError) {
    const message = feedError instanceof Error ? feedError.message : String(feedError);
    console.error("[Boribon sync] Feed fetch failed, no stock modified:", message);
    // Re-throw to let the job be marked as FAILED without touching products
    throw new Error(`Feed fetch failed: ${message}`);
  }
  
  const checkedAt = new Date();
  const outcomes: SyncOutcome[] = [];
  let updated = 0;
  let keptStock = 0;
  let explicitlyZeroed = 0;
  let failed = 0;
  let skipped = 0;
  
  await db.$transaction(
    async tx => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(74261063)`;
      const links = await tx.supplierProduct.findMany({
        where: {
          supplierId: BORIBON_ID,
          supplierSku: { in: portfolio.map(p => p.model) },
        },
        include: {
          product: {
            select: { id: true, stockQuantity: true, reservedQuantity: true },
          },
        },
      });
      
      for (const item of items) {
        const link = links.find(p => p.supplierSku === item.entry.model);
        
        // UPSELL entries can be uninstalled without closing stock for the whole catalog
        if (!link?.productId) {
          if (item.entry.tier === "UPSELL") {
            console.warn(
              `[Boribon sync] Skipping uninstalled UPSELL: ${item.entry.model}`
            );
            outcomes.push({
              sku: item.entry.model,
              status: "skipped",
              reason: "UPSELL not installed",
            });
            skipped++;
            continue;
          }
          // Core catalog entries should be installed, but don't throw - just track failure
          console.error(
            `[Boribon sync] Portfolio item not installed: ${item.entry.model}`
          );
          outcomes.push({
            sku: item.entry.model,
            status: "failed",
            reason: "Not installed",
          });
          failed++;
          continue;
        }
        
        const oldStock = link.product?.stockQuantity ?? 0;
        
        // If item failed validation, keep existing stock (don't zero it)
        if (!item.valid) {
          console.warn(
            `[Boribon sync] Item ${item.entry.model} failed validation, keeping stock: ${item.error}`
          );
          await tx.supplierProduct.update({
            where: { id: link.id },
            data: {
              feedId: feed.id,
              raw: item.row,
              lastSyncAt: checkedAt,
              status: "ERROR",
              lastError: item.error || "Validation failed",
            },
          });
          outcomes.push({
            sku: item.entry.model,
            status: "kept_stock",
            reason: item.error || "Validation failed",
            oldStock,
            newStock: oldStock,
          });
          // Always count failures, even for UPSELL (they're tracked separately later)
          failed++;
          keptStock++;
          continue;
        }
        
        // Update stock based on feed data
        // Only set to 0 when feed explicitly reports 0 stock
        const newStock = Math.max(0, item.stock - (link.product?.reservedQuantity ?? 0));
        
        try {
          const changed = await tx.$executeRaw(Prisma.sql`
            UPDATE "Product" SET "stockQuantity" = GREATEST(0, ${item.stock} - "reservedQuantity"),
              "price" = ${item.price ?? 0},
              "compareAtPrice" = NULL, "updatedAt" = ${checkedAt}
            WHERE id = ${link.productId} AND "supplierId" = ${BORIBON_ID} AND "barcode" = ${item.entry.ean}
          `);
          
          if (changed !== 1) {
            // Identity changed (EAN mismatch) - keep old stock, don't zero it
            // This happens when supplier rotates product EANs (e.g., manufacturer change)
            console.error(
              `[Boribon sync] EAN/identity mismatch for ${item.entry.model} (expected ${item.entry.ean}), keeping stock at ${oldStock}. Requires manual Product.barcode + portfolio.json update.`
            );
            outcomes.push({
              sku: item.entry.model,
              status: "kept_stock",
              reason: `EAN/identity mismatch (expected ${item.entry.ean})`,
              oldStock,
              newStock: oldStock,
            });
            keptStock++;
            failed++;
            continue;
          }
          
          await tx.supplierProduct.update({
            where: { id: link.id },
            data: {
              feedId: feed.id,
              stock: item.stock,
              raw: item.row,
              lastSyncAt: checkedAt,
              status: "MAPPED",
              lastError: null,
            },
          });
          
          if (item.stock === 0) {
            outcomes.push({
              sku: item.entry.model,
              status: "zeroed",
              reason: "Supplier reported out of stock",
              oldStock,
              newStock: 0,
            });
            explicitlyZeroed++;
          } else {
            outcomes.push({
              sku: item.entry.model,
              status: "updated",
              oldStock,
              newStock,
            });
          }
          updated++;
        } catch (itemError) {
          // Individual item update failed - keep existing stock
          const message = itemError instanceof Error ? itemError.message : String(itemError);
          console.error(
            `[Boribon sync] Failed to update ${item.entry.model}: ${message}, keeping stock`
          );
          outcomes.push({
            sku: item.entry.model,
            status: "kept_stock",
            reason: `Update failed: ${message}`,
            oldStock,
            newStock: oldStock,
          });
          keptStock++;
          failed++;
        }
      }
    },
    { timeout: 25000, maxWait: 5000 }
  );
  
  // Log detailed summary
  console.log(`[Boribon sync] Summary: ${updated} updated, ${keptStock} kept stock, ${explicitlyZeroed} explicitly zeroed, ${failed} failed, ${skipped} skipped`);
  
  // Log per-item details for debugging
  if (outcomes.length > 0) {
    console.log("[Boribon sync] Per-item outcomes:", JSON.stringify(outcomes, null, 2));
  }
  
  // Count UPSELL failures separately (they don't fail the sync)
  const failedUpsell = outcomes.filter(
    o => (o.status === "failed" || o.status === "kept_stock") && 
         portfolio.find(p => p.model === o.sku)?.tier === "UPSELL"
  );
  
  if (failedUpsell.length > 0) {
    console.warn(
      `[Boribon sync] ${failedUpsell.length} UPSELL items had issues:`,
      failedUpsell.map(o => `${o.sku} (${o.reason})`).join(", ")
    );
  }
  
  // Return stats - include all failures in the failed count
  return { 
    imported: 0, 
    updated, 
    failed 
  };
}

/**
 * DEPRECATED: This function should NOT be called automatically on sync failures.
 * It unconditionally zeros ALL Boribon product stock, which hides the entire
 * catalog from customers.
 * 
 * Per owner requirements (2026-10-01): sync failures should keep last known
 * good stock, not zero everything. This function remains for manual admin use
 * only (e.g., supplier shutdown, mass recall).
 * 
 * @deprecated Use graceful per-item error handling in syncBoribonPortfolio instead
 */
export async function closeBoribonStock(db: PrismaClient) {
  console.warn(
    "[Boribon sync] closeBoribonStock called - this will zero ALL Boribon stock"
  );
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
