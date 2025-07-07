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
      const searchParams = new URL(request.url).searchParams;
      const { page, limit, skip } = getPaginationParams(searchParams, {
        defaultLimit: 10,
        maxLimit: 100,
      });
      const filters = getFilterParams(searchParams, ["slug", "language"]);
      const slug = filters.slug ? String(filters.slug) : undefined;
      const language = filters.language ? String(filters.language) : undefined;
      const cacheKey = getCacheKey("books", { slug, language, page, limit });

      // Build where clause
      const where = {
        ...(slug ? { slug } : {}),
      };

      const include = {
        languages: true,
        ...(language ? { languages: { where: { code: language } } } : {}),
      };

      // --- Caching logic start ---
      const CACHE_TTL = 2 * 60 * 1000; // 2 minutes

      const books = await getCached(
        cacheKey,
        async () => {
          try {
            return await db.book.findMany({
              where,
              include,
              orderBy: {
                createdAt: "desc",
              },
            });
          } catch (error) {
            console.error("Database query error:", error);
            throw error;
          }
        },
        CACHE_TTL
      );
      // --- Caching logic end ---

      // Create response with books
      const response = applyStandardHeaders(NextResponse.json(books), {
        cache: "public",
      });
      return response;
    } catch (error) {
      console.error("Error fetching books:", error);
      return applyStandardHeaders(
        NextResponse.json({ error: "Failed to fetch books" }, { status: 500 }),
        { cache: "public" }
      );
    }
  },
  { limit: 60, windowMs: 10 * 60 * 1000 }
);
