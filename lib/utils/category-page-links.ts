export const REMOVED_CATEGORY_PAGE_SLUGS = [
  "puzzles-optics",
  "coding-robotics",
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
