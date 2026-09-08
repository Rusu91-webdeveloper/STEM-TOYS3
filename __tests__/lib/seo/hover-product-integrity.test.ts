import {
  applyProductContentOverride,
  HOVER_RACER_SLUG,
  HOVER_RACER_TITLE,
} from "@/lib/products/catalog-content-overrides";
import { generateProductMetadata } from "@/lib/utils/seo";
import { generateEducationalProductSchema } from "@/lib/seo/advanced-schema";
import { buildDefaultProductFaq } from "@/lib/seo/product-faq";
import type { Product } from "@/types/product";

const source = {
  id: "hover-test",
  slug: HOVER_RACER_SLUG,
  name: "Old supplier title",
  description: "Old supplier copy",
  price: 137.25,
  stockQuantity: 2,
  images: [],
  attributes: {},
  metadata: {},
  ageGroup: "ELEMENTARY_6_8",
  category: { id: "technology", name: "Technology", slug: "technology" },
  isActive: true,
  tags: [],
  reservedQuantity: 0,
  featured: false,
  createdAt: new Date(),
  updatedAt: new Date(),
} satisfies Product;

describe("Hover Racer content integrity", () => {
  it("corrects manufacturer guidance while preserving live price and stock", () => {
    const product = applyProductContentOverride(source);
    expect(product.name).toBe(HOVER_RACER_TITLE);
    expect(product.ageRange).toBe("8+");
    expect(product.price).toBe(source.price);
    expect(product.stockQuantity).toBe(source.stockQuantity);
    const schema = generateEducationalProductSchema(product) as any;
    expect(schema.audience.suggestedMinAge).toBe(8);
    expect(schema.aggregateRating).toBeUndefined();
    expect(buildDefaultProductFaq(product)[0].answer).not.toMatch(/6[–-]8/);
  });
  it("publishes product-specific primary and social metadata, without site defaults", () => {
    const metadata = generateProductMetadata(
      applyProductContentOverride(source)
    );
    expect(metadata.title).toBe("Hover Racer Kidz Robotix 4M, 8+ | TechTots");
    expect(metadata.openGraph?.title).toBe(metadata.title);
    expect(metadata.twitter?.title).toBe(metadata.title);
    expect(metadata.description).toContain("fără ecran");
    expect(metadata.description).toContain("Plată ramburs (COD)");
    expect(metadata.description).toContain("Livrare 1–4 zile lucrătoare");
    expect(metadata.openGraph?.description).toBe(metadata.description);
    expect(JSON.stringify(metadata)).not.toMatch(/Cristale|1[–-]3 zile/);
  });
  it("keeps unavailable stock unavailable", () => {
    const product = applyProductContentOverride({
      ...source,
      stockQuantity: 0,
    });
    const schema = generateEducationalProductSchema(product) as any;
    expect(schema.offers.availability).toBe("https://schema.org/OutOfStock");
  });
});
