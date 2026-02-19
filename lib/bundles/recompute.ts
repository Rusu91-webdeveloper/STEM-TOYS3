import { db } from "@/lib/db";

type RecomputeOptions = {
  supplierId?: string;
};

export type BundleRecomputeResult = {
  processed: number;
  updated: number;
  disabled: number;
  skipped: number;
  failed: number;
};

function parseBundleItemIds(value: unknown): string[] {
  if (Array.isArray(value)) {
    return Array.from(
      new Set(
        value
          .map(v => String(v).trim())
          .filter(Boolean)
      )
    );
  }

  if (typeof value === "string" && value.trim().length > 0) {
    try {
      const parsed = JSON.parse(value);
      return parseBundleItemIds(parsed);
    } catch {
      return Array.from(
        new Set(
          value
            .split(/[,\n\r\t]+/)
            .map(v => v.trim())
            .filter(Boolean)
        )
      );
    }
  }

  return [];
}

function clampDiscount(discount: number): number {
  if (!Number.isFinite(discount)) return 0;
  return Math.min(100, Math.max(0, discount));
}

function roundCurrency(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function isDifferentNumber(current: number | null, next: number): boolean {
  if (current === null || current === undefined) return true;
  return Math.abs(current - next) > 0.005;
}

export async function recomputeBundles(
  options: RecomputeOptions = {}
): Promise<BundleRecomputeResult> {
  const bundles = await db.product.findMany({
    where: {
      isBundle: true,
      ...(options.supplierId
        ? { OR: [{ supplierId: options.supplierId }, { supplierId: null }] }
        : {}),
    },
    select: {
      id: true,
      name: true,
      bundleItems: true,
      bundleDiscount: true,
      price: true,
      compareAtPrice: true,
      costPrice: true,
      stockQuantity: true,
      isActive: true,
      supplierId: true,
      featured: true,
    },
  });

  const result: BundleRecomputeResult = {
    processed: 0,
    updated: 0,
    disabled: 0,
    skipped: 0,
    failed: 0,
  };

  if (bundles.length === 0) {
    return result;
  }

  const bundleItemsMap = new Map<string, string[]>();
  const allItemIds = new Set<string>();

  for (const bundle of bundles) {
    const ids = parseBundleItemIds(bundle.bundleItems);
    bundleItemsMap.set(bundle.id, ids);
    ids.forEach(id => allItemIds.add(id));
  }

  const components = allItemIds.size
    ? await db.product.findMany({
        where: {
          id: { in: Array.from(allItemIds) },
        },
        select: {
          id: true,
          price: true,
          costPrice: true,
          stockQuantity: true,
          isActive: true,
          supplierId: true,
          isBundle: true,
        },
      })
    : [];

  const componentById = new Map(components.map(component => [component.id, component]));

  for (const bundle of bundles) {
    result.processed += 1;

    try {
      const itemIds = bundleItemsMap.get(bundle.id) ?? [];
      if (itemIds.length === 0) {
        const shouldDisable = bundle.isActive || bundle.stockQuantity !== 0 || bundle.featured;
        if (shouldDisable) {
          await db.product.update({
            where: { id: bundle.id },
            data: {
              isActive: false,
              featured: false,
              stockQuantity: 0,
            },
          });
          result.disabled += 1;
        } else {
          result.skipped += 1;
        }
        continue;
      }

      const bundleComponents = itemIds
        .map(id => componentById.get(id))
        .filter((value): value is NonNullable<typeof value> => Boolean(value));
      const missingIds = itemIds.filter(id => !componentById.has(id));

      if (missingIds.length > 0) {
        const shouldDisable = bundle.isActive || bundle.stockQuantity !== 0 || bundle.featured;
        if (shouldDisable) {
          await db.product.update({
            where: { id: bundle.id },
            data: {
              isActive: false,
              featured: false,
              stockQuantity: 0,
            },
          });
          result.disabled += 1;
        } else {
          result.skipped += 1;
        }
        console.warn(
          `[BUNDLE RECOMPUTE] Disabled bundle ${bundle.id} (${bundle.name}) due to missing items: ${missingIds.join(", ")}`
        );
        continue;
      }

      if (bundleComponents.some(component => component.isBundle)) {
        const shouldDisable = bundle.isActive || bundle.stockQuantity !== 0 || bundle.featured;
        if (shouldDisable) {
          await db.product.update({
            where: { id: bundle.id },
            data: {
              isActive: false,
              featured: false,
              stockQuantity: 0,
            },
          });
          result.disabled += 1;
        } else {
          result.skipped += 1;
        }
        console.warn(
          `[BUNDLE RECOMPUTE] Disabled bundle ${bundle.id} (${bundle.name}) because nested bundles are not supported.`
        );
        continue;
      }

      const supplierIds = Array.from(
        new Set(
          bundleComponents
            .map(component => component.supplierId)
            .filter((value): value is string => Boolean(value))
        )
      );

      if (supplierIds.length !== 1) {
        const shouldDisable = bundle.isActive || bundle.stockQuantity !== 0 || bundle.featured;
        if (shouldDisable) {
          await db.product.update({
            where: { id: bundle.id },
            data: {
              isActive: false,
              featured: false,
              stockQuantity: 0,
            },
          });
          result.disabled += 1;
        } else {
          result.skipped += 1;
        }
        console.warn(
          `[BUNDLE RECOMPUTE] Disabled bundle ${bundle.id} (${bundle.name}) because it mixes suppliers.`
        );
        continue;
      }

      const inferredSupplierId = supplierIds[0];
      if (options.supplierId && inferredSupplierId !== options.supplierId) {
        result.skipped += 1;
        continue;
      }

      const compareAtPrice = roundCurrency(
        bundleComponents.reduce((sum, component) => sum + (component.price || 0), 0)
      );
      const totalCost = roundCurrency(
        bundleComponents.reduce((sum, component) => sum + (component.costPrice || 0), 0)
      );
      const minStock = Math.max(
        0,
        Math.min(...bundleComponents.map(component => Math.max(0, component.stockQuantity || 0)))
      );
      const discountPercent = clampDiscount(bundle.bundleDiscount ?? 0);
      const calculatedPrice = roundCurrency(
        compareAtPrice * (1 - discountPercent / 100)
      );
      const shouldBeActive =
        calculatedPrice > 0 &&
        minStock > 0 &&
        bundleComponents.every(component => component.isActive);

      const updateData: {
        compareAtPrice?: number;
        costPrice?: number;
        price?: number;
        stockQuantity?: number;
        supplierId?: string;
        isActive?: boolean;
        featured?: boolean;
      } = {};

      if (isDifferentNumber(bundle.compareAtPrice, compareAtPrice)) {
        updateData.compareAtPrice = compareAtPrice;
      }
      if (isDifferentNumber(bundle.costPrice, totalCost)) {
        updateData.costPrice = totalCost;
      }
      if (isDifferentNumber(bundle.price, calculatedPrice)) {
        updateData.price = calculatedPrice;
      }
      if (bundle.stockQuantity !== minStock) {
        updateData.stockQuantity = minStock;
      }
      if (bundle.supplierId !== inferredSupplierId) {
        updateData.supplierId = inferredSupplierId;
      }
      if (bundle.isActive !== shouldBeActive) {
        updateData.isActive = shouldBeActive;
      }
      if (!shouldBeActive && bundle.featured) {
        updateData.featured = false;
      }

      if (Object.keys(updateData).length === 0) {
        result.skipped += 1;
        continue;
      }

      await db.product.update({
        where: { id: bundle.id },
        data: updateData,
      });
      result.updated += 1;
    } catch (error) {
      result.failed += 1;
      console.error(
        `[BUNDLE RECOMPUTE] Failed for bundle ${bundle.id} (${bundle.name}):`,
        error
      );
    }
  }

  return result;
}
