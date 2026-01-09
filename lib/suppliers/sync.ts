import {
  SupplierFeed,
  SupplierFeedType,
  SupplierProductStatus,
  SupplierSyncJobType,
  SupplierSyncStatus,
} from "@prisma/client";

import { db } from "@/lib/db";
import {
  createAppAdapter,
  createBaseLinkerCsvAdapter,
  createBaseLinkerXmlAdapter,
  createGenericApiAdapter,
} from "@/lib/suppliers/adapters";
import { FieldMapping, ProductFeedItem } from "@/lib/suppliers/types";
import { calculateDropshippingPrice } from "@/lib/pricing/dropshipping-pricing";
import { calculateProfitMargin } from "@/lib/utils/unit-economics";

type RunSyncParams = {
  feedId?: string;
  supplierId?: string;
  jobType?: SupplierSyncJobType;
};

export async function runSupplierFeedSync(
  params: RunSyncParams = {}
): Promise<
  Array<{
    feedId: string;
    supplierId: string;
    status: SupplierSyncStatus;
    imported: number;
    updated: number;
    failed: number;
    error?: string | null;
  }>
> {
  const feeds = await db.supplierFeed.findMany({
    where: {
      isActive: true,
      ...(params.feedId ? { id: params.feedId } : {}),
      ...(params.supplierId ? { supplierId: params.supplierId } : {}),
    },
  });

  const results: Array<{
    feedId: string;
    supplierId: string;
    status: SupplierSyncStatus;
    imported: number;
    updated: number;
    failed: number;
    error?: string | null;
  }> = [];

  for (const feed of feeds) {
    const job = await db.supplierSyncJob.create({
      data: {
        supplierId: feed.supplierId,
        feedId: feed.id,
        jobType: params.jobType || SupplierSyncJobType.PRODUCTS,
        status: SupplierSyncStatus.RUNNING,
        startedAt: new Date(),
      },
    });

    try {
      const mapping: FieldMapping = (feed.mapping as FieldMapping) || {};
      const connector = getConnector(feed, mapping);
      const items = await connector.fetchProducts();

      const { imported, updated, failed } = await upsertProducts(feed, items);

      await db.supplierSyncJob.update({
        where: { id: job.id },
        data: {
          status: SupplierSyncStatus.SUCCESS,
          finishedAt: new Date(),
          imported,
          updated,
          failed,
        },
      });

      await db.supplierFeed.update({
        where: { id: feed.id },
        data: {
          lastSyncAt: new Date(),
          lastSyncStatus: SupplierSyncStatus.SUCCESS,
          lastError: null,
        },
      });

      results.push({
        feedId: feed.id,
        supplierId: feed.supplierId,
        status: SupplierSyncStatus.SUCCESS,
        imported,
        updated,
        failed,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown sync failure";

      await db.supplierSyncJob.update({
        where: { id: job.id },
        data: {
          status: SupplierSyncStatus.FAILED,
          finishedAt: new Date(),
          error: message,
        },
      });

      await db.supplierFeed.update({
        where: { id: feed.id },
        data: {
          lastSyncAt: new Date(),
          lastSyncStatus: SupplierSyncStatus.FAILED,
          lastError: message,
        },
      });

      results.push({
        feedId: feed.id,
        supplierId: feed.supplierId,
        status: SupplierSyncStatus.FAILED,
        imported: 0,
        updated: 0,
        failed: 0,
        error: message,
      });
    }
  }

  return results;
}

function getConnector(feed: SupplierFeed, mapping: FieldMapping) {
  switch (feed.type) {
    case SupplierFeedType.CSV:
      return createBaseLinkerCsvAdapter({ feed, mapping });
    case SupplierFeedType.XML:
      return createBaseLinkerXmlAdapter({ feed, mapping });
    case SupplierFeedType.API:
      return createGenericApiAdapter({ feed, mapping });
    case SupplierFeedType.APP:
      return createAppAdapter({ feed, mapping });
    default:
      return createBaseLinkerCsvAdapter({ feed, mapping });
  }
}

async function upsertProducts(
  feed: SupplierFeed,
  items: ProductFeedItem[]
) {
  let imported = 0;
  let updated = 0;
  let failed = 0;

  // Get supplier configuration for margin settings
  const supplier = await db.supplier.findUnique({
    where: { id: feed.supplierId },
    select: {
      defaultMargin: true,
      minimumMarginPercentage: true,
      priceChangeThreshold: true,
    },
  });

  const defaultMargin = supplier?.defaultMargin ?? 0.30; // 30% default
  const minimumMargin = supplier?.minimumMarginPercentage ?? 0.15; // 15% minimum
  const priceChangeThreshold = supplier?.priceChangeThreshold ?? 0.10; // 10% threshold

  // Default shipping cost (can be configured per supplier later)
  const defaultShippingCost = 15; // RON

  for (const item of items) {
    if (!item.supplierSku) {
      failed += 1;
      continue;
    }

    const existing = await db.supplierProduct.findUnique({
      where: {
        supplierId_supplierSku: {
          supplierId: feed.supplierId,
          supplierSku: item.supplierSku,
        },
      },
      include: {
        product: {
          select: {
            id: true,
            price: true,
            isActive: true,
          },
        },
      },
    });

    const supplierPrice = item.price ?? 0;
    const oldSupplierPrice = existing?.price ?? 0;

    // Calculate new selling price with margin
    let calculatedPrice = supplierPrice;
    let marginPercentage = 0;
    let marginTooLow = false;
    let priceChangeSignificant = false;

    if (supplierPrice > 0) {
      // Calculate price with margin: Final Price = COGS / (1 - Margin)
      const pricingResult = calculateDropshippingPrice({
        cogs: supplierPrice,
        shipping: defaultShippingCost,
        codFee: 0, // Will be calculated at checkout if COD
        targetMargin: defaultMargin,
      });

      calculatedPrice = pricingResult.finalPrice;
      marginPercentage = pricingResult.marginPercentage;

      // Check if margin is too low
      if (marginPercentage < minimumMargin * 100) {
        marginTooLow = true;
      }

      // Check if price change is significant
      if (existing && oldSupplierPrice > 0) {
        const priceChangePercent = Math.abs(
          (supplierPrice - oldSupplierPrice) / oldSupplierPrice
        );
        if (priceChangePercent > priceChangeThreshold) {
          priceChangeSignificant = true;
        }
      }
    }

    const data = {
      supplierId: feed.supplierId,
      feedId: feed.id,
      supplierSku: item.supplierSku,
      name: item.name,
      description: item.description,
      price: supplierPrice,
      currency: item.currency ?? "RON",
      stock: item.stock ?? 0,
      images: item.images ?? [],
      categoryPath: item.categoryPath ?? [],
      attributes: item.attributes ?? {},
      raw: item.raw ?? {},
      lastSyncAt: new Date(),
      status:
        item.price !== undefined && item.name
          ? SupplierProductStatus.MAPPED
          : SupplierProductStatus.PENDING,
      lastError: marginTooLow
        ? `Margin too low: ${marginPercentage.toFixed(2)}% (minimum: ${(minimumMargin * 100).toFixed(2)}%)`
        : null,
    };

    let supplierProduct;
    if (existing) {
      supplierProduct = await db.supplierProduct.update({
        where: { id: existing.id },
        data,
      });
      updated += 1;
    } else {
      supplierProduct = await db.supplierProduct.create({ data });
      imported += 1;
    }

    // Update linked Product if it exists
    if (supplierProduct.productId && supplierPrice > 0) {
      const updateData: {
        costPrice: number;
        price?: number;
        isActive?: boolean;
      } = {
        costPrice: supplierPrice,
      };

      // Only update price if margin is acceptable
      if (!marginTooLow) {
        updateData.price = calculatedPrice;
        updateData.isActive = true;
      } else {
        // Disable product if margin is too low
        updateData.isActive = false;
      }

      await db.product.update({
        where: { id: supplierProduct.productId },
        data: updateData,
      });

      // Log significant price changes for admin review
      if (priceChangeSignificant && existing?.productId) {
        console.warn(
          `[SUPPLIER SYNC] Significant price change for product ${supplierProduct.productId}: ` +
            `Supplier price changed from ${oldSupplierPrice} to ${supplierPrice} ` +
            `(${((supplierPrice - oldSupplierPrice) / oldSupplierPrice * 100).toFixed(2)}%)`
        );
        // TODO: Create admin notification for significant price changes
      }
    }
  }

  return { imported, updated, failed };
}
