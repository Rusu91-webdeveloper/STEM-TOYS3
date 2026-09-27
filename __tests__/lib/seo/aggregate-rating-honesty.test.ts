import { generateCompleteProductSchema } from "@/lib/seo/advanced-schema";
import type { Product } from "@/types/product";

const product = {
  id: "p1",
  name: "Kit",
  slug: "kit",
  description: "Kit",
  price: 10,
  images: [],
  tags: [],
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  stockQuantity: 1,
  reservedQuantity: 0,
  featured: false,
  averageRating: 4.9,
  reviewCount: 120,
} as Product;

describe("product review JSON-LD", () => {
  it("omits AggregateRating and Review when there are no real reviews", () => {
    const schemas = generateCompleteProductSchema(product, []);
    const serialized = JSON.stringify(schemas);

    expect(serialized).not.toContain("AggregateRating");
    expect(serialized).not.toContain('"@type":"Review"');
  });

  it("publishes AggregateRating only from supplied reviews", () => {
    const schemas = generateCompleteProductSchema(product, [
      {
        authorName: "Ana",
        rating: 4,
        comment: "Kit clar, copilul l-a asamblat singur.",
        createdAt: "2026-09-01",
      },
      {
        authorName: "Ion",
        rating: 5,
        comment: "Instructiunile au fost suficiente.",
        createdAt: "2026-09-02",
      },
    ]);
    const productSchema = schemas.find(
      schema => schema["@type"] === "Product"
    ) as Record<string, unknown> | undefined;

    expect(productSchema?.["aggregateRating"]).toMatchObject({
      "@type": "AggregateRating",
      ratingValue: 4.5,
      reviewCount: 2,
    });
    expect(schemas.filter(schema => schema["@type"] === "Review")).toHaveLength(
      2
    );
  });
});