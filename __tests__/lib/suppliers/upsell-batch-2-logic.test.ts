/**
 * Tests for upsell batch 2 staging script logic
 * 
 * Tests the pure functions: deduplication, confidence parsing, age mapping, CSV parsing, etc.
 */

import { describe, it, expect } from "@jest/globals";
import * as fs from "fs";
import * as path from "path";
import * as XLSX from "xlsx";
import {
  filterCandidatesByConfidence,
  deduplicateResults,
  buildUpsellForValue,
  type CandidateRow,
  type ValidationResult,
} from "../../../lib/upsell/batch-2";
import { mapAgeRangeToAgeGroup } from "../../../lib/suppliers/kidstory/age-mapper";

describe("Upsell Batch 2 Logic", () => {
  describe("Confidence filtering", () => {
    it("accepts 'high' as valid", () => {
      const rows: CandidateRow[] = [
        {
          supplier: "Boribon",
          base_sku: "BASE1",
          base_title: "Base Product",
          candidate_sku: "CAND1",
          candidate_title: "Candidate",
          feed_price: "100",
          suggested_retail_if_known: "100",
          stock: "10",
          has_images: "yes",
          image_count: "5",
          has_description: "yes",
          fit_reason: "Compatible",
          confidence: "high",
        },
      ];
      const filtered = filterCandidatesByConfidence(rows, []);
      expect(filtered).toHaveLength(1);
    });

    it("accepts 'medium' as valid", () => {
      const rows: CandidateRow[] = [
        {
          supplier: "Boribon",
          base_sku: "BASE1",
          base_title: "Base",
          candidate_sku: "CAND1",
          candidate_title: "Candidate",
          feed_price: "100",
          suggested_retail_if_known: "100",
          stock: "10",
          has_images: "yes",
          image_count: "5",
          has_description: "yes",
          fit_reason: "Compatible",
          confidence: "medium",
        },
      ];
      const filtered = filterCandidatesByConfidence(rows, []);
      expect(filtered).toHaveLength(1);
    });

    it("accepts 'med' as synonym for medium", () => {
      const rows: CandidateRow[] = [
        {
          supplier: "Boribon",
          base_sku: "BASE1",
          base_title: "Base",
          candidate_sku: "CAND1",
          candidate_title: "Candidate",
          feed_price: "100",
          suggested_retail_if_known: "100",
          stock: "10",
          has_images: "yes",
          image_count: "5",
          has_description: "yes",
          fit_reason: "Compatible",
          confidence: "med",
        },
      ];
      const filtered = filterCandidatesByConfidence(rows, []);
      expect(filtered).toHaveLength(1);
    });

    it("is case-insensitive", () => {
      const rows: CandidateRow[] = [
        { confidence: "HIGH" } as CandidateRow,
        { confidence: "MED" } as CandidateRow,
        { confidence: "Medium" } as CandidateRow,
      ];
      const filtered = filterCandidatesByConfidence(rows, []);
      expect(filtered).toHaveLength(3);
    });

    it("rejects 'low' confidence", () => {
      const rows: CandidateRow[] = [
        { confidence: "low", candidate_sku: "CAND1" } as CandidateRow,
      ];
      const filtered = filterCandidatesByConfidence(rows, []);
      expect(filtered).toHaveLength(0);
    });

    it("excludes already-installed SKUs", () => {
      const rows: CandidateRow[] = [
        { confidence: "high", candidate_sku: "K_550202" } as CandidateRow,
        { confidence: "high", candidate_sku: "NEW_SKU" } as CandidateRow,
      ];
      const filtered = filterCandidatesByConfidence(rows, ["K_550202"]);
      expect(filtered).toHaveLength(1);
      expect(filtered[0].candidate_sku).toBe("NEW_SKU");
    });
  });

  describe("Deduplication by candidate SKU", () => {
    it("merges duplicate SKUs with different base SKUs into array", () => {
      const rawResults: ValidationResult[] = [
        {
          sku: "CC-1026",
          name: "Set mini placi magnetice",
          supplier: "Boribon",
          baseSku: "CC- 1009",
          status: "create",
          feedPrice: 126,
        },
        {
          sku: "CC-1026",
          name: "Set mini placi magnetice",
          supplier: "Boribon",
          baseSku: "CC-1004",
          status: "create",
          feedPrice: 126,
        },
      ];

      const deduped = deduplicateResults(rawResults);

      expect(deduped).toHaveLength(1);
      expect(deduped[0].sku).toBe("CC-1026");
      expect(deduped[0].baseSkus).toEqual(["CC- 1009", "CC-1004"]);
    });

    it("keeps unique SKUs as-is", () => {
      const rawResults: ValidationResult[] = [
        {
          sku: "DJ05641",
          name: "Zig & Go Bila",
          supplier: "Boribon",
          baseSku: "DJ05640",
          status: "create",
        },
        {
          sku: "DJ05642",
          name: "Zig & Go Dring",
          supplier: "Boribon",
          baseSku: "DJ05640",
          status: "create",
        },
      ];

      const deduped = deduplicateResults(rawResults);

      expect(deduped).toHaveLength(2);
      expect(deduped[0].sku).toBe("DJ05641");
      expect(deduped[0].baseSkus).toEqual(["DJ05640"]);
      expect(deduped[1].sku).toBe("DJ05642");
      expect(deduped[1].baseSkus).toEqual(["DJ05640"]);
    });

    it("does not create duplicate entries for same baseSku", () => {
      const rawResults: ValidationResult[] = [
        {
          sku: "CC-1026",
          name: "Set mini placi magnetice",
          supplier: "Boribon",
          baseSku: "CC- 1009",
          status: "create",
        },
        {
          sku: "CC-1026",
          name: "Set mini placi magnetice",
          supplier: "Boribon",
          baseSku: "CC- 1009", // Same base SKU
          status: "create",
        },
      ];

      const deduped = deduplicateResults(rawResults);

      expect(deduped).toHaveLength(1);
      expect(deduped[0].baseSkus).toEqual(["CC- 1009"]); // Not ["CC- 1009", "CC- 1009"]
    });
  });

  describe("Kidstory age mapping (uses YOUNGEST band)", () => {
    it('maps "3-5 ani" to PRESCHOOL_3_5', () => {
      expect(mapAgeRangeToAgeGroup("3-5 ani")).toBe("PRESCHOOL_3_5");
    });

    it('maps "5-7 ani" to PRESCHOOL_3_5 (youngest age is 5)', () => {
      expect(mapAgeRangeToAgeGroup("5-7 ani")).toBe("PRESCHOOL_3_5");
    });

    it('maps "6-8 ani" to ELEMENTARY_6_8', () => {
      expect(mapAgeRangeToAgeGroup("6-8 ani")).toBe("ELEMENTARY_6_8");
    });

    it('maps "10 ani+" to MIDDLE_SCHOOL_9_12', () => {
      expect(mapAgeRangeToAgeGroup("10 ani+")).toBe("MIDDLE_SCHOOL_9_12");
    });

    it('maps "13+" to TEENS_13_PLUS', () => {
      expect(mapAgeRangeToAgeGroup("13+")).toBe("TEENS_13_PLUS");
    });

    it('maps "1-3 ani" to TODDLERS_1_3', () => {
      expect(mapAgeRangeToAgeGroup("1-3 ani")).toBe("TODDLERS_1_3");
    });

    it('maps multi-range "3-5 ani, 5-7 ani" to PRESCHOOL_3_5 (youngest is 3)', () => {
      expect(mapAgeRangeToAgeGroup("3-5 ani, 5-7 ani")).toBe("PRESCHOOL_3_5");
    });

    it("returns null for invalid age strings", () => {
      expect(mapAgeRangeToAgeGroup("unknown")).toBe(null);
      expect(mapAgeRangeToAgeGroup("")).toBe(null);
      expect(mapAgeRangeToAgeGroup(null)).toBe(null);
      expect(mapAgeRangeToAgeGroup(undefined)).toBe(null);
    });
  });

  describe("Metadata format for product creation", () => {
    it("uses string format for single base SKU", () => {
      const baseSkusToQuery = ["DJ05640"];
      const upsellForValue = buildUpsellForValue(baseSkusToQuery);

      expect(typeof upsellForValue).toBe("string");
      expect(upsellForValue).toBe("DJ05640");
    });

    it("uses array format for multiple base SKUs", () => {
      const baseSkusToQuery = ["CC- 1009", "CC-1004"];
      const upsellForValue = buildUpsellForValue(baseSkusToQuery);

      expect(Array.isArray(upsellForValue)).toBe(true);
      expect(upsellForValue).toEqual(["CC- 1009", "CC-1004"]);
    });
  });

  describe("CSV parsing and deduplication (real data)", () => {
    it("parses committed CSV and finds 48 high/med rows", () => {
      const csvPath = path.join(process.cwd(), "data/upsell/upsell-candidates-batch-2.csv");
      
      if (!fs.existsSync(csvPath)) {
        console.warn("Skipping CSV test: file not found");
        return;
      }

      const csvContent = fs.readFileSync(csvPath, "utf-8");
      const workbook = XLSX.read(csvContent, { type: "string", raw: false });
      const rows = XLSX.utils.sheet_to_json<CandidateRow>(
        workbook.Sheets[workbook.SheetNames[0]],
        { raw: false }
      );

      // Exclude PR #31 SKUs
      const excludedSkus = ["K_550202", "K_550203", "K_550204", "DJ05648", "CC-1027", "CC-1029"];
      const filtered = filterCandidatesByConfidence(rows, excludedSkus);

      expect(filtered.length).toBe(48); // 11 high + 37 med
    });

    it("deduplicates to 43 unique SKUs with 5 merged pairs", () => {
      const csvPath = path.join(process.cwd(), "data/upsell/upsell-candidates-batch-2.csv");
      
      if (!fs.existsSync(csvPath)) {
        console.warn("Skipping CSV test: file not found");
        return;
      }

      const csvContent = fs.readFileSync(csvPath, "utf-8");
      const workbook = XLSX.read(csvContent, { type: "string", raw: false });
      const rows = XLSX.utils.sheet_to_json<CandidateRow>(
        workbook.Sheets[workbook.SheetNames[0]],
        { raw: false }
      );

      const excludedSkus = ["K_550202", "K_550203", "K_550204", "DJ05648", "CC-1027", "CC-1029"];
      const filtered = filterCandidatesByConfidence(rows, excludedSkus);

      // Simulate validation results (all "create" status)
      const mockResults: ValidationResult[] = filtered.map(row => ({
        sku: row.candidate_sku,
        name: row.candidate_title,
        supplier: row.supplier as "Boribon" | "Kidstory",
        baseSku: row.base_sku,
        status: "create",
      }));

      const deduped = deduplicateResults(mockResults);

      expect(deduped.length).toBe(43); // 48 - 5 duplicates = 43 unique

      // Verify the 5 known duplicate SKUs have multiple base SKUs
      const duplicates = [
        { sku: "CC-1026", bases: ["CC- 1009", "CC-1004"] },
        { sku: "G_7445", bases: ["G_7268", "G_7449"] },
        { sku: "MR_712432", bases: ["MR_712031", "TB_160285"] },
        { sku: "4M-03479", bases: ["4M-03299", "4M-05545"] },
        { sku: "PP4185", bases: ["PP3989", "PP4105"] },
      ];

      for (const { sku, bases } of duplicates) {
        const result = deduped.find(r => r.sku === sku);
        expect(result).toBeDefined();
        expect(result?.baseSkus).toEqual(expect.arrayContaining(bases));
        expect(result?.baseSkus?.length).toBe(bases.length);
      }
    });
  });
});
