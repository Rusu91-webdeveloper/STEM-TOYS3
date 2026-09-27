import {
  disciplineBadgeLabel,
  resolveProductAgeChip,
} from "@/lib/products/romanian-catalog";
import { generateCompleteProductSchema } from "@/lib/seo/advanced-schema";
import type { Product } from "@/types/product";

describe("disciplineBadgeLabel", () => {
  it("maps STEM enums and English category names to Romanian", () => {
    expect(disciplineBadgeLabel("SCIENCE")).toBe("Știință");
    expect(disciplineBadgeLabel("TECHNOLOGY")).toBe("Tehnologie");
    expect(disciplineBadgeLabel("ENGINEERING")).toBe("Inginerie");
    expect(disciplineBadgeLabel("MATHEMATICS")).toBe("Matematică");
    expect(disciplineBadgeLabel(null, "Science")).toBe("Știință");
    expect(disciplineBadgeLabel(null, "Engineering")).toBe("Inginerie");
  });

  it("omits GENERAL and empty values", () => {
    expect(disciplineBadgeLabel("GENERAL")).toBeNull();
    expect(disciplineBadgeLabel("")).toBeNull();
    expect(disciplineBadgeLabel(null, "general")).toBeNull();
    expect(disciplineBadgeLabel(undefined, undefined)).toBeNull();
  });

  it("keeps a specific discipline over a generic category name", () => {
    expect(disciplineBadgeLabel("SCIENCE", "GENERAL")).toBe("Știință");
    expect(disciplineBadgeLabel(null, "Robotics")).toBe("Robotics");
  });
});

describe("resolveProductAgeChip", () => {
  it("prefers an explicit minimum age over a contradicting coarse group", () => {
    const chip = resolveProductAgeChip({
      ageGroup: "PRESCHOOL_3_5",
      ageRange: "3-5 ani",
      description: "Kit de construit. Potrivit de la 8 ani.",
    });

    expect(chip).toMatchObject({
      label: "8+",
      source: "explicit",
      contradictsCoarseGroup: true,
    });
  });

  it("uses manufacturer attributes such as 8+ before the coarse bucket", () => {
    const chip = resolveProductAgeChip({
      ageGroup: "PRESCHOOL_3_5",
      attributes: { manufacturerRecommendedAge: "8+" },
    });

    expect(chip?.label).toBe("8+");
    expect(chip?.contradictsCoarseGroup).toBe(true);
  });

  it("keeps an explicit age that sits inside the coarse group", () => {
    const chip = resolveProductAgeChip({
      ageGroup: "ELEMENTARY_6_8",
      attributes: { originalAgeText: "6+" },
    });

    expect(chip).toMatchObject({
      label: "6+",
      source: "explicit",
      contradictsCoarseGroup: false,
    });
  });

  it("shows the coarse Romanian label only when nothing more specific exists", () => {
    const chip = resolveProductAgeChip({ ageGroup: "PRESCHOOL_3_5" });

    expect(chip).toMatchObject({
      label: "3–5 ani",
      source: "ageGroup",
      contradictsCoarseGroup: false,
    });
  });

  it("omits the chip when the product has no age data", () => {
    expect(resolveProductAgeChip({})).toBeNull();
  });
});

describe("product JSON-LD without reviews", () => {
  const product = {
    id: "p1",
    name: "Kit",
    slug: "kit",
    description: "Kit de la 8 ani",
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
    stemDiscipline: "SCIENCE",
  } as Product;

  it("does not emit aggregateRating when there are no real reviews", () => {
    const schemas = generateCompleteProductSchema(product, []);
    const serialized = JSON.stringify(schemas);

    expect(serialized).not.toContain("aggregateRating");
    expect(serialized).not.toContain("AggregateRating");
    expect(serialized).toContain("Știință");
    expect(serialized).not.toContain('"value":"SCIENCE"');
  });
});
