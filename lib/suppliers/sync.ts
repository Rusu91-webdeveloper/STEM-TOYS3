import { KIDSTORY_SYNC_MODE } from "@/lib/suppliers/kidstory/feed";
import { syncKidstoryPortfolio, closeKidstoryStock } from "@/lib/suppliers/kidstory/sync";
import { invalidateProductCaches } from "@/lib/cache-smart-invalidation";
import { BORIBON_SYNC_MODE } from "@/lib/suppliers/boribon/feed";
import { syncBoribonPortfolio, closeBoribonStock } from "@/lib/suppliers/boribon/sync";
import {
  SupplierFeed,
  SupplierFeedType,
  SupplierProductStatus,
  SupplierSyncJobType,
  SupplierSyncStatus,
} from "@prisma/client";

import { recomputeBundles } from "@/lib/bundles/recompute";
import { db } from "@/lib/db";
import {
  calculateBufferedRetailPrice,
  calculateDropshippingPrice,
} from "@/lib/pricing/dropshipping-pricing";
import {
  createAppAdapter,
  createBaseLinkerCsvAdapter,
  createBaseLinkerXmlAdapter,
  createGenericApiAdapter,
} from "@/lib/suppliers/adapters";
import { FieldMapping, ProductFeedItem } from "@/lib/suppliers/types";
import { slugify } from "@/lib/utils";
import { calculateProfitMargin } from "@/lib/utils/unit-economics";

type RunSyncParams = {
  feedId?: string;
  supplierId?: string;
  jobType?: SupplierSyncJobType;
};

function normalizeSkuList(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map(v => String(v).trim()).filter(Boolean);
  }
  if (typeof value === "string") {
    return value
      .split(/[,\n\r\t]+/)
      .map(v => v.trim())
      .filter(Boolean);
  }
  return [];
}

function normalizeStringList(value: unknown): string[] {
  return normalizeSkuList(value);
}

