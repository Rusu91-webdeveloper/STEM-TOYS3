// A03 FIX: Exclude categories with typo/invalid slugs that 404
// These need database slug corrections but are excluded from sitemap/nav until fixed
export const REMOVED_CATEGORY_PAGE_SLUGS = [
  "puzzles-optics",
  "coding-robotics",
  // Typo slugs from database that cause 404s:
  "educaie-stem", // should be "educatie-stem"
  "matematic", // should be "mathematics" or "matematica"
  "mathematics", // if this is the English version causing issues
  "matematica", // Romanian word - should use "math" slug instead
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
  const normalizedSlug = normalizeCategoryPageSlug(slug);

  if (!normalizedSlug || isRemovedCategoryPageSlug(normalizedSlug)) {
    return null;
  }

  return `/categories/${normalizedSlug}`;
}
