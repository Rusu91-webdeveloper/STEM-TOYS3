import { generateProductMetadata } from "@/lib/utils/seo";

describe("generateProductMetadata", () => {
  it("includes Product and BreadcrumbList JSON-LD", () => {
    const product = {
      id: "p1",
      name: "Robo Kit",
      description: "Learn robotics by building a robot",
      slug: "robo-kit",
      images: ["https://www.techtots.ro/placeholder-product.png"],
      price: 199.99,
      isActive: true,
      category: { name: "Robotics" },
      attributes: { age: "8-12" },
    } as any;

    const metadata = generateProductMetadata(product);

    // metadata.other.structuredData is a stringified JSON (array)
    const json = JSON.parse((metadata.other as any).structuredData);

    expect(Array.isArray(json)).toBe(true);
    const types = json.map((j: any) => j["@type"]);
    expect(types).toContain("Product");
    expect(types).toContain("BreadcrumbList");

    const breadcrumb = json.find((j: any) => j["@type"] === "BreadcrumbList");
    expect(breadcrumb.itemListElement?.length).toBeGreaterThanOrEqual(3);
  });

  it("includes brand from supplier, GTIN key, and additionalProperty from attributes", () => {
    const product = {
      id: "p2",
      name: "Chem Lab",
      description: "Science kit",
      slug: "chem-lab",
      images: ["https://www.techtots.ro/placeholder-product.png"],
      price: 129.99,
      isActive: true,
      category: { name: "Science" },
      attributes: { age: "8-12", pieces: 42, difficulty: "beginner" },
      barcode: "1234567890123", // 13 → gtin13
      averageRating: 4.7,
      reviewCount: 123,
      supplier: { companyName: "EduLabs", companySlug: "edulabs" },
    } as any;

    const metadata = generateProductMetadata(product);
    const json = JSON.parse((metadata.other as any).structuredData);

    const productSchema = json.find((j: any) => j["@type"] === "Product");
    expect(productSchema.brand?.name).toBe("EduLabs");
    expect(productSchema.gtin13).toBe("1234567890123");
    expect(Array.isArray(productSchema.additionalProperty)).toBe(true);
    const names = productSchema.additionalProperty.map((p: any) => p.name);
    expect(names).toEqual(
      expect.arrayContaining(["age", "pieces", "difficulty"])
    );

    const agg = productSchema.aggregateRating;
    expect(agg.ratingValue).toBe(4.7);
    expect(agg.reviewCount).toBe(123);
  });

  it("includes FAQPage when metadata.seo.faq exists", () => {
    const product = {
      id: "p3",
      name: "Robo Kit",
      description: "Robotics",
      slug: "robo-kit",
      images: ["/img.png"],
      price: 199.99,
      isActive: true,
      attributes: { age: "6-8" },
      metadata: { seo: { faq: [{ question: "Is it safe?", answer: "Yes" }] } },
    } as any;

    const metadata = generateProductMetadata(product);
    const json = JSON.parse((metadata.other as any).structuredData);
    const types = json.map((j: any) => j["@type"]);
    expect(types).toContain("FAQPage");
    const faq = json.find((j: any) => j["@type"] === "FAQPage");
    expect(faq.mainEntity?.[0]?.name).toBe("Is it safe?");
  });
});
