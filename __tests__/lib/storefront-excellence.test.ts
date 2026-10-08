import source from "@/docs/audits/2026-10-06-catalog-editorial-source.json";
import { reviewedCatalog } from "@/lib/products/catalog-editorial";
import { toGiftProduct, selectGifts } from "@/lib/products/gift-finder";
import { toShopperProduct } from "@/lib/products/public-shopper";
import { resolveProductAgeChip } from "@/lib/products/romanian-catalog";
import { matchesProductSearch } from "@/lib/products/search";
import { buildMerchantFeed } from "@/lib/seo/merchant-feed";
import { validGtin } from "@/lib/seo/product-identifiers";
import { DEFAULT_COURIERS } from "@/lib/shipping/couriers";
import { productDeliveryEstimate } from "@/lib/shipping/product-delivery";
import type { Product } from "@/types/product";

const product = (id = source.products[0].id): Product =>
  toShopperProduct({
    ...source.products.find(p => p.id === id)!,
    price: 150,
    stockQuantity: 5,
    reservedQuantity: 0,
    featured: false,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    images: ["/images/toy.webp"],
    tags: [],
  } as Product);
const shipping = {
  couriers: DEFAULT_COURIERS,
  deliveryPrice: { active: true, price: "19.99" },
  freeThreshold: { active: true, price: "500" },
};

it("gives every reviewed product its own contents, preparation, age and safety without changing commerce", () => {
  for (const copy of reviewedCatalog.products) {
    const projected = product(copy.id);
    expect(projected.buyingGuide).toMatchObject({
      brand: copy.brand,
      age: copy.age,
      contents: copy.contents,
      safety: copy.warning,
    });
    expect(projected.buyingGuide?.preparation).toBeTruthy();
    expect(projected.price).toBe(150);
    expect(projected.stockQuantity).toBe(5);
  }
});

it("keeps supervision and independent-use qualifications in the age chip", () => {
  const glove = reviewedCatalog.products.find(p => p.slug.includes("g_7080"))!;
  const projected = product(glove.id);
  expect(resolveProductAgeChip(projected)?.label).toMatch(/8.*ajutor.*10/i);
});

it("finds Romanian products without diacritics and independently of word order", () => {
  const p = {
    ...product(),
    name: "Mănușă robotică",
    description: "Construiește mecanisme",
    tags: [],
  };
  expect(matchesProductSearch(p, "robotica manusa")).toBe(true);
  expect(matchesProductSearch(p, "manusa microscop")).toBe(false);
});

it("does not recommend missing, hidden or dependent products as standalone gifts", () => {
  const p = product();
  expect(toGiftProduct({ ...p, stockQuantity: 0 })).toBeNull();
  expect(toGiftProduct({ ...p, tags: ["upsell"] })).toBeNull();
  expect(toGiftProduct({ ...p, buyingGuide: undefined })).toBeNull();
  expect(toGiftProduct({ ...p, name: "Extensie pentru set" })).toBeNull();
  expect(
    toGiftProduct({
      ...p,
      buyingGuide: { ...p.buyingGuide!, preparation: "Necesită set de bază" },
    })
  ).toBeNull();
});

it("never relaxes manufacturer minimum age, interest or budget for recommendations", () => {
  const gift = {
    ...toGiftProduct(product())!,
    minimumAge: 8,
    price: 150,
    interests: ["science" as const],
  };
  expect(
    selectGifts([gift], { age: 6, budget: 500, interest: "science" })
  ).toEqual([]);
  expect(selectGifts([gift], { age: 8, budget: 100, interest: "any" })).toEqual(
    []
  );
  expect(
    selectGifts([gift], { age: 8, budget: 500, interest: "logic" })
  ).toEqual([]);
  expect(
    selectGifts([gift], { age: 8, budget: 150, interest: "science" })
  ).toEqual([gift]);
  expect(
    selectGifts([gift], { age: NaN, budget: 500, interest: "any" })
  ).toEqual([]);
});

it("uses enabled courier prices with checkout precedence and the configured free-shipping threshold", () => {
  expect(productDeliveryEstimate(product(), shipping).methods).toEqual([
    { name: "FanCourier Standard", price: 19.99, prepaid: false },
    { name: "FanCourier FANbox", price: 19.99, prepaid: true },
  ]);
  const override = {
    ...shipping,
    couriers: [
      {
        ...DEFAULT_COURIERS[0],
        services: [
          { ...DEFAULT_COURIERS[0].services[0], priceOverride: "24.5" },
        ],
      },
    ],
  };
  expect(productDeliveryEstimate(product(), override).methods[0].price).toBe(
    24.5
  );
  expect(
    productDeliveryEstimate({ ...product(), price: 500 }, override).methods[0]
      .price
  ).toBe(0);
  expect(
    productDeliveryEstimate(product(), { ...override, couriers: [] }).methods
  ).toEqual([]);
});

it("avoids parcel estimates for digital/bundle/unavailable products and overweight lockers", () => {
  for (const update of [
    { isBook: true },
    { isBundle: true },
    { stockQuantity: 0 },
  ])
    expect(
      productDeliveryEstimate({ ...product(), ...update }, shipping).methods
    ).toEqual([]);
  expect(
    productDeliveryEstimate({ ...product(), weight: 21 }, shipping).methods.map(
      m => m.prepaid
    )
  ).toEqual([false]);
  const invalid = {
    ...shipping,
    couriers: [
      {
        ...DEFAULT_COURIERS[0],
        services: [
          { ...DEFAULT_COURIERS[0].services[0], priceOverride: "bad" },
        ],
      },
    ],
  };
  expect(productDeliveryEstimate(product(), invalid).methods).toEqual([]);
});

it("publishes only browseable stock, canonical URLs, actual RON prices and safely escaped product facts", () => {
  const p = { ...product(), name: "A & B <kit>", barcode: "4006381333931" };
  const xml = buildMerchantFeed(
    [p, { ...p, id: "hidden", stockQuantity: 0 }],
    shipping
  );
  expect(xml.match(/<item>/g)).toHaveLength(1);
  expect(xml).toContain("A &amp; B &lt;kit&gt;");
  expect(xml).toContain("<g:price>150.00 RON</g:price>");
  expect(xml).toContain("https://www.techtots.ro/products/");
  expect(xml).toContain("<g:gtin>4006381333931</g:gtin>");
  expect(xml).not.toContain("supplierId");
  expect(xml).not.toContain("identifier_exists");
});

it("never publishes an invalid or fabricated GTIN", () => {
  expect(validGtin("4006381333931")).toBe("4006381333931");
  for (const raw of [
    "4006381333932",
    "0000000000000",
    "sku-123",
    "12345",
    null,
  ])
    expect(validGtin(raw)).toBeNull();
  expect(
    buildMerchantFeed([{ ...product(), barcode: "sku-123" }], shipping)
  ).not.toContain("<g:gtin>");
});

it("keeps adult participation visible for a geode rather than showing only the minimum age", () => {
  const copy = reviewedCatalog.products.find(p => p.slug.includes("03925"))!;
  expect(resolveProductAgeChip(product(copy.id))?.label).toContain("adult");
});
