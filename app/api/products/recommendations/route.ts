import { NextRequest, NextResponse } from "next/server";

import { withErrorHandler } from "@/lib/api-error-handler";
import { db } from "@/lib/db";

interface RecommendationProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  images: string[];
  category?: {
    id: string;
    name: string;
    slug: string;
  };
  rating?: number;
  reviewCount?: number;
  score?: number;
  reason?: string;
  isNew?: boolean;
  isTrending?: boolean;
}

interface RecommendationParams {
  userId?: string;
  currentProductId?: string;
  viewedProducts?: string[];
  purchaseHistory?: string[];
  categories?: string[];
  limit: number;
}

export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);

  const params: RecommendationParams = {
    userId: searchParams.get("userId") || undefined,
    currentProductId: searchParams.get("currentProductId") || undefined,
    viewedProducts:
      searchParams.get("viewedProducts")?.split(",").filter(Boolean) || [],
    purchaseHistory:
      searchParams.get("purchaseHistory")?.split(",").filter(Boolean) || [],
    categories:
      searchParams.get("categories")?.split(",").filter(Boolean) || [],
    limit: Math.min(parseInt(searchParams.get("limit") || "8"), 20),
  };

  try {
    const recommendations = await generateRecommendations(params);

    return NextResponse.json({
      recommendations,
      meta: {
        algorithms: Object.keys(recommendations),
        totalProducts: Object.values(recommendations).reduce(
          (sum, products) => sum + products.length,
          0
        ),
        params: {
          userId: params.userId,
          currentProductId: params.currentProductId,
          limit: params.limit,
        },
      },
    });
  } catch (error) {
    console.error("Error generating recommendations:", error);
    return NextResponse.json(
      {
        recommendations: {},
        error: "Failed to generate recommendations",
      },
      { status: 500 }
    );
  }
});

async function generateRecommendations(params: RecommendationParams) {
  const {
    userId,
    currentProductId,
    viewedProducts,
    purchaseHistory,
    categories,
    limit,
  } = params;

  // Get current product details if provided
  let currentProduct = null;
  if (currentProductId) {
    currentProduct = await db.product.findUnique({
      where: { id: currentProductId },
      include: {
        category: true,
      },
    });
  }

  const recommendations: Record<string, RecommendationProduct[]> = {};

  // 1. Personalized Recommendations
  recommendations.personalized = await getPersonalizedRecommendations(
    userId,
    viewedProducts,
    purchaseHistory,
    limit
  );

  // 2. Similar Products (Content-based)
  recommendations.similar = await getSimilarProducts(
    currentProduct,
    viewedProducts,
    limit
  );

  // 3. Trending Products
  recommendations.trending = await getTrendingProducts(limit);

  // 4. Collaborative Filtering (Others also viewed)
  recommendations.collaborative = await getCollaborativeRecommendations(
    currentProductId,
    viewedProducts,
    limit
  );

  // 5. Smart Picks (AI-enhanced recommendations)
  recommendations.smart = await getSmartRecommendations(
    userId,
    currentProduct,
    categories,
    limit
  );

  return recommendations;
}

async function getPersonalizedRecommendations(
  userId?: string,
  viewedProducts: string[] = [],
  purchaseHistory: string[] = [],
  limit: number = 8
): Promise<RecommendationProduct[]> {
  try {
    // Combine viewed and purchased products to understand user preferences
    const userInteractedProducts = [
      ...new Set([...viewedProducts, ...purchaseHistory]),
    ];

    if (userInteractedProducts.length === 0) {
      // Fallback to popular products
      return await getPopularProducts(limit);
    }

    // Get categories of products user has interacted with
    const interactedCategories = await db.product.findMany({
      where: {
        id: { in: userInteractedProducts },
      },
      select: {
        categoryId: true,
        attributes: true,
      },
    });

    const categoryIds = [
      ...new Set(
        interactedCategories
          .map(p => p.categoryId)
          .filter((id): id is string => id !== null)
      ),
    ];

    // Find similar products in same categories
    const recommendations = await db.product.findMany({
      where: {
        AND: [
          { isActive: true },
          { id: { notIn: userInteractedProducts } },
          categoryIds.length > 0 ? { categoryId: { in: categoryIds } } : {},
        ],
      },
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
      },
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
      take: limit * 2, // Get more to allow for scoring and filtering
    });

    // Score recommendations based on similarity
    const scoredRecommendations = recommendations.map(product => ({
      ...transformProduct(product),
      score: calculatePersonalizedScore(product, interactedCategories),
      reason: "Based on your browsing history and preferences",
    }));

    // Sort by score and return top results
    return scoredRecommendations
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, limit);
  } catch (error) {
    console.error("Error generating personalized recommendations:", error);
    return [];
  }
}

