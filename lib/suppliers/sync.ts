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
    });

    const data = {
      supplierId: feed.supplierId,
      feedId: feed.id,
      supplierSku: item.supplierSku,
      name: item.name,
      description: item.description,
      price: item.price ?? undefined,
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
      lastError: null,
    };

    if (existing) {
      await db.supplierProduct.update({
        where: { id: existing.id },
        data,
      });
      updated += 1;
    } else {
      await db.supplierProduct.create({ data });
      imported += 1;
    }
  }

  return { imported, updated, failed };
}
