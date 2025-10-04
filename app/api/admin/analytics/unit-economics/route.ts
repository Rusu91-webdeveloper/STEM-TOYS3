import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getCached, CacheKeys, invalidateCachePattern } from "@/lib/cache";
import { withRateLimit } from "@/lib/rate-limit";
import {
  validateUnitEconomicsRequest,
  validateUnitEconomicsSummary,
  validateProductProfitability,
} from "@/lib/validations/unit-economics";
import {
  fetchAllProductsProfitability,
  generateUnitEconomicsSummary,
  fetchProductProfitability,
} from "@/lib/utils/unit-economics";

export const GET = withRateLimit(
  async (request: NextRequest) => {
    try {
      // Check authentication
      const session = await auth();
      if (!session?.user || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Not authorized" }, { status: 403 });
      }

      // Parse and validate query parameters
      const searchParams = request.nextUrl.searchParams;
      const timeRange = searchParams.get("timeRange") || "30d";
      const categoryId = searchParams.get("categoryId") || undefined;
      const supplierId = searchParams.get("supplierId") || undefined;
      const includeInactive = searchParams.get("includeInactive") === "true";
      const productId = searchParams.get("productId") || undefined;

      // Validate request parameters
      const validatedRequest = validateUnitEconomicsRequest({
        timeRange,
        categoryId,
        supplierId,
        includeInactive,
      });

      // Caching strategy for unit economics data
      const cacheKey = CacheKeys.analytics(
        `unit-economics:${timeRange}:${categoryId || "all"}:${supplierId || "all"}:${includeInactive}:${productId || "summary"}`
      );
      const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

      const unitEconomicsData = await getCached(
        cacheKey,
        async () => {
          if (productId) {
            // Return single product profitability
            const productProfitability = await fetchProductProfitability(
              productId,
              validatedRequest.timeRange
            );

            if (!productProfitability) {
              throw new Error("Product not found");
            }

            return {
              type: "product",
              data: productProfitability,
            };
          } else {
            // Return summary and all products
            const [summary, products] = await Promise.all([
              generateUnitEconomicsSummary(validatedRequest),
              fetchAllProductsProfitability(validatedRequest),
            ]);

            return {
              type: "summary",
              data: {
                summary,
                products,
              },
            };
          }
        },
        CACHE_TTL
      );

      // Validate the data before returning
      if (productId) {
        const validatedData = validateProductProfitability(
          unitEconomicsData.data
        );
        return NextResponse.json({
          success: true,
          type: "product",
          data: validatedData,
          timeRange: validatedRequest.timeRange,
          generatedAt: new Date().toISOString(),
        });
      } else {
        const validatedSummary = validateUnitEconomicsSummary(
          unitEconomicsData.data.summary
        );
        const validatedProducts = unitEconomicsData.data.products.map(p =>
          validateProductProfitability(p)
        );

        return NextResponse.json({
          success: true,
          type: "summary",
          data: {
            summary: validatedSummary,
            products: validatedProducts,
          },
          timeRange: validatedRequest.timeRange,
          generatedAt: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error("Error fetching unit economics data:", error);

      // Handle validation errors
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      if (errorMessage.includes("Invalid request parameters")) {
        return NextResponse.json(
          {
            error: "Invalid request parameters",
            details: error,
          },
          { status: 400 }
        );
      }

      if (errorMessage.includes("Product not found")) {
        return NextResponse.json(
          {
            error: "Product not found",
          },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { error: "Failed to fetch unit economics data" },
        { status: 500 }
      );
    }
  },
  { limit: 20, windowMs: 10 * 60 * 1000 } // Rate limiting for analytics
);

export const POST = withRateLimit(
  async (request: NextRequest) => {
    try {
      // Check authentication
      const session = await auth();
      if (!session?.user || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Not authorized" }, { status: 403 });
      }

      const body = await request.json();
      const { timeRange = "30d", reportType = "summary" } = body;

      // Validate request
      const validatedRequest = validateUnitEconomicsRequest({ timeRange });

      // Generate report based on type
      let reportData;
      switch (reportType) {
        case "summary":
          reportData = await generateUnitEconomicsSummary(validatedRequest);
          break;
        case "products":
          reportData = await fetchAllProductsProfitability(validatedRequest);
          break;
        default:
          return NextResponse.json(
            { error: "Invalid report type. Must be 'summary' or 'products'" },
            { status: 400 }
          );
      }

      // Invalidate cache to ensure fresh data
      await invalidateCachePattern("unit-economics:*");

      return NextResponse.json({
        success: true,
        report: reportData,
        reportType,
        timeRange: validatedRequest.timeRange,
        generatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error generating unit economics report:", error);
      return NextResponse.json(
        {
          error: "Failed to generate unit economics report",
          details: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 500 }
      );
    }
  },
  { limit: 10, windowMs: 10 * 60 * 1000 } // Stricter rate limiting for reports
);