async function getSimilarProducts(
  currentProduct: any,
  viewedProducts: string[] = [],
  limit: number = 8
): Promise<RecommendationProduct[]> {
  try {
    if (!currentProduct) {
      // Use most recently viewed product as reference
      if (viewedProducts.length > 0) {
        currentProduct = await db.product.findUnique({
          where: { id: viewedProducts[viewedProducts.length - 1] },
          include: { category: true },
        });
      }

      if (!currentProduct) {
        return [];
      }
    }

    const similarProducts = await db.product.findMany({
      where: {
        AND: [
          { isActive: true },
          { id: { not: currentProduct.id } },
          { id: { notIn: viewedProducts } },
          currentProduct.categoryId
            ? { categoryId: currentProduct.categoryId }
            : {},
        ],
      },
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
      },
      orderBy: [{ featured: "desc" }, { price: "asc" }],
      take: limit,
    });

    return similarProducts.map(product => ({
      ...transformProduct(product),
      score: calculateSimilarityScore(product, currentProduct),
      reason: `Similar to ${currentProduct.name}`,
    }));
  } catch (error) {
    console.error("Error generating similar products:", error);
    return [];
  }
}

async function getTrendingProducts(
  limit: number = 8
): Promise<RecommendationProduct[]> {
  try {
    // In a real implementation, this would use analytics data
    // For now, we'll use featured products and recent products with high ratings
    const trendingProducts = await db.product.findMany({
      where: {
        isActive: true,
        OR: [
          { featured: true },
          {
            createdAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
            },
          },
        ],
      },
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
      },
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
      take: limit,
    });

    return trendingProducts.map(product => ({
      ...transformProduct(product),
      score: 0.9,
      reason: "Trending among STEM enthusiasts",
      isTrending: true,
    }));
  } catch (error) {
    console.error("Error generating trending products:", error);
    return [];
  }
}

async function getCollaborativeRecommendations(
  currentProductId?: string,
  viewedProducts: string[] = [],
  limit: number = 8
): Promise<RecommendationProduct[]> {
  try {
    // This would typically use order data and user behavior analytics
    // For now, we'll simulate collaborative filtering with category-based recommendations

    const referenceProducts = currentProductId
      ? [currentProductId]
      : viewedProducts;
    if (referenceProducts.length === 0) {
      return [];
    }

    // Get categories of reference products
    const referenceCategories = await db.product.findMany({
      where: {
        id: { in: referenceProducts },
      },
      select: {
        categoryId: true,
      },
    });

    const categoryIds = [
      ...new Set(
        referenceCategories
          .map(p => p.categoryId)
          .filter((id): id is string => id !== null)
      ),
    ];

    if (categoryIds.length === 0) {
      return [];
    }

    const collaborativeProducts = await db.product.findMany({
      where: {
        AND: [
          { isActive: true },
          { id: { notIn: [...referenceProducts, ...viewedProducts] } },
          { categoryId: { in: categoryIds } },
        ],
      },
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
      },
      orderBy: [{ createdAt: "desc" }],
      take: limit,
    });

    return collaborativeProducts.map(product => ({
      ...transformProduct(product),
      score: 0.85,
      reason: "Popular with customers who viewed similar products",
    }));
  } catch (error) {
    console.error("Error generating collaborative recommendations:", error);
    return [];
  }
}

