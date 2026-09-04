import {
  applyProductContentOverride,
  CRISTALE_4M_SLUG,
} from "@/lib/products/catalog-content-overrides";
import { generateEducationalProductSchema } from "@/lib/seo/advanced-schema";
import { buildDefaultProductFaq } from "@/lib/seo/product-faq";
import type { Product } from "@/types/product";

const product = {
  id: "cristale",
  name: "Set Cristale Roșu 4M - Experiment STEM Viral",
  slug: CRISTALE_4M_SLUG,
  description:
    'Ce spun utilizatorii? "Copilul meu a fost uimit" — Maria, București',
  price: 101.43,
  images: ["https://example.com/cristale.png"],
  metadata: {},
  category: { id: "science", name: "Știință", slug: "science" },
  tags: [],
  attributes: { brand: "4M", originalAgeText: "7-10 ani" },
  isActive: true,
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
  stockQuantity: 5,
  reservedQuantity: 0,
  featured: false,
  ageGroup: "ELEMENTARY_6_8",
} satisfies Product;

describe("Cristale 4M product integrity", () => {
  it("replaces fabricated testimonials with factual product copy", () => {
    const corrected = applyProductContentOverride(product);

    expect(corrected.description).not.toMatch(
      /Maria|Andrei|Elena|Ce spun utilizatorii|Copilul meu a fost uimit/i
    );
    expect(corrected.description).toContain("Set educativ 4M");
    expect(corrected.description).toContain(
      "Vârsta recomandată de producător este 10+"
    );
  });

  it("publishes the real brand, live price, stock availability, and manufacturer age", () => {
    const schema = generateEducationalProductSchema(
      applyProductContentOverride(product)
    ) as any;

    expect(schema.brand.name).toBe("4M");
    expect(schema.brand.name).not.toBe("TechTots");
    expect(schema.offers.price).toBe(101.43);
    expect(schema.offers.availability).toBe("https://schema.org/InStock");
    expect(schema.audience).toEqual({
      "@type": "PeopleAudience",
      suggestedMinAge: 10,
    });
  });

  it("labels manufacturer guidance separately from gift-guide targeting", () => {
    const [ageFaq] = buildDefaultProductFaq(
      applyProductContentOverride(product)
    );

    expect(ageFaq.answer).toContain("recomandată de producător");
    expect(ageFaq.answer).toContain("10+");
    expect(ageFaq.answer).toContain("ghidul de cadouri");
  });
});
