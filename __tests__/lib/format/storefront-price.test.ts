import { formatDeliveryWindow } from "@/lib/format/delivery-window";
import { formatStorefrontPrice } from "@/lib/format/storefront-price";

describe("formatStorefrontPrice", () => {
  it("formats lei with Romanian decimals", () => {
    const expected = `${new Intl.NumberFormat("ro-RO", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(168)} lei`;
    expect(formatStorefrontPrice(168)).toBe(expected);
    expect(formatStorefrontPrice(168)).toBe("168,00 lei");
    expect(formatStorefrontPrice(123.45)).toBe("123,45 lei");
    expect(formatStorefrontPrice(1206)).toMatch(/1[\s.\u00a0\u202f]?206,00 lei/);
  });

  it("treats non-finite amounts as zero", () => {
    expect(formatStorefrontPrice(Number.NaN)).toBe("0,00 lei");
  });

  it("does not use a currency code in the shopper string", () => {
    expect(formatStorefrontPrice(206)).not.toContain("RON");
    expect(formatStorefrontPrice(206)).not.toContain(".");
  });
});

describe("formatDeliveryWindow", () => {
  it("turns 24-72h into the Romanian shopper label", () => {
    expect(formatDeliveryWindow("24-72h")).toBe("24–72 h");
    expect(formatDeliveryWindow("24-48h", "en")).toBe("24-48h");
    expect(formatDeliveryWindow("24h")).toBe("24 h");
  });
});
