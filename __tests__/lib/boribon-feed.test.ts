import {
  selectBoribonProducts,
  portfolio,
  boribonStockIsFresh,
  BORIBON_MAX_AGE_MS,
} from "@/lib/suppliers/boribon/feed";
const rows = () =>
  portfolio.map(p => ({
    id: p.sourceId,
    model: p.model,
    sku: p.ean,
    price_b2c: "206",
    price_b2b: "",
    quantity: "12",
  }));
describe("curated Boribon feed", () => {
  it("selects exactly 63 identities and accepts B2C without invented purchase cost", () => {
    const result = selectBoribonProducts(rows());
    expect(result).toHaveLength(63);
    expect(
      result.every(p => p.valid && p.price === 206 && p.stock === 12)
    ).toBe(true);
  });
  it("does not match a reused model to a different EAN", () => {
    const source = rows();
    source[0].sku = "different";
    expect(selectBoribonProducts(source)[0]).toMatchObject({
      valid: false,
      stock: 0,
    });
  });
  it("fails closed on duplicate identities and missing products", () => {
    const source = rows();
    source.push(source[0]);
    source.splice(1, 1);
    const result = selectBoribonProducts(source);
    expect(result[0].valid).toBe(false);
    expect(result[1].stock).toBe(0);
  });
  it.each(["", "garbage", "-1", "1.5"])(
    "rejects invalid stock %s",
    quantity => {
      const source = rows();
      source[0].quantity = quantity;
      expect(selectBoribonProducts(source)[0]).toMatchObject({
        valid: false,
        stock: 0,
      });
    }
  );
  it("accepts zero stock and decimal-comma B2C exactly", () => {
    const source = rows();
    source[0].quantity = "0";
    source[0].price_b2c = "206,25";
    expect(selectBoribonProducts(source)[0]).toMatchObject({
      valid: true,
      price: 206.25,
      stock: 0,
    });
  });
  it.each(["", "0", "-50", "NaN"])("rejects unusable B2C %s", price => {
    const source = rows();
    source[0].price_b2c = price;
    expect(selectBoribonProducts(source)[0].valid).toBe(false);
  });
  it("rejects stale, missing and future timestamps", () => {
    const now = Date.now();
    expect(boribonStockIsFresh(new Date(now - 60000), now)).toBe(true);
    for (const value of [
      null,
      "invalid",
      new Date(now + 1),
      new Date(now - BORIBON_MAX_AGE_MS),
    ])
      expect(boribonStockIsFresh(value, now)).toBe(false);
  });
});
