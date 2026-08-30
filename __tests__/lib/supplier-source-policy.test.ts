import {
  assertLiveInventorySource,
  isStaticSeedSource,
} from "@/lib/suppliers/source-policy";

describe("supplier source policy", () => {
  it("recognizes the TechTots seed snapshot with or without a query string", () => {
    expect(
      isStaticSeedSource(
        "https://www.techtots.ro/supplier-feeds/enhanced_v7_clean.csv?v=1"
      )
    ).toBe(true);
    expect(isStaticSeedSource("/supplier-feeds/enhanced_v7_clean.csv")).toBe(
      true
    );
  });

  it("allows live supplier sources", () => {
    expect(isStaticSeedSource("https://supplier.example/feed.csv")).toBe(false);
    expect(() =>
      assertLiveInventorySource("https://supplier.example/feed.csv")
    ).not.toThrow();
  });

  it("rejects the static seed as a recurring source", () => {
    expect(() =>
      assertLiveInventorySource(
        "https://www.techtots.ro/supplier-feeds/enhanced_v7_clean.csv"
      )
    ).toThrow("must remain inactive");
  });
});
