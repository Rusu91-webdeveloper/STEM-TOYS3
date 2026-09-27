import { canonicalizeCategorySlug } from "@/lib/products/stem-category";

// Centralized utilities for building /products URLs from filter selections

export type AgeGroup =
  | "TODDLERS_1_3"
  | "PRESCHOOL_3_5"
  | "ELEMENTARY_6_8"
  | "MIDDLE_SCHOOL_9_12"
  | "TEENS_13_PLUS";

export type SpecialCategory =
  | "NEW_ARRIVALS"
  | "BEST_SELLERS"
  | "GIFT_IDEAS"
  | "SALE_ITEMS";

export interface BuildProductsUrlInput {
  category?: string | string[]; // slug(s)
  ageGroup?: AgeGroup;
  specialCategories?: SpecialCategory | SpecialCategory[];
  minPrice?: number;
  maxPrice?: number;
  noPriceFilter?: boolean;
}

// Centralized category normalization function - USE THIS EVERYWHERE
export function normalizeCategory(name: string): string {
  if (!name || typeof name !== "string") {
    return "";
  }

  return canonicalizeCategorySlug(name) ?? name.toLowerCase().trim();
}

export function buildProductsUrl(input: BuildProductsUrlInput = {}): string {
  const params = new URLSearchParams();

  if (input.category) {
    const categories = Array.isArray(input.category)
      ? input.category
      : [input.category];
    const normalized = Array.from(
      new Set(categories.map(c => normalizeCategory(String(c).trim())))
    ).filter(Boolean);
    if (normalized.length > 0) params.set("category", normalized.join(","));
  }

  if (input.ageGroup) params.set("ageGroup", input.ageGroup);

  if (input.specialCategories) {
    const specials = Array.isArray(input.specialCategories)
      ? input.specialCategories
      : [input.specialCategories];
    const unique = Array.from(new Set(specials)).filter(Boolean) as string[];
    if (unique.length > 0) params.set("specialCategories", unique.join(","));
  }

  const hasPriceBounds =
    typeof input.minPrice === "number" && typeof input.maxPrice === "number";
  if (hasPriceBounds) {
    params.set("minPrice", String(input.minPrice));
    params.set("maxPrice", String(input.maxPrice));
  }

  if (input.noPriceFilter === false && hasPriceBounds) {
    params.set("noPriceFilter", "false");
  }

  const qs = params.toString();
  return qs ? `/products?${qs}` : "/products";
}
