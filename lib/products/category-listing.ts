import { db } from "@/lib/db";
import { toShopperProduct } from "@/lib/products/public-shopper";
import { toPublicProductSlug } from "@/lib/products/public-slug";
import {
  type CanonicalCategorySlug,
  type CategoryListingProduct,
  countListedProductsByCategory,
  isListedInCategory,
} from "@/lib/products/stem-category";
import type { Product } from "@/types/product";

export const CATEGORY_PAGE_SIZE = 12;

const storefrontWhere = {
  isActive: true,
  OR: [{ status: "APPROVED" as const }, { status: "IN_PENDING" as const }],
};

type StorefrontRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  compareAtPrice: number | null;
  images: string[];
  featured: boolean;
  isActive: boolean;
  stockQuantity: number;
  reservedQuantity: number;
  tags: string[];
  attributes: unknown;
  metadata: unknown;
  ageGroup: string | null;
  stemDiscipline: string | null;
  createdAt: Date;
  updatedAt: Date;
  isBundle: boolean;
  bundleItems: unknown;
  bundleDiscount: number | null;
  category: { id: string; name: string; slug: string } | null;
};

function mapStorefrontProduct(row: StorefrontRow): Product {
  return toShopperProduct({
    id: row.id,
    name: row.name,
    slug: toPublicProductSlug(row.slug),
    description: row.description ?? "",
    price: row.price,
    compareAtPrice: row.compareAtPrice ?? undefined,
    images: row.images?.filter(Boolean) ?? [],
    featured: row.featured,
    isActive: row.isActive,
    stockQuantity: row.stockQuantity,
    reservedQuantity: row.reservedQuantity,
    tags: row.tags ?? [],
    attributes: (row.attributes as Product["attributes"]) ?? undefined,
    metadata: row.metadata as Product["metadata"],
    ageGroup: row.ageGroup as Product["ageGroup"],
    stemDiscipline: row.stemDiscipline as Product["stemDiscipline"],
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    isBundle: row.isBundle,
    bundleItems: Array.isArray(row.bundleItems)
      ? (row.bundleItems as string[])
      : undefined,
    bundleDiscount: row.bundleDiscount ?? undefined,
    category: row.category ?? undefined,
    isBook: false,
  });
}

function mapBook(book: {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  coverImage: string | null;
  author: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}): Product {
  return {
    id: book.id,
    name: book.name,
    slug: toPublicProductSlug(book.slug),
    description: book.description,
    price: book.price,
    images: book.coverImage ? [book.coverImage] : [],
    category: {
      id: "educational-books",
      name: "Cărți Educaționale",
      slug: "educational-books",
    },
    tags: ["book", "educational"],
    attributes: { author: book.author, type: "digital-book" },
    isActive: book.isActive,
    createdAt: book.createdAt,
    updatedAt: book.updatedAt,
    stockQuantity: 999,
    reservedQuantity: 0,
    featured: false,
    isBook: true,
  };
}

/** Active storefront rows, same status gate as /api/products. */
export async function loadStorefrontCatalog(): Promise<Product[]> {
  const [products, books] = await Promise.all([
    db.product.findMany({
      where: storefrontWhere,
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        price: true,
        compareAtPrice: true,
        images: true,
        featured: true,
        isActive: true,
        stockQuantity: true,
        reservedQuantity: true,
        tags: true,
        attributes: true,
        metadata: true,
        ageGroup: true,
        stemDiscipline: true,
        createdAt: true,
        updatedAt: true,
        isBundle: true,
        bundleItems: true,
        bundleDiscount: true,
        category: { select: { id: true, name: true, slug: true } },
      },
    }),
    db.book.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        price: true,
        coverImage: true,
        author: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
  ]);

  return [
    ...products.map(row => mapStorefrontProduct(row)),
    ...books.map(book => mapBook(book)),
  ];
}

export async function getVisibleCategoryCounts(): Promise<
  Record<CanonicalCategorySlug, number>
> {
  const products = await loadStorefrontCatalog();
  return countListedProductsByCategory(products);
}

export async function getCategoryPageProducts(
  slug: CanonicalCategorySlug,
  page: number
): Promise<{
  products: Product[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}> {
  const catalog = await loadStorefrontCatalog();
  const matched = catalog.filter(product =>
    isListedInCategory(product as CategoryListingProduct, slug)
  );
  const total = matched.length;
  const totalPages = total === 0 ? 0 : Math.ceil(total / CATEGORY_PAGE_SIZE);
  const safePage = total === 0 ? 1 : Math.min(Math.max(page, 1), totalPages);
  const start = (safePage - 1) * CATEGORY_PAGE_SIZE;

  return {
    products: matched.slice(start, start + CATEGORY_PAGE_SIZE),
    total,
    page: safePage,
    pageSize: CATEGORY_PAGE_SIZE,
    totalPages,
  };
}
