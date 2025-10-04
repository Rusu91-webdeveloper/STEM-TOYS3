import { NextResponse } from "next/server";

import { withAdminAuth } from "@/lib/authorization";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

export const POST = withAdminAuth(async request => {
  try {
    const { imageIds } = await request.json();

    if (!Array.isArray(imageIds) || imageIds.length === 0) {
      return NextResponse.json(
        { error: "imageIds must be a non-empty array" },
        { status: 400 }
      );
    }

    const deletedImages = [];
    const failedImages = [];

    for (const imageId of imageIds) {
      try {
        // Get image metadata to check if it exists
        const image = await db.imageMetadata.findUnique({
          where: { id: imageId },
          include: {
            processingLogs: true,
          },
        });

        if (!image) {
          failedImages.push({ id: imageId, error: "Image not found" });
          continue;
        }

        // Delete processing logs first (cascade will handle this, but explicit is better)
        await db.imageProcessingLog.deleteMany({
          where: { imageId },
        });

        // Delete image metadata
        await db.imageMetadata.delete({
          where: { id: imageId },
        });

        // In a real implementation, you would also:
        // 1. Delete the actual image files from storage (S3, local, etc.)
        // 2. Delete optimized versions
        // 3. Clean up CDN cache if applicable

        deletedImages.push({
          id: imageId,
          filename: image.filename,
          originalUrl: image.originalUrl,
        });

        logger.info("Image deleted successfully", {
          imageId,
          filename: image.filename,
        });
      } catch (error) {
        logger.error(`Error deleting image ${imageId}:`, error);
        failedImages.push({
          id: imageId,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return NextResponse.json({
      success: true,
      deletedCount: deletedImages.length,
      failedCount: failedImages.length,
      deletedImages,
      failedImages,
    });
  } catch (error) {
    logger.error("Error in bulk image cleanup:", error);
    return NextResponse.json(
      { error: "Failed to delete images" },
      { status: 500 }
    );
  }
});
