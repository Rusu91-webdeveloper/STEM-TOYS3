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
});
