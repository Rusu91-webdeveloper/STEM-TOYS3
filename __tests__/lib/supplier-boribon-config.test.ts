import {
  BORIBON_ALLOWED_SKUS,
  BORIBON_FEEDS,
  buildBoribonMapping,
  validateBoribonConfig,
} from "@/lib/suppliers/boribon-config";

describe("Boribon supplier configuration", () => {
  it("keeps one authoritative source and exactly 77 approved SKUs", () => {
    expect(() => validateBoribonConfig()).not.toThrow();
    expect(BORIBON_FEEDS).toHaveLength(7);
    expect(new Set(BORIBON_ALLOWED_SKUS).size).toBe(77);
    expect(
      BORIBON_FEEDS.filter(
        feed =>
          "authoritativeForMissingStock" in feed &&
          feed.authoritativeForMissingStock
      )
    ).toHaveLength(1);
  });

  it("guards missing-stock zeroing with a minimum coverage threshold", () => {
    const mapping = buildBoribonMapping(true);

    expect(mapping.authoritativeForMissingStock).toBe(true);
    expect(mapping.minimumExpectedItems).toBe(70);
    expect(mapping.autoCreateProducts).toBe(false);
    expect(mapping.allowedSkus).toHaveLength(77);
  });
});
