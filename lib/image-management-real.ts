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
      isActive?: boolean;
      search?: string;
      sortBy?: string;
      sortOrder?: "asc" | "desc";
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
      isActive,
      search,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = options;

    const skip = (page - 1) * limit;

    // Build where clause for products
    const where: any = {
      images: {
        isEmpty: false,
      },
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    // Get products with images and total count
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        select: {
          id: true,
          name: true,
          slug: true,
          images: true,
          createdAt: true,
          updatedAt: true,
          isActive: true,
        },
      }),
      prisma.product.count({ where }),
    ]);

    // Transform product images to ImageItem format
    const transformedImages: ImageItem[] = [];

    products.forEach(product => {
      product.images.forEach((imageUrl, index) => {
        const filename = this.extractFilename(imageUrl);
        const format = this.extractFormat(imageUrl);

        transformedImages.push({
          id: `${product.id}-${index}`,
          originalUrl: imageUrl,
          filename: filename,
          fileSize: 0, // We don't have file size info from URLs
          width: 0, // We don't have dimension info from URLs
          height: 0,
          format: format,
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

    return {
      images: transformedImages,
      total: transformedImages.length,
      page,
      limit,
      totalPages: Math.ceil(transformedImages.length / limit),
    };
  }

  /**
   * Get image statistics
   */
  static async getImageStats(): Promise<ImageStats> {
    // Get all products with images
    const products = await prisma.product.findMany({
      where: {
        images: {
          isEmpty: false,
        },
      },
      select: {
        images: true,
        isActive: true,
        createdAt: true,
      },
    });

    // Calculate statistics from product images
    let totalImages = 0;
    const formatDistribution: Record<string, number> = {};
    const sizeDistribution: Record<string, number> = {
      "0-100KB": 0,
      "100KB-1MB": 0,
      "1MB-5MB": 0,
      "5MB-10MB": 0,
      "10MB+": 0,
    };

    products.forEach(product => {
      product.images.forEach(imageUrl => {
        totalImages++;
        const format = this.extractFormat(imageUrl);
        formatDistribution[format] = (formatDistribution[format] || 0) + 1;

        // Estimate file size based on URL (placeholder images are typically small)
        const estimatedSize = this.estimateFileSize(imageUrl);
        if (estimatedSize < 100 * 1024) sizeDistribution["0-100KB"]++;
        else if (estimatedSize < 1024 * 1024) sizeDistribution["100KB-1MB"]++;
        else if (estimatedSize < 5 * 1024 * 1024) sizeDistribution["1MB-5MB"]++;
        else if (estimatedSize < 10 * 1024 * 1024)
          sizeDistribution["5MB-10MB"]++;
        else sizeDistribution["10MB+"]++;
      });
    });

    const totalSize = totalImages * 500 * 1024; // Estimate 500KB average per image
    const averageSize = totalImages > 0 ? totalSize / totalImages : 0;

    return {
      totalImages,
      totalSize,
      averageSize,
      formatDistribution,
      sizeDistribution,
      processingStats: {
        totalProcessed: totalImages,
        successRate: 100, // All images are considered successfully processed
        averageProcessingTime: 0, // No processing time data available
      },
      storageSavings: {
        totalSaved: 0,
        percentageSaved: 0,
      },
    };
  }

  /**
   * Save processed images to database
   */
  static async saveProcessedImages(
    processedImages: ProcessedImage[],
    productId?: string
  ): Promise<ImageMetadata[]> {
    const savedImages: ImageMetadata[] = [];

    for (const processedImage of processedImages) {
      try {
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
   * Find orphaned images (not referenced by any product)
   */
  static async findOrphanedImages(): Promise<ImageItem[]> {
    // Since images are stored in Product.images array, we don't have orphaned images
    // in the traditional sense. All images are associated with products.
    // Return empty array for now.
    return [];
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
      return await prisma.imageMetadata.update({
        where: { id: imageId },
        data: updates,
      });
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
    if (!image.productId) return "orphaned";
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
