import { BORIBON_ID } from "@/lib/suppliers/boribon/feed";
import { isCuratedSupplier } from "@/lib/suppliers/curated-stock";
import { KIDSTORY_ID } from "@/lib/suppliers/kidstory/feed";
import {
  launchSelection,
  rolloutMetadata,
  rolloutAgeGroup,
  validateRolloutIdentity,
} from "@/lib/upsell/rollout";

describe("reviewed upsell rollout", () => {
  it("repairs legacy metadata without losing editorial settings or previous pairings", () => {
    const metadata = rolloutMetadata(
      {
        merchandising: { browseHidden: true },
        upsellFor: "base-a",
        unrelated: "keep",
      },
      "Boribon",
      { sourceId: "feed-1", ean: "123" },
      ["base-b", "base-a"],
      true
    );
    expect(metadata).toMatchObject({
      merchandising: { browseHidden: true },
      unrelated: "keep",
      upsellFor: ["base-a", "base-b"],
      staged: false,
    });
    expect(isCuratedSupplier(BORIBON_ID, metadata)).toBe(true);
    expect(
      rolloutMetadata(
        metadata,
        "Boribon",
        { sourceId: "feed-1", ean: "123" },
        ["base-b"],
        true
      )
    ).toEqual(metadata);
  });
  it("recognizes Kidstory add-ons for freshness enforcement", () => {
    const metadata = rolloutMetadata(
      null,
      "Kidstory",
      { inventoryMode: "supplier-availability", checkoutCapacity: 1 },
      ["base"],
      false
    );
    expect(isCuratedSupplier(KIDSTORY_ID, metadata)).toBe(true);
    expect(metadata.upsellFor).toBe("base");
    expect(metadata.staged).toBe(true);
  });
  it("rejects reused SKUs and mismatched supplier mappings", () => {
    const product = {
      id: "p1",
      sku: "sku",
      supplierId: "supplier",
      barcode: "ean",
    };
    expect(() =>
      validateRolloutIdentity("sku", "other", "ean", product, undefined)
    ).toThrow("identity conflict");
    expect(() =>
      validateRolloutIdentity("sku", "supplier", "ean", product, {
        productId: "other",
      })
    ).toThrow("mapping conflict");
    expect(() =>
      validateRolloutIdentity("sku", "supplier", "ean", product, {
        productId: "p1",
      })
    ).not.toThrow();
    expect(() =>
      validateRolloutIdentity("sku", "supplier", "ean", undefined, {
        productId: "p1",
      })
    ).toThrow();
  });
  it("derives Boribon age bands and refuses missing ages on new records", () => {
    expect(rolloutAgeGroup("6 - 9 ani, 9 - 12 ani", null)).toBe(
      "ELEMENTARY_6_8"
    );
    expect(rolloutAgeGroup("", "PRESCHOOL_3_5")).toBe("PRESCHOOL_3_5");
    expect(() => rolloutAgeGroup("", null)).toThrow();
  });
  it("keeps the initial six, excludes deferred Air Toobz and includes multi-base pairings", () => {
    const skus = launchSelection.map(p => p.sku);
    expect(new Set(skus).size).toBe(skus.length);
    expect(skus).toEqual(
      expect.arrayContaining([
        "K_550202",
        "K_550203",
        "K_550204",
        "DJ05648",
        "CC-1027",
        "CC-1029",
      ])
    );
    expect(skus).not.toEqual(expect.arrayContaining(["F4641DT", "F5311ML"]));
    expect(launchSelection.find(p => p.sku === "PP4185")?.baseSkus).toEqual([
      "PP3989",
      "PP4105",
    ]);
  });
});
