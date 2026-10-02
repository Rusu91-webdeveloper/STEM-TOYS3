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
    items = await fetchBoribonProducts(feed.sourceUrl);
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
  const errors: string[] = [];
  
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
            select: { id: true, stockQuantity: true, reservedQuantity: true, barcode: true },
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
          errors.push(`${item.entry.model}: not installed`);
          failed++;
          continue;
        }
        
        const oldStock = link.product?.stockQuantity ?? 0;
        
        // If item failed validation, keep existing stock (don't zero it)
        // Don't update lastSyncAt - kept-stock items aren't freshly synced
        if (!item.valid) {
          const errorMsg = item.error || "Validation failed";
          console.warn(
            `[Boribon sync] Item ${item.entry.model} failed validation, keeping stock: ${errorMsg}`
          );
          await tx.supplierProduct.update({
            where: { id: link.id },
            data: {
              feedId: feed.id,
              raw: item.row,
              // lastSyncAt NOT updated - stock is stale
              status: "ERROR",
              lastError: errorMsg,
            },
          });
          outcomes.push({
            sku: item.entry.model,
            status: "kept_stock",
            reason: errorMsg,
            oldStock,
            newStock: oldStock,
          });
          errors.push(`${item.entry.model}: ${errorMsg}`);
          failed++;
          keptStock++;
          continue;
        }
        
        // Use savepoint for transactional isolation per item
        // If this item's SQL fails, rollback to savepoint and continue with others
        // Reuse constant name per iteration - Postgres allows sequential reuse
        const savepointName = 'boribon_item';
        try {
          await tx.$executeRaw`SAVEPOINT boribon_item`;
          
          // Update stock based on feed data
          // Only set to 0 when feed explicitly reports 0 stock
          const newStock = Math.max(0, item.stock - (link.product?.reservedQuantity ?? 0));
          
          const changed = await tx.$executeRaw(Prisma.sql`
            UPDATE "Product" SET "stockQuantity" = GREATEST(0, ${item.stock} - "reservedQuantity"),
              "price" = ${item.price ?? 0},
              "compareAtPrice" = NULL, "updatedAt" = ${checkedAt}
            WHERE id = ${link.productId} AND "supplierId" = ${BORIBON_ID} AND "barcode" = ${item.entry.ean}
          `);
          
          if (changed !== 1) {
            // Identity changed (EAN mismatch) - rollback item update, keep old stock
            await tx.$executeRaw`ROLLBACK TO SAVEPOINT boribon_item`;
            
            const mismatchMsg = `EAN/identity mismatch (expected ${item.entry.ean}, DB has ${link.product?.barcode})`;
            console.error(
              `[Boribon sync] ${mismatchMsg} for ${item.entry.model}, keeping stock at ${oldStock}. Requires manual Product.barcode + portfolio.json update.`
            );
            
            // Record mismatch on SupplierProduct (status ERROR, lastError)
            // Don't update lastSyncAt - stock is stale
            await tx.supplierProduct.update({
              where: { id: link.id },
              data: {
                feedId: feed.id,
                raw: item.row,
                // lastSyncAt NOT updated - stock is stale
                status: "ERROR",
                lastError: mismatchMsg,
              },
            });
            
            outcomes.push({
              sku: item.entry.model,
              status: "kept_stock",
              reason: mismatchMsg,
              oldStock,
              newStock: oldStock,
            });
            errors.push(`${item.entry.model}: ${mismatchMsg}`);
            keptStock++;
            failed++;
            continue;
          }
          
          // Success - update SupplierProduct with fresh sync time
          await tx.supplierProduct.update({
            where: { id: link.id },
            data: {
              feedId: feed.id,
              stock: item.stock,
              raw: item.row,
              lastSyncAt: checkedAt, // Stock successfully refreshed
              status: "MAPPED",
              lastError: null,
            },
          });
          
          await tx.$executeRaw`RELEASE SAVEPOINT boribon_item`;
          
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
          // SQL error within item processing - rollback to savepoint
          try {
            await tx.$executeRaw`ROLLBACK TO SAVEPOINT boribon_item`;
          } catch (rollbackError) {
            // Savepoint might not exist if error happened before SAVEPOINT
            console.error(`[Boribon sync] Rollback failed for ${item.entry.model}:`, rollbackError);
          }
          
          const message = itemError instanceof Error ? itemError.message : String(itemError);
          console.error(
            `[Boribon sync] Failed to update ${item.entry.model}: ${message}, keeping stock at ${oldStock}`
          );
          
          // Record SQL error on SupplierProduct
          // Don't update lastSyncAt - stock is stale
          await tx.supplierProduct.update({
            where: { id: link.id },
            data: {
              feedId: feed.id,
              raw: item.row,
              // lastSyncAt NOT updated - stock is stale
              status: "ERROR",
              lastError: `Update failed: ${message}`,
            },
          });
          
          outcomes.push({
            sku: item.entry.model,
            status: "kept_stock",
            reason: `Update failed: ${message}`,
            oldStock,
            newStock: oldStock,
          });
          errors.push(`${item.entry.model}: ${message}`);
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
  
  // Return stats with error summary for job tracking
  const errorSummary = errors.length > 0 
    ? errors.slice(0, 3).join("; ") + (errors.length > 3 ? ` (+${errors.length - 3} more)` : "")
    : null;
  
  return { 
    imported: 0, 
    updated, 
    failed,
    error: errorSummary,
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
