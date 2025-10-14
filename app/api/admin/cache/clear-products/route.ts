import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

/**
 * Manual Cache Clear Endpoint for Products
 * 
 * POST /api/admin/cache/clear-products
 * 
 * Allows admins to manually clear all product-related caches.
 * This triggers the same invalidation that happens automatically
 * when products are created/updated/approved.
 * 
 * Protected: Requires ADMIN role
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Check authentication
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Only admins can manually clear cache
    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Not authorized - Admin access required" },
        { status: 403 }
      );
    }

    // Import and execute smart cache invalidation
    const { invalidateProductCaches } = await import("@/lib/cache-smart-invalidation");
    
    await invalidateProductCaches({
      reason: `Manual cache clear by admin: ${session.user.email}`,
    });

    const duration = Date.now() - startTime;
    
    console.log(`✅ Manual cache clear completed in ${duration}ms by ${session.user.email}`);

    return NextResponse.json({
      success: true,
      message: "All product caches cleared successfully",
      duration,
      clearedAt: new Date().toISOString(),
      clearedBy: session.user.email,
    });

  } catch (error) {
    console.error("Error in manual cache clear:", error);
    
    return NextResponse.json(
      {
        error: "Failed to clear cache",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

