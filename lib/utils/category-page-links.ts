import { mapStemToken } from "@/lib/products/romanian-catalog";
import {
  CATEGORY_LABELS_RO,
  canonicalizeCategorySlug,
  categoryLandingSlug,
  categoryPagePath,
} from "@/lib/products/stem-category";

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
  return categoryPagePath(canonical);
}

export interface StorefrontCategoryLink {
  label: string;
  href: string;
}

/**
 * Breadcrumb label and href must name the same page.
 * A shop slug with its own /categories landing keeps that page.
 * Otherwise the STEM discipline page is used, with its Romanian STEM label.
 */
export function resolveStorefrontCategoryLink(input: {
  stemDiscipline?: string | null;
  categorySlug?: string | null;
  categoryName?: string | null;
}): StorefrontCategoryLink | null {
  const slug = input.categorySlug?.trim() ?? "";
  const ownPage = categoryLandingSlug(slug);
  if (ownPage) {
    return {
      href: categoryPagePath(ownPage),
      label: CATEGORY_LABELS_RO[ownPage],
    };
  }

  const stem = mapStemToken(input.stemDiscipline);
  const stemPage = canonicalizeCategorySlug(input.stemDiscipline);
  if (stem.recognized && stem.label && stemPage) {
    return {
      href: categoryPagePath(stemPage),
      label: stem.label,
    };
  }

  const fromCategory =
    canonicalizeCategorySlug(slug) ??
    canonicalizeCategorySlug(input.categoryName);
  if (!fromCategory) return null;
  return {
    href: categoryPagePath(fromCategory),
    label: CATEGORY_LABELS_RO[fromCategory],
  };
}
