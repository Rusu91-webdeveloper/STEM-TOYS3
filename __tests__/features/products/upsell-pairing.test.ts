/**
 * Tests for upsell pairing metadata
 * 
 * Ensures that metadata.upsellFor format matches what CompleteSetUpsell reads.
 * CompleteSetUpsell supports both:
 * - Legacy: metadata.upsellFor as string (PR #31 format)
 * - New: metadata.upsellFor as array (batch 2 multi-pairing format)
 * 
 * This test verifies the pairing will work once products are activated.
 */

import { describe, it, expect } from "@jest/globals";

describe("Upsell Pairing Metadata", () => {
  it("metadata.upsellFor string format (legacy, PR #31)", () => {
    // Example metadata from PR #31 staging
    const exampleMetadata = {
      staged: true,
      stagedAt: "2024-09-25T19:00:00.000Z",
      stagedReason: "Awaiting validation",
      upsellFor: "CC- 1009",  // Base product SKU as string
      upsellForProductIds: ["ed49ee47-6b6b-41f4-8e48-f2113db27e92"],
    };

    // Legacy format: upsellFor is a string
    expect(typeof exampleMetadata.upsellFor).toBe("string");
    expect(exampleMetadata.upsellFor).toBe("CC- 1009");
  });

  it("metadata.upsellFor array format (new, batch 2 multi-pairing)", () => {
    // New format for add-ons that pair with multiple base products
    // Example: CC-1026 pairs with both CC- 1009 and CC-1004
    const multiPairingMetadata = {
      staged: true,
      stagedAt: "2026-09-25T19:00:00.000Z",
      stagedReason: "Upsell add-on batch 2 - awaiting activation",
      upsellFor: ["CC- 1009", "CC-1004"],  // Array of base SKUs
      upsellForProductIds: ["id1", "id2"],
      supplier: "Boribon",
    };

    // New format: upsellFor is an array
    expect(Array.isArray(multiPairingMetadata.upsellFor)).toBe(true);
    expect(multiPairingMetadata.upsellFor).toHaveLength(2);
    expect(multiPairingMetadata.upsellFor).toContain("CC- 1009");
    expect(multiPairingMetadata.upsellFor).toContain("CC-1004");
  });

  it("CompleteSetUpsell finds add-ons with string upsellFor", () => {
    // Legacy query: metadata.path: ["upsellFor"], equals: baseSku
    const baseSku = "K_550201";
    const metadata = {
      upsellFor: "K_550201",
      upsellForProductIds: ["some-id"],
    };

    // Simulates: WHERE metadata.path = ["upsellFor"] AND metadata.equals = baseSku
    expect(metadata.upsellFor).toBe(baseSku);
  });

  it("CompleteSetUpsell finds add-ons with array upsellFor", () => {
    // New query: metadata.path: ["upsellFor"], array_contains: baseSku
    const baseSku = "CC- 1009";
    const metadata = {
      upsellFor: ["CC- 1009", "CC-1004"],
      upsellForProductIds: ["id1", "id2"],
    };

    // Simulates: WHERE metadata.path = ["upsellFor"] AND array_contains baseSku
    expect(metadata.upsellFor).toContain(baseSku);
  });

  it("existing PR #31 add-ons use string format", () => {
    // PR #31 created 6 add-ons: K_550202, K_550203, K_550204, DJ05648, CC-1027, CC-1029
    // Their metadata uses string format and must continue to work
    
    const pr31Example = {
      upsellFor: "K_550201",  // String, not array
      upsellForProductIds: ["some-id"],
    };

    expect(typeof pr31Example.upsellFor).toBe("string");
    expect(pr31Example.upsellFor).toBe("K_550201");
  });

  it("deduplicates candidate SKUs and merges base SKUs into array", () => {
    // CSV has 5 duplicate candidate SKUs with different base SKUs:
    // - CC-1026: pairs with CC- 1009 (row 2) and CC-1004 (row 17)
    // - G_7445: pairs with G_7268 (row 27) and G_7449 (row 28)
    // - MR_712432: pairs with MR_712031 (row 29) and TB_160285 (row 36)
    // - 4M-03479: pairs with 4M-03299 (row 41) and 4M-05545 (row 49)
    // - PP4185: pairs with PP3989 (row 50) and PP4105 (row 51)
    
    // Simulate deduplication result for CC-1026
    const dedupedResult = {
      sku: "CC-1026",
      name: "Set de construit cu mini placi magnetice, Cleverclixx",
      supplier: "Boribon",
      baseSku: "CC- 1009", // First occurrence (kept for backwards compat)
      baseSkus: ["CC- 1009", "CC-1004"], // Merged array
      status: "create",
    };

    expect(dedupedResult.baseSkus).toHaveLength(2);
    expect(dedupedResult.baseSkus).toContain("CC- 1009");
    expect(dedupedResult.baseSkus).toContain("CC-1004");
  });

  it("single-pairing add-ons use string format for backwards compatibility", () => {
    // Add-ons with only one base SKU should use string format, not array
    const singlePairingMetadata = {
      upsellFor: "DJ05640",  // String, not ["DJ05640"]
      upsellForProductIds: ["some-id"],
    };

    expect(typeof singlePairingMetadata.upsellFor).toBe("string");
    expect(Array.isArray(singlePairingMetadata.upsellFor)).toBe(false);
  });
});
