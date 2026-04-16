import {
  DEFAULT_PRODUCT_WEIGHT_KG,
  productStoredWeightToKg,
} from "@/lib/shipping/store-weight-to-kg";

describe("productStoredWeightToKg", () => {
  it("converts grams to kg", () => {
    expect(productStoredWeightToKg(500, "g")).toBe(0.5);
    expect(productStoredWeightToKg(2000, "g")).toBe(2);
  });

  it("returns default kg when weight is null or invalid", () => {
    expect(productStoredWeightToKg(null, "kg")).toBe(DEFAULT_PRODUCT_WEIGHT_KG);
    expect(productStoredWeightToKg(undefined, "g")).toBe(DEFAULT_PRODUCT_WEIGHT_KG);
    expect(productStoredWeightToKg(Number.NaN, "kg")).toBe(DEFAULT_PRODUCT_WEIGHT_KG);
    expect(productStoredWeightToKg(0, "kg")).toBe(DEFAULT_PRODUCT_WEIGHT_KG);
    expect(productStoredWeightToKg(-1, "g")).toBe(DEFAULT_PRODUCT_WEIGHT_KG);
  });

  it("passes through kg when unit is kg", () => {
    expect(productStoredWeightToKg(1.5, "kg")).toBe(1.5);
  });
});
