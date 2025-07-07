import { Prisma, Product } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import {
  getCached,
  CacheKeys,
  invalidateCache,
  invalidateCachePattern,
} from "@/lib/cache";
import { TIME } from "@/lib/constants";
import { db } from "@/lib/db";
import { withPerformanceMonitoring } from "@/lib/performance";
import {
  validateQueryParams,
  productQuerySchema,
  createValidationErrorResponse,
  type ValidatedProductQuery,
} from "@/lib/validations/api";
import { getPaginationParams } from "@/lib/utils/pagination";
import { getFilterParams } from "@/lib/utils/filtering";
import { getCacheKey } from "@/lib/utils/cache-key";

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
    const { page, limit, skip } = getPaginationParams(searchParams, {
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
    ]);
    // Normalize and parse filter values for DB
    const category = filters.category ? String(filters.category) : undefined;
    const featured = filters.featured ? String(filters.featured) : undefined;
    const minPrice = filters.minPrice ? Number(filters.minPrice) : undefined;
    const maxPrice = filters.maxPrice ? Number(filters.maxPrice) : undefined;
    const search = filters.search ? String(filters.search) : undefined;
    const sort = filters.sort ? String(filters.sort) : undefined;
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
    });

    // **PERFORMANCE**: Check cache first with distributed caching
    try {
      const cachedResult = await getCached(
        cacheKey,
        async () =>
          // This will only run if cache miss
          await fetchProductsFromDatabase({
            category,
            featured,
            minPrice,
            maxPrice,
            search,
            sort,
            limit,
            page,
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
}) {
  const { category, featured, minPrice, maxPrice, search, sort, limit, page } =
    params;

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
      // Use attributes for STEM categories (faster than string matching)
      where.attributes = {
        path: ["stemCategory"],
        equals: normalizedCategory,
      };
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

  console.log("API Request Params:", {
    category: category || null,
    featured: featured || null,
    minPrice: minPrice || null,
    maxPrice: maxPrice || null,
  });

  console.log("Final query where clause:", JSON.stringify(where, null, 2));

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
      async () => {
        // **PERFORMANCE-FIX**: Conditionally include category data
        // Avoid the JOIN for featured products query to improve speed
        const queryOptions: {
          where: Prisma.ProductWhereInput;
          include?: typeof optimizedIncludes;
          orderBy: any;
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

    console.log(`Found ${products.length} products matching criteria`);

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
        };

        // **PERFORMANCE**: Faster attribute extraction
        if (product.attributes && typeof product.attributes === "object") {
          const attrs = product.attributes as Record<string, any>;
          if (attrs.stemCategory) {
            (productData as any).stemCategory = attrs.stemCategory;
          }
          if (attrs.ageRange) {
            (productData as any).ageRange = attrs.ageRange;
          }
        }

        return productData;
      }
    );

    const executionTime = Date.now() - startTime;

    console.log("Response structure format:", {
      count: products.length,
      totalCount,
      page,
      limit,
      hasProducts: true,
      format: "paginated",
    });

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

    console.log(
      `API response structure: [${transformedProducts.map((_, i) => `'${i}'`)}]`
    );

    console.log("[INFO] Performance Metric", {
      success: true,
      resultSize: transformedProducts.length,
      performance: {
        operation: "product_list_query",
        duration: executionTime,
        timestamp: Date.now(),
      },
    });

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
