import source from "@/docs/audits/2026-10-06-catalog-editorial-source.json";
import {
  applyReviewedCatalogCopy,
  reviewedCatalog,
} from "@/lib/products/catalog-editorial";
import { toShopperProduct } from "@/lib/products/public-shopper";

it("covers every current public supplier product, including unavailable products", () => {
  expect(reviewedCatalog.products).toHaveLength(104);
  expect(new Set(reviewedCatalog.products.map(p => p.id))).toEqual(
    new Set(source.products.map(p => p.id))
  );
  for (const original of source.products) {
    const copy = reviewedCatalog.products.find(p => p.id === original.id)!;
    const product = toShopperProduct({
      ...original,
      price: 99,
      stockQuantity: 0,
      slug: original.slug,
    });
    expect(product.name).toBe(copy.name);
    expect(product.description.replace(/&amp;/g, "&")).toContain(copy.intro);
    expect(product.description).toContain("Ce conține:");
    expect(product.description).toContain("Utilizare și siguranță:");
    expect(product.attributes.age).toBe(copy.age);
    expect(product.slug).toBe(original.slug);
    expect(product.price).toBe(99);
    expect(product.stockQuantity).toBe(0);
    expect(product.description).not.toMatch(
      /native code|siguran[tț][aă] garantat|,œ|, ž|click aici|descarca aici/i
    );
    expect(toShopperProduct(product)).toEqual(product);
  }
});

it("does not apply reviewed facts to an unrelated identity or unknown product", () => {
  const original = source.products[0];
  const unrelated = { ...original, id: "new-product" };
  expect(applyReviewedCatalogCopy(unrelated)).toBe(unrelated);
  const unknown = { ...original, slug: "new-supplier-product" };
  expect(applyReviewedCatalogCopy(unknown)).toBe(unknown);
});

it("corrects substantive supplier conflicts and keeps preparation requirements", () => {
  const find = (code: string) =>
    reviewedCatalog.products.find(p => p.slug.includes(code))!;
  expect(find("160021").contents).toContain("Stație meteo");
  expect(find("160021").contents).not.toContain("proiector");
  expect(find("03926").age).toBe("10+");
  expect(find("03394").specifications).toContain("2 baterii AAA");
  expect(find("03460").specifications).toContain("șurubelniță");
  expect(find("160022").specifications).toContain("nu în română");
  expect(find("550202").specifications).toContain("setul de bază");
  expect(find("g-7268").specifications).toContain("nemotorizate");
  expect(find("7065r").warning).toContain("Magneții înghițiți");
});
