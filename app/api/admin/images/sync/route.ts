import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { ImageManagementService } from "@/lib/image-management-real";
import { auth } from "@/lib/server/auth";

// Sync request schema
const syncRequestSchema = z.object({
  operation: z.enum(["product", "all"]),
  productId: z.string().optional(), // Required when operation is "product"
});

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const validation = syncRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: validation.error.errors },
        { status: 400 }
      );
    }

    const { operation, productId } = validation.data;

    console.log(`[IMAGES SYNC API] Starting ${operation} sync operation`);

    if (operation === "product") {
      if (!productId) {
        return NextResponse.json(
          { error: "productId is required for product sync operation" },
          { status: 400 }
        );
      }

      await ImageManagementService.syncProductImages(productId);

      return NextResponse.json({
        success: true,
        operation: "product",
        productId,
        message: `Successfully synced images for product ${productId}`,
      });
    } else if (operation === "all") {
      const result = await ImageManagementService.syncAllProductImages();

      return NextResponse.json({
        success: true,
        operation: "all",
        results: result,
        message: `Synced images for ${result.processed} products (${result.errors} errors)`,
      });
    }
  } catch (error) {
    console.error("[IMAGES SYNC API] Unexpected error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: "Method not allowed. Use POST." },
    { status: 405 }
  );
}
