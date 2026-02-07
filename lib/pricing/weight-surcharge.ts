/**
 * Weight-based surcharge for packages over a threshold.
 *
 * Used to recover extra delivery cost for heavy packages without showing
 * a separate "heavy package fee" at checkout (which can discourage customers).
 * The surcharge is baked into the product price instead.
 */

export const WEIGHT_SURCHARGE_CONFIG = {
  /** Weight threshold in kg - packages above this get the surcharge */
  thresholdKg: 2,
  /** Surcharge amount in RON (≈2 EUR) */
  surchargeRon: 10,
} as const;

/**
 * Parse weight from Boribon format (e.g. "1.5 kg", "0.45 kg", "1 kg").
 * Returns weight in kg or null if unparseable.
 */
export function parseWeightKg(value: string | undefined): number | null {
  if (!value || typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  // Match number (with optional decimal) followed by optional "kg"
  const match = trimmed.match(/^([\d.,]+)\s*(?:kg)?$/i);
  if (!match) return null;

  const num = parseFloat(match[1].replace(",", "."));
  return Number.isFinite(num) ? num : null;
}

/**
 * Get weight surcharge for a given weight.
 * Returns surcharge in RON if weight > threshold, else 0.
 */
export function getWeightSurchargeRon(
  weightKg: number | null,
  config = WEIGHT_SURCHARGE_CONFIG
): number {
  if (weightKg == null || !Number.isFinite(weightKg)) return 0;
  return weightKg > config.thresholdKg ? config.surchargeRon : 0;
}

/**
 * Apply weight surcharge to a base price.
 * Returns basePrice + surcharge if weight > threshold.
 */
export function applyWeightSurcharge(
  basePrice: number,
  weightKg: number | null,
  config = WEIGHT_SURCHARGE_CONFIG
): number {
  const surcharge = getWeightSurchargeRon(weightKg, config);
  return basePrice + surcharge;
}
