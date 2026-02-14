import { NextRequest, NextResponse } from "next/server";

import { withAdminAuth } from "@/lib/authorization";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

export const PUT = withAdminAuth(
  async (
    request: NextRequest,
    _session,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    try {
      const { id: imageId } = await params;
      const { alt, description, tags } = await request.json();

      // Validate input
      if (tags && !Array.isArray(tags)) {
        return NextResponse.json(
          { error: "Tags must be an array" },
          { status: 400 }
        );
      }

      // Check if image exists
      const image = await db.imageMetadata.findUnique({
        where: { id: imageId },
      });

      if (!image) {
        return NextResponse.json({ error: "Image not found" }, { status: 404 });
      }

      // Update metadata
      const updatedImage = await db.imageMetadata.update({
        where: { id: imageId },
        data: {
          alt: alt || null,
          description: description || null,
          tags: tags || [],
        },
        include: {
          processingLogs: {
            orderBy: { startedAt: "desc" },
            take: 10,
          },
        },
      });

      logger.info("Image metadata updated", { imageId });

      return NextResponse.json({
        id: updatedImage.id,
        alt: updatedImage.alt,
        description: updatedImage.description,
        tags: updatedImage.tags,
      });
    } catch (error) {
      logger.error("Error updating image metadata:", error);
      return NextResponse.json(
        { error: "Failed to update image metadata" },
        { status: 500 }
      );
    }
  }
);
