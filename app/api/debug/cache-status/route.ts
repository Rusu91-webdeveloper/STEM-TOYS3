import { NextRequest, NextResponse } from "next/server";

import { db } from "@/lib/db";

/**
 * Debug endpoint to check cache status and product visibility
 * Usage: GET /api/debug/cache-status
 *
 * This endpoint provides diagnostic information about:
 * 1. Products in database by status
 * 2. Cache configuration
 * 3. Recent products added
 * 4. Category information
 */
export async function GET(request: NextRequest) {
  try {
    // Only allow in development or with secret token
    const searchParams = request.nextUrl.searchParams;
    const secret = searchParams.get("secret");
    const expectedSecret = process.env.DEBUG_SECRET || "debug-secret-token";

    if (process.env.NODE_ENV === "production" && secret !== expectedSecret) {
      return NextResponse.json(
        { error: "Unauthorized - Debug endpoint requires secret" },
        { status: 401 }
      );
    }

    // Fetch products from database
    const [
      approvedProducts,
      pendingProducts,
      deniedProducts,
      rejectedProducts,
      totalProducts,
      categories,
      recentProducts,
    ] = await Promise.all([
      // Approved products
      db.product.findMany({
        where: { isActive: true, status: "APPROVED" },
        select: {
          id: true,
          name: true,
          slug: true,
          status: true,
          isActive: true,
          stemDiscipline: true,
          ageGroup: true,
          categoryId: true,
          createdAt: true,
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      // Pending products
      db.product.count({
        where: { isActive: true, status: "IN_PENDING" },
      }),
      // Denied products
      db.product.count({
        where: { isActive: true, status: "DENIED" },
      }),
      // Rejected products
      db.product.count({
        where: { isActive: true, status: "REJECTED" },
      }),
      // Total products
      db.product.count({
        where: { isActive: true },
      }),
      // Categories
      db.category.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          slug: true,
          _count: {
            select: {
              products: true,
            },
          },
        },
      }),
      // Recent products (last 24 hours)
      db.product.findMany({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
        select: {
          id: true,
          name: true,
          slug: true,
          status: true,
          isActive: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    // Check if books exist
    const booksCount = await db.book.count({
      where: { isActive: true },
    });

    // Cache configuration info
    const cacheConfig = {
      NODE_ENV: process.env.NODE_ENV,
      REDIS_URL: process.env.REDIS_URL ? "configured" : "not configured",
      UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL
        ? "configured"
        : "not configured",
    };

    // Response data
    const diagnostics = {
      timestamp: new Date().toISOString(),
      database: {
        products: {
          total: totalProducts,
          approved: approvedProducts.length,
          pending: pendingProducts,
          denied: deniedProducts,
          rejected: rejectedProducts,
        },
        books: {
          total: booksCount,
        },
        categories: categories.map(cat => ({
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
          productCount: cat._count.products,
        })),
      },
      recentActivity: {
        productsLast24h: recentProducts.length,
        products: recentProducts,
      },
      approvedProducts: approvedProducts.map(p => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        status: p.status,
        isActive: p.isActive,
        stemDiscipline: p.stemDiscipline,
        ageGroup: p.ageGroup,
        category: p.category
          ? {
              id: p.category.id,
              name: p.category.name,
              slug: p.category.slug,
            }
          : null,
        createdAt: p.createdAt,
      })),
      cacheConfiguration: cacheConfig,
      apiEndpoints: {
        products: "/api/products",
        revalidate: "/api/revalidate/products?secret=YOUR_SECRET",
        debug: "/api/debug/cache-status?secret=YOUR_SECRET",
      },
      recommendations: [
        approvedProducts.length === 0
          ? "⚠️ No APPROVED products found - check product approval status"
          : `✅ ${approvedProducts.length} approved products found`,
        recentProducts.length === 0
          ? "ℹ️ No products created in last 24 hours"
          : `✅ ${recentProducts.length} products created recently`,
        booksCount === 0
          ? "⚠️ No active books found"
          : `✅ ${booksCount} books available`,
        "💡 Use POST /api/revalidate/products?secret=YOUR_SECRET to clear cache",
      ],
    };

    return NextResponse.json(diagnostics, {
      headers: {
        "Cache-Control": "no-store, must-revalidate",
      },
    });
  } catch (error) {
    console.error("❌ Debug endpoint error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch debug information",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
