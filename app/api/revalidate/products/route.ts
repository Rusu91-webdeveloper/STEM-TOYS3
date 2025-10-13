import { revalidatePath, revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

/**
 * API endpoint to force revalidation of products pages and cache
 * Usage: POST /api/revalidate/products?secret=YOUR_SECRET_TOKEN
 *
 * This endpoint will:
 * 1. Revalidate the /products page (ISR cache)
 * 2. Clear Next.js cache tags for products
 * 3. Clear application-level cache (if Redis is used)
 */
export async function POST(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const secret = searchParams.get("secret");

    // Protect the endpoint with a secret token
    const expectedSecret =
      process.env.REVALIDATION_SECRET || "dev-secret-token";

    if (secret !== expectedSecret) {
      return NextResponse.json(
        { error: "Invalid secret token" },
        { status: 401 }
      );
    }

    // Revalidate the /products page (ISR cache)
    revalidatePath("/products");
    console.log("✅ Revalidated /products page");

    // Revalidate all product detail pages pattern
    revalidatePath("/products/[slug]", "page");
    console.log("✅ Revalidated product detail pages");

    // Revalidate Next.js cache tags
    revalidateTag("products");
    revalidateTag("books");
    console.log("✅ Revalidated cache tags: products, books");

    // Clear application-level cache (if using getCached function)
    // This will be picked up on next request
    if (process.env.REDIS_URL || process.env.UPSTASH_REDIS_REST_URL) {
      try {
        const { invalidateCachePattern } = await import("@/lib/cache");
        await invalidateCachePattern("products:");
        await invalidateCachePattern("product:");
        console.log("✅ Cleared application Redis cache");
      } catch (cacheError) {
        console.warn("⚠️ Redis cache clear failed:", cacheError);
        // Don't fail the request if Redis is not available
      }
    }

    return NextResponse.json({
      success: true,
      message: "Products cache cleared and pages revalidated",
      timestamp: new Date().toISOString(),
      revalidated: ["/products", "/products/[slug]", "tags: products, books"],
    });
  } catch (error) {
    console.error("❌ Revalidation error:", error);
    return NextResponse.json(
      {
        error: "Failed to revalidate",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint for manual testing (without secret in production)
 */
export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      {
        error: "Use POST method with secret parameter",
        usage: "POST /api/revalidate/products?secret=YOUR_SECRET",
      },
      { status: 405 }
    );
  }

  // In development, allow GET without secret
  const searchParams = request.nextUrl.searchParams;
  searchParams.set("secret", "dev-secret-token");

  return POST(request);
}
