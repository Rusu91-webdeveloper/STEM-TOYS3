import {
  calculateBufferedRetailPrice,
  calculateDropshippingPrice,
} from "@/lib/pricing/dropshipping-pricing";

describe("calculateBufferedRetailPrice", () => {
  it("applies a simple extra buffer on top of supplier retail price", () => {
    const result = calculateBufferedRetailPrice({
      supplierRetailPrice: 30,
      extraBufferPercentage: 0.2,
    });

    expect(result.targetPrice).toBe(36);
    expect(result.displayPrice).toBe(36);
    expect(result.extraBufferAmount).toBe(6);
    expect(result.extraBufferPercentage).toBe(20);
  });

  it("raises the display price to preserve the buffered retail target after a planned coupon", () => {
    const result = calculateBufferedRetailPrice({
      supplierRetailPrice: 30,
      extraBufferPercentage: 0.2,
      plannedDiscountPercentage: 0.1,
    });

    expect(result.targetPrice).toBe(36);
    expect(result.displayPrice).toBe(40);
    expect(result.plannedDiscountPercentage).toBe(10);
  });
});

describe("calculateDropshippingPrice", () => {
  it("keeps the existing dropshipping formula intact", () => {
    const result = calculateDropshippingPrice({
      cogs: 100,
      shipping: 15,
      codFee: 0,
      targetMargin: 0.25,
    });

    expect(result.finalPrice).toBeGreaterThan(150);
    expect(result.marginPercentage).toBeCloseTo(25, 2);
  });
});
