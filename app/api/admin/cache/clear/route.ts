import { revalidatePath, revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { invalidateCachePattern } from "@/lib/cache";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { pattern } = await request.json();

    // Clear Redis cache
    await invalidateCachePattern(pattern || "products");

    // Clear Next.js cache
    revalidateTag("products");
    revalidatePath("/products");

    console.log(
      `✅ Admin manually cleared cache for pattern: ${pattern || "products"}`
    );

    return NextResponse.json({
      success: true,
      message: "Cache cleared successfully",
    });
  } catch (error) {
    console.error("Error clearing cache:", error);
    return NextResponse.json(
      { error: "Failed to clear cache" },
      { status: 500 }
    );
  }
}
