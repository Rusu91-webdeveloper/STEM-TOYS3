import { applyProductContentOverride } from "@/lib/products/catalog-content-overrides";
import { getProductBuyingGuide } from "@/lib/products/product-buying-guides";
import { toShopperProduct } from "@/lib/products/public-shopper";
import { resolveProductAgeChip } from "@/lib/products/romanian-catalog";
import type { Product } from "@/types/product";

const cases = [
  [
    "set-constructie-plus-plus-tub-240-piese-basic-culori-standard-pp4185",
    "3+",
  ],
  ["joc-electronic-logiblocs-set-secret-recorder-06808is", "5+"],
  ["mega-brat-hidraulic-kidzlabs-4m-03427", "8+"],
] as const;

describe("reviewed product content", () => {
  it.each(cases)(
    "corrects copy/age for %s without changing commerce data",
    (slug, age) => {
      const product = {
        id: "live-id",
        slug,
        price: 79.25,
        stockQuantity: 7,
        description: 'Ce spun părinții: "Cea mai bună jucărie!"',
        attributes: { originalAgeText: "3-5 ani", availability: "instock" },
        metadata: { homepageExcluded: true, adsExcluded: true },
        ageRange: "3-5 ani",
        ageGroup: "PRESCHOOL_3_5",
      } as unknown as Product;
      const corrected = toShopperProduct(product);
      expect(corrected.description).not.toMatch(/părinții|cea mai bună/i);
      expect(resolveProductAgeChip(corrected)?.label).toBe(`${age} ani`);
      expect(corrected).toMatchObject({
        id: product.id,
        price: product.price,
        stockQuantity: 7,
        metadata: product.metadata,
      });
      expect(corrected.attributes?.availability).toBe("instock");
      expect(product.description).toContain("părinții");
      expect(getProductBuyingGuide(slug.toUpperCase())).not.toBeNull();
    }
  );

  it("does not invent a guide or rewrite an unreviewed product", () => {
    const product = {
      slug: "unknown-product",
      description: "Original",
    } as Product;
    expect(applyProductContentOverride(product)).toBe(product);
    expect(getProductBuyingGuide(product.slug)).toBeNull();
  });
});
