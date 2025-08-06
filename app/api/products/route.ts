import { Prisma, Product } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import { getCached } from "@/lib/cache";
import { TIME } from "@/lib/constants";
import { db } from "@/lib/db";
import { withPerformanceMonitoring } from "@/lib/performance";
import { getCacheKey } from "@/lib/utils/cache-key";
import { getFilterParams } from "@/lib/utils/filtering";
import { getPaginationParams } from "@/lib/utils/pagination";
// Validation imports removed as they're currently unused

type ProductWithOptionalCategory = Product & {
  category?: {
    id: string;
    name: string;
    slug: string;
  } | null;
};

// Type definitions to help with type safety
type StemCategoryMap = {
  science: string[];
  technology: string[];
  engineering: string[];
  mathematics: string[];
  "educational-books": string[];
};

// **PERFORMANCE**: Cache duration for product queries
const CACHE_DURATION = TIME.CACHE_DURATION.SHORT; // 2 minutes cache

// **PERFORMANCE**: Optimized includes to prevent over-fetching
const optimizedIncludes = {
  category: {
    select: {
      id: true,
      name: true,
      slug: true,
      image: true,
    },
  },
};

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const { page, limit } = getPaginationParams(searchParams, {
      defaultLimit: 12,
      maxLimit: 100,
    });
    const filters = getFilterParams(searchParams, [
      "category",
      "featured",
      "minPrice",
      "maxPrice",
      "search",
      "sort",
      // New categorization filters
      "ageGroup",
      "stemDiscipline",
      "learningOutcomes",
      "productType",
      "specialCategories",
    ]);
    // Normalize and parse filter values for DB
    const category = filters.category ? String(filters.category) : undefined;
    const featured = filters.featured ? String(filters.featured) : undefined;
    const minPrice = filters.minPrice ? Number(filters.minPrice) : undefined;
    const maxPrice = filters.maxPrice ? Number(filters.maxPrice) : undefined;
    const search = filters.search ? String(filters.search) : undefined;
    const sort = filters.sort ? String(filters.sort) : undefined;

    // New categorization filters
    const ageGroup = filters.ageGroup ? String(filters.ageGroup) : undefined;
    const stemDiscipline = filters.stemDiscipline
      ? String(filters.stemDiscipline)
      : undefined;
    const learningOutcomes = filters.learningOutcomes
      ? String(filters.learningOutcomes).split(",")
      : undefined;
    const productType = filters.productType
      ? String(filters.productType)
      : undefined;
    const specialCategories = filters.specialCategories
      ? String(filters.specialCategories).split(",")
      : undefined;

    // Use shared cache key utility
    const cacheKey = getCacheKey("products", {
      category,
      featured,
      minPrice,
      maxPrice,
      search,
      sort,
      page,
      limit,
      // Include new filters in cache key
      ageGroup,
      stemDiscipline,
      learningOutcomes,
      productType,
      specialCategories,
    });

    // **PERFORMANCE**: Check cache first with distributed caching
    try {
      const cachedResult = await getCached(
        cacheKey,
        () =>
          // This will only run if cache miss
          fetchProductsFromDatabase({
            category,
            featured,
            minPrice,
            maxPrice,
            search,
            sort,
            limit,
            page,
            // Pass new filters to database function
            ageGroup,
            stemDiscipline,
            learningOutcomes,
            productType,
            specialCategories,
          }),
        CACHE_DURATION
      );

      const response = NextResponse.json(cachedResult);
      response.headers.set("X-Cache", "HIT");
      response.headers.set(
        "Cache-Control",
        "public, max-age=120, s-maxage=120, stale-while-revalidate=300"
      );
      return response;
    } catch (cacheError) {
      console.warn(
        "Cache error, falling back to direct database query:",
        cacheError
      );
      // Fall back to direct database query if cache fails
    }

    // **PERFORMANCE**: Direct database query as fallback
    const result = await fetchProductsFromDatabase({
      category,
      featured,
      minPrice,
      maxPrice,
      search,
      sort,
      limit,
      page,
      // Pass new filters to database function
      ageGroup,
      stemDiscipline,
      learningOutcomes,
      productType,
      specialCategories,
    });

    const response = NextResponse.json(result);
    response.headers.set("X-Cache", "MISS");
    response.headers.set(
      "Cache-Control",
      "public, max-age=60, s-maxage=60, stale-while-revalidate=120"
    );

    return response;
  } catch (error) {
    console.error("Products API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function fetchProductsFromDatabase(params: {
  category?: string;
  featured?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  sort?: string;
  limit: number;
  page: number;
  // New categorization filter parameters
  ageGroup?: string;
  stemDiscipline?: string;
  learningOutcomes?: string[];
  productType?: string;
  specialCategories?: string[];
}) {
  const {
    category,
    featured,
    minPrice,
    maxPrice,
    search,
    sort,
    limit,
    page,
    // Destructure new filters
    ageGroup,
    stemDiscipline,
    learningOutcomes,
    productType,
    specialCategories,
  } = params;

  // **PERFORMANCE**: Build optimized where clause
  const where: Prisma.ProductWhereInput = {
    isActive: true,
  };

  // **PERFORMANCE**: Optimized category filtering
  if (category) {
    const normalizedCategory = category.toLowerCase();

    // STEM categories mapping with better performance
    const stemCategoryMap: StemCategoryMap = {
      science: ["fizica", "chimie", "biologie", "astronomie"],
      technology: ["programare", "robotica", "electronica"],
      engineering: ["constructii", "mecanica", "inginerie"],
      mathematics: ["matematica", "geometrie", "algebra"],
      "educational-books": ["carti-educationale", "manuale"],
    };

    if (stemCategoryMap[normalizedCategory as keyof StemCategoryMap]) {
      // For STEM categories, check both attributes.stemCategory AND category.slug
      where.OR = [
        {
          attributes: {
            path: ["stemCategory"],
            equals: normalizedCategory,
          },
        },
        {
          category: {
            slug: normalizedCategory,
            isActive: true,
          },
        },
      ];
    } else {
      // Single query for custom categories
      where.category = {
        slug: normalizedCategory,
        isActive: true,
      };
    }
  }

  // **PERFORMANCE**: Optimized price filtering
  if (minPrice !== undefined || maxPrice !== undefined) {
    where.price = {};
    if (minPrice !== undefined) where.price.gte = minPrice;
    if (maxPrice !== undefined) where.price.lte = maxPrice;
  }

  // Handle featured products filter
  if (featured === "true") {
    where.featured = true;
  }

  // **PERFORMANCE**: Optimized search with proper indexing
  if (search) {
    const searchTerm = search.toLowerCase();
    where.OR = [
      { name: { contains: searchTerm, mode: "insensitive" } },
      { description: { contains: searchTerm, mode: "insensitive" } },
      { tags: { hasSome: [searchTerm] } },
    ];
  }

  // New categorization filters
  if (ageGroup) {
    (where as any).ageGroup = ageGroup;
  }

  if (stemDiscipline) {
    (where as any).stemDiscipline = stemDiscipline;
  }

  if (learningOutcomes && learningOutcomes.length > 0) {
    (where as any).learningOutcomes = {
      hasEvery: learningOutcomes,
    };
  }

  if (productType) {
    (where as any).productType = productType;
  }

  if (specialCategories && specialCategories.length > 0) {
    (where as any).specialCategories = {
      hasEvery: specialCategories,
    };
  }

  // Debug logging for API request params
  if (process.env.NODE_ENV === "development") {
    console.warn("API Request Params:", {
      category: category ?? null,
      featured: featured ?? null,
      minPrice: minPrice ?? null,
      maxPrice: maxPrice ?? null,
      // Log new filters
      ageGroup: ageGroup ?? null,
      stemDiscipline: stemDiscipline ?? null,
      learningOutcomes: learningOutcomes ?? null,
      productType: productType ?? null,
      specialCategories: specialCategories ?? null,
    });

    console.warn("Final query where clause:", JSON.stringify(where, null, 2));
  }

  try {
    const startTime = Date.now();

    // **PERFORMANCE**: Calculate pagination
    const skip = (page - 1) * limit;

    // **PERFORMANCE**: Optimized sort order
    const orderBy = (() => {
      switch (sort) {
        case "name":
          return { name: "asc" as const };
        case "price":
          return { price: "asc" as const };
        case "featured":
          return [
            { featured: "desc" as const },
            { createdAt: "desc" as const },
          ];
        case "created":
        default:
          return { createdAt: "desc" as const };
      }
    })();

    // **PERFORMANCE**: Execute optimized parallel queries
    const fetchProducts = withPerformanceMonitoring(
      "product_list_query",
      () => {
        // **PERFORMANCE-FIX**: Conditionally include category data
        // Avoid the JOIN for featured products query to improve speed
        const queryOptions: {
          where: Prisma.ProductWhereInput;
          include?: typeof optimizedIncludes;
          orderBy:
            | Prisma.ProductOrderByWithRelationInput
            | Prisma.ProductOrderByWithRelationInput[];
          skip: number;
          take: number;
        } = {
          where,
          orderBy,
          skip,
          take: limit,
        };

        if (featured !== "true") {
          queryOptions.include = optimizedIncludes;
        }

        // Use an interactive transaction for concurrent execution
        return db.$transaction([
          db.product.findMany(queryOptions),
          db.product.count({ where }),
        ]);
      }
    );

    const [products, totalCount] = await fetchProducts();

    if (process.env.NODE_ENV === "development") {
      console.warn(`Found ${products.length} products matching criteria`);
    }

    // **PERFORMANCE**: Optimized data transformation
    const transformedProducts = (products as ProductWithOptionalCategory[]).map(
      product => {
        const productData = {
          id: product.id,
          name: product.name,
          slug: product.slug,
          description: product.description,
          price: product.price,
          compareAtPrice: product.compareAtPrice,
          images: product.images,
          featured: product.featured,
          isActive: product.isActive,
          stockQuantity: product.stockQuantity,
          reservedQuantity: product.reservedQuantity,
          category: product.category
            ? {
                id: product.category.id,
                name: product.category.name,
                slug: product.category.slug,
              }
            : null,
          attributes: product.attributes,
          tags: product.tags,
          // Include new categorization fields
          ageGroup: (product as any).ageGroup,
          stemDiscipline: (product as any).stemDiscipline,
          learningOutcomes: (product as any).learningOutcomes,
          productType: (product as any).productType,
          specialCategories: (product as any).specialCategories,
        };

        // **PERFORMANCE**: Faster attribute extraction
        if (product.attributes && typeof product.attributes === "object") {
          const attrs = product.attributes as Record<string, unknown>;
          if (attrs.stemCategory && typeof attrs.stemCategory === "string") {
            (
              productData as typeof productData & { stemCategory: string }
            ).stemCategory = attrs.stemCategory;
          }
          if (attrs.ageRange && typeof attrs.ageRange === "string") {
            (
              productData as typeof productData & { ageRange: string }
            ).ageRange = attrs.ageRange;
          }
        }

        return productData;
      }
    );

    const executionTime = Date.now() - startTime;

    if (process.env.NODE_ENV === "development") {
      console.warn("Response structure format:", {
        count: products.length,
        totalCount,
        page,
        limit,
        hasProducts: true,
        format: "paginated",
      });
    }

    const responseData = {
      products: transformedProducts,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNext: page * limit < totalCount,
        hasPrevious: page > 1,
      },
      meta: {
        executionTime,
        itemsCount: transformedProducts.length,
        queryOptimizations: true,
        cached: false,
      },
    };

    if (process.env.NODE_ENV === "development") {
      console.warn(
        `API response structure: [${transformedProducts.map((_, i) => `'${i}'`)}]`
      );

      console.warn("[INFO] Performance Metric", {
        success: true,
        resultSize: transformedProducts.length,
        performance: {
          operation: "product_list_query",
          duration: executionTime,
          timestamp: Date.now(),
        },
      });
    }

    if (executionTime > 500) {
      console.warn(`[WARN] Slow database operation detected`, {
        operation: "product_list_query",
        duration: executionTime,
        params: JSON.stringify(params),
      });
    }

    return responseData;
  } catch (dbError) {
    console.error("Database error when fetching products:", dbError);
    throw new Error("Database query failed");
  }
}

// After any product mutation (POST, PUT, DELETE), add:
// await invalidateCachePattern('products:');
// await invalidateCachePattern('product:');
