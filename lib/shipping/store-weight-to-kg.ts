/**
 * Converts catalog `Product.weight` from store `weightUnit` to kilograms for couriers and pricing.
 */

export const DEFAULT_PRODUCT_WEIGHT_KG = 1;

const LB_TO_KG = 0.45359237;
const OZ_TO_KG = 0.0283495231;

/** Normalize StoreSettings.weightUnit (and common aliases) to a canonical code. */
export function normalizeStoreWeightUnit(raw: string | null | undefined): string {
  if (!raw || typeof raw !== "string") return "kg";
  const u = raw.trim().toLowerCase();
  if (u === "g" || u === "gram" || u === "grams") return "g";
  if (u === "kg" || u === "kilogram" || u === "kilograms") return "kg";
  if (u === "lb" || u === "lbs" || u === "pound" || u === "pounds") return "lb";
  if (u === "oz" || u === "ounce" || u === "ounces") return "oz";
  return u;
}

/**
 * Interpret a single product's stored weight as kilograms.
 * Missing or invalid stored values become {@link DEFAULT_PRODUCT_WEIGHT_KG}.
 */
export function productStoredWeightToKg(
  stored: number | null | undefined,
  weightUnit: string | null | undefined
): number {
  if (stored === null || stored === undefined || Number.isNaN(stored)) {
    return DEFAULT_PRODUCT_WEIGHT_KG;
  }

  const unit = normalizeStoreWeightUnit(weightUnit);
  let kg: number;

  switch (unit) {
    case "g":
      kg = stored / 1000;
      break;
    case "kg":
      kg = stored;
      break;
    case "lb":
      kg = stored * LB_TO_KG;
      break;
    case "oz":
      kg = stored * OZ_TO_KG;
      break;
    default:
      kg = stored;
      break;
  }

  if (!Number.isFinite(kg) || kg <= 0) {
    return DEFAULT_PRODUCT_WEIGHT_KG;
  }

  return kg;
}
