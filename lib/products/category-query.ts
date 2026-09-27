import { visibleInBrowse } from "@/lib/products/merchandising";
import {
  isListedInCategory,
  type CategoryListingProduct,
} from "@/lib/products/stem-category";

export interface CategoryQueryProduct extends CategoryListingProduct {
  price: number;
  description?: string | null;
  tags?: string[] | null;
  featured?: boolean;
  ageGroup?: string | null;
  createdAt?: Date | string | null;
}

export interface CategoryCatalogQuery {
  category: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  featured?: string;
  ageGroup?: string;
  sort?: string;
}

function createdAtTime(value: CategoryQueryProduct["createdAt"]): number {
  if (!value) return 0;
  const parsed =
    value instanceof Date ? value.getTime() : Date.parse(String(value));
  return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * Same category membership as the category pages: hidden add-ons drop out,
 * and educational-books returns books instead of the whole catalog.
 */
export function filterCatalogForCategory<T extends CategoryQueryProduct>(
  products: T[],
  query: CategoryCatalogQuery
): T[] {
  const categories = query.category
    .split(",")
    .map(value => value.trim())
    .filter(category => category.length > 0);

  let matched = products.filter(product =>
    categories.some(category => isListedInCategory(product, category))
  );

  if (query.featured === "true") {
    matched = matched.filter(product => product.featured === true);
  }

  if (query.ageGroup) {
    matched = matched.filter(product => product.ageGroup === query.ageGroup);
  }

  if (query.minPrice !== undefined || query.maxPrice !== undefined) {
    matched = matched.filter(product => {
      if (!Number.isFinite(product.price) || product.price <= 0) return false;
      if (query.minPrice !== undefined && product.price < query.minPrice) {
        return false;
      }
      if (query.maxPrice !== undefined && product.price > query.maxPrice) {
        return false;
      }
      return true;
    });
  }

  const search = query.search?.trim().toLowerCase();
  if (search) {
    matched = matched.filter(product => {
      const name = product.name.toLowerCase();
      const description = (product.description ?? "").toLowerCase();
      const tags = product.tags ?? [];
      return (
        name.includes(search) ||
        description.includes(search) ||
        tags.some(tag => tag.toLowerCase().includes(search))
      );
    });
  }

  const sorted = [...matched];
  const byNewest = (a: T, b: T) => createdAtTime(b.createdAt) - createdAtTime(a.createdAt);

  switch (query.sort) {
    case "name":
      sorted.sort((a, b) => a.name.localeCompare(b.name, "ro"));
      break;
    case "price":
    case "price-low":
      sorted.sort((a, b) => a.price - b.price);
      break;
    case "price-high":
      sorted.sort((a, b) => b.price - a.price);
      break;
    case "featured":
      sorted.sort((a, b) => {
        const featuredRank =
          Number(b.featured === true) - Number(a.featured === true);
        if (featuredRank !== 0) return featuredRank;
        return byNewest(a, b);
      });
      break;
    case "created":
    case "newest":
    default:
      sorted.sort(byNewest);
      break;
  }

  return sorted;
}

export function paginateItems<T>(items: T[], page: number, limit: number) {
  const safeLimit = limit > 0 ? limit : 1;
  const safePage = page > 0 ? page : 1;
  const start = (safePage - 1) * safeLimit;

  return {
    items: items.slice(start, start + safeLimit),
    total: items.length,
    page: safePage,
    limit: safeLimit,
    totalPages: Math.ceil(items.length / safeLimit),
    hasNext: safePage * safeLimit < items.length,
    hasPrevious: safePage > 1,
  };
}

/** Count used for /products canonical and rel next. */
export function countIndexableListing(
  products: Array<CategoryListingProduct & { ageGroup?: string | null }>,
  params: { category?: string; ageGroup?: string }
): number {
  const category = params.category?.trim();
  const visible = products.filter(product => {
    if (category) {
      return category
        .split(",")
        .some(slug => isListedInCategory(product, slug.trim()));
    }
    return visibleInBrowse(product);
  });

  if (!params.ageGroup) return visible.length;
  return visible.filter(product => product.ageGroup === params.ageGroup).length;
}