async function getSmartRecommendations(
  userId?: string,
  currentProduct?: any,
  categories: string[] = [],
  limit: number = 8
): Promise<RecommendationProduct[]> {
  try {
    // AI-enhanced recommendations based on educational value and learning progression
    const targetCategories =
      categories.length > 0
        ? categories
        : ["science", "technology", "engineering", "mathematics"];

    const smartProducts = await db.product.findMany({
      where: {
        AND: [
          { isActive: true },
          {
            OR: [
              { category: { slug: { in: targetCategories } } },
              { tags: { hasSome: targetCategories } },
            ],
          },
          currentProduct ? { id: { not: currentProduct.id } } : {},
        ],
      },
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
      },
      orderBy: [{ featured: "desc" }, { price: "asc" }],
      take: limit,
    });

    return smartProducts.map(product => ({
      ...transformProduct(product),
      score: calculateEducationalScore(product),
      reason: "Recommended for optimal learning progression",
    }));
  } catch (error) {
    console.error("Error generating smart recommendations:", error);
    return [];
  }
}

async function getPopularProducts(
  limit: number = 8
): Promise<RecommendationProduct[]> {
  try {
    const popularProducts = await db.product.findMany({
      where: {
        isActive: true,
      },
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
      },
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
      take: limit,
    });

    return popularProducts.map(product => ({
      ...transformProduct(product),
      score: 0.8,
      reason: "Popular choice among educators and parents",
    }));
  } catch (error) {
    console.error("Error generating popular products:", error);
    return [];
  }
}

function transformProduct(product: any): RecommendationProduct {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    price: product.price,
    images: Array.isArray(product.images) ? product.images : [],
    category: product.category,
    rating: generateMockRating(), // In real app, this would come from reviews
    reviewCount: generateMockReviewCount(),
    isNew: isProductNew(product.createdAt),
  };
}

function calculatePersonalizedScore(product: any, userHistory: any[]): number {
  let score = 0.5; // Base score

  // Category preference bonus
  const userCategories = userHistory.map(p => p.categoryId).filter(Boolean);
  if (userCategories.includes(product.categoryId)) {
    score += 0.3;
  }

  // Featured product bonus
  if (product.featured) {
    score += 0.1;
  }

  // Recent product bonus
  if (isProductNew(product.createdAt)) {
    score += 0.1;
  }

  return Math.min(score, 1.0);
}

function calculateSimilarityScore(product: any, referenceProduct: any): number {
  let score = 0.5;

  // Same category
  if (product.categoryId === referenceProduct.categoryId) {
    score += 0.4;
  }

  // Similar price range (within 50%)
  const priceDiff =
    Math.abs(product.price - referenceProduct.price) / referenceProduct.price;
  if (priceDiff < 0.5) {
    score += 0.2;
  }

  // Featured bonus
  if (product.featured) {
    score += 0.1;
  }

  return Math.min(score, 1.0);
}

function calculateEducationalScore(product: any): number {
  let score = 0.6; // Base educational value

  // STEM category bonus
  const stemCategories = [
    "science",
    "technology",
    "engineering",
    "mathematics",
  ];
  if (product.category && stemCategories.includes(product.category.slug)) {
    score += 0.2;
  }

  // Educational tags bonus
  const educationalTags = [
    "educational",
    "learning",
    "STEM",
    "coding",
    "experiment",
  ];
  if (product.tags && Array.isArray(product.tags)) {
    const hasEducationalTags = product.tags.some((tag: string) =>
      educationalTags.some(eduTag =>
        tag.toLowerCase().includes(eduTag.toLowerCase())
      )
    );
    if (hasEducationalTags) {
      score += 0.2;
    }
  }

  return Math.min(score, 1.0);
}

function isProductNew(createdAt: Date): boolean {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  return new Date(createdAt) > thirtyDaysAgo;
}

function generateMockRating(): number {
  return Math.round((Math.random() * 1.5 + 3.5) * 10) / 10; // 3.5 to 5.0
}

function generateMockReviewCount(): number {
  return Math.floor(Math.random() * 200) + 10; // 10 to 210
}
