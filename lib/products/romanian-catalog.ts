/**
 * Romanian storefront labels for STEM disciplines and the PDP age chip.
 *
 * Age chip rule (do not rewrite database age groups here):
 * The buy-box chip must not contradict the product's own age data. A coarse
 * catalog bucket (`ageGroup`, for example PRESCHOOL_3_5 → "3–5 ani") is only
 * a gift-guide grouping. It is not a manufacturer recommendation.
 *
 * 1. Explicit ages are read from manufacturer fields and attributes
 *    (`manufacturerRecommendedAge`, `originalAgeText`, `recommendedAge`,
 *    `age`), then from the description (`8+`, `de la 8 ani`, a "vârstă"
 *    range), then from `ageRange` when that value is not just a restatement
 *    of the coarse bucket.
 * 2. An explicit minimum such as "8+" or "de la 8 ani" wins over the coarse
 *    bucket. The chip shows that minimum (for example "8+").
 * 3. When the explicit age sits inside the coarse bucket, the chip shows the
 *    explicit wording.
 * 4. When nothing more specific exists, the coarse Romanian label may be
 *    shown. It is omitted when it would contradict an explicit age.
 * 5. With no age data at all, the chip is omitted.
 *
 * A separate data script corrects wrong `ageGroup` values in the database.
 */

export type AgeChipSource = "explicit" | "ageGroup";

export interface AgeChip {
  label: string;
  source: AgeChipSource;
  /** True when the coarse ageGroup range disagrees with an explicit age. */
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

/** Known STEM tokens. `null` means the label should be omitted (GENERAL). */
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

interface ParsedAge {
  min: number;
  max?: number;
  label: string;
}

function stripHtml(value: string): string {
  return value.replace(/<[^>]*>/g, " ").replace(/&nbsp;/gi, " ");
}

function parseAgeField(raw: string): ParsedAge | null {
  const text = stripHtml(raw).replace(/\s+/g, " ").trim();
  if (!text) return null;

  const fromMatch = text.match(/de\s+la\s+(\d{1,2})\s*ani/i);
  if (fromMatch) {
    const min = Number(fromMatch[1]);
    return { min, label: `${min}+` };
  }

  const plusMatch = text.match(/(?:^|[^\d])(\d{1,2})\s*\+/);
  if (plusMatch) {
    const min = Number(plusMatch[1]);
    return { min, label: `${min}+` };
  }

  const rangeMatch = text.match(/(\d{1,2})\s*[-–]\s*(\d{1,2})/);
  if (rangeMatch) {
    const min = Number(rangeMatch[1]);
    const max = Number(rangeMatch[2]);
    if (max >= min) return { min, max, label: `${min}–${max} ani` };
  }

  return null;
}

function explicitFromDescription(description: string): ParsedAge | null {
  const text = stripHtml(description);
  const minimums: number[] = [];

  for (const match of text.matchAll(/de\s+la\s+(\d{1,2})\s*ani/gi)) {
    minimums.push(Number(match[1]));
  }
  for (const match of text.matchAll(/(?:^|[^\d])(\d{1,2})\s*\+/g)) {
    minimums.push(Number(match[1]));
  }
  if (minimums.length > 0) {
    const min = Math.min(...minimums.filter(value => value > 0 && value < 100));
    if (Number.isFinite(min)) return { min, label: `${min}+` };
  }

  const range = text.match(
    /v[aâ]rst[aă][^\d]{0,40}(\d{1,2})\s*[-–]\s*(\d{1,2})/i
  );
  if (!range) return null;
  const min = Number(range[1]);
  const max = Number(range[2]);
  if (max < min) return null;
  return { min, max, label: `${min}–${max} ani` };
}

function sameAsCoarseBucket(
  parsed: ParsedAge,
  group?: { min: number; max: number }
): boolean {
  if (!group || parsed.max === undefined) return false;
  return parsed.min === group.min && parsed.max === group.max;
}

function isInsideGroup(
  parsed: ParsedAge,
  group: { min: number; max: number }
): boolean {
  if (parsed.min > group.max) return false;
  if (parsed.max !== undefined && parsed.max < group.min) return false;
  return parsed.min >= group.min && parsed.min <= group.max;
}

function attributeString(
  attributes: Record<string, unknown> | null | undefined,
  key: string
): string | null {
  const value = attributes?.[key];
  return typeof value === "string" && value.trim() ? value : null;
}

function resolveExplicitAge(
  product: AgeChipProduct,
  group?: { min: number; max: number }
): ParsedAge | null {
  const fieldKeys = [
    "manufacturerRecommendedAge",
    "originalAgeText",
    "recommendedAge",
    "age",
  ];
  for (const key of fieldKeys) {
    const raw = attributeString(product.attributes, key);
    if (!raw) continue;
    const parsed = parseAgeField(raw);
    if (parsed && !sameAsCoarseBucket(parsed, group)) return parsed;
  }

  if (product.description) {
    const fromDescription = explicitFromDescription(product.description);
    if (fromDescription && !sameAsCoarseBucket(fromDescription, group)) {
      return fromDescription;
    }
  }

  if (product.ageRange) {
    const parsed = parseAgeField(product.ageRange);
    if (parsed && !sameAsCoarseBucket(parsed, group)) return parsed;
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

/**
 * Badge and sentence label. Specific disciplines win. GENERAL and empty
 * values are omitted (`null`) unless another recognized label is available.
 * Unrecognized category names (already Romanian, or a real category) pass
 * through when stem discipline does not name a specific subject.
 */
export function disciplineBadgeLabel(
  stemDiscipline?: string | null,
  categoryName?: string | null
): string | null {
  const stem = mapStemToken(stemDiscipline);
  if (stem.recognized && stem.label) return stem.label;

  const category = mapStemToken(categoryName);
  if (category.recognized) return category.label;

  if (!stem.recognized && categoryName?.trim()) return categoryName.trim();
  return null;
}

export function resolveProductAgeChip(
  product: AgeChipProduct
): AgeChip | null {
  const group = product.ageGroup ? AGE_GROUPS[product.ageGroup] : undefined;
  const explicit = resolveExplicitAge(product, group);

  if (explicit) {
    const contradicts = Boolean(group && !isInsideGroup(explicit, group));
    return {
      label: explicit.label,
      source: "explicit",
      contradictsCoarseGroup: contradicts,
    };
  }

  if (product.ageRange) {
    const parsed = parseAgeField(product.ageRange);
    if (parsed) {
      return {
        label: parsed.label,
        source: "explicit",
        contradictsCoarseGroup: Boolean(group && !isInsideGroup(parsed, group)),
      };
    }
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
