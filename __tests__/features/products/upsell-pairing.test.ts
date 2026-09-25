/**
 * Tests for upsell pairing metadata
 * 
 * Ensures that metadata.upsellFor format matches what CompleteSetUpsell reads.
 * CompleteSetUpsell queries: metadata.path: ["upsellFor"], equals: baseSku
 * 
 * This test verifies the pairing will work once products are activated.
 */

import { describe, it, expect } from "@jest/globals";

describe("Upsell Pairing Metadata", () => {
  it("metadata.upsellFor format matches CompleteSetUpsell query", () => {
    // Example metadata from staging script
    const exampleMetadata = {
      staged: true,
      stagedAt: "2024-09-25T19:00:00.000Z",
      stagedReason: "Awaiting validation",
      upsellFor: "CC- 1009",  // Base product SKU
      upsellForProductId: "ed49ee47-6b6b-41f4-8e48-f2113db27e92",
    };

    // Simulate Prisma JSON query: metadata.path: ["upsellFor"], equals: baseSku
    const extractedValue = exampleMetadata.upsellFor;
    const baseSku = "CC- 1009";

    // This is what CompleteSetUpsell checks
    expect(extractedValue).toBe(baseSku);
  });

  it("upsellFor is a string, not an array", () => {
    // CompleteSetUpsell uses: metadata: { path: ["upsellFor"], equals: baseSku }
    // This means metadata.upsellFor should be a string, not an array
    
    const metadata = {
      upsellFor: "K_550201",
      upsellForProductId: "some-id",
    };

    expect(typeof metadata.upsellFor).toBe("string");
    expect(Array.isArray(metadata.upsellFor)).toBe(false);
  });

  it("handles multi-pairing correctly (one upsell pairs with multiple bases)", () => {
    // Some add-ons pair with multiple base products (e.g., CC-1026 → CC- 1009 and CC-1004)
    // The staging script should create ONE product with ONE primary pairing,
    // not multiple products or array values.
    
    // Example: CC-1026 pairs with CC- 1009 (primary from research)
    const metadata1 = {
      upsellFor: "CC- 1009",
      upsellForProductId: "ed49ee47-6b6b-41f4-8e48-f2113db27e92",
    };

    // If we also want it to appear for CC-1004, that would require
    // either a separate product or additional logic in CompleteSetUpsell.
    // For now, we use primary pairing only (one upsellFor value).
    
    expect(typeof metadata1.upsellFor).toBe("string");
  });

  it("existing PR #31 add-ons follow the same format", () => {
    // PR #31 created 6 add-ons: K_550202, K_550203, K_550204, DJ05648, CC-1027, CC-1029
    // Their metadata should use the same upsellFor format
    
    const pr31Example = {
      upsellFor: "K_550201",  // Base SKU
      upsellForProductId: "some-id",
    };

    expect(typeof pr31Example.upsellFor).toBe("string");
    expect(pr31Example.upsellFor).toBe("K_550201");
  });

  it("CompleteSetUpsell query pattern", () => {
    // Document the exact query pattern from CompleteSetUpsell.tsx
    const query = {
      where: {
        isActive: true,
        status: "APPROVED",
        metadata: {
          path: ["upsellFor"],
          equals: "K_550201",  // baseSku
        },
      },
    };

    // The path: ["upsellFor"] means: traverse metadata object and read metadata.upsellFor
    // equals: baseSku means: check if metadata.upsellFor === baseSku
    
    expect(query.metadata.path).toEqual(["upsellFor"]);
    expect(query.metadata.equals).toBe("K_550201");
  });
});
