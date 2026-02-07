import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import { getCached } from "@/lib/cache";
import { TIME } from "@/lib/constants";
import { db } from "@/lib/db";
import { withPerformanceMonitoring } from "@/lib/performance";
import { getCacheKey } from "@/lib/utils/cache-key";
import { getFilterParams } from "@/lib/utils/filtering";
import { getPaginationParams } from "@/lib/utils/pagination";
// Validation imports removed as they're currently unused

// Type definitions to help with type safety
// type StemCategoryMap = {
//   science: string[];
//   technology: string[];
//   engineering: string[];
//   mathematics: string[];
//   "educational-books": string[];
// };

// ⚡ E-COMMERCE OPTIMIZED CACHING: Balance between performance and freshness
// Cache is re-enabled with e-commerce best practices and automatic invalidation
const CACHE_DURATIONS = {
  FEATURED_PRODUCTS: 3 * 60 * 1000, // 3 minutes - Homepage cached longer (high traffic)
  CATEGORY_PRODUCTS: 2 * 60 * 1000, // 2 minutes - Category browsing pages
  SEARCH_RESULTS: 1 * 60 * 1000, // 1 minute - Search needs fresher data for inventory
  GENERAL_LISTING: 2 * 60 * 1000, // 2 minutes - General product listings
};

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
      maxLimit: 1000, // allow larger batches for client-side filtering on /products
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

    // **PERFORMANCE**: Optimized cache key generation with reduced fragmentation
    const cacheKey = getCacheKey("products", {
      // Only include non-null values to reduce cache fragmentation
      ...(category && { category }),
      ...(featured && { featured }),
      ...(minPrice !== undefined && { minPrice }),
      ...(maxPrice !== undefined && { maxPrice }),
      ...(search && { search: search.slice(0, 50) }), // Limit search term length
      ...(sort && { sort }),
      page,
      limit,
      // Include new filters only if they have values
      ...(ageGroup && { ageGroup }),
      ...(stemDiscipline && { stemDiscipline }),
      ...(learningOutcomes?.length && {
        learningOutcomes: learningOutcomes.slice(0, 3).join(","), // Limit to 3 outcomes
      }),
      ...(productType && { productType }),
      ...(specialCategories?.length && {
        specialCategories: specialCategories.slice(0, 3).join(","), // Limit to 3 categories
      }),
    });

    // **PERFORMANCE**: Determine cache duration based on query type
    let cacheDuration = CACHE_DURATIONS.GENERAL_LISTING;

    if (featured === "true" && !category && !search) {
      cacheDuration = CACHE_DURATIONS.FEATURED_PRODUCTS;
    } else if (category && !search) {
      cacheDuration = CACHE_DURATIONS.CATEGORY_PRODUCTS;
    } else if (search) {
      cacheDuration = CACHE_DURATIONS.SEARCH_RESULTS;
    }

    // ⚡ SMART CACHING: Featured products with short TTL + auto-invalidation
    if (
      featured === "true" &&
      !category &&
      !search &&
      !ageGroup &&
      !stemDiscipline
    ) {
      try {
        const cachedResult = await getCached(
          `featured_products_${limit}_${page}`,
          () => fetchFeaturedProductsFast({ limit, page }),
          CACHE_DURATIONS.FEATURED_PRODUCTS // 1 minute cache
        );

        if (cachedResult && cachedResult.products?.length > 0) {
          const response = NextResponse.json(cachedResult);
          response.headers.set("X-Cache", "HIT-FAST");
          response.headers.set("Cache-Control", "no-store");
          return response;
        }
      } catch (cacheError) {
        console.warn(
          "Fast cache failed, falling back to normal query:",
          cacheError
        );
      }
    }

    // ⚡ SMART CACHING: Redis cache with short TTL + auto-invalidation
    // Cache is automatically cleared when products are created/updated/approved
    try {
      const cachedResult = await getCached(
        cacheKey,
        () =>
          fetchProductsFromDatabase({
            category,
            featured,
            minPrice,
            maxPrice,
            search,
            sort,
            limit,
            page,
            ageGroup,
            stemDiscipline,
            learningOutcomes,
            productType,
            specialCategories,
          }),
        cacheDuration
      );

      const response = NextResponse.json(cachedResult);
      response.headers.set("X-Cache", "HIT");
      response.headers.set("Cache-Control", "no-store");
      return response;
    } catch (cacheError) {
      console.warn(
        "Cache error, falling back to direct database query:",
        cacheError
      );
      // Fall through to direct query
    }

    // **FALLBACK**: Direct database query if cache fails
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
    response.headers.set("Cache-Control", "no-store");

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

  // Check if educational-books category is requested
  const includeBooks = category
    ?.split(",")
    .some(cat => cat.trim().toLowerCase() === "educational-books");

  // **PERFORMANCE**: Build optimized where clause
  const where: Prisma.ProductWhereInput = {
    isActive: true,
    status: "APPROVED",
  };

  // Always exclude products in "educational-books" category
  // Books are handled separately via the /api/books endpoint or included via includeBooks logic below
  if (!category) {
    // Include uncategorized products in the default listing
    where.OR = [
      { category: { slug: { not: "educational-books" } } },
      { categoryId: null },
    ];
  } else {
    where.category = {
      slug: { not: "educational-books" },
    };
  }

  // **PERFORMANCE**: Optimized category filtering with better query patterns
  if (category) {
    const categories = category.split(",").map(cat => cat.trim().toLowerCase());
    const validStemDisciplines = [
      "science",
      "technology",
      "engineering",
      "mathematics",
    ];

    // Build category conditions with optimized patterns
    const categoryConditions = categories
      .map(normalizedCategory => {
        const isValidStemDiscipline =
          validStemDisciplines.includes(normalizedCategory);

        if (isValidStemDiscipline) {
          // **PERFORMANCE**: Use single field check first for better index utilization
          return {
            stemDiscipline: normalizedCategory.toUpperCase() as any,
          };
        } else if (normalizedCategory === "educational-books") {
          // Skip educational-books category in products query
          // Books are handled separately via the /api/books endpoint or included via includeBooks logic
          return null; // This will be filtered out
        } else {
          // For other categories, check category slug
          return {
            category: {
              slug: normalizedCategory,
              isActive: true,
            },
          };
        }
      })
      .filter((condition): condition is NonNullable<typeof condition> => condition !== null);

    // **PERFORMANCE**: Use more efficient OR conditions
    if (categoryConditions.length > 1) {
      where.OR = categoryConditions;
    } else if (categoryConditions.length === 1) {
      // Merge single condition directly to avoid OR wrapper
      Object.assign(where, categoryConditions[0]);
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

  // **PERFORMANCE**: Ultra-optimized search using database full-text search
  if (search) {
    const searchTerm = search.toLowerCase().trim();
    if (searchTerm.length > 0) {
      // **PERFORMANCE**: Use database-level full-text search for better performance
      // This leverages the GIN trigram indexes we created
      const searchConditions = [];

      // Primary search: name field (fastest, most relevant)
      searchConditions.push({
        name: { contains: searchTerm, mode: "insensitive" },
      });

      // Secondary search: description for longer terms
      if (searchTerm.length >= 3) {
        searchConditions.push({
          description: { contains: searchTerm, mode: "insensitive" },
        });
      }

      // Tertiary search: tags for very specific terms
      if (searchTerm.length >= 5 && !searchTerm.includes(" ")) {
        searchConditions.push({ tags: { hasSome: [searchTerm] } });
      }

      // **PERFORMANCE**: Optimized OR logic to prevent query planner issues
      if (where.OR) {
        where.AND = where.AND || [];
        where.AND.push({ OR: where.OR });
        where.AND.push({ OR: searchConditions });
        delete where.OR;
      } else {
        where.OR = searchConditions;
      }
    }
  }

  // New categorization filters
  if (ageGroup) {
    (where as any).ageGroup = ageGroup;
  }

  if (stemDiscipline) {
    (where as any).stemDiscipline = stemDiscipline;
  }

  // learningOutcomes, productType, specialCategories are in metadata (JSON), not columns.
  // Filtering is done client-side after extraction from metadata in the response.

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
        // **PERFORMANCE-FIX**: Ultra-optimized query for featured products
        if (
          featured === "true" &&
          !category &&
          !search &&
          !ageGroup &&
          !stemDiscipline
        ) {
          // **PERFORMANCE**: Use perfect composite index for homepage-style queries
          const queryOptions = {
            where: {
              isActive: true,
              status: "APPROVED",
              featured: true,
            },
            orderBy: {
              // **PERFORMANCE**: Single field sort leverages composite index perfectly
              createdAt: "desc" as const,
            },
            skip,
            take: limit,
            // **FIX**: Include all product fields including categorization data
            include: optimizedIncludes,
          };

          // **PERFORMANCE**: Parallel queries for optimal performance
          return Promise.all([
            db.product.findMany(queryOptions),
            db.product.count({
              where: {
                isActive: true,
                status: "APPROVED",
                featured: true,
              },
            }),
          ]);
        }
        // For regular products, include category data
        const queryOptions = {
          where,
          include: optimizedIncludes,
          orderBy,
          skip,
          take: limit,
        };

        // **PERFORMANCE**: Handle books in transaction for consistency
        if (includeBooks) {
          return db.$transaction([
            db.product.findMany(queryOptions),
            db.product.count({ where }),
            db.book.findMany({
              where: {
                isActive: true,
                ...(minPrice !== undefined || maxPrice !== undefined
                  ? {
                      price: {
                        ...(minPrice !== undefined ? { gte: minPrice } : {}),
                        ...(maxPrice !== undefined ? { lte: maxPrice } : {}),
                      },
                    }
                  : {}),
                ...(search
                  ? {
                      OR: [
                        { name: { contains: search, mode: "insensitive" } },
                        {
                          description: {
                            contains: search,
                            mode: "insensitive",
                          },
                        },
                        { author: { contains: search, mode: "insensitive" } },
                      ],
                    }
                  : {}),
              },
              include: {
                languages: true,
              },
              orderBy: { createdAt: "desc" },
              take: limit, // **PERFORMANCE**: Limit books to prevent overwhelming results
              skip: (page - 1) * limit,
            }),
            db.book.count({
              where: {
                isActive: true,
                ...(minPrice !== undefined || maxPrice !== undefined
                  ? {
                      price: {
                        ...(minPrice !== undefined ? { gte: minPrice } : {}),
                        ...(maxPrice !== undefined ? { lte: maxPrice } : {}),
                      },
                    }
                  : {}),
                ...(search
                  ? {
                      OR: [
                        { name: { contains: search, mode: "insensitive" } },
                        {
                          description: {
                            contains: search,
                            mode: "insensitive",
                          },
                        },
                        { author: { contains: search, mode: "insensitive" } },
                      ],
                    }
                  : {}),
              },
            }),
          ]);
        }

        return db.$transaction([
          db.product.findMany(queryOptions),
          db.product.count({ where }),
        ]);
      }
    );

    const fetchResult = await fetchProducts();
    let products,
      totalCount,
      books = [],
      bookCount = 0;

    if (includeBooks && fetchResult.length === 4) {
      [products, totalCount, books, bookCount] = fetchResult;
    } else {
      [products, totalCount] = fetchResult;
    }

    // Transform books to product-like structure if included
    const transformedBooks = books.map((book: any) => ({
      id: book.id,
      name: book.name,
      slug: book.slug,
      description: book.description,
      price: book.price,
      compareAtPrice: null,
      images: book.coverImage ? [book.coverImage] : [],
      category: {
        id: "educational-books",
        name: "Educational Books",
        slug: "educational-books",
      },
      tags: ["book", "educational"],
      attributes: {
        author: book.author,
        languages: book.languages?.map((lang: any) => lang.name) || [],
      },
      isActive: book.isActive,
      createdAt: book.createdAt,
      updatedAt: book.updatedAt,
      stockQuantity: 10,
      featured: true,
      isBook: true, // Flag to identify this as a book
      sku: `BOOK-${book.id}`,
      weight: 0.5, // Default book weight
      dimensions: null,
      averageRating: 0,
      reviewCount: 0,
      totalSold: 0,
    }));

    if (process.env.NODE_ENV === "development") {
      console.warn(
        `Found ${products.length} products and ${transformedBooks.length} books matching criteria`
      );
    }

    // **PERFORMANCE**: Optimized data transformation
    const allProducts = [...products, ...transformedBooks];
    const combinedTotalCount = totalCount + bookCount;

    const transformedProducts = allProducts.map((product: any) => {
      // If this is already a transformed book, return it as-is
      if (product.isBook) {
        return product;
      }

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
        // Include new categorization fields (from metadata JSON)
        ageGroup: product.ageGroup,
        stemDiscipline: product.stemDiscipline,
        learningOutcomes:
          (product.metadata as Record<string, unknown>)?.learningOutcomes ??
          product.learningOutcomes,
        productType:
          (product.metadata as Record<string, unknown>)?.productType ??
          product.productType,
        specialCategories:
          (product.metadata as Record<string, unknown>)?.specialCategories ??
          product.specialCategories,
      };

      // **PERFORMANCE**: Faster attribute extraction
      if (product.attributes && typeof product.attributes === "object") {
        const attrs = product.attributes as Record<string, unknown>;
        // Note: stemDiscipline is now a proper database field, no need to extract from attributes
        if (attrs.ageRange && typeof attrs.ageRange === "string") {
          (productData as typeof productData & { ageRange: string }).ageRange =
            attrs.ageRange;
        }
      }

      return productData;
    });

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

      // Enhanced diagnostic logging for product visibility debugging
      console.log("📦 Products API Response:", {
        totalProducts: transformedProducts.length,
        totalCount: combinedTotalCount,
        page,
        limit,
        cacheKey: params.category || "all",
        productIds: transformedProducts.slice(0, 5).map(p => ({
          id: p.id,
          name: p.name,
          createdAt: p.createdAt,
          status: (p as any).status,
          isActive: p.isActive,
        })),
      });
    }

    const responseData = {
      products: transformedProducts,
      pagination: {
        page,
        limit,
        total: combinedTotalCount,
        totalPages: Math.ceil(combinedTotalCount / limit),
        hasNext: page * limit < combinedTotalCount,
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

// **PERFORMANCE**: Ultra-fast featured products query
async function fetchFeaturedProductsFast(params: {
  limit: number;
  page: number;
}) {
  const { limit, page } = params;

  try {
    const startTime = Date.now();

    // **PERFORMANCE**: Use optimized query with minimal fields for speed
    const products = await db.product.findMany({
      where: {
        isActive: true,
        status: "APPROVED",
        featured: true,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        price: true,
        compareAtPrice: true,
        images: true,
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
      skip: (page - 1) * limit,
    });

    const totalCount = await db.product.count({
      where: {
        isActive: true,
        status: "APPROVED",
        featured: true,
      },
    });

    const executionTime = Date.now() - startTime;

    if (process.env.NODE_ENV === "development") {
      console.log(
        `⚡ FAST Featured query: ${executionTime}ms for ${products.length} products`
      );
    }

    return {
      products,
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
        itemsCount: products.length,
        queryOptimizations: true,
        cached: false,
        fastQuery: true,
      },
    };
  } catch (error) {
    console.error("Fast featured products query failed:", error);
    throw error;
  }
}

// After any product mutation (POST, PUT, DELETE), add:
// await invalidateCachePattern('products:');
// await invalidateCachePattern('product:');
