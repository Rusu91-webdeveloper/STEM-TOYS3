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

// Category mapping from production database slugs to standard STEM categories
const categoryMapping = {
  // Science categories
  "science-kits": "science",
  geology: "science",

  // Technology categories
  electronics: "technology",
  programming: "technology",
  robotics: "technology",

  // Engineering categories
  "construction-sets": "engineering",

  // Mathematics categories
  matematic: "mathematics",

  // Educational content
  "educaie-stem": "educational-books",
};

// Standard STEM categories with translations
const standardCategories = {
  science: {
    en: "Science",
    ro: "Știință",
  },
  technology: {
    en: "Technology",
    ro: "Tehnologie",
  },
  engineering: {
    en: "Engineering",
    ro: "Inginerie",
  },
  mathematics: {
    en: "Mathematics",
    ro: "Matematică",
  },
  "educational-books": {
    en: "Educational Books",
    ro: "Cărți Educaționale",
  },
};

// GET - List all categories
export const GET = withRateLimit(
  async (request: NextRequest) => {
    try {
      // Get locale from cookies, default to "en"
      const { cookies } = await import("next/headers");
      const cookieStore = await cookies();
      const locale = cookieStore.get("locale")?.value ?? "en";

      // Fetch production categories from database
      const dbCategories = await db.category.findMany({
        select: {
          id: true,
          name: true,
          slug: true,
        },
        where: {
          isActive: true,
        },
        orderBy: {
          name: "asc",
        },
      });

      // Group production categories by their mapped standard category
      const groupedCategories = new Map<string, string[]>();

      dbCategories.forEach(cat => {
        const standardCategory =
          categoryMapping[cat.slug as keyof typeof categoryMapping];
        if (standardCategory) {
          if (!groupedCategories.has(standardCategory)) {
            groupedCategories.set(standardCategory, []);
          }
          groupedCategories.get(standardCategory)!.push(cat.slug);
        }
      });

      // Create the 5 standard STEM categories with proper translations
      const categories = Object.keys(standardCategories).map(standardSlug => {
        const productionSlugs = groupedCategories.get(standardSlug) || [];

        return {
          id: standardSlug,
          name:
            standardCategories[standardSlug as keyof typeof standardCategories][
              locale as "en" | "ro"
            ] ||
            standardCategories[standardSlug as keyof typeof standardCategories]
              .en,
          slug: standardSlug,
          // Include production slugs for debugging/compatibility
          productionSlugs: productionSlugs,
        };
      });

      return NextResponse.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  },
  {
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 100, // 100 requests per window
  }
);
