import { cache } from "react";

import { fallbackProducts } from "@/app/api/products/combined/fallback-product";
import { db } from "@/lib/db";
import type { Product } from "@/types/product";

import { resolveActiveBookId, resolveProductId } from "./public-catalog";
import { toShopperProduct } from "./public-shopper";
import { resolveProductPageDecision, toPublicProductSlug } from "./public-slug";

/** Read the public catalog directly. React memoization shares this read across
 * metadata and product rendering without an HTTP request to our own server.
 * Database failures propagate; they must never be mistaken for missing stock. */
export const getCombinedProduct = cache(
  async (slug: string): Promise<Product | null> => {
    const publicSlug = toPublicProductSlug(slug);
    const [productId, bookId] = await Promise.all([
      resolveProductId(publicSlug, "public"),
      resolveActiveBookId(publicSlug),
    ]);

    const [dbProduct, dbBook] = await Promise.all([
      productId
        ? db.product.findFirst({
            where: { id: productId },
            include: {
              category: {
                select: { id: true, name: true, slug: true, description: true },
              },
              supplier: {
                select: { id: true, companyName: true, companySlug: true },
              },
            },
          })
        : Promise.resolve(null),
      bookId
        ? db.book.findFirst({
            where: { id: bookId },
            include: {
              languages: true,
            },
          })
        : Promise.resolve(null),
    ]);

    if (
      dbProduct &&
      resolveProductPageDecision({
        kind: "product",
        isActive: dbProduct.isActive,
        status: dbProduct.status,
      }) === "render"
    ) {
      const attributes =
        (dbProduct.attributes as Record<string, any>) || undefined;
      const dimensions =
        (dbProduct.dimensions as Record<string, any>) || undefined;

      const transformed: Product = {
        id: dbProduct.id,
        name: dbProduct.name,
        slug: toPublicProductSlug(dbProduct.slug),
        description: dbProduct.description ?? "",
        price: dbProduct.price,
        priceCurrency: "RON",
        compareAtPrice: dbProduct.compareAtPrice ?? undefined,
        compareAtPriceCurrency: "RON",
        sku: dbProduct.sku ?? undefined,
        barcode: dbProduct.barcode ?? undefined,
        images: (dbProduct.images as string[]) || [],
        metadata: dbProduct.metadata as any,
        category: dbProduct.category
          ? {
              id: dbProduct.category.id,
              name: dbProduct.category.name,
              slug: dbProduct.category.slug,
              description: dbProduct.category.description ?? undefined,
            }
          : undefined,
        tags: (dbProduct.tags as string[]) || [],
        attributes,
        isActive: dbProduct.isActive,
        createdAt: dbProduct.createdAt,
        updatedAt: dbProduct.updatedAt,
        stockQuantity: dbProduct.stockQuantity,
        reservedQuantity: dbProduct.reservedQuantity,
        featured: dbProduct.featured,
        isBundle: dbProduct.isBundle,
        bundleItems: Array.isArray(dbProduct.bundleItems)
          ? (dbProduct.bundleItems as string[])
          : [],
        bundleDiscount:
          typeof dbProduct.bundleDiscount === "number"
            ? dbProduct.bundleDiscount
            : undefined,
        isBook: false,
        weight: dbProduct.weight ?? undefined,
        dimensions,
        averageRating: undefined,
        reviewCount: 0,
        totalSold: dbProduct.totalSold ?? undefined,
        supplier: dbProduct.supplier
          ? {
              id: dbProduct.supplier.id,
              companyName: dbProduct.supplier.companyName ?? "",
              companySlug: dbProduct.supplier.companySlug ?? "",
            }
          : undefined,
        ageRange:
          (attributes?.manufacturerRecommendedAge as string | undefined) ||
          (attributes?.originalAgeText as string | undefined) ||
          (attributes?.age as string | undefined),
        ageGroup: dbProduct.ageGroup as any,
        stemDiscipline: dbProduct.stemDiscipline as any,
      };

      return toShopperProduct(transformed);
    }

    if (
      dbBook &&
      resolveProductPageDecision({
        kind: "book",
        isActive: dbBook.isActive,
      }) === "render"
    ) {
      // Transform book to product-like structure
      const bookAsProduct: Product = {
        id: dbBook.id,
        name: dbBook.name,
        slug: toPublicProductSlug(dbBook.slug),
        description: dbBook.description,
        price: dbBook.price,
        priceCurrency: "RON",
        compareAtPrice: undefined,
        compareAtPriceCurrency: "RON",
        sku: undefined,
        barcode: undefined,
        images: dbBook.coverImage ? [dbBook.coverImage] : [],
        category: {
          id: "educational-books",
          name: "Educational Books",
          slug: "educational-books",
        },
        tags: ["book", "educational"],
        attributes: {
          author: dbBook.author,
          languages:
            (dbBook as any).languages?.map((lang: any) => lang.name) || [],
        },
        isActive: dbBook.isActive,
        createdAt: dbBook.createdAt,
        updatedAt: dbBook.updatedAt,
        stockQuantity: 10,
        reservedQuantity: 0,
        featured: true,
        isBook: true, // Flag to identify this as a book
        averageRating: undefined,
        reviewCount: 0,
        totalSold: 0,
      };

      return toShopperProduct(bookAsProduct);
    }

    const fallbackProduct = fallbackProducts[publicSlug];

    if (fallbackProduct) {
      return toShopperProduct(fallbackProduct);
    }

    return null;
  }
);
