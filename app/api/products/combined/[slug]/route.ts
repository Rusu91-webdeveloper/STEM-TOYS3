import { NextRequest, NextResponse } from "next/server";

import { db } from "@/lib/db";
import type { Product } from "@/types/product";

const fallbackProducts: Record<string, Product> = {
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  try {
    // 🚀 PERFORMANCE: Execute both queries in parallel instead of sequential
    const [dbProduct, dbBook] = await Promise.all([
      db.product.findFirst({
        where: {
          slug,
          isActive: true,
        },
        include: {
          category: {
            select: { id: true, name: true, slug: true, description: true },
          },
          supplier: {
            select: { id: true, companyName: true, companySlug: true },
          },
        },
      }),
      db.book.findFirst({
        where: {
          slug,
          isActive: true,
        },
        include: {
          languages: true,
        },
      }),
    ]);

    if (dbProduct) {
      const attributes =
        (dbProduct.attributes as Record<string, any>) || undefined;
      const dimensions =
        (dbProduct.dimensions as Record<string, any>) || undefined;

      const transformed: Product = {
        id: dbProduct.id,
        name: dbProduct.name,
        slug: dbProduct.slug,
        description: dbProduct.description ?? "",
        price: dbProduct.price,
        priceCurrency: dbProduct.priceCurrency,
        compareAtPrice: dbProduct.compareAtPrice ?? undefined,
        compareAtPriceCurrency: dbProduct.compareAtPriceCurrency,
        sku: dbProduct.sku ?? undefined,
        barcode: dbProduct.barcode ?? undefined,
        images: (dbProduct.images as string[]) || [],
        metadata: dbProduct.metadata as any,
        category: dbProduct.category
          ? {
              id: dbProduct.category.id,
              name: dbProduct.category.name,
              slug: dbProduct.category.slug,
              description: dbProduct.category.description ?? undefined,
            }
          : undefined,
        tags: (dbProduct.tags as string[]) || [],
        attributes,
        isActive: dbProduct.isActive,
        createdAt: dbProduct.createdAt,
        updatedAt: dbProduct.updatedAt,
        stockQuantity: dbProduct.stockQuantity,
        reservedQuantity: dbProduct.reservedQuantity,
        featured: dbProduct.featured,
        isBook: false,
        weight: dbProduct.weight ?? undefined,
        dimensions,
        averageRating: dbProduct.averageRating ?? undefined,
        reviewCount: dbProduct.reviewCount ?? undefined,
        totalSold: dbProduct.totalSold ?? undefined,
        supplier: dbProduct.supplier
          ? {
              id: dbProduct.supplier.id,
              companyName: dbProduct.supplier.companyName,
              companySlug: dbProduct.supplier.companySlug,
            }
          : undefined,
        ageRange: attributes?.age as string | undefined,
        ageGroup: dbProduct.ageGroup as any,
        stemDiscipline: dbProduct.stemDiscipline as any,
        learningOutcomes: (dbProduct.learningOutcomes as any) || undefined,
        productType: dbProduct.productType as any,
        specialCategories: (dbProduct.specialCategories as any) || undefined,
        romanianCompetencies:
          (dbProduct.romanianCompetencies as any) || undefined,
        romanianCurriculumAlignment:
          (dbProduct.romanianCurriculumAlignment as any) || undefined,
        romanianEducationalCertification:
          dbProduct.romanianEducationalCertification ?? undefined,
        romanianEducationalLevel: dbProduct.romanianEducationalLevel as any,
        romanianMinistryApproval:
          dbProduct.romanianMinistryApproval ?? undefined,
        romanianParentGuides:
          (dbProduct.romanianParentGuides as any) || undefined,
        romanianSubjectAreas:
          (dbProduct.romanianSubjectAreas as any) || undefined,
        romanianTeacherResources:
          (dbProduct.romanianTeacherResources as any) || undefined,
      };

      return NextResponse.json(transformed, {
        headers: {
          // 🚀 PERFORMANCE: Add caching headers
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      });
    }

    if (dbBook) {
      // Transform book to product-like structure
      const bookAsProduct: Product = {
        id: dbBook.id,
        name: dbBook.name,
        slug: dbBook.slug,
        description: dbBook.description,
        price: dbBook.price,
        priceCurrency: "RON",
        compareAtPrice: undefined,
        compareAtPriceCurrency: "RON",
        sku: undefined,
        barcode: undefined,
        images: dbBook.coverImage ? [dbBook.coverImage] : [],
        category: {
          id: "educational-books",
          name: "Educational Books",
          slug: "educational-books",
        },
        tags: ["book", "educational"],
        attributes: {
          author: dbBook.author,
          languages:
            (dbBook as any).languages?.map((lang: any) => lang.name) || [],
        },
        isActive: dbBook.isActive,
        createdAt: dbBook.createdAt,
        updatedAt: dbBook.updatedAt,
        stockQuantity: 10,
        reservedQuantity: 0,
        featured: true,
        isBook: true, // Flag to identify this as a book
        averageRating: undefined,
        reviewCount: 0,
        totalSold: 0,
      };

      return NextResponse.json(bookAsProduct, {
        headers: {
          // 🚀 PERFORMANCE: Add caching headers
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      });
    }

    const fallbackProduct = fallbackProducts[slug];

    if (fallbackProduct) {
      return NextResponse.json(fallbackProduct, {
        headers: {
          "Cache-Control": "public, s-maxage=120, stale-while-revalidate=300",
        },
      });
    }

    // If neither product nor book found
    return NextResponse.json(
      { error: `No product or book found with slug: ${slug}` },
      { status: 404 }
    );
  } catch (error) {
    console.error("Error fetching combined product/book:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
