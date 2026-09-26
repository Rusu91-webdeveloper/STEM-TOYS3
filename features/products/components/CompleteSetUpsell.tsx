import { prisma } from "@/lib/prisma";
import {
  curatedStockIsFresh,
  isCuratedSupplier,
} from "@/lib/suppliers/curated-stock";

interface UpsellProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  images: string[];
  stockQuantity: number;
}

export async function getUpsellProducts(
  baseSku: string
): Promise<UpsellProduct[]> {
  try {
    // Find products where metadata.upsellFor matches this product's SKU
    // Supports both legacy string format and new array format
    const upsellProducts = await prisma.product.findMany({
      where: {
        isActive: true,
        status: "APPROVED",
        stockQuantity: { gt: 0 },
        sku: { not: baseSku },
        OR: [
          // Legacy format: metadata.upsellFor is a string
          {
            metadata: {
              path: ["upsellFor"],
              equals: baseSku,
            },
          },
          // New format: metadata.upsellFor is an array containing baseSku
          {
            metadata: {
              path: ["upsellFor"],
              array_contains: [baseSku],
            },
          },
        ],
      },
      select: {
        id: true,
        name: true,
        slug: true,
        price: true,
        images: true,
        stockQuantity: true,
        supplierId: true,
        metadata: true,
        supplierProducts: { select: { status: true, lastSyncAt: true } },
      },
      orderBy: [{ price: "asc" }, { slug: "asc" }],
    });

    return upsellProducts
      .filter(
        p =>
          Array.isArray(p.images) &&
          p.images.some(
            image => typeof image === "string" && /^https?:\/\//.test(image)
          )
      )
      .filter(
        p =>
          !isCuratedSupplier(p.supplierId, p.metadata) ||
          p.supplierProducts.some(
            link =>
              link.status === "MAPPED" && curatedStockIsFresh(link.lastSyncAt)
          )
      )
      .slice(0, 6)
      .map(p => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        price: p.price,
        stockQuantity: p.stockQuantity,
        images: Array.isArray(p.images)
          ? p.images.filter(
              (image): image is string =>
                typeof image === "string" && /^https?:\/\//.test(image)
            )
          : [],
      }));
  } catch (error) {
    console.error("Failed to fetch upsell products:", error);
    return [];
  }
}
