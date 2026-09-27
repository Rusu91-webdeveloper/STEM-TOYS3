import { canonicalizeCategorySlug } from "@/lib/products/stem-category";

// Product-category typos that must not become their own landing URLs.
// Recognized aliases still resolve to a canonical /categories/* page.
export const REMOVED_CATEGORY_PAGE_SLUGS = [
  "puzzles-optics",
  "coding-robotics",
  "educaie-stem",
  "matematic",
  "matematica",
] as const;

type RemovedCategoryPageSlug = (typeof REMOVED_CATEGORY_PAGE_SLUGS)[number];

export function normalizeCategoryPageSlug(slug?: string | null): string {
  return slug?.trim().toLowerCase() ?? "";
}

export function isRemovedCategoryPageSlug(slug?: string | null): boolean {
  const normalizedSlug = normalizeCategoryPageSlug(slug);

  return REMOVED_CATEGORY_PAGE_SLUGS.includes(
    normalizedSlug as RemovedCategoryPageSlug
  );
}

export function getCategoryPageHref(slug?: string | null): string | null {
  const canonical = canonicalizeCategorySlug(slug);
  if (!canonical) return null;
  return `/categories/${canonical}`;
}
