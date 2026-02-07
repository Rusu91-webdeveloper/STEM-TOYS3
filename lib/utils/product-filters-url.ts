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

  const lower = name.toLowerCase().trim();

  // Handle educational books variations
  if (
    lower === "educational-books" ||
    lower === "educational books" ||
    lower === "books" ||
    lower === "carti" ||
    lower === "carti educationale" ||
    lower.includes("book") ||
    lower.includes("carte")
  ) {
    return "educational-books";
  }

  // Handle science variations
  if (
    lower === "science" ||
    lower === "stiinta" ||
    lower === "știință" ||
    lower.includes("stiint") ||
    lower.includes("știin")
  ) {
    return "science";
  }

  // Handle technology variations
  if (
    lower === "technology" ||
    lower === "tehnologie" ||
    lower.includes("tehnolog")
  ) {
    return "technology";
  }

  // Handle engineering variations
  if (lower === "inginerie" || lower.includes("engineer")) {
    return "engineering";
  }

  // Handle mathematics variations
  if (
    lower === "mathematics" ||
    lower === "matematica" ||
    lower === "matematică" ||
    lower.includes("math") ||
    lower.includes("mate")
  ) {
    return "mathematics";
  }

  // Handle engineering learning variations
  if (
    lower === "engineeringlearning" ||
    lower === "engineering learning" ||
    lower === "inginerie si invatare" ||
    lower === "inginerie și învățare"
  ) {
    return "engineering";
  }

  return lower;
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
