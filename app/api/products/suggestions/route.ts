import { NextRequest, NextResponse } from "next/server";

import { withErrorHandler } from "@/lib/api-error-handler";
import { db } from "@/lib/db";

interface SearchSuggestion {
  id: string;
  text: string;
  type: "product" | "category" | "brand" | "tag";
  count?: number;
  category?: string;
  image?: string;
}

export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim();
  const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 20);

  if (!query || query.length < 2) {
    return NextResponse.json({ suggestions: [] });
  }

  const suggestions: SearchSuggestion[] = [];
  const queryLower = query.toLowerCase();

  try {
    // 1. Product name suggestions
    const productSuggestions = await db.product.findMany({
      where: {
        AND: [
          { isActive: true },
          {
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              { description: { contains: query, mode: "insensitive" } },
              { tags: { hasSome: [query] } },
            ],
          },
        ],
      },
      select: {
        id: true,
        name: true,
        slug: true,
        images: true,
        category: {
          select: {
            name: true,
          },
        },
      },
      take: Math.ceil(limit * 0.6), // 60% for products
      orderBy: [{ featured: "desc" }, { name: "asc" }],
    });

    // Add product suggestions
    productSuggestions.forEach(product => {
      suggestions.push({
        id: `product-${product.id}`,
        text: product.name,
        type: "product",
        category: product.category?.name,
        image:
          Array.isArray(product.images) && product.images.length > 0
            ? product.images[0]
            : undefined,
      });
    });

    // 2. Category suggestions
    const categorySuggestions = await db.category.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { slug: { contains: query, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        name: true,
        slug: true,
        _count: {
          select: {
            products: {
              where: { isActive: true },
            },
          },
        },
      },
      take: Math.ceil(limit * 0.3), // 30% for categories
      orderBy: {
        name: "asc",
      },
    });

    // Add category suggestions
    categorySuggestions.forEach(category => {
      suggestions.push({
        id: `category-${category.id}`,
        text: category.name,
        type: "category",
        count: category._count.products,
      });
    });

    // 3. Tag suggestions (from product tags)
    const tagSuggestions = await db.product.findMany({
      where: {
        AND: [{ isActive: true }, { tags: { hasSome: [query] } }],
      },
      select: {
        tags: true,
      },
      take: 50,
    });

    // Extract matching tags
    const matchingTags = new Set<string>();
    tagSuggestions.forEach(product => {
      if (Array.isArray(product.tags)) {
        product.tags.forEach(tag => {
          if (
            typeof tag === "string" &&
            tag.toLowerCase().includes(queryLower)
          ) {
            matchingTags.add(tag);
          }
        });
      }
    });

    // Add tag suggestions (remaining 10%)
    const tagLimit = Math.ceil(limit * 0.1);
    Array.from(matchingTags)
      .slice(0, tagLimit)
      .forEach(tag => {
        suggestions.push({
          id: `tag-${tag}`,
          text: tag,
          type: "tag",
        });
      });

    // 4. Popular search completion
    if (suggestions.length < limit) {
      // Get popular search patterns from a predefined list or database
      const popularTerms = [
        "STEM toys",
        "educational games",
        "science kits",
        "building blocks",
        "robotics",
        "coding games",
        "math toys",
        "chemistry sets",
        "microscopes",
        "puzzles",
      ];

      const matchingPopular = popularTerms.filter(term =>
        term.toLowerCase().includes(queryLower)
      );

      matchingPopular
        .slice(0, limit - suggestions.length)
        .forEach((term, index) => {
          suggestions.push({
            id: `popular-${index}`,
            text: term,
            type: "product",
          });
        });
    }

    // Remove duplicates and limit results
    const uniqueSuggestions = suggestions
      .filter(
        (suggestion, index, self) =>
          index ===
          self.findIndex(
            s => s.text.toLowerCase() === suggestion.text.toLowerCase()
          )
      )
      .slice(0, limit);

    return NextResponse.json({
      suggestions: uniqueSuggestions,
      meta: {
        query,
        limit,
        total: uniqueSuggestions.length,
      },
    });
  } catch (error) {
    console.error("Error fetching suggestions:", error);
    return NextResponse.json(
      {
        suggestions: [],
        error: "Failed to fetch suggestions",
      },
      { status: 500 }
    );
  }
});
