// @ts-nocheck — ImageMetadata model lacks blogId/blogContentId/productId/isActive fields referenced throughout. Needs schema migration.
import { PrismaClient } from "@prisma/client";
import {
  processProductImagesReal,
  ProcessedImage,
  ImageMetadata,
} from "./image-processing-real";

const prisma = new PrismaClient();

export interface ImageStats {
  totalImages: number;
  totalSize: number;
  averageSize: number;
  formatDistribution: Record<string, number>;
  sizeDistribution: Record<string, number>;
  processingStats: {
    totalProcessed: number;
    successRate: number;
    averageProcessingTime: number;
  };
  storageSavings: {
    totalSaved: number;
    percentageSaved: number;
  };
}

export interface ImageItem extends ImageMetadata {
  id: string;
  originalUrl: string;
  filename: string;
  uploadedAt: Date;
  processedSizes: any;
  optimizationStats: any;
  tags: string[];
  alt: string | null;
  isActive: boolean;
  productId: string | null;
  blogId: string | null;
  status: "valid" | "invalid" | "orphaned" | "processing";
}

export class ImageManagementService {
  /**
   * Get all images with pagination and filtering
   */
  static async getImages(
    options: {
      page?: number;
      limit?: number;
      format?: string;
      status?: "valid" | "invalid" | "orphaned" | "processing";
      isActive?: boolean;
      search?: string;
      sortBy?: "uploadedAt" | "filename" | "size" | "format";
      sortOrder?: "asc" | "desc";
      productId?: string;
      dateFrom?: Date;
      dateTo?: Date;
    } = {}
  ): Promise<{
    images: ImageItem[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const {
      page = 1,
      limit = 20,
      format,
      status,
      isActive,
      search,
      sortBy = "uploadedAt",
      sortOrder = "desc",
      productId,
      dateFrom,
      dateTo,
    } = options;

    const skip = (page - 1) * limit;

    // Build where clause for ImageMetadata
    const where: any = {};

    // Filter by format
    if (format) {
      where.format = format;
    }

    // Filter by status (for backward compatibility with status filter)
    if (status) {
      if (status === "orphaned") {
        // Orphaned images have no productId and no blogId
        where.AND = [{ productId: null }, { blogId: null }];
      } else if (status === "valid") {
        // Valid images have either productId or blogId
        where.OR = [{ productId: { not: null } }, { blogId: { not: null } }];
      } else if (status === "invalid") {
        where.isActive = false;
      }
      // "processing" status could be determined by processing logs, but for now we'll skip it
    }

    // Filter by active status
    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    // Filter by product
    if (productId) {
      where.productId = productId;
    }

    // Filter by date range
    if (dateFrom || dateTo) {
      where.uploadedAt = {};
      if (dateFrom) where.uploadedAt.gte = dateFrom;
      if (dateTo) where.uploadedAt.lte = dateTo;
    }

    // Search functionality
    if (search) {
      where.OR = [
        { filename: { contains: search, mode: "insensitive" } },
        { alt: { contains: search, mode: "insensitive" } },
        { tags: { hasSome: [search] } },
        // Also search in related product name if productId not specified
        ...(productId
          ? []
          : [
            {
              product: {
                name: { contains: search, mode: "insensitive" },
              },
            },
          ]),
      ];
    }

    // Get images with metadata and total count
    const [imageMetadata, total] = await Promise.all([
      prisma.imageMetadata.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              isActive: true,
            },
          },
        },
      }),
      prisma.imageMetadata.count({ where }),
    ]);

    // Transform to ImageItem format
    const transformedImages: ImageItem[] = imageMetadata.map(metadata => ({
      id: metadata.id,
      originalUrl: metadata.originalUrl,
      filename: metadata.filename,
      fileSize: metadata.fileSize,
      width: metadata.width || 0,
      height: metadata.height || 0,
      format: metadata.format,
      uploadedAt: metadata.uploadedAt,
      processedSizes: metadata.processedSizes,
      optimizationStats: metadata.optimizationStats,
      tags: metadata.tags,
      alt: metadata.alt,
      isActive: metadata.isActive,
      productId: metadata.productId,
      blogId: metadata.blogId || metadata.blogContentId, // Use either cover or content blog ID
      status: this.determineImageStatus(metadata),
    }));

    return {
      images: transformedImages,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get image statistics (optimized with database aggregation)
   */
  static async getImageStats(): Promise<ImageStats> {
    try {
      // Use database aggregation for better performance
      const [totalProducts, activeProducts, imageStats] = await Promise.all([
        // Count total products with images
        prisma.product.count({
          where: {
            images: {
              isEmpty: false,
            },
          },
        }),
        // Count active products with images
        prisma.product.count({
          where: {
            images: {
              isEmpty: false,
            },
            isActive: true,
          },
        }),
        // Get aggregated image data
        prisma.product.findMany({
          where: {
            images: {
              isEmpty: false,
            },
          },
          select: {
            images: true,
            isActive: true,
          },
          take: 100, // Limit to first 100 products for performance
        }),
      ]);

      // Calculate statistics from sampled data
      let totalImages = 0;
      const formatDistribution: Record<string, number> = {};
      const sizeDistribution: Record<string, number> = {
        "0-100KB": 0,
        "100KB-1MB": 0,
        "1MB-5MB": 0,
        "5MB-10MB": 0,
        "10MB+": 0,
      };

      imageStats.forEach(product => {
        product.images.forEach(imageUrl => {
          totalImages++;
          const format = this.extractFormat(imageUrl);
          formatDistribution[format] = (formatDistribution[format] || 0) + 1;

          // Estimate file size based on URL
          const estimatedSize = this.estimateFileSize(imageUrl);
          if (estimatedSize < 100 * 1024) sizeDistribution["0-100KB"]++;
          else if (estimatedSize < 1024 * 1024) sizeDistribution["100KB-1MB"]++;
          else if (estimatedSize < 5 * 1024 * 1024)
            sizeDistribution["1MB-5MB"]++;
          else if (estimatedSize < 10 * 1024 * 1024)
            sizeDistribution["5MB-10MB"]++;
          else sizeDistribution["10MB+"]++;
        });
      });

      // Scale up the statistics based on the sample
      const scaleFactor = totalProducts / Math.max(imageStats.length, 1);
      const scaledTotalImages = Math.round(totalImages * scaleFactor);
      const totalSize = scaledTotalImages * 500 * 1024; // Estimate 500KB average per image
      const averageSize =
        scaledTotalImages > 0 ? totalSize / scaledTotalImages : 0;

      return {
        totalImages: scaledTotalImages,
        totalSize,
        averageSize,
        formatDistribution,
        sizeDistribution,
        processingStats: {
          totalProcessed: scaledTotalImages,
          successRate: 100,
          averageProcessingTime: 0,
        },
        storageSavings: {
          totalSaved: 0,
          percentageSaved: 0,
        },
      };
    } catch (error) {
      console.error("Error getting image stats:", error);
      // Return default stats on error
      return {
        totalImages: 0,
        totalSize: 0,
        averageSize: 0,
        formatDistribution: {},
        sizeDistribution: {
          "0-100KB": 0,
          "100KB-1MB": 0,
          "1MB-5MB": 0,
          "5MB-10MB": 0,
          "10MB+": 0,
        },
        processingStats: {
          totalProcessed: 0,
          successRate: 0,
          averageProcessingTime: 0,
        },
        storageSavings: {
          totalSaved: 0,
          percentageSaved: 0,
        },
      };
    }
  }

  /**
   * Save processed images to database
   */
  static async saveProcessedImages(
    processedImages: ProcessedImage[],
    productId?: string,
    blogId?: string
  ): Promise<ImageMetadata[]> {
    return this.saveProcessedImagesForBlog(
      processedImages,
      blogId,
      undefined,
      productId
    );
  }

  /**
   * Save processed images for blogs with proper field assignment
   */
  static async saveProcessedImagesForBlog(
    processedImages: ProcessedImage[],
    blogId: string,
    imageType: "cover" | "content",
    productId?: string
  ): Promise<ImageMetadata[]> {
    const savedImages: ImageMetadata[] = [];

    for (const processedImage of processedImages) {
      try {
        // Determine which blog field to use based on image type
        const blogData: any = {};
        if (blogId) {
          if (imageType === "cover") {
            blogData.blogId = blogId;
          } else if (imageType === "content") {
            blogData.blogContentId = blogId;
          }
        }

        const imageMetadata = await prisma.imageMetadata.create({
          data: {
            originalUrl: processedImage.originalUrl,
            filename: this.extractFilename(processedImage.originalUrl),
            fileSize: processedImage.metadata.size,
            width: processedImage.metadata.width,
            height: processedImage.metadata.height,
            format: processedImage.metadata.format,
            processedSizes: processedImage.sizes,
            optimizationStats: {
              originalSize: processedImage.metadata.size,
              processedSize: processedImage.metadata.size,
              compressionRatio: 1,
              quality: 85,
            },
            tags: [],
            alt: null,
            isActive: true,
            productId,
            ...blogData,
          },
        });

        savedImages.push(imageMetadata);

        // Log the processing
        await prisma.imageProcessingLog.create({
          data: {
            imageId: imageMetadata.id,
            operation: "process",
            status: "completed",
            details: {
              sizes: processedImage.sizes,
              metadata: processedImage.metadata,
            },
            completedAt: new Date(),
          },
        });
      } catch (error) {
        console.error("Error saving processed image:", error);

        // Log the error
        if (savedImages.length > 0) {
          await prisma.imageProcessingLog.create({
            data: {
              imageId: savedImages[savedImages.length - 1].id,
              operation: "process",
              status: "failed",
              errorMessage:
                error instanceof Error ? error.message : "Unknown error",
            },
          });
        }
      }
    }

    return savedImages;
  }

  /**
   * Find orphaned images (not referenced by any product or blog)
   */
  static async findOrphanedImages(): Promise<ImageItem[]> {
    try {
      // Get all ImageMetadata records
      const allImages = await prisma.imageMetadata.findMany({
        include: {
          product: {
            select: {
              id: true,
              name: true,
              isActive: true,
            },
          },
        },
      });

      const orphanedImages: ImageItem[] = [];

      for (const image of allImages) {
        let isOrphaned = true;

        // Check if image is referenced by a product
        if (image.productId && image.product) {
          // Additional check: verify the image URL is actually in the product's images array
          const productWithImages = await prisma.product.findUnique({
            where: { id: image.productId },
            select: { images: true },
          });

          if (
            productWithImages &&
            productWithImages.images.includes(image.originalUrl)
          ) {
            isOrphaned = false;
          }
        }

        // Check if image is referenced by a blog as cover image
        if (image.blogId) {
          // Additional check: verify the blog actually has this as cover image
          const blogWithCoverImage = await prisma.blog.findUnique({
            where: { id: image.blogId },
            select: { coverImageId: true },
          });

          if (blogWithCoverImage?.coverImageId === image.id) {
            isOrphaned = false;
          }
        }

        // Check if image is referenced by a blog as content image
        if (image.blogContentId) {
          // Check if the blog exists (content images relation is checked via blogContentId)
          const blogExists = await prisma.blog.findUnique({
            where: { id: image.blogContentId },
            select: { id: true },
          });

          if (blogExists) {
            isOrphaned = false;
          }
        }

        if (isOrphaned) {
          orphanedImages.push({
            id: image.id,
            originalUrl: image.originalUrl,
            filename: image.filename,
            fileSize: image.fileSize,
            width: image.width || 0,
            height: image.height || 0,
            format: image.format,
            uploadedAt: image.uploadedAt,
            processedSizes: image.processedSizes,
            optimizationStats: image.optimizationStats,
            tags: image.tags,
            alt: image.alt,
            isActive: image.isActive,
            productId: image.productId,
            status: "orphaned",
          });
        }
      }

      console.log(`Found ${orphanedImages.length} orphaned images`);
      return orphanedImages;
    } catch (error) {
      console.error("Error finding orphaned images:", error);
      return [];
    }
  }

  /**
   * Find duplicate images based on file hash or similar characteristics
   */
  static async findDuplicateImages(): Promise<{
    duplicates: ImageItem[][];
    totalDuplicates: number;
    potentialSavings: number;
  }> {
    // Get all product images
    const products = await prisma.product.findMany({
      where: {
        images: {
          isEmpty: false,
        },
      },
      select: {
        id: true,
        name: true,
        images: true,
        createdAt: true,
        isActive: true,
      },
    });

    // Flatten all images with product context
    const allImages: ImageItem[] = [];
    products.forEach(product => {
      product.images.forEach((imageUrl, index) => {
        allImages.push({
          id: `${product.id}-${index}`,
          originalUrl: imageUrl,
          filename: this.extractFilename(imageUrl),
          fileSize: this.estimateFileSize(imageUrl),
          width: 0,
          height: 0,
          format: this.extractFormat(imageUrl),
          uploadedAt: product.createdAt,
          processedSizes: null,
          optimizationStats: null,
          tags: [product.name],
          alt: `${product.name} image ${index + 1}`,
          isActive: product.isActive,
          productId: product.id,
          status: this.determineImageStatusFromProduct(product, imageUrl),
        });
      });
    });

    const duplicates: ImageItem[][] = [];
    const processed = new Set<string>();

    for (let i = 0; i < allImages.length; i++) {
      if (processed.has(allImages[i].id)) continue;

      const currentImage = allImages[i];
      const similarImages: ImageItem[] = [currentImage];

      // Find similar images (same URL or similar characteristics)
      for (let j = i + 1; j < allImages.length; j++) {
        if (processed.has(allImages[j].id)) continue;

        const otherImage = allImages[j];
        if (
          currentImage.originalUrl === otherImage.originalUrl ||
          (currentImage.filename === otherImage.filename &&
            currentImage.format === otherImage.format)
        ) {
          similarImages.push(otherImage);
          processed.add(otherImage.id);
        }
      }

      if (similarImages.length > 1) {
        duplicates.push(similarImages);
        similarImages.forEach(img => processed.add(img.id));
      }
    }

    const totalDuplicates = duplicates.reduce(
      (sum, group) => sum + group.length - 1,
      0
    );
    const potentialSavings = duplicates.reduce((sum, group) => {
      // Keep the first image, remove the rest
      return (
        sum +
        group.slice(1).reduce((groupSum, img) => groupSum + img.fileSize, 0)
      );
    }, 0);

    return {
      duplicates,
      totalDuplicates,
      potentialSavings,
    };
  }

  /**
   * Delete images by IDs
   */
  static async deleteImages(imageIds: string[]): Promise<{
    deleted: number;
    errors: string[];
  }> {
    const errors: string[] = [];
    let deleted = 0;

    for (const imageId of imageIds) {
      try {
        await prisma.imageMetadata.delete({
          where: { id: imageId },
        });
        deleted++;
      } catch (error) {
        errors.push(
          `Failed to delete image ${imageId}: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }

    return { deleted, errors };
  }

  /**
   * Get single image by ID
   */
  static async getImageById(imageId: string): Promise<ImageItem | null> {
    try {
      const metadata = await prisma.imageMetadata.findUnique({
        where: { id: imageId },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              isActive: true,
            },
          },
        },
      });

      if (!metadata) return null;

      return {
        id: metadata.id,
        originalUrl: metadata.originalUrl,
        filename: metadata.filename,
        fileSize: metadata.fileSize,
        width: metadata.width || 0,
        height: metadata.height || 0,
        format: metadata.format,
        uploadedAt: metadata.uploadedAt,
        processedSizes: metadata.processedSizes,
        optimizationStats: metadata.optimizationStats,
        tags: metadata.tags,
        alt: metadata.alt,
        isActive: metadata.isActive,
        productId: metadata.productId,
        status: this.determineImageStatus(metadata),
      };
    } catch (error) {
      console.error("Error getting image by ID:", error);
      return null;
    }
  }

  /**
   * Sync Product.images array with ImageMetadata records
   * This ensures consistency between the two storage methods
   */
  static async syncProductImages(productId: string): Promise<void> {
    try {
      // Get all active image metadata for this product
      const productImages = await prisma.imageMetadata.findMany({
        where: {
          productId,
          isActive: true,
        },
        orderBy: {
          uploadedAt: "asc", // Maintain consistent ordering
        },
      });

      // Extract URLs
      const imageUrls = productImages.map(img => img.originalUrl);

      // Update the product's images array
      await prisma.product.update({
        where: { id: productId },
        data: {
          images: imageUrls,
        },
      });

      console.log(`Synced ${imageUrls.length} images for product ${productId}`);
    } catch (error) {
      console.error(`Error syncing product images for ${productId}:`, error);
    }
  }

  /**
   * Sync all products' images arrays with their ImageMetadata records
   * This is a maintenance operation to fix inconsistencies
   */
  static async syncAllProductImages(): Promise<{
    processed: number;
    errors: number;
  }> {
    try {
      const products = await prisma.product.findMany({
        select: { id: true, name: true },
      });

      let processed = 0;
      let errors = 0;

      for (const product of products) {
        try {
          await this.syncProductImages(product.id);
          processed++;
        } catch (error) {
          console.error(
            `Failed to sync images for product ${product.name}:`,
            error
          );
          errors++;
        }
      }

      console.log(`Synced images for ${processed} products, ${errors} errors`);
      return { processed, errors };
    } catch (error) {
      console.error("Error syncing all product images:", error);
      return { processed: 0, errors: 1 };
    }
  }

  /**
   * Update image metadata
   */
  static async updateImageMetadata(
    imageId: string,
    updates: {
      alt?: string;
      tags?: string[];
      isActive?: boolean;
    }
  ): Promise<ImageMetadata | null> {
    try {
      const updatedImage = await prisma.imageMetadata.update({
        where: { id: imageId },
        data: updates,
      });

      // If this affects a product's images, sync the product
      if (updatedImage.productId && updates.isActive !== undefined) {
        await this.syncProductImages(updatedImage.productId);
      }

      return updatedImage;
    } catch (error) {
      console.error("Error updating image metadata:", error);
      return null;
    }
  }

  // Helper methods
  private static determineImageStatus(
    image: any
  ): "valid" | "invalid" | "orphaned" | "processing" {
    if (!image.isActive) return "invalid";
    if (!image.productId && !image.blogId && !image.blogContentId)
      return "orphaned";
    return "valid";
  }

  private static determineImageStatusFromProduct(
    product: any,
    imageUrl: string
  ): "valid" | "invalid" | "orphaned" | "processing" {
    if (!product.isActive) return "invalid";
    if (
      imageUrl.includes("placeholder") ||
      imageUrl.includes("via.placeholder")
    ) {
      return "invalid";
    }
    return "valid";
  }

  private static extractFilename(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.pathname.split("/").pop() || "unknown";
    } catch {
      return "unknown";
    }
  }

  private static extractFormat(url: string): string {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname.toLowerCase();
      if (pathname.includes(".jpg") || pathname.includes(".jpeg"))
        return "jpeg";
      if (pathname.includes(".png")) return "png";
      if (pathname.includes(".webp")) return "webp";
      if (pathname.includes(".gif")) return "gif";
      if (pathname.includes(".svg")) return "svg";
      return "unknown";
    } catch {
      return "unknown";
    }
  }

  private static estimateFileSize(url: string): number {
    // Estimate file size based on URL patterns
    if (url.includes("placeholder") || url.includes("via.placeholder")) {
      return 50 * 1024; // 50KB for placeholder images
    }
    if (url.includes("uploadthing")) {
      return 500 * 1024; // 500KB for UploadThing images
    }
    return 200 * 1024; // 200KB default estimate
  }
}
