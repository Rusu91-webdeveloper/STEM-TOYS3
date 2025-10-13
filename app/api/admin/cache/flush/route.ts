import { revalidatePath, revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { cache } from "@/lib/cache";

/**
 * FLUSH ALL CACHE - Use this to completely clear all cached data
 * This is a nuclear option for when cache becomes corrupted or stale
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("🔥 FLUSHING ALL CACHE - This will clear ALL cached data");

    // Clear Redis cache completely
    await cache.flush();

    // Clear Next.js cache
    revalidateTag("products");
    revalidateTag("books");
    revalidateTag("categories");
    revalidatePath("/products");
    revalidatePath("/");

    console.log("✅ ALL CACHE FLUSHED SUCCESSFULLY");

    return NextResponse.json({
      success: true,
      message: "All cache flushed successfully. Fresh data will be loaded on next request.",
    });
  } catch (error) {
    console.error("Error flushing cache:", error);
    return NextResponse.json(
      { error: "Failed to flush cache" },
      { status: 500 }
    );
  }
}

