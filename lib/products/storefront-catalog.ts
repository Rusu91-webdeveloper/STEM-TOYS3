import "server-only";

import { unstable_cache } from "next/cache";

import { db } from "@/lib/db";
import type { Product } from "@/types/product";

import { isVisibleOnProductsListing } from "./catalog-access";
import { toShopperProduct } from "./public-shopper";
import { toPublicProductSlug } from "./public-slug";

/** Public projections only; credentials, supplier identity and cost stay server-side. */
export const getStorefrontCatalog = unstable_cache(
  async (): Promise<Product[]> => {
    const rows = await db.product.findMany({
      where: { isActive: true, status: { in: ["APPROVED", "IN_PENDING"] } },
      select: {
        id: true,
        slug: true,
        name: true,
        description: true,
        price: true,
        sku: true,
        barcode: true,
        weight: true,
        dimensions: true,
        isBundle: true,
        images: true,
        tags: true,
        attributes: true,
        metadata: true,
        stockQuantity: true,
        reservedQuantity: true,
        featured: true,
        isActive: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        stemDiscipline: true,
        ageGroup: true,
        category: { select: { id: true, name: true, slug: true } },
      },
      orderBy: [{ featured: "desc" }, { id: "asc" }],
    });
    return rows
      .map(row =>
        toShopperProduct({
          ...row,
          slug: toPublicProductSlug(row.slug),
          description: row.description ?? "",
          sku: row.sku ?? undefined,
          barcode: row.barcode ?? undefined,
          weight: row.weight ?? undefined,
          dimensions: row.dimensions as Product["dimensions"],
          attributes: row.attributes as Product["attributes"],
          metadata: row.metadata as Product["metadata"],
          category: row.category ?? undefined,
          ageGroup: row.ageGroup as Product["ageGroup"],
          stemDiscipline: row.stemDiscipline as Product["stemDiscipline"],
        })
      )
      .filter(isVisibleOnProductsListing);
  },
  ["storefront-catalog-v1"],
  { revalidate: 60, tags: ["products"] }
);
