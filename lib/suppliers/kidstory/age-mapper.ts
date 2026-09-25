/**
 * Maps Kidstory age ranges to standard AgeGroup enum values
 * 
 * Kidstory age ranges come as Romanian strings like:
 * - "3-5 ani"
 * - "5-7 ani"  
 * - "7-10 ani"
 * - "10 ani+"
 * - "3-5 ani, 5-7 ani" (multi-range)
 * 
 * We map to the youngest applicable age band to maximize discovery.
 */

export type AgeGroup =
  | "TODDLERS_1_3"
  | "PRESCHOOL_3_5"
  | "ELEMENTARY_6_8"
  | "MIDDLE_SCHOOL_9_12"
  | "TEENS_13_PLUS";

/**
 * Parse age range string and extract numeric bounds
 * Examples: "3-5 ani" => {min: 3, max: 5}, "10 ani+" => {min: 10, max: 99}
 */
function parseAgeRange(range: string): { min: number; max: number } | null {
  const trimmed = range.trim().toLowerCase();
  
  // Match patterns like "3-5", "10+", "10 ani+"
  const rangeMatch = trimmed.match(/(\d+)\s*[-–]\s*(\d+)/);
  if (rangeMatch) {
    return {
      min: parseInt(rangeMatch[1], 10),
      max: parseInt(rangeMatch[2], 10),
    };
  }

  const plusMatch = trimmed.match(/(\d+)\s*(?:ani)?\s*\+/);
  if (plusMatch) {
    return {
      min: parseInt(plusMatch[1], 10),
      max: 99, // Arbitrary high value for "+"
    };
  }

  const singleMatch = trimmed.match(/(\d+)\s*ani?/);
  if (singleMatch) {
    const age = parseInt(singleMatch[1], 10);
    return { min: age, max: age };
  }

  return null;
}

/**
 * Maps an age range string to an AgeGroup enum value.
 * 
 * For multi-range products (e.g., "3-5 ani, 5-7 ani"), we select the youngest band
 * to maximize product discovery. A 3-year-old's parent searching "3-5" should find
 * products that span both "3-5" and "5-7".
 * 
 * Mapping rules (using youngest/minimum age):
 * - 0-2 years: TODDLERS_1_3
 * - 3-5 years: PRESCHOOL_3_5
 * - 6-8 years: ELEMENTARY_6_8
 * - 9-12 years: MIDDLE_SCHOOL_9_12
 * - 13+ years: TEENS_13_PLUS
 * 
 * @param ageRangeString - Age range from Kidstory feed (e.g., "3-5 ani", "5-7 ani, 7-10 ani")
 * @returns AgeGroup enum value, or null if unable to parse
 */
export function mapAgeRangeToAgeGroup(ageRangeString: string | null | undefined): AgeGroup | null {
  if (!ageRangeString || typeof ageRangeString !== "string") {
    return null;
  }

  // Split by comma for multi-range products
  const ranges = ageRangeString.split(/[,;]/).map(r => r.trim()).filter(Boolean);
  
  if (ranges.length === 0) {
    return null;
  }

  // Parse all ranges and find the minimum age across all ranges
  let minAge: number | null = null;

  for (const range of ranges) {
    const parsed = parseAgeRange(range);
    if (parsed) {
      if (minAge === null || parsed.min < minAge) {
        minAge = parsed.min;
      }
    }
  }

  if (minAge === null) {
    return null;
  }

  // Map minimum age to AgeGroup enum
  if (minAge >= 0 && minAge <= 2) {
    return "TODDLERS_1_3";
  } else if (minAge >= 3 && minAge <= 5) {
    return "PRESCHOOL_3_5";
  } else if (minAge >= 6 && minAge <= 8) {
    return "ELEMENTARY_6_8";
  } else if (minAge >= 9 && minAge <= 12) {
    return "MIDDLE_SCHOOL_9_12";
  }
  return "TEENS_13_PLUS";
}

/**
 * Get a human-readable explanation of the age group mapping decision
 * Useful for logging during import/backfill
 */
export function explainAgeGroupMapping(
  ageRangeString: string | null | undefined,
  result: AgeGroup | null
): string {
  if (!ageRangeString) {
    return "No age range provided";
  }
  if (!result) {
    return `Unable to parse age range: "${ageRangeString}"`;
  }

  const ranges = ageRangeString.split(/[,;]/).map(r => r.trim()).filter(Boolean);
  const parsed = ranges.map(r => parseAgeRange(r)).filter(Boolean);
  const minAge = Math.min(...parsed.map(p => p!.min));

  return `"${ageRangeString}" → min age ${minAge} → ${result}`;
}
