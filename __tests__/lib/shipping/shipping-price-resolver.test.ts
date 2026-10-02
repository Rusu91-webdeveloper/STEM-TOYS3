import {
  resolveShippingPrice,
  checkFreeShipping,
} from "@/lib/shipping/shipping-price-resolver";

describe("resolveShippingPrice", () => {
  it("returns null when deliveryPrice is missing", () => {
    const result = resolveShippingPrice({});
    expect(result).toEqual({ price: null, source: "missing" });
  });

  it("returns null when deliveryPrice is inactive", () => {
    const result = resolveShippingPrice({
      deliveryPrice: { price: "15.00", active: false },
    });
    expect(result).toEqual({ price: null, source: "missing" });
  });

  it("returns null when deliveryPrice.price is empty", () => {
    const result = resolveShippingPrice({
      deliveryPrice: { price: "", active: true },
    });
    expect(result).toEqual({ price: null, source: "missing" });
  });

  it("returns null when deliveryPrice.price is invalid (NaN)", () => {
    const result = resolveShippingPrice({
      deliveryPrice: { price: "invalid", active: true },
    });
    expect(result).toEqual({ price: null, source: "missing" });
  });

  it("returns null when deliveryPrice.price is negative", () => {
    const result = resolveShippingPrice({
      deliveryPrice: { price: "-5.00", active: true },
    });
    expect(result).toEqual({ price: null, source: "missing" });
  });

  it("returns 0 when active deliveryPrice is '0'", () => {
    const result = resolveShippingPrice({
      deliveryPrice: { price: "0", active: true },
    });
    expect(result).toEqual({ price: 0, source: "admin" });
  });

  it("returns 0 when active deliveryPrice is '0.00'", () => {
    const result = resolveShippingPrice({
      deliveryPrice: { price: "0.00", active: true },
    });
    expect(result).toEqual({ price: 0, source: "admin" });
  });

  it("returns valid price when deliveryPrice is configured", () => {
    const result = resolveShippingPrice({
      deliveryPrice: { price: "15.00", active: true },
    });
    expect(result).toEqual({ price: 15, source: "admin" });
  });

  it("handles decimal prices correctly", () => {
    const result = resolveShippingPrice({
      deliveryPrice: { price: "19.99", active: true },
    });
    expect(result).toEqual({ price: 19.99, source: "admin" });
  });

  it("returns null when settings is null", () => {
    const result = resolveShippingPrice(null);
    expect(result).toEqual({ price: null, source: "missing" });
  });

  it("returns null when settings is undefined", () => {
    const result = resolveShippingPrice(undefined);
    expect(result).toEqual({ price: null, source: "missing" });
  });
});

describe("checkFreeShipping", () => {
  it("returns false when settings is null", () => {
    expect(checkFreeShipping(200, null)).toBe(false);
  });

  it("returns false when freeThreshold is inactive", () => {
    const settings = {
      freeThreshold: { price: "199", active: false },
    };
    expect(checkFreeShipping(200, settings)).toBe(false);
  });

  it("returns false when cart total is below threshold", () => {
    const settings = {
      freeThreshold: { price: "199", active: true },
    };
    expect(checkFreeShipping(150, settings)).toBe(false);
  });

  it("returns true when cart total equals threshold", () => {
    const settings = {
      freeThreshold: { price: "199", active: true },
    };
    expect(checkFreeShipping(199, settings)).toBe(true);
  });

  it("returns true when cart total exceeds threshold", () => {
    const settings = {
      freeThreshold: { price: "199", active: true },
    };
    expect(checkFreeShipping(250, settings)).toBe(true);
  });

  it("returns false when threshold price is invalid", () => {
    const settings = {
      freeThreshold: { price: "invalid", active: true },
    };
    expect(checkFreeShipping(200, settings)).toBe(false);
  });

  it("returns false when threshold is 0", () => {
    const settings = {
      freeThreshold: { price: "0", active: true },
    };
    expect(checkFreeShipping(100, settings)).toBe(false);
  });
});
