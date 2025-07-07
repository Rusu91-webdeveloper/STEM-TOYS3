import { NextRequest, NextResponse } from "next/server";

import {
  withErrorHandling,
  badRequest,
  notFound,
  handleZodError,
  handleUnexpectedError,
} from "@/lib/api-error";
import {
  getCached,
  CacheKeys,
  invalidateCache,
  invalidateCachePattern,
} from "@/lib/cache";
import { db } from "@/lib/db";
import { withRateLimit } from "@/lib/rate-limit";
import { applyStandardHeaders } from "@/lib/response-headers";
import { getCacheKey } from "@/lib/utils/cache-key";
import { getFilterParams } from "@/lib/utils/filtering";
import { getPaginationParams } from "@/lib/utils/pagination";

export const GET = withRateLimit(
  async (request: NextRequest) => {
    try {
      const searchParams = request.nextUrl.searchParams;
      const { page, limit, skip } = getPaginationParams(searchParams, {
        defaultLimit: 20,
        maxLimit: 100,
      });
      // No filters currently, but set up for future
      const filters = getFilterParams(searchParams, []);
      // Use shared cache key utility
      const cacheKey = getCacheKey("categories", { ...filters, page, limit });
      // --- Caching logic start ---
      const CACHE_TTL = 2 * 60 * 1000; // 2 minutes
      const categoriesWithCounts = await getCached(
        cacheKey,
        async () => {
          // Use Promise.all to fetch categories and book count concurrently
          const [categories, bookCount] = await Promise.all([
            db.category.findMany({
              where: {
                isActive: true,
              },
              orderBy: {
                name: "asc",
              },
              include: {
                _count: {
                  select: {
                    products: {
                      where: {
                        isActive: true,
                      },
                    },
                  },
                },
              },
            }),
            // Also get the count of all active books
            db.book.count({
              where: {
                isActive: true,
              },
            }),
          ]);

          // Transform the response to include product counts
          return categories.map(category => {
            let productCount = category._count.products;
            if (category.slug === "educational-books") {
              productCount = bookCount;
            }
            return {
              ...category,
              productCount,
              _count: undefined, // Remove the internal _count object
            };
          });
        },
        CACHE_TTL
      );
      // --- Caching logic end ---

      const response = applyStandardHeaders(
        NextResponse.json(categoriesWithCounts),
        { cache: "public" }
      );
      return response;
    } catch (error) {
      return applyStandardHeaders(
        handleUnexpectedError("Failed to fetch categories"),
        { cache: "public" }
      );
    }
  },
  { limit: 60, windowMs: 10 * 60 * 1000 }
);
