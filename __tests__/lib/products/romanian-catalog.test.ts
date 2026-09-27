import ageChipProducts from "@/__tests__/lib/products/fixtures/age-chip-products.json";
import {
  categoryStorefrontLabel,
  disciplineBadgeLabel,
  lowestExplicitAge,
  resolveProductAgeChip,
} from "@/lib/products/romanian-catalog";
import { generateCompleteProductSchema } from "@/lib/seo/advanced-schema";
import { resolveStorefrontCategoryLink } from "@/lib/utils/category-page-links";
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
    expect(
      disciplineBadgeLabel(null, "Robotics", "robotics")
    ).toBe("Robotică");
  });

  it("maps English category names and slugs when there is no STEM discipline", () => {
    expect(
      disciplineBadgeLabel(null, "Construction Sets", "construction-sets")
    ).toBe("Seturi de construcție");
    expect(disciplineBadgeLabel(null, "Magnetic Building")).toBe(
      "Construcții magnetice"
    );
    expect(categoryStorefrontLabel("electronics", "Electronics")).toBe(
      "Electronică"
    );
    expect(categoryStorefrontLabel("science-experiments")).toBe(
      "Experimente științifice"
    );
    expect(categoryStorefrontLabel("logic-games")).toBe("Jocuri de logică");
    expect(categoryStorefrontLabel("educational-books")).toBe(
      "Cărți educaționale"
    );
    expect(disciplineBadgeLabel("ENGINEERING", "Construction Sets")).toBe(
      "Inginerie"
    );
  });

  it("uses the STEM page and its Romanian label when the shop slug has no category page", () => {
    expect(
      resolveStorefrontCategoryLink({
        stemDiscipline: "ENGINEERING",
        categorySlug: "construction-sets",
        categoryName: "Construction Sets",
      })
    ).toEqual({
      label: "Inginerie",
      href: "/categories/engineering",
    });
  });

  it("keeps the label and href on the same page when the slug is a real landing", () => {
    expect(
      resolveStorefrontCategoryLink({
        stemDiscipline: "ENGINEERING",
        categorySlug: "science",
        categoryName: "Science",
      })
    ).toEqual({
      label: "Știință",
      href: "/categories/science",
    });
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
      label: "8+ ani",
      source: "explicit",
      contradictsCoarseGroup: true,
    });
  });

  it("uses manufacturer attributes such as 8+ before the coarse bucket", () => {
    const chip = resolveProductAgeChip({
      ageGroup: "PRESCHOOL_3_5",
      attributes: { manufacturerRecommendedAge: "8+" },
    });

    expect(chip?.label).toBe("8+ ani");
    expect(chip?.contradictsCoarseGroup).toBe(true);
  });

  it("keeps an explicit age that sits inside the coarse group", () => {
    const chip = resolveProductAgeChip({
      ageGroup: "ELEMENTARY_6_8",
      attributes: { originalAgeText: "6+" },
    });

    expect(chip).toMatchObject({
      label: "6+ ani",
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

  it("does not treat a comma-separated bracket list as an explicit age", () => {
    const chip = resolveProductAgeChip({
      ageGroup: "PRESCHOOL_3_5",
      ageRange: "5-7 ani, 7-10 ani",
      description: "Varsta 8+.",
      attributes: { age: "5-7 ani, 7-10 ani" },
    });

    expect(chip?.label).toBe("8+ ani");
  });

  it("never shows a minimum younger than the manufacturer field", () => {
    const chip = resolveProductAgeChip({
      ageGroup: "ELEMENTARY_6_8",
      attributes: {
        manufacturerRecommendedAge: "10+",
        originalAgeText: "9+",
      },
      description: "Vârsta recomandată: +8 ani. Conține 139 piese.",
    });

    expect(chip?.label).toBe("10+ ani");
  });

  it("raises the chip when the description minimum is higher", () => {
    const chip = resolveProductAgeChip({
      attributes: { manufacturerRecommendedAge: "8+" },
      description: "Vârsta recomandată: +12 ani.",
    });

    expect(chip?.label).toBe("12+ ani");
  });

  it.each([
    ["proiector-holograma-kidzlabs-4m-03394", "8+ ani"],
    ["mega-brat-hidraulic-kidzlabs-4m-03427", "8+ ani"],
    [
      "set-educativ-stem-aqua-dragons-habitat-vulcan-cu-lava-acvariu-cu-led-si-aqua-dragons-rosii-ad6102",
      "6+ ani",
    ],
    ["kit-constructie-robot---t-rex-kidz-robotix-4m-03460", "8+ ani"],
    ["kit-stem-manusa-robotica-genius-toy-g_7080", "8+ ani"],
    ["mini-experiment-sparge-o-geoda-cristal-4m-03925", "3+ ani"],
    ["terariu-cristale-cu-dinozauri-4m-experiment-stem-4m-03926", "10+ ani"],
    ["zig-go-bila-cea-mai-mare-traseu-reactie-in-lant-dj05641", "7+ ani"],
  ] as const)(
    "matches the live description minimum for %s",
    (slug, expected) => {
      const product = ageChipProducts.find(item => item.slug === slug);
      expect(product).toBeDefined();
      const chip = resolveProductAgeChip({
        ageGroup: product?.ageGroup,
        ageRange: product?.ageRange,
        description: product?.description,
        attributes: product?.attributes,
      });
      const descriptionMin = lowestExplicitAge(product?.description ?? "");

      expect(chip?.label).toBe(expected);
      const chipMin = Number(chip?.label.match(/(\d{1,2})/)?.[1]);
      expect(descriptionMin).not.toBeNull();
      expect(chipMin).toBeGreaterThanOrEqual(descriptionMin ?? 0);
    }
  );
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