function normalizeRequiredFieldKey(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function validateRequiredFields(
  item: ProductFeedItem,
  requiredFields: string[]
): string[] {
  if (!requiredFields.length) return [];
  const normalized = requiredFields
    .map(field => normalizeRequiredFieldKey(field))
    .filter(Boolean);

  const requireSku = normalized.some(
    field => field === "suppliersku" || field === "sku"
  );
  const requireRetailPrice = normalized.some(
    field =>
      field === "retailprice" || field === "priceb2c" || field === "b2cprice"
  );
  const requireImages = normalized.some(
    field => field === "images" || field === "image"
  );
  const requireName = normalized.some(field => field === "name");

  const errors: string[] = [];
  if (requireSku && !item.supplierSku) {
    errors.push("missing SKU");
  }
  if (
    requireRetailPrice &&
    (!Number.isFinite(item.retailPrice ?? NaN) || (item.retailPrice ?? 0) <= 0)
  ) {
    errors.push("missing retail price");
  }
  if (requireImages && (!item.images || item.images.length === 0)) {
    errors.push("missing images");
  }
  if (requireName && !item.name?.trim()) {
    errors.push("missing name");
  }

  return errors;
}

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
  let shouldRecomputeBundlePricing = false;

  for (const feed of feeds) {
    const curatedBoribon =
      (feed.mapping as Record<string, unknown> | null)?.syncMode === BORIBON_SYNC_MODE;
    const curatedKidstory = (feed.mapping as Record<string, unknown> | null)?.syncMode === KIDSTORY_SYNC_MODE;
    const since = new Date(Date.now() - SYNC_IN_PROGRESS_WINDOW_MS);
    const existingRunning = await db.supplierSyncJob.findFirst({
      where: {
        feedId: feed.id,
        status: SupplierSyncStatus.RUNNING,
        startedAt: { gte: since },
      },
    });
    if (existingRunning) {
      results.push({
        feedId: feed.id,
        supplierId: feed.supplierId,
        status: SupplierSyncStatus.SUCCESS,
        imported: 0,
        updated: 0,
        failed: 0,
        error: "Skipped: sync already in progress for this feed",
      });
      continue;
    }

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
      let items = (curatedBoribon || curatedKidstory) ? [] : await connector.fetchProducts();

      const allowList = normalizeSkuList(mapping.allowedSkus);
      const blockList = normalizeSkuList(mapping.blockedSkus);
      const requiredFields = normalizeStringList(
        mapping.requiredFields ??
          (mapping as Record<string, unknown>).required_fields
      );
      const enforceAllowedSkus = Boolean(
        mapping.enforceAllowedSkus ??
          (mapping as Record<string, unknown>).enforce_allowed_skus
      );
      const autoCreateProducts = Boolean(
        mapping.autoCreateProducts ??
          (mapping as Record<string, unknown>).auto_create_products
      );
      const allowSet = allowList.length > 0 ? new Set(allowList) : null;
      const blockSet = blockList.length > 0 ? new Set(blockList) : null;

      // Allowlist semantics: when enforceAllowedSkus is true but allowedSkus is empty,
      // we fail the sync to avoid accidentally importing the full catalog.
      if (enforceAllowedSkus && (!allowList || allowList.length === 0)) {
        throw new Error(
          "Feed has enforceAllowedSkus true but no allowedSkus defined. " +
            "Set allowedSkus in mapping or set enforceAllowedSkus to false."
        );
      }

      if (allowSet) {
        items = items.filter(item => allowSet.has(item.supplierSku));
      }
      if (blockSet) {
        items = items.filter(item => !blockSet.has(item.supplierSku));
      }

      const { imported, updated, failed } = curatedBoribon
        ? await syncBoribonPortfolio(db, feed)
        : curatedKidstory ? await syncKidstoryPortfolio(db, feed) : await upsertProducts(feed, items, {
        requiredFields,
        enforceAllowedSkus,
        allowSet,
        autoCreateProducts,
      });

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
      shouldRecomputeBundlePricing = true;
    } catch (error) {
      if (curatedBoribon) {
        await closeBoribonStock(db);
        await invalidateProductCaches({ reason: "Boribon sync failed: stock closed" });
      }
      if (curatedKidstory) {
        await closeKidstoryStock(db);
        await invalidateProductCaches({ reason: "Kidstory sync failed: availability closed" });
      }
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

  if (shouldRecomputeBundlePricing) {
    await invalidateProductCaches({ reason: "Supplier prices and stock refreshed" });
    try {
      const bundleResult = await recomputeBundles();
      console.log(
        `[SUPPLIER SYNC] Bundle recompute completed: processed=${bundleResult.processed}, updated=${bundleResult.updated}, disabled=${bundleResult.disabled}, failed=${bundleResult.failed}`
      );
    } catch (error) {
      console.error("[SUPPLIER SYNC] Bundle recompute failed:", error);
    }
  }

  return results;
}

/** Maximum age (ms) of a RUNNING job to consider the feed "sync in progress" and skip. */
const SYNC_IN_PROGRESS_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

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

async function ensureCategory(name: string | undefined) {
  const categoryName = name?.trim();
  if (!categoryName) return null;
  const slug = slugify(categoryName);

  const existing = await db.category.findFirst({
    where: {
      OR: [{ slug }, { name: { equals: categoryName, mode: "insensitive" } }],
    },
  });
  if (existing) return existing;

  return db.category.create({
    data: {
      name: categoryName,
      slug,
      description: `Category for ${categoryName}`,
      isActive: true,
    },
  });
}

async function upsertProducts(
  feed: SupplierFeed,
  items: ProductFeedItem[],
  options?: {
    requiredFields?: string[];
    enforceAllowedSkus?: boolean;
    allowSet?: Set<string> | null;
    autoCreateProducts?: boolean;
  }
) {
  let imported = 0;
  let updated = 0;
  let failed = 0;
  const requiredFields = options?.requiredFields ?? [];
  const autoCreateProducts = options?.autoCreateProducts ?? false;

  // Get supplier configuration for margin settings
  const supplier = await db.supplier.findUnique({
    where: { id: feed.supplierId },
    select: {
      defaultMargin: true,
      minimumMarginPercentage: true,
      priceChangeThreshold: true,
      useSupplierRetailPriceAsBase: true,
      plannedPromoDiscountPercentage: true,
    },
  });

  const defaultMargin = supplier?.defaultMargin ?? 0.30; // 30% default
  const minimumMargin = supplier?.minimumMarginPercentage ?? 0.15; // 15% minimum
  const priceChangeThreshold = supplier?.priceChangeThreshold ?? 0.10; // 10% threshold
  const useSupplierRetailPriceAsBase =
    supplier?.useSupplierRetailPriceAsBase ?? false;
  const plannedPromoDiscountPercentage =
    supplier?.plannedPromoDiscountPercentage ?? 0;

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
            isBundle: true,
          },
        },
      },
    });

    if (existing?.product?.isBundle) {
      failed += 1;
      await db.supplierProduct.update({
        where: { id: existing.id },
        data: {
          status: SupplierProductStatus.ERROR,
          lastError:
            "Linked product is a bundle; supplier sync skipped to protect bundle integrity",
          lastSyncAt: new Date(),
        },
      });
      console.warn(
        `[SUPPLIER SYNC] Skipped supplier SKU ${item.supplierSku} because it is linked to bundle product ${existing.product.id}`
      );
      continue;
    }

    const costCandidate =
      Number.isFinite(item.cost ?? NaN)
        ? (item.cost as number)
        : Number.isFinite(item.price ?? NaN)
          ? (item.price as number)
          : undefined;
    const supplierCost =
      costCandidate !== undefined && costCandidate > 0
        ? costCandidate
        : existing?.price ?? 0;
    const oldSupplierPrice = existing?.price ?? 0;
    const retailPrice = Number.isFinite(item.retailPrice ?? NaN)
      ? (item.retailPrice as number)
      : undefined;

    const validationErrors = validateRequiredFields(item, requiredFields);
    if (validationErrors.length > 0) {
      failed += 1;
      const errorMessage = `Validation failed: ${validationErrors.join(", ")}`;
      const errorData = {
        supplierId: feed.supplierId,
        feedId: feed.id,
        supplierSku: item.supplierSku,
        name: item.name,
        description: item.description,
        price: supplierCost,
        currency: item.currency ?? "RON",
        stock: item.stock ?? 0,
        images: item.images ?? [],
        categoryPath: item.categoryPath ?? [],
        attributes: item.attributes ?? {},
        raw: item.raw ?? {},
        lastSyncAt: new Date(),
        productId: existing?.productId ?? null,
        status: SupplierProductStatus.ERROR,
        lastError: errorMessage,
      };

      if (existing) {
        await db.supplierProduct.update({
          where: { id: existing.id },
          data: errorData,
        });
      } else {
        await db.supplierProduct.create({ data: errorData });
      }

      if (existing?.productId) {
        await db.product.update({
          where: { id: existing.productId },
          data: {
            isActive: false,
            featured: false,
            status: "IN_PENDING",
          },
        });
      }
      continue;
    }

    // Calculate new selling price with margin
    let calculatedPrice = retailPrice ?? supplierCost;
    let marginPercentage = 0;
    let marginTooLow = false;
    let priceChangeSignificant = false;

    if (supplierCost > 0) {
      if (useSupplierRetailPriceAsBase && retailPrice !== undefined) {
        const pricingResult = calculateBufferedRetailPrice({
          supplierRetailPrice: retailPrice,
          extraBufferPercentage: defaultMargin,
          plannedDiscountPercentage: plannedPromoDiscountPercentage,
        });

        calculatedPrice = pricingResult.displayPrice;
        marginPercentage = calculateProfitMargin(calculatedPrice, supplierCost);

        if (marginPercentage < minimumMargin * 100) {
          marginTooLow = true;
        }
      } else if (retailPrice !== undefined) {
        marginPercentage = calculateProfitMargin(retailPrice, supplierCost);
        if (marginPercentage < minimumMargin * 100) {
          marginTooLow = true;
        }
      } else {
        // Calculate price with margin: Final Price = COGS / (1 - Margin)
        const pricingResult = calculateDropshippingPrice({
          cogs: supplierCost,
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
      }

      // Check if price change is significant
      if (existing && oldSupplierPrice > 0) {
        const priceChangePercent = Math.abs(
          (supplierCost - oldSupplierPrice) / oldSupplierPrice
        );
        if (priceChangePercent > priceChangeThreshold) {
          priceChangeSignificant = true;
        }
      }
    }

    let productId = existing?.productId ?? null;

    const resolvedPrice =
      Number.isFinite(calculatedPrice ?? NaN) && calculatedPrice > 0
        ? calculatedPrice
        : Number.isFinite(retailPrice ?? NaN) && (retailPrice as number) > 0
          ? (retailPrice as number)
          : 0;

    let unmatchedReason: string | null = null;

    if (!productId && item.name) {
      const categoryName = item.categoryPath?.[0];
      const category = await ensureCategory(categoryName);
      const baseSlug = `${slugify(item.name)}-${item.supplierSku.replace(
        /[^a-zA-Z0-9-_]/g,
        "-"
      )}`;

      const existingBySku = await db.product.findFirst({
        where: {
          isBundle: false,
          sku: item.supplierSku,
        },
      });

      const existingBySlug = existingBySku
        ? null
        : await db.product.findFirst({
            where: {
              isBundle: false,
              slug: baseSlug,
            },
          });

      const existingBySupplierName =
        existingBySku || existingBySlug
          ? null
          : await db.product.findFirst({
              where: {
                isBundle: false,
                supplierId: feed.supplierId,
                name: item.name,
              },
            });

      const existingProduct =
        existingBySku ?? existingBySlug ?? existingBySupplierName;

      if (existingProduct) {
        productId = existingProduct.id;
      } else if (autoCreateProducts) {
        const tags = [
          categoryName?.trim(),
          item.attributes?.stemDiscipline as string | undefined,
        ].filter(Boolean) as string[];

        const metadata = {
          source: "supplier-feed-sync",
          feedId: feed.id,
          supplierSku: item.supplierSku,
          categoryPath: item.categoryPath ?? [],
        };

        const product = await db.product.create({
          data: {
            name: item.name,
            slug: baseSlug,
            description: item.description ?? null,
            price: resolvedPrice,
            costPrice: supplierCost || null,
            stockQuantity: item.stock ?? 0,
            images: item.images ?? [],
            isActive: resolvedPrice > 0 && !marginTooLow,
            status: resolvedPrice > 0 ? "APPROVED" : "IN_PENDING",
            tags,
            ageGroup: (item.attributes?.ageGroup as string | undefined) ?? null,
            stemDiscipline:
              (item.attributes?.stemDiscipline as string | undefined) ?? null,
            metadata,
            supplierId: feed.supplierId,
            categoryId: category?.id ?? null,
          },
        });

        productId = product.id;
      } else {
        unmatchedReason =
          "Feed item did not match an approved catalog product and automatic product creation is disabled for this feed.";
      }
    }

    const data = {
      supplierId: feed.supplierId,
      feedId: feed.id,
      supplierSku: item.supplierSku,
      name: item.name,
      description: item.description,
      price: supplierCost,
      currency: item.currency ?? "RON",
      stock: item.stock ?? 0,
      images: item.images ?? [],
      categoryPath: item.categoryPath ?? [],
      attributes: item.attributes ?? {},
      raw: item.raw ?? {},
      lastSyncAt: new Date(),
      productId,
      status:
        supplierCost > 0 && item.name && productId
          ? SupplierProductStatus.MAPPED
          : SupplierProductStatus.PENDING,
      lastError: marginTooLow
        ? `Margin too low: ${marginPercentage.toFixed(2)}% (minimum: ${(minimumMargin * 100).toFixed(2)}%)`
        : unmatchedReason,
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
    if (supplierProduct.productId) {
      const updateData: {
        costPrice: number;
        price?: number;
        isActive?: boolean;
        name?: string;
        description?: string | null;
        images?: string[];
        stockQuantity?: number;
      } = {
        costPrice: supplierCost || 0,
      };

      // Only update price if margin is acceptable
      if (!marginTooLow && resolvedPrice > 0) {
        updateData.price = calculatedPrice;
        updateData.isActive = true;
      } else {
        // Disable product if margin is too low
        updateData.isActive = false;
      }

      if (item.name) {
        updateData.name = item.name;
      }
      if (item.description !== undefined) {
        updateData.description = item.description || null;
      }
      if (item.images && item.images.length > 0) {
        updateData.images = item.images;
      }
      if (item.stock !== undefined) {
        updateData.stockQuantity = item.stock;
      }

      await db.product.update({
        where: { id: supplierProduct.productId },
        data: updateData,
      });

      // Log significant price changes for admin review
      if (priceChangeSignificant && existing?.productId) {
        const percentChange =
          oldSupplierPrice > 0
            ? ((supplierCost - oldSupplierPrice) / oldSupplierPrice) * 100
            : 0;
        const formattedChange = percentChange.toFixed(2);

        console.warn(
          `[SUPPLIER SYNC] Significant price change for product ${supplierProduct.productId}: ` +
            `Supplier price changed from ${oldSupplierPrice} to ${supplierCost} ` +
            `(${formattedChange}%)`
        );

        await db.supplierNotification.create({
          data: {
            supplierId: feed.supplierId,
            type: "WARNING",
            title: "Significant supplier price change",
            message: `SKU ${item.supplierSku}: ${oldSupplierPrice} → ${supplierCost} RON (${formattedChange}%).`,
            actionUrl: `/admin/products/${existing.productId}/edit`,
            metadata: {
              supplierSku: item.supplierSku,
              oldSupplierPrice,
              newSupplierPrice: supplierCost,
              percentChange: Number(formattedChange),
              feedId: feed.id,
            },
          },
        });
      }
    }
  }

  if (options?.enforceAllowedSkus && options.allowSet) {
    await disableProductsNotInAllowlist(feed, options.allowSet);
  }

  return { imported, updated, failed };
}

async function disableProductsNotInAllowlist(
  feed: SupplierFeed,
  allowSet: Set<string>
) {
  if (!allowSet || allowSet.size === 0) return;
  const disallowed = await db.supplierProduct.findMany({
    where: {
      supplierId: feed.supplierId,
      supplierSku: { notIn: Array.from(allowSet) },
    },
    select: { id: true, productId: true },
  });

  if (disallowed.length === 0) return;

  await db.supplierProduct.updateMany({
    where: { id: { in: disallowed.map(item => item.id) } },
    data: {
      status: SupplierProductStatus.DISABLED,
      lastError: "Disabled: not in allowlist",
      lastSyncAt: new Date(),
    },
  });

  const productIds = Array.from(
    new Set(
      disallowed
        .map(item => item.productId)
        .filter((id): id is string => Boolean(id))
    )
  );

  if (productIds.length === 0) return;

  await db.product.updateMany({
    where: { id: { in: productIds }, supplierId: feed.supplierId, isBundle: false },
    data: { isActive: false, featured: false },
  });
}
