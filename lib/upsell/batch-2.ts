/**
 * Pure functions for upsell batch 2 staging logic
 * 
 * Extracted from scripts/stage-upsell-batch-2.ts for testability.
 */

export interface CandidateRow {
  supplier: string;
  base_sku: string;
  base_title: string;
  candidate_sku: string;
  candidate_title: string;
  feed_price: string;
  suggested_retail_if_known: string;
  stock: string;
  has_images: string;
  image_count: string;
  has_description: string;
  fit_reason: string;
  confidence: string;
}

export interface ValidationResult {
  sku: string;
  name: string;
  supplier: "Boribon" | "Kidstory";
  baseSku: string;
  baseSkus?: string[];
  status: "create" | "skip" | "reject";
  reason?: string;
  feedPrice?: number;
  feedStock?: number | string;
  images?: string[];
  description?: string;
  categoryId?: string;
  brand?: string;
  ean?: string;
  age?: string;
  ageGroup?: string | null;
}

/**
 * Filter CSV rows to high/medium confidence, case-insensitive
 * Accept "med" as synonym for "medium"
 * Exclude already-installed SKUs from PR #31
 */
export function filterCandidatesByConfidence(
  rows: CandidateRow[],
  excludedSkus: string[]
): CandidateRow[] {
  return rows.filter(row => {
    const confidence = row.confidence?.toLowerCase() || "";
    const isHighOrMed = confidence === "high" || confidence === "medium" || confidence === "med";
    return isHighOrMed && !excludedSkus.includes(row.candidate_sku);
  });
}

/**
 * Deduplicate validation results by candidate SKU, merging base SKUs into arrays
 * when a candidate pairs with multiple base products.
 */
export function deduplicateResults(results: ValidationResult[]): ValidationResult[] {
  const dedupedMap = new Map<string, ValidationResult>();
  
  for (const result of results) {
    const existing = dedupedMap.get(result.sku);
    
    if (!existing) {
      // First occurrence: initialize baseSkus array
      dedupedMap.set(result.sku, {
        ...result,
        baseSkus: [result.baseSku],
      });
    } else if (existing.status === "create" && result.status === "create") {
      // Duplicate candidate SKU - merge base SKUs
      if (!existing.baseSkus!.includes(result.baseSku)) {
        existing.baseSkus!.push(result.baseSku);
      }
    }
    // If status differs (e.g., one is "skip", one is "create"), keep the first one
  }
  
  return Array.from(dedupedMap.values());
}

/**
 * Build metadata.upsellFor value with backwards compatibility:
 * - Single base SKU: string (legacy format)
 * - Multiple base SKUs: array (new format)
 */
export function buildUpsellForValue(baseSkus: string[]): string | string[] {
  return baseSkus.length === 1 ? baseSkus[0] : baseSkus;
}
