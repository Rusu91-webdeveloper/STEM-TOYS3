import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { ImageManagementService } from "@/lib/image-management-real";
import { deleteUploadThingFiles } from "@/lib/uploadthing";
import { auth } from "@/lib/server/auth";

// Bulk operations schema
const bulkDeleteSchema = z.object({
  operation: z.literal("delete"),
  imageIds: z.array(z.string()).min(1, "At least one image must be selected"),
  deleteFromStorage: z.boolean().default(false), // Whether to delete from UploadThing
});

const bulkUpdateSchema = z.object({
  operation: z.literal("update"),
  imageIds: z.array(z.string()).min(1, "At least one image must be selected"),
  updates: z
    .object({
      alt: z.string().optional(),
      tags: z.array(z.string()).optional(),
      isActive: z.boolean().optional(),
    })
    .refine(
      updates => Object.keys(updates).length > 0,
      "At least one field must be updated"
    ),
});

const bulkOperationSchema = z.discriminatedUnion("operation", [
  bulkDeleteSchema,
  bulkUpdateSchema,
]);

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const validation = bulkOperationSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: validation.error.errors },
        { status: 400 }
      );
    }

    const operationData = validation.data;

    console.log(
      `[IMAGES BULK API] Starting ${operationData.operation} operation for ${operationData.imageIds.length} images`
    );

    if (operationData.operation === "delete") {
      // Handle bulk delete
      const { imageIds, deleteFromStorage } = operationData;

      // Get image metadata to collect URLs for storage deletion
      const imagesToDelete = await Promise.all(
        imageIds.map(async id => {
          try {
            // Get image metadata (we'll need to add this method to the service)
            const imageMetadata = await ImageManagementService.getImageById(id);
            return imageMetadata;
          } catch (error) {
            console.warn(`Could not find metadata for image ${id}:`, error);
            return null;
          }
        })
      );

      // Filter out null results
      const validImages = imagesToDelete.filter(img => img !== null);

      // Delete from storage if requested
      if (deleteFromStorage && validImages.length > 0) {
        const urlsToDelete = validImages.map(img => img!.originalUrl);
        console.log(
          `[IMAGES BULK API] Deleting ${urlsToDelete.length} files from storage`
        );

        const storageResult = await deleteUploadThingFiles(urlsToDelete);
        if (!storageResult.success) {
          console.warn(
            "[IMAGES BULK API] Storage deletion failed:",
            storageResult.message
          );
          // Continue with database deletion even if storage deletion fails
        }
      }

      // Delete from database
      const deleteResult = await ImageManagementService.deleteImages(imageIds);

      console.log(
        `[IMAGES BULK API] Bulk delete completed. Deleted: ${deleteResult.deleted}, Failed: ${deleteResult.errors.length}`
      );

      return NextResponse.json({
        success: true,
        operation: "delete",
        results: {
          totalRequested: imageIds.length,
          deleted: deleteResult.deleted,
          failed: deleteResult.errors.length,
          errors: deleteResult.errors,
          storageDeleted: deleteFromStorage ? validImages.length : 0,
        },
        message: `Successfully deleted ${deleteResult.deleted} of ${imageIds.length} images`,
      });
    } else if (operationData.operation === "update") {
      // Handle bulk update
      const { imageIds, updates } = operationData;

      const updateResults = [];
      let successCount = 0;
      const errors: string[] = [];

      // Update each image individually
      for (const imageId of imageIds) {
        try {
          const updatedImage = await ImageManagementService.updateImageMetadata(
            imageId,
            updates
          );
          if (updatedImage) {
            successCount++;
            updateResults.push({
              imageId,
              success: true,
              updated: updates,
            });
          } else {
            errors.push(`Failed to update image ${imageId}: Image not found`);
            updateResults.push({
              imageId,
              success: false,
              error: "Image not found",
            });
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
          errors.push(`Failed to update image ${imageId}: ${errorMessage}`);
          updateResults.push({
            imageId,
            success: false,
            error: errorMessage,
          });
        }
      }

      console.log(
        `[IMAGES BULK API] Bulk update completed. Success: ${successCount}, Failed: ${errors.length}`
      );

      return NextResponse.json({
        success: true,
        operation: "update",
        results: {
          totalRequested: imageIds.length,
          updated: successCount,
          failed: errors.length,
          errors,
          updates: updateResults,
        },
        message: `Successfully updated ${successCount} of ${imageIds.length} images`,
      });
    }

    // This should never be reached due to discriminated union
    return NextResponse.json({ error: "Invalid operation" }, { status: 400 });
  } catch (error) {
    console.error("[IMAGES BULK API] Unexpected error:", error);
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
