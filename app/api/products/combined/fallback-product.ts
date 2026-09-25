import type { Product } from "@/types/product";

/** Demo product used only when this exact slug is absent from the database. */
export const fallbackProducts: Record<string, Product> = {
  "arduino-starter-kit": {
    id: "fallback-arduino-starter-kit",
    name: "Arduino Starter Kit",
    slug: "arduino-starter-kit",
    description:
      "Complete electronics kit for learning Arduino programming and building interactive projects. Includes board, sensors, and guided lessons for aspiring makers.",
    price: 89.99,
    priceCurrency: "RON",
    compareAtPrice: 109.99,
    compareAtPriceCurrency: "RON",
    sku: "ARD-START-001",
    barcode: "8991234567890",
    images: [
      "https://images.unsplash.com/photo-1553406830-ef2513450d76?w=960&h=720&fit=crop",
      "https://images.unsplash.com/photo-1518770660439-4636190af475?w=960&h=720&fit=crop",
    ],
    metadata: {
      title: "Arduino Starter Kit - Complete Electronics Learning Bundle",
      description:
        "Learn electronics and coding with the Arduino Starter Kit. Build real hardware projects with step-by-step lessons and high-quality components.",
      keywords: [
        "arduino kit",
        "electronics for beginners",
        "STEM engineering kit",
        "arduino starter bundle",
        "hardware coding projects",
      ],
      schema: {
        "@type": "Product",
        brand: "TechTots",
        category: "Engineering/Electronics",
        sku: "ARD-START-001",
      },
    },
    category: {
      id: "electronics",
      name: "Electronics",
      slug: "electronics",
      description:
        "STEM electronics and coding kits that help learners explore circuits, sensors, and hardware prototyping.",
    },
    tags: ["electronics", "arduino", "coding", "hardware", "teens"],
    attributes: {
      componentsIncluded: ["Arduino board", "breadboard", "LEDs", "sensors"],
      difficulty: "Beginner",
      lessons: 12,
    },
    isActive: true,
    createdAt: new Date("2024-01-01T00:00:00Z"),
    updatedAt: new Date("2024-01-01T00:00:00Z"),
    stockQuantity: 50,
    reservedQuantity: 0,
    featured: true,
    isBook: false,
    weight: 0.8,
    dimensions: {
      width: 25,
      height: 7,
      depth: 17,
      unit: "cm",
    },
    averageRating: 4.8,
    reviewCount: 124,
    totalSold: 860,
    ageRange: "13+ years",
    ageGroup: "TEENS_13_PLUS",
    stemDiscipline: "ENGINEERING",
    learningOutcomes: ["PROBLEM_SOLVING", "LOGIC"],
    productType: "EXPERIMENT_KITS",
    specialCategories: ["NEW_ARRIVALS"],
    supplier: {
      id: "static-supplier",
      companyName: "TechTots STEM Labs",
      companySlug: "techtots-stem-labs",
    },
    imageMetadata: [
      {
        alt: "Arduino starter kit components laid out on a workbench",
        tags: ["arduino", "electronics", "stem"],
      },
      {
        alt: "Teen assembling an Arduino robotics project",
        tags: ["arduino", "robotics", "coding"],
      },
    ],
  },
};
