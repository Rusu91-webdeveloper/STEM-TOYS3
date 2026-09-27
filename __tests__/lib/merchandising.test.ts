import {
  applyProductContentOverride,
  GLOVE_SLUG,
} from "@/lib/products/catalog-content-overrides";
import {
  GIFT_SLUGS,
  HOMEPAGE_PRODUCT_LIMIT,
  selectHomepageGifts,
  selectHomepageProducts,
  visibleInBrowse,
} from "@/lib/products/merchandising";
const gifts = GIFT_SLUGS.map((slug, i) => ({
  slug,
  name: `Gift ${i}`,
  stockQuantity: 4,
}));
test("homepage uses editorial order, never newest fallback or low stock", () => {
  expect(selectHomepageGifts([...gifts].reverse()).map(p => p.slug)).toEqual(
    GIFT_SLUGS
  );
  expect(
    selectHomepageGifts([
      { slug: "junk", name: "Aqua refill", stockQuantity: 100 },
    ])
  ).toEqual([]);
  expect(
    selectHomepageGifts(gifts.map(p => ({ ...p, stockQuantity: 1 })))
  ).toEqual([]);
});
test("browse hides books, add-ons, broken titles and low stock with explicit keep exception", () => {
  for (const name of [
    "Air Toobz extra balls",
    "Aqua Dragons refill",
    "Fridge Rover",
    "Kit E tiintific detectiv",
  ])
    expect(visibleInBrowse({ slug: "other", name, stockQuantity: 50 })).toBe(
      false
    );
  expect(visibleInBrowse({ ...gifts[0], isBook: true })).toBe(false);
  expect(visibleInBrowse({ ...gifts[0], stockQuantity: 1 })).toBe(false);
  expect(
    visibleInBrowse({
      ...gifts[0],
      stockQuantity: 1,
      metadata: { merchandising: { keepLowStock: true } },
    })
  ).toBe(true);
});
test("homepage prefers featured in-stock products, then fills deterministically", () => {
  const products = [
    {
      slug: "z-addon",
      name: "Extensie",
      stockQuantity: 5,
      tags: ["upsell"],
      images: ["a.jpg"],
      featured: true,
    },
    {
      slug: "hidden",
      name: "Ascuns",
      stockQuantity: 5,
      metadata: { merchandising: { browseHidden: true } },
      images: ["a.jpg"],
      featured: true,
    },
    {
      slug: "low",
      name: "Mic",
      stockQuantity: 1,
      images: ["a.jpg"],
      featured: true,
    },
    {
      slug: "b-plain",
      name: "B",
      stockQuantity: 4,
      images: ["b.jpg"],
    },
    {
      slug: "a-featured",
      name: "A",
      stockQuantity: 4,
      images: ["a.jpg"],
      featured: true,
    },
    {
      slug: "c-no-image",
      name: "C",
      stockQuantity: 4,
      images: [],
    },
    {
      slug: "book",
      name: "Carte",
      stockQuantity: 9,
      isBook: true,
      images: ["book.jpg"],
      featured: true,
    },
    {
      slug: "junk",
      name: "Aqua Dragons refill",
      stockQuantity: 8,
      images: ["junk.jpg"],
    },
  ];

  expect(selectHomepageProducts(products).map(product => product.slug)).toEqual([
    "a-featured",
    "b-plain",
    "c-no-image",
  ]);
  expect(
    selectHomepageProducts([...products].reverse()).map(product => product.slug)
  ).toEqual(["a-featured", "b-plain", "c-no-image"]);
});

test("homepage fill stops at eight and never invents products", () => {
  const products = Array.from({ length: 12 }, (_, index) => ({
    slug: `produs-${String(index).padStart(2, "0")}`,
    name: `Produs ${index}`,
    stockQuantity: 6,
    images: ["photo.jpg"],
    featured: index < 2,
  }));

  const selected = selectHomepageProducts(products);
  expect(selected).toHaveLength(HOMEPAGE_PRODUCT_LIMIT);
  expect(selected.slice(0, 2).every(product => product.featured)).toBe(true);
  expect(selected.map(product => product.slug)).toEqual([
    "produs-00",
    "produs-01",
    ...Array.from({ length: 6 }, (_, index) => `produs-${String(index + 2).padStart(2, "0")}`),
  ]);
});

test("glove age survives stale cached supplier bucket without changing stock", () => {
  const product = applyProductContentOverride({
    slug: GLOVE_SLUG,
    name: "Kit STEM Mănușă robotică",
    stockQuantity: 4,
    ageGroup: "ELEMENTARY_6_8",
  } as any);
  expect(product.ageRange).toBe("8+");
  expect(product.ageGroup).toBe("MIDDLE_SCHOOL_9_12");
  expect(product.stockQuantity).toBe(4);
});
