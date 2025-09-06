import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { ImageManagementService } from "@/lib/image-management-real";
import { auth } from "@/lib/server/auth";

// Cleanup request schema
const cleanupRequestSchema = z.object({
  cleanupTypes: z.array(
    z.enum(["orphaned", "invalid", "duplicate", "large", "old"])
  ),
  dryRun: z.boolean().default(true), // Default to dry run for safety
  settings: z.object({
    maxAge: z.number().default(30), // Days
    maxSize: z.number().default(5 * 1024 * 1024), // 5MB
    duplicateThreshold: z.number().default(0.95), // 95% similarity
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
    const validation = cleanupRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: validation.error.errors },
        { status: 400 }
      );
    }

    const { cleanupTypes, dryRun, settings } = validation.data;

    console.log(
      `[IMAGE CLEANUP API] Starting cleanup for types: ${cleanupTypes.join(", ")}. Dry run: ${dryRun}`
    );

    // Query the database for images matching cleanup criteria
    const analysisResults: any = {
      orphaned: { count: 0, totalSize: 0, images: [] },
      invalid: { count: 0, totalSize: 0, images: [] },
      duplicate: { count: 0, totalSize: 0, groups: [] },
      large: { count: 0, totalSize: 0, images: [] },
      old: { count: 0, totalSize: 0, images: [] },
    };

    // Find orphaned images (optimized)
    if (cleanupTypes.includes("orphaned")) {
      const orphanedImages = await ImageManagementService.findOrphanedImages();
      analysisResults.orphaned = {
        count: orphanedImages.length,
        totalSize: orphanedImages.reduce((sum, img) => sum + img.fileSize, 0),
        images: orphanedImages.slice(0, 50).map(img => ({
          // Limit to first 50 for performance
          id: img.id,
          url: img.originalUrl,
          filename: img.filename,
          size: img.fileSize,
          uploadedAt: img.uploadedAt,
        })),
      };
    }

    // Find duplicate images
    if (cleanupTypes.includes("duplicate")) {
      const duplicateData = await ImageManagementService.findDuplicateImages();
      analysisResults.duplicate = {
        count: duplicateData.totalDuplicates,
        totalSize: duplicateData.potentialSavings,
        groups: duplicateData.duplicates.map(group =>
          group.map(img => ({
            id: img.id,
            url: img.originalUrl,
            filename: img.filename,
            size: img.fileSize,
            similarity: 0.95, // Simplified similarity score
          }))
        ),
      };
    }

    // Find large images (optimized)
    if (cleanupTypes.includes("large")) {
      const largeImages = await ImageManagementService.getImages({
        limit: 100, // Reduced limit for better performance
      });

      const largeImagesFiltered = largeImages.images.filter(
        img => img.fileSize > settings.maxSize
      );
      analysisResults.large = {
        count: largeImagesFiltered.length,
        totalSize: largeImagesFiltered.reduce(
          (sum, img) => sum + img.fileSize,
          0
        ),
        images: largeImagesFiltered.slice(0, 50).map(img => ({
          // Limit to first 50 for performance
          id: img.id,
          url: img.originalUrl,
          filename: img.filename,
          size: img.fileSize,
          dimensions: `${img.width}x${img.height}`,
        })),
      };
    }

    // Find old images (optimized)
    if (cleanupTypes.includes("old")) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - settings.maxAge);

      const oldImages = await ImageManagementService.getImages({
        limit: 100, // Reduced limit for better performance
      });

      const oldImagesFiltered = oldImages.images.filter(
        img => img.uploadedAt < cutoffDate
      );
      analysisResults.old = {
        count: oldImagesFiltered.length,
        totalSize: oldImagesFiltered.reduce(
          (sum, img) => sum + img.fileSize,
          0
        ),
        images: oldImagesFiltered.slice(0, 50).map(img => ({
          // Limit to first 50 for performance
          id: img.id,
          url: img.originalUrl,
          filename: img.filename,
          size: img.fileSize,
          age: Math.floor(
            (Date.now() - img.uploadedAt.getTime()) / (1000 * 60 * 60 * 24)
          ),
        })),
      };
    }

    // Find invalid images (inactive or corrupted) - optimized
    if (cleanupTypes.includes("invalid")) {
      const invalidImages = await ImageManagementService.getImages({
        isActive: false,
        limit: 100, // Reduced limit for better performance
      });

      analysisResults.invalid = {
        count: invalidImages.images.length,
        totalSize: invalidImages.images.reduce(
          (sum, img) => sum + img.fileSize,
          0
        ),
        images: invalidImages.images.slice(0, 50).map(img => ({
          // Limit to first 50 for performance
          id: img.id,
          url: img.originalUrl,
          filename: img.filename,
          size: img.fileSize,
          status: img.status,
        })),
      };
    }

    // Calculate total potential savings
    const totalSavings = Object.values(analysisResults).reduce(
      (sum, type) => sum + type.totalSize,
      0
    );

    // Generate recommendations
    const recommendations = [];
    if (analysisResults.orphaned.count > 0) {
      recommendations.push(
        `Remove ${analysisResults.orphaned.count} orphaned images to free up ${Math.round(analysisResults.orphaned.totalSize / (1024 * 1024))}MB`
      );
    }
    if (analysisResults.duplicate.count > 0) {
      recommendations.push(
        `Consolidate ${analysisResults.duplicate.count} duplicate images to save ${Math.round(analysisResults.duplicate.totalSize / (1024 * 1024))}MB`
      );
    }
    if (analysisResults.large.count > 0) {
      recommendations.push(
        `Optimize ${analysisResults.large.count} large images to improve performance`
      );
    }
    if (analysisResults.old.count > 0) {
      recommendations.push(
        `Archive ${analysisResults.old.count} old images to free up ${Math.round(analysisResults.old.totalSize / (1024 * 1024))}MB`
      );
    }

    if (dryRun) {
      console.log(
        `[IMAGE CLEANUP API] Dry run complete. Found cleanup opportunities for ${cleanupTypes.length} types`
      );

      return NextResponse.json({
        success: true,
        message: "Cleanup analysis complete (dry run)",
        dryRun: true,
        analysis: analysisResults,
        recommendations,
        potentialSavings: {
          total: totalSavings,
          formatted: `${Math.round(totalSavings / (1024 * 1024))}MB`,
        },
        summary: {
          totalImages: Object.values(analysisResults).reduce(
            (sum, type) => sum + type.count,
            0
          ),
          totalSize: totalSavings,
          cleanupTypes: cleanupTypes.length,
        },
      });
    }

    // Execute actual cleanup
    console.log(
      `[IMAGE CLEANUP API] Executing cleanup for ${cleanupTypes.length} types`
    );

    const cleanupResults: any = {
      orphaned: { deleted: 0, failed: 0 },
      invalid: { deleted: 0, failed: 0 },
      duplicate: { deleted: 0, failed: 0 },
      large: { deleted: 0, failed: 0 },
      old: { deleted: 0, failed: 0 },
    };

    // Execute cleanup for each type
    for (const cleanupType of cleanupTypes) {
      const imagesToDelete: string[] = [];

      switch (cleanupType) {
        case "orphaned":
          imagesToDelete.push(
            ...analysisResults.orphaned.images.map((img: any) => img.id)
          );
          break;
        case "invalid":
          imagesToDelete.push(
            ...analysisResults.invalid.images.map((img: any) => img.id)
          );
          break;
        case "duplicate":
          // For duplicates, keep the first image in each group, delete the rest
          analysisResults.duplicate.groups.forEach((group: any[]) => {
            imagesToDelete.push(...group.slice(1).map((img: any) => img.id));
          });
          break;
        case "large":
          imagesToDelete.push(
            ...analysisResults.large.images.map((img: any) => img.id)
          );
          break;
        case "old":
          imagesToDelete.push(
            ...analysisResults.old.images.map((img: any) => img.id)
          );
          break;
      }

      if (imagesToDelete.length > 0) {
        const deleteResult =
          await ImageManagementService.deleteImages(imagesToDelete);
        cleanupResults[cleanupType] = {
          deleted: deleteResult.deleted,
          failed: deleteResult.errors.length,
        };
      }
    }

    const totalDeleted = Object.values(cleanupResults).reduce(
      (sum: number, type: any) => sum + type.deleted,
      0
    );
    const totalFailed = Object.values(cleanupResults).reduce(
      (sum: number, type: any) => sum + type.failed,
      0
    );

    console.log(
      `[IMAGE CLEANUP API] Cleanup complete. Deleted: ${totalDeleted}, Failed: ${totalFailed}`
    );

    return NextResponse.json({
      success: true,
      message: `Cleanup complete. Successfully deleted ${totalDeleted} images`,
      dryRun: false,
      results: cleanupResults,
      summary: {
        totalDeleted,
        totalFailed,
        totalSavings: {
          total: totalSavings,
          formatted: `${Math.round(totalSavings / (1024 * 1024))}MB`,
        },
      },
    });
  } catch (error) {
    console.error("[IMAGE CLEANUP API] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
