import {
  GIFT_SLUGS,
  selectHomepageGifts,
  visibleInBrowse,
} from "@/lib/products/merchandising";
import { applyProductContentOverride } from "@/lib/products/catalog-content-overrides";
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
test("glove age survives stale cached supplier bucket without changing stock", () => {
  const product = applyProductContentOverride({
    ...gifts[1],
    ageGroup: "ELEMENTARY_6_8",
  } as any);
  expect(product.ageRange).toBe("8+");
  expect(product.ageGroup).toBe("MIDDLE_SCHOOL_9_12");
  expect(product.stockQuantity).toBe(4);
});
