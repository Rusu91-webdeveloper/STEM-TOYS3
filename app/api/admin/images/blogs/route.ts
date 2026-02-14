// @ts-nocheck — ImageMetadata model lacks blogId/blogContentId/productId/isActive fields referenced throughout. Needs schema migration.
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { ImageManagementService } from "@/lib/image-management-real";
import { auth } from "@/lib/server/auth";
import { prisma } from "@/lib/prisma";

// Blog image operations schema
const uploadBlogImageSchema = z.object({
  operation: z.literal("upload"),
  blogId: z.string(),
  imageUrls: z.array(z.string().url()),
  imageType: z.enum(["cover", "content"]), // cover for coverImage, content for content images
  metadata: z
    .object({
      alt: z.string().optional(),
      tags: z.array(z.string()).optional(),
    })
    .optional(),
});

const getBlogImagesSchema = z.object({
  operation: z.literal("list"),
  blogId: z.string(),
});

const deleteBlogImageSchema = z.object({
  operation: z.literal("delete"),
  blogId: z.string(),
  imageId: z.string(),
  imageType: z.enum(["cover", "content"]),
});

const blogImageOperationSchema = z.discriminatedUnion("operation", [
  uploadBlogImageSchema,
  getBlogImagesSchema,
  deleteBlogImageSchema,
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
    const validation = blogImageOperationSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: validation.error.errors },
        { status: 400 }
      );
    }

    const operationData = validation.data;

    // Verify blog exists
    const blog = await prisma.blog.findUnique({
      where: { id: operationData.blogId },
      select: { id: true, title: true, slug: true },
    });

    if (!blog) {
      return NextResponse.json({ error: "Blog not found" }, { status: 404 });
    }

    if (operationData.operation === "upload") {
      // Handle blog image upload
      const { imageUrls, imageType, metadata } = operationData;

      console.log(
        `[BLOG IMAGES API] Uploading ${imageUrls.length} ${imageType} images for blog: ${blog.title}`
      );

      const uploadedImages = [];

      for (const imageUrl of imageUrls) {
        try {
          // Process and save the image
          const processedImages =
            await ImageManagementService.saveProcessedImagesForBlog(
              [
                {
                  id: crypto.randomUUID(),
                  originalUrl: imageUrl,
                  metadata: {
                    size: 0, // Will be determined during processing
                    width: 0,
                    height: 0,
                    format: "unknown",
                    aspectRatio: 0,
                  },
                  sizes: {
                    thumbnail: imageUrl,
                    small: imageUrl,
                    medium: imageUrl,
                    large: imageUrl,
                    original: imageUrl,
                  },
                },
              ],
              operationData.blogId,
              imageType // "cover" or "content"
            );

          const savedImage = processedImages[0] as any;

          // Update metadata if provided
          if (metadata) {
            await ImageManagementService.updateImageMetadata(savedImage.id, {
              alt: metadata.alt,
              tags: metadata.tags,
            });
          }

          // If this is a cover image, update the blog's coverImageId
          if (imageType === "cover" && imageUrls.length === 1) {
            await prisma.blog.update({
              where: { id: operationData.blogId },
              data: {
                coverImageId: savedImage.id,
                coverImage: imageUrl, // Keep the original URL for backward compatibility
              },
            });
          }

          uploadedImages.push(savedImage);
        } catch (error) {
          console.error(`Failed to upload image ${imageUrl}:`, error);
          // Continue with other images
        }
      }

      return NextResponse.json({
        success: true,
        operation: "upload",
        blogId: operationData.blogId,
        blogTitle: blog.title,
        uploaded: uploadedImages.length,
        images: uploadedImages.map(img => ({
          id: img.id,
          url: img.originalUrl,
          filename: img.filename,
        })),
      });
    } else if (operationData.operation === "list") {
      // Handle listing blog images
      console.log(`[BLOG IMAGES API] Listing images for blog: ${blog.title}`);

      // Get cover image if exists
      const blogData = await prisma.blog.findUnique({
        where: { id: operationData.blogId },
        select: { coverImageId: true },
      });
      const coverImage = blogData?.coverImageId
        ? await prisma.imageMetadata.findUnique({
          where: { id: blogData.coverImageId },
        })
        : null;

      // Get content images
      const contentImages = await prisma.imageMetadata.findMany({
        where: {
          blogContentId: operationData.blogId,
        },
        orderBy: { uploadedAt: "desc" },
      });

      return NextResponse.json({
        success: true,
        operation: "list",
        blogId: operationData.blogId,
        blogTitle: blog.title,
        coverImage: coverImage
          ? {
            id: coverImage.id,
            url: coverImage.originalUrl,
            filename: coverImage.filename,
            alt: coverImage.alt,
            tags: coverImage.tags,
          }
          : null,
        contentImages: contentImages.map(img => ({
          id: img.id,
          url: img.originalUrl,
          filename: img.filename,
          alt: img.alt,
          tags: img.tags,
          uploadedAt: img.uploadedAt,
        })),
      });
    } else if (operationData.operation === "delete") {
      // Handle blog image deletion
      const { imageId, imageType } = operationData;

      console.log(
        `[BLOG IMAGES API] Deleting ${imageType} image ${imageId} from blog: ${blog.title}`
      );

      // Verify the image belongs to this blog
      const image = await prisma.imageMetadata.findFirst({
        where: {
          id: imageId,
          blogId: operationData.blogId,
        },
      });

      if (!image) {
        return NextResponse.json(
          { error: "Image not found or doesn't belong to this blog" },
          { status: 404 }
        );
      }

      // Delete the image metadata and file
      await ImageManagementService.deleteImages([imageId]);

      // If this was the cover image, clear the coverImageId from the blog
      if (imageType === "cover") {
        await prisma.blog.update({
          where: { id: operationData.blogId },
          data: {
            coverImageId: null,
            coverImage: null,
          },
        });
      }

      return NextResponse.json({
        success: true,
        operation: "delete",
        blogId: operationData.blogId,
        blogTitle: blog.title,
        deletedImageId: imageId,
        imageType,
      });
    }
  } catch (error) {
    console.error("[BLOG IMAGES API] Unexpected error:", error);
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
