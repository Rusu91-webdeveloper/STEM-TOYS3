import { visibleInBrowse } from "@/lib/products/merchandising";
import { toShopperProduct } from "@/lib/products/public-shopper";
import {
  categoryLandingSlug,
  categoryPagePath,
} from "@/lib/products/stem-category";
import { normalizeStorefrontCopy } from "@/lib/products/storefront-copy";

it("never displays out-of-stock products even with an editorial exception", () => {
  const product = {
    name: "Microscop",
    slug: "microscop",
    stockQuantity: 0,
    metadata: { merchandising: { keepLowStock: true } },
  };
  expect(visibleInBrowse(product)).toBe(false);
  expect(visibleInBrowse({ ...product, stockQuantity: 1 })).toBe(true);
  expect(
    visibleInBrowse({
      ...product,
      stockQuantity: 1,
      attributes: { inventoryMode: "supplier-availability" },
    })
  ).toBe(true);
});

it("corrects Romanian copy without changing model names, numbers or HTML links", () => {
  const source =
    '<p>Kit constructie si apa</p>Descopera.Statie <a href="/apa?si=1">1200x SI KAI 4M-03460</a>';
  expect(normalizeStorefrontCopy(source)).toBe(
    '<p>Kit construcție și apă</p> Descoperă. Stație <a href="/apa?si=1">1200x SI KAI 4M-03460</a>'
  );
  expect(normalizeStorefrontCopy("jucărie &si; apă")).toBe("jucărie &si; apă");
});

it("keeps Romanian and historic category URLs on the same catalog key", () => {
  for (const [old, current] of [
    ["science", "stiinta"],
    ["technology", "tehnologie"],
    ["engineering", "inginerie"],
    ["mathematics", "matematica"],
    ["educational-books", "carti-educationale"],
  ] as const) {
    expect(categoryLandingSlug(current)).toBe(old);
    expect(categoryPagePath(old)).toBe(`/categories/${current}`);
  }
  expect(categoryLandingSlug("unknown")).toBeNull();
});

it("applies spelling corrections at the public product boundary", () => {
  const product = {
    name: "Kit roboti si logica",
    description: "Descopera apa.",
    sku: "SI-apa-1",
  };
  expect(toShopperProduct(product)).toEqual({
    ...product,
    name: "Kit roboți și logică",
    description: "Descoperă apă.",
  });
  expect(product.name).toBe("Kit roboti si logica");
});
