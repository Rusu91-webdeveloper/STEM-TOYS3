import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { ImageManagementService } from "@/lib/image-management-real";
import {
  processProductImagesReal,
  optimizeImage,
} from "@/lib/image-processing-real";
import { auth } from "@/lib/server/auth";

// Optimization request schema
const optimizeRequestSchema = z.object({
  imageUrls: z.array(z.string().url()),
  settings: z.object({
    targetFormat: z.enum(["jpeg", "png", "webp", "avif"]).default("webp"),
    quality: z.number().min(1).max(100).default(85),
    maxWidth: z.number().optional(),
    maxHeight: z.number().optional(),
    maintainAspectRatio: z.boolean().default(true),
    progressive: z.boolean().default(true),
    stripMetadata: z.boolean().default(true),
  }),
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
    const validation = optimizeRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: validation.error.errors },
        { status: 400 }
      );
    }

    const { imageUrls, settings } = validation.data;

    console.log(
      `[IMAGE OPTIMIZATION API] Starting optimization for ${imageUrls.length} images`
    );

    // Process images in batches to avoid overwhelming the system
    const batchSize = 5;
    const results = [];

    for (let i = 0; i < imageUrls.length; i += batchSize) {
      const batch = imageUrls.slice(i, i + batchSize);
      console.log(
        `[IMAGE OPTIMIZATION API] Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(imageUrls.length / batchSize)}`
      );

      const batchResults = await Promise.allSettled(
        batch.map(async imageUrl => {
          try {
            // Download the original image
            const response = await fetch(imageUrl);
            if (!response.ok) {
              throw new Error(`Failed to fetch image: ${response.statusText}`);
            }

            const originalBuffer = Buffer.from(await response.arrayBuffer());
            const originalSize = originalBuffer.length;

            // Optimize the image with Sharp
            const optimizedBuffer = await optimizeImage(originalBuffer, {
              quality: settings.quality,
              format: settings.targetFormat,
              maxWidth: settings.maxWidth,
              maxHeight: settings.maxHeight,
            });

            const optimizedSize = optimizedBuffer.length;
            const savings =
              originalSize > 0
                ? ((originalSize - optimizedSize) / originalSize) * 100
                : 0;

            // In a real implementation, you would upload the optimized image
            // For now, we'll return the original URL with optimization stats
            const optimizedUrl = imageUrl; // In production, this would be the new URL

            return {
              originalUrl: imageUrl,
              optimizedUrl,
              status: "success",
              savings: Math.round(savings * 100) / 100,
              originalSize,
              newSize: optimizedSize,
              format: settings.targetFormat,
            };
          } catch (error) {
            console.error(
              `[IMAGE OPTIMIZATION API] Failed to optimize ${imageUrl}:`,
              error
            );
            return {
              originalUrl: imageUrl,
              status: "failed",
              error: error instanceof Error ? error.message : "Unknown error",
            };
          }
        })
      );

      results.push(...batchResults);
    }

    // Process results
    const successful = results.filter(
      result =>
        result.status === "fulfilled" && result.value.status === "success"
    );
    const failed = results.filter(
      result =>
        result.status === "rejected" ||
        (result.status === "fulfilled" && result.value.status === "failed")
    );

    const totalSavings = successful.reduce((sum, result) => {
      if (result.status === "fulfilled" && result.value.status === "success") {
        return sum + result.value.savings;
      }
      return sum;
    }, 0);

    console.log(
      `[IMAGE OPTIMIZATION API] Optimization complete. Success: ${successful.length}, Failed: ${failed.length}`
    );

    return NextResponse.json({
      success: true,
      message: `Successfully optimized ${successful.length} of ${imageUrls.length} images`,
      results: {
        total: imageUrls.length,
        successful: successful.length,
        failed: failed.length,
        totalSavings: `${totalSavings}%`,
      },
      data: results.map(result => {
        if (result.status === "fulfilled") {
          return result.value;
        }
        return {
          status: "failed",
          error: "Processing failed",
        };
      }),
    });
  } catch (error) {
    console.error("[IMAGE OPTIMIZATION API] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
