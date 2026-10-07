/**
 * Romanian storefront labels and the PDP age chip.
 *
 * Age chip rule (do not rewrite database age groups here):
 * A coarse gift-guide bucket (`ageGroup`) is not a manufacturer recommendation.
 * Comma-separated bracket lists such as "5-7 ani, 7-10 ani" are the same kind
 * of coarse grouping. They are never an explicit age.
 *
 * Priority:
 * 1. `manufacturerRecommendedAge` or `originalAgeText`, when that field is one
 *    explicit age and not a comma-separated bracket list.
 * 2. The lowest explicit minimum in the description (1–18, with "ani" or "+"
 *    beside the number). Piece counts ("N piese/buc") are ignored.
 * 3. A single age or ageRange value such as "8+".
 * 4. The coarse Romanian age-group label, when nothing more specific exists.
 *
 * An explicit minimum is shown as "N+ ani". If the description minimum is
 * higher than the chip, the chip uses the description minimum. The chip never
 * shows an age younger than the manufacturer's stated minimum.
 */

export type AgeChipSource = "explicit" | "ageGroup";

export interface AgeChip {
  label: string;
  source: AgeChipSource;
  /** True when the coarse ageGroup range disagrees with the shown minimum. */
  contradictsCoarseGroup: boolean;
}

export interface AgeChipProduct {
  ageGroup?: string | null;
  ageRange?: string | null;
  description?: string | null;
  attributes?: Record<string, unknown> | null;
}

const AGE_GROUPS: Record<string, { min: number; max: number; label: string }> =
  {
    TODDLERS_1_3: { min: 1, max: 3, label: "1–3 ani" },
    PRESCHOOL_3_5: { min: 3, max: 5, label: "3–5 ani" },
    ELEMENTARY_6_8: { min: 6, max: 8, label: "6–8 ani" },
    MIDDLE_SCHOOL_9_12: { min: 9, max: 12, label: "9–12 ani" },
    TEENS_13_PLUS: { min: 13, max: 99, label: "13+ ani" },
  };

const STEM_LABELS: Record<string, string | null> = {
  SCIENCE: "Știință",
  TECHNOLOGY: "Tehnologie",
  ENGINEERING: "Inginerie",
  MATHEMATICS: "Matematică",
  MATH: "Matematică",
  GENERAL: null,
  STEM: "STEM",
};

const ENGLISH_NAMES: Record<string, string | null> = {
  science: "Știință",
  technology: "Tehnologie",
  engineering: "Inginerie",
  mathematics: "Matematică",
  math: "Matematică",
  general: null,
  stem: "STEM",
};

/** Shop category slug → Romanian storefront label. */
const CATEGORY_LABELS: Record<string, string> = {
  "construction-sets": "Seturi de construcție",
  "magnetic-building": "Construcții magnetice",
  electronics: "Electronică",
  "science-experiments": "Experimente științifice",
  "logic-games": "Jocuri de logică",
  "educational-books": "Cărți educaționale",
  robotics: "Robotică",
  programming: "Programare",
  "outdoor-nature": "Natură și aer liber",
  "puzzles-optics": "Puzzle-uri și optică",
  "coding-robotics": "Robotică și programare",
  accesorii: "Accesorii",
  science: "Știință",
  technology: "Tehnologie",
  engineering: "Inginerie",
  mathematics: "Matematică",
  math: "Matematică",
};

const CATEGORY_ENGLISH_NAMES: Record<string, string> = {
  "construction sets": "construction-sets",
  "science & experiments": "science-experiments",
  "science and experiments": "science-experiments",
  "logic games": "logic-games",
  electronics: "electronics",
  "magnetic building": "magnetic-building",
  robotics: "robotics",
  programming: "programming",
  "outdoor & nature": "outdoor-nature",
  "outdoor and nature": "outdoor-nature",
  "puzzles & optics": "puzzles-optics",
  "educational books": "educational-books",
  accesorii: "accesorii",
};

const MIN_YEAR = 1;
const MAX_YEAR = 18;

function stripHtml(value: string): string {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&acirc;/gi, "â")
    .replace(/&amp;/gi, "&")
    .replace(/&#(\d+);/g, (_, code: string) =>
      String.fromCharCode(Number(code))
    );
}

function normalizeAgeText(raw: string): string {
  return stripHtml(raw)
    .replace(/\d+\s*(?:de\s+)?(?:piese|buc(?:ăți|ati)?|grame|pagini)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function keepAge(value: number): number | null {
  return value >= MIN_YEAR && value <= MAX_YEAR ? value : null;
}

/** Lowest explicit minimum in one text. Bracket lists are not read here. */
export function lowestExplicitAge(raw: string): number | null {
  const text = normalizeAgeText(raw);
  if (!text) return null;
  const found: number[] = [];
  const patterns = [
    /de\s+la\s+(\d{1,2})\s*ani/gi,
    /\+\s*(\d{1,2})\s*ani/gi,
    /(\d{1,2})\s*ani\s*\+/gi,
    /(\d{1,2})\s*ani\s*(?:si|și)\s*peste/gi,
    /peste\s+(\d{1,2})\s*ani/gi,
    /v[aâ]rst[aăe][^\d]{0,40}(\d{1,2})\s*\+/gi,
    /v[aâ]rst[aăe][^\d]{0,40}(\d{1,2})\s*[-–]\s*\d{1,2}/gi,
    /(?:^|[^\d])(\d{1,2})\s*\+/g,
  ];
  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) {
      const age = keepAge(Number(match[1]));
      if (age !== null) found.push(age);
    }
  }
  if (found.length === 0) return null;
  return Math.min(...found);
}

