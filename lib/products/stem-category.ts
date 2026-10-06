import { visibleInBrowse } from "@/lib/products/merchandising";

/**
 * Public STEM landing slugs. Catalog rows do not use these as Category.slug:
 * they store stemDiscipline (SCIENCE, MATH, …) and slugs such as
 * science-experiments, construction-sets, or logic-games.
 */
export const CANONICAL_CATEGORY_SLUGS = [
  "science",
  "technology",
  "engineering",
  "mathematics",
  "educational-books",
] as const;

export type CanonicalCategorySlug = (typeof CANONICAL_CATEGORY_SLUGS)[number];

export const CATEGORY_PUBLIC_SLUGS: Record<CanonicalCategorySlug, string> = {
  science: "stiinta",
  technology: "tehnologie",
  engineering: "inginerie",
  mathematics: "matematica",
  "educational-books": "carti-educationale",
};

export function categoryPagePath(slug: CanonicalCategorySlug): string {
  return `/categories/${CATEGORY_PUBLIC_SLUGS[slug]}`;
}

export const CATEGORY_LABELS_RO: Record<CanonicalCategorySlug, string> = {
  science: "Știință",
  technology: "Tehnologie",
  engineering: "Inginerie",
  mathematics: "Matematică",
  "educational-books": "Cărți Educaționale",
};

const CATEGORY_ALIASES: Record<string, CanonicalCategorySlug> = {
  science: "science",
  stiinta: "science",
  "science-kits": "science",
  "science-experiments": "science",
  "science-and-experiments": "science",
  geology: "science",
  technology: "technology",
  tehnologie: "technology",
  electronics: "technology",
  electronic: "technology",
  electronice: "technology",
  programming: "technology",
  programare: "technology",
  robotics: "technology",
  robotica: "technology",
  engineering: "engineering",
  inginerie: "engineering",
  "construction-sets": "engineering",
  "construction-set": "engineering",
  "magnetic-building": "engineering",
  mathematics: "mathematics",
  math: "mathematics",
  maths: "mathematics",
  matematica: "mathematics",
  matematic: "mathematics",
  "logic-games": "mathematics",
  "jocuri-de-logica": "mathematics",
  "jocuri-logica": "mathematics",
  "educational-books": "educational-books",
  "educaie-stem": "educational-books",
  "educatie-stem": "educational-books",
  books: "educational-books",
  carti: "educational-books",
  "carti-educationale": "educational-books",
};

export interface CategoryListingProduct {
  isBook?: boolean;
  stemDiscipline?: string | null;
  category?: { slug?: string | null; name?: string | null } | null;
  slug: string;
  name: string;
  stockQuantity: number;
  metadata?: unknown;
  attributes?: unknown;
}

/** Fold diacritics, case, and separators so RO/EN names compare as one key. */
export function foldCategoryKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function canonicalizeCategorySlug(
  value: string | null | undefined
): CanonicalCategorySlug | null {
  if (!value || typeof value !== "string") return null;

  const folded = foldCategoryKey(value);
  if (!folded) return null;

  const alias = CATEGORY_ALIASES[folded];
  if (alias) return alias;

  if (
    folded.includes("book") ||
    folded.includes("carte") ||
    folded.includes("carti")
  ) {
    return "educational-books";
  }
  if (
    folded.includes("stiint") ||
    folded.includes("stiin") ||
    folded.includes("science")
  ) {
    return "science";
  }
  if (folded.includes("tehnolog") || folded.includes("technolog")) {
    return "technology";
  }
  if (folded.includes("engineer") || folded.includes("inginer")) {
    return "engineering";
  }
  if (
    folded.includes("math") ||
    folded.includes("matematic") ||
    folded.includes("mate")
  ) {
    return "mathematics";
  }

  return null;
}

/** Romanian public routes and retained English aliases share catalog keys. */
export function categoryLandingSlug(
  slug: string | null | undefined
): CanonicalCategorySlug | null {
  const lower = slug?.trim().toLowerCase() ?? "";
  if (lower === "math") return "mathematics";
  if ((CANONICAL_CATEGORY_SLUGS as readonly string[]).includes(lower)) {
    return lower as CanonicalCategorySlug;
  }
  for (const slug of CANONICAL_CATEGORY_SLUGS) {
    if (CATEGORY_PUBLIC_SLUGS[slug] === lower) return slug;
  }
  return null;
}

function stemIsUnset(stem: string | null | undefined): boolean {
  const value = stem?.trim().toLowerCase() ?? "";
  return value.length === 0 || value === "general";
}

/**
 * Prefer a real stemDiscipline. GENERAL / empty falls back to category slug,
 * then category name, so products still group before a later recategorization.
 */
export function resolveProductCategorySlug(
  product: Pick<
    CategoryListingProduct,
    "isBook" | "stemDiscipline" | "category"
  >
): CanonicalCategorySlug | null {
  if (product.isBook) return "educational-books";

  if (!stemIsUnset(product.stemDiscipline)) {
    const fromStem = canonicalizeCategorySlug(product.stemDiscipline);
    if (fromStem) return fromStem;
  }

  const fromSlug = canonicalizeCategorySlug(product.category?.slug);
  if (fromSlug) return fromSlug;

  return canonicalizeCategorySlug(product.category?.name);
}

/** Same visibility rules as the /products browse listing, then the category. */
export function isListedInCategory(
  product: CategoryListingProduct,
  category: string
): boolean {
  const canonical = canonicalizeCategorySlug(category);
  if (!canonical) return false;
  if (resolveProductCategorySlug(product) !== canonical) return false;
  if (product.isBook) return canonical === "educational-books";
  return visibleInBrowse(product);
}

export function countListedProductsByCategory(
  products: CategoryListingProduct[]
): Record<CanonicalCategorySlug, number> {
  const counts = Object.fromEntries(
    CANONICAL_CATEGORY_SLUGS.map(slug => [slug, 0])
  ) as Record<CanonicalCategorySlug, number>;

  for (const product of products) {
    const slug = resolveProductCategorySlug(product);
    if (!slug) continue;
    if (!isListedInCategory(product, slug)) continue;
    counts[slug] += 1;
  }

  return counts;
}

export function formatProductCountRo(count: number): string {
  const safe = Number.isFinite(count) ? Math.max(0, Math.trunc(count)) : 0;
  if (safe === 1) return "1 produs";
  return `${safe} produse`;
}

export function disciplineValuesForCategory(
  slug: CanonicalCategorySlug
): string[] {
  switch (slug) {
    case "science":
      return ["SCIENCE", "science", "Science"];
    case "technology":
      return ["TECHNOLOGY", "technology", "Technology"];
    case "engineering":
      return ["ENGINEERING", "engineering", "Engineering"];
    case "mathematics":
      return [
        "MATHEMATICS",
        "mathematics",
        "Mathematics",
        "MATH",
        "math",
        "Math",
      ];
    case "educational-books":
      return [];
    default: {
      const exhaustive: never = slug;
      return exhaustive;
    }
  }
}

export function categorySlugsForCategory(
  slug: CanonicalCategorySlug
): string[] {
  return Object.entries(CATEGORY_ALIASES)
    .filter(entry => entry[1] === slug)
    .map(entry => entry[0]);
}
