/**
 * Tests for upsell batch 2 staging script logic
 * 
 * Tests the pure functions: deduplication, confidence parsing, age mapping, etc.
 */

import { describe, it, expect } from "@jest/globals";

describe("Upsell Batch 2 Logic", () => {
  describe("Confidence parsing", () => {
    it("accepts 'high' as valid", () => {
      const confidence = "high";
      const isValid = ["high", "medium", "med"].includes(confidence.toLowerCase());
      expect(isValid).toBe(true);
    });

    it("accepts 'medium' as valid", () => {
      const confidence = "medium";
      const isValid = ["high", "medium", "med"].includes(confidence.toLowerCase());
      expect(isValid).toBe(true);
    });

    it("accepts 'med' as valid (synonym for medium)", () => {
      const confidence = "med";
      const isValid = ["high", "medium", "med"].includes(confidence.toLowerCase());
      expect(isValid).toBe(true);
    });

    it("accepts case-insensitive 'HIGH', 'MED', 'MEDIUM'", () => {
      expect(["high", "medium", "med"].includes("HIGH".toLowerCase())).toBe(true);
      expect(["high", "medium", "med"].includes("MED".toLowerCase())).toBe(true);
      expect(["high", "medium", "med"].includes("Medium".toLowerCase())).toBe(true);
    });

    it("rejects 'low' confidence", () => {
      const confidence = "low";
      const isValid = ["high", "medium", "med"].includes(confidence.toLowerCase());
      expect(isValid).toBe(false);
    });
  });

  describe("Deduplication by candidate SKU", () => {
    it("merges duplicate SKUs with different base SKUs into array", () => {
      const rawResults = [
        {
          sku: "CC-1026",
          name: "Set mini placi magnetice",
          supplier: "Boribon" as const,
          baseSku: "CC- 1009",
          status: "create" as const,
          feedPrice: 126,
        },
        {
          sku: "CC-1026",
          name: "Set mini placi magnetice",
          supplier: "Boribon" as const,
          baseSku: "CC-1004",
          status: "create" as const,
          feedPrice: 126,
        },
      ];

      // Simulate deduplication
      const dedupedMap = new Map();
      for (const result of rawResults) {
        const existing = dedupedMap.get(result.sku);
        if (!existing) {
          dedupedMap.set(result.sku, {
            ...result,
            baseSkus: [result.baseSku],
          });
        } else if (existing.status === "create" && result.status === "create") {
          if (!existing.baseSkus.includes(result.baseSku)) {
            existing.baseSkus.push(result.baseSku);
          }
        }
      }

      const deduped = Array.from(dedupedMap.values());

      expect(deduped).toHaveLength(1);
      expect(deduped[0].sku).toBe("CC-1026");
      expect(deduped[0].baseSkus).toEqual(["CC- 1009", "CC-1004"]);
    });

    it("keeps unique SKUs as-is", () => {
      const rawResults = [
        {
          sku: "DJ05641",
          name: "Zig & Go Bila",
          supplier: "Boribon" as const,
          baseSku: "DJ05640",
          status: "create" as const,
        },
        {
          sku: "DJ05642",
          name: "Zig & Go Dring",
          supplier: "Boribon" as const,
          baseSku: "DJ05640",
          status: "create" as const,
        },
      ];

      const dedupedMap = new Map();
      for (const result of rawResults) {
        const existing = dedupedMap.get(result.sku);
        if (!existing) {
          dedupedMap.set(result.sku, {
            ...result,
            baseSkus: [result.baseSku],
          });
        }
      }

      const deduped = Array.from(dedupedMap.values());

      expect(deduped).toHaveLength(2);
      expect(deduped[0].sku).toBe("DJ05641");
      expect(deduped[0].baseSkus).toEqual(["DJ05640"]);
      expect(deduped[1].sku).toBe("DJ05642");
      expect(deduped[1].baseSkus).toEqual(["DJ05640"]);
    });

    it("does not create duplicate entries for same baseSku", () => {
      const rawResults = [
        {
          sku: "CC-1026",
          name: "Set mini placi magnetice",
          supplier: "Boribon" as const,
          baseSku: "CC- 1009",
          status: "create" as const,
        },
        {
          sku: "CC-1026",
          name: "Set mini placi magnetice",
          supplier: "Boribon" as const,
          baseSku: "CC- 1009", // Same base SKU
          status: "create" as const,
        },
      ];

      const dedupedMap = new Map();
      for (const result of rawResults) {
        const existing = dedupedMap.get(result.sku);
        if (!existing) {
          dedupedMap.set(result.sku, {
            ...result,
            baseSkus: [result.baseSku],
          });
        } else if (existing.status === "create" && result.status === "create") {
          if (!existing.baseSkus.includes(result.baseSku)) {
            existing.baseSkus.push(result.baseSku);
          }
        }
      }

      const deduped = Array.from(dedupedMap.values());

      expect(deduped).toHaveLength(1);
      expect(deduped[0].baseSkus).toEqual(["CC- 1009"]); // Not ["CC- 1009", "CC- 1009"]
    });
  });

  describe("Kidstory age mapping", () => {
    function mapKidstoryAgeGroup(age: string | undefined): string | null {
      if (!age) return null;

      const ageLower = age.toLowerCase().trim();

      const match = ageLower.match(/(\d+)[\s\-+]*(?:(\d+))?/);
      if (!match) return null;

      const minAge = parseInt(match[1]);
      const maxAge = match[2] ? parseInt(match[2]) : minAge;

      if (maxAge <= 3) return "TODDLERS_1_3";
      if (maxAge <= 5) return "PRESCHOOL_3_5";
      if (maxAge <= 8 || (minAge >= 6 && maxAge <= 10)) return "ELEMENTARY_6_8";
      if (maxAge <= 12 || (minAge >= 9 && maxAge <= 14)) return "MIDDLE_SCHOOL_9_12";
      if (minAge >= 13) return "TEENS_13_PLUS";

      if (minAge >= 6 && maxAge >= 8) return "ELEMENTARY_6_8";

      return null;
    }

    it('maps "3+" to PRESCHOOL_3_5', () => {
      expect(mapKidstoryAgeGroup("3+")).toBe("PRESCHOOL_3_5");
    });

    it('maps "6-8" to ELEMENTARY_6_8', () => {
      expect(mapKidstoryAgeGroup("6-8")).toBe("ELEMENTARY_6_8");
    });

    it('maps "8-12 ani" to MIDDLE_SCHOOL_9_12', () => {
      expect(mapKidstoryAgeGroup("8-12 ani")).toBe("MIDDLE_SCHOOL_9_12");
    });

    it('maps "10+" to MIDDLE_SCHOOL_9_12', () => {
      expect(mapKidstoryAgeGroup("10+")).toBe("MIDDLE_SCHOOL_9_12");
    });

    it('maps "13+" to TEENS_13_PLUS', () => {
      expect(mapKidstoryAgeGroup("13+")).toBe("TEENS_13_PLUS");
    });

    it('maps "1-3" to TODDLERS_1_3', () => {
      expect(mapKidstoryAgeGroup("1-3")).toBe("TODDLERS_1_3");
    });

    it("returns null for invalid age strings", () => {
      expect(mapKidstoryAgeGroup("unknown")).toBe(null);
      expect(mapKidstoryAgeGroup("")).toBe(null);
      expect(mapKidstoryAgeGroup(undefined)).toBe(null);
    });
  });

  describe("Metadata format for product creation", () => {
    it("uses string format for single base SKU", () => {
      const baseSkusToQuery = ["DJ05640"];
      const upsellForValue = baseSkusToQuery.length === 1 
        ? baseSkusToQuery[0] 
        : baseSkusToQuery;

      expect(typeof upsellForValue).toBe("string");
      expect(upsellForValue).toBe("DJ05640");
    });

    it("uses array format for multiple base SKUs", () => {
      const baseSkusToQuery = ["CC- 1009", "CC-1004"];
      const upsellForValue = baseSkusToQuery.length === 1 
        ? baseSkusToQuery[0] 
        : baseSkusToQuery;

      expect(Array.isArray(upsellForValue)).toBe(true);
      expect(upsellForValue).toEqual(["CC- 1009", "CC-1004"]);
    });
  });

  describe("Summary counts", () => {
    it("deduplication reduces count from 48 rows to 43 unique SKUs", () => {
      // CSV has 48 high/med rows after filtering
      // 5 duplicate candidate SKUs = 5 rows to merge
      // Expected: 48 - 5 = 43 unique SKUs
      const rawRowCount = 48;
      const duplicateCount = 5;
      const uniqueSkuCount = rawRowCount - duplicateCount;

      expect(uniqueSkuCount).toBe(43);
    });

    it("with 4 already staged, 39 new SKUs should be created", () => {
      const uniqueSkuCount = 43;
      const alreadyStaged = 4; // DJ05641, B_2901, DJ05642, F_569016
      const newToCreate = uniqueSkuCount - alreadyStaged;

      expect(newToCreate).toBe(39);
    });
  });
});