/** "5-7 ani, 7-10 ani" is a coarse supplier list, not one manufacturer age. */
export function isCoarseBracketList(raw: string): boolean {
  const text = normalizeAgeText(raw);
  if (!text.includes(",")) return false;
  return /\d{1,2}\s*[-–]\s*\d{1,2}/.test(text);
}

function explicitSingleValue(raw: string): number | null {
  if (isCoarseBracketList(raw)) return null;
  const fromPatterns = lowestExplicitAge(raw);
  if (fromPatterns !== null) return fromPatterns;
  const range = normalizeAgeText(raw).match(/(\d{1,2})\s*[-–]\s*(\d{1,2})/);
  if (!range) return null;
  return keepAge(Number(range[1]));
}

function attributeString(
  attributes: Record<string, unknown> | null | undefined,
  key: string
): string | null {
  const value = attributes?.[key];
  return typeof value === "string" && value.trim() ? value : null;
}

function manufacturerMinimum(product: AgeChipProduct): number | null {
  for (const key of ["manufacturerRecommendedAge", "originalAgeText"]) {
    const raw = attributeString(product.attributes, key);
    if (!raw || isCoarseBracketList(raw)) continue;
    const age = explicitSingleValue(raw);
    if (age !== null) return age;
  }
  return null;
}

export function mapStemToken(value?: string | null): {
  recognized: boolean;
  label: string | null;
} {
  if (!value?.trim()) return { recognized: false, label: null };
  const trimmed = value.trim();
  const upper = trimmed.toUpperCase().replace(/[\s-]+/g, "_");
  if (Object.prototype.hasOwnProperty.call(STEM_LABELS, upper)) {
    return { recognized: true, label: STEM_LABELS[upper] };
  }
  const lower = trimmed.toLowerCase();
  if (Object.prototype.hasOwnProperty.call(ENGLISH_NAMES, lower)) {
    return { recognized: true, label: ENGLISH_NAMES[lower] };
  }
  return { recognized: false, label: null };
}

/** Romanian name for a shop category. Slug wins over the English DB name. */
export function categoryStorefrontLabel(
  slug?: string | null,
  name?: string | null
): string | null {
  const slugKey = slug?.trim().toLowerCase();
  if (slugKey && CATEGORY_LABELS[slugKey]) return CATEGORY_LABELS[slugKey];
  const nameKey = name?.trim().toLowerCase().replace(/\s+/g, " ");
  if (nameKey && CATEGORY_ENGLISH_NAMES[nameKey]) {
    return CATEGORY_LABELS[CATEGORY_ENGLISH_NAMES[nameKey]];
  }
  const stem = mapStemToken(name);
  if (stem.recognized) return stem.label;
  return name?.trim() ? name.trim() : null;
}

/**
 * Badge label. A specific STEM discipline wins. Otherwise the Romanian
 * category label is used. GENERAL without a category is omitted.
 */
export function disciplineBadgeLabel(
  stemDiscipline?: string | null,
  categoryName?: string | null,
  categorySlug?: string | null
): string | null {
  const stem = mapStemToken(stemDiscipline);
  if (stem.recognized && stem.label) return stem.label;
  return categoryStorefrontLabel(categorySlug, categoryName);
}

export function resolveProductAgeChip(product: AgeChipProduct): AgeChip | null {
  const group = product.ageGroup ? AGE_GROUPS[product.ageGroup] : undefined;
  const manufacturerMin = manufacturerMinimum(product);
  const descriptionMin = product.description
    ? lowestExplicitAge(product.description)
    : null;

  let minimum = manufacturerMin;
  if (minimum === null && descriptionMin !== null) minimum = descriptionMin;

  if (minimum === null) {
    const candidates = [
      attributeString(product.attributes, "recommendedAge"),
      attributeString(product.attributes, "age"),
      product.ageRange,
    ];
    for (const raw of candidates) {
      if (!raw) continue;
      const age = explicitSingleValue(raw);
      if (age !== null) {
        minimum = age;
        break;
      }
    }
  }

  if (minimum !== null && descriptionMin !== null && descriptionMin > minimum) {
    minimum = descriptionMin;
  }
  if (
    minimum !== null &&
    manufacturerMin !== null &&
    minimum < manufacturerMin
  ) {
    minimum = manufacturerMin;
  }

  if (minimum !== null) {
    // Preserve assistance/autonomy qualifiers from an explicit source. A
    // minimum-only chip would conceal conditions that matter when choosing.
    const qualifiedAge = [
      attributeString(product.attributes, "manufacturerRecommendedAge"),
      attributeString(product.attributes, "originalAgeText"),
      product.ageRange,
    ].find(
      raw =>
        raw &&
        !isCoarseBracketList(raw) &&
        explicitSingleValue(raw) === minimum &&
        /ajutor|asisten|supravegh|autonom|individual|adult/i.test(raw)
    );
    const contradicts = Boolean(
      group && (minimum < group.min || minimum > group.max)
    );
    return {
      label: qualifiedAge ? normalizeAgeText(qualifiedAge) : `${minimum}+ ani`,
      source: "explicit",
      contradictsCoarseGroup: contradicts,
    };
  }

  if (group) {
    return {
      label: group.label,
      source: "ageGroup",
      contradictsCoarseGroup: false,
    };
  }

  return null;
}
