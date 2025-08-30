/**
 * Image management service for handling image operations, cleanup, and optimization
 * Integrates with UploadThing for file management
 */

import { utapi } from "@/lib/uploadthing";
import { deleteUploadThingFiles } from "@/lib/uploadthing";

export interface ImageMetadata {
  url: string;
  filename: string;
  size: number;
  width?: number;
  height?: number;
  format?: string;
  uploadedAt: Date;
  tags?: string[];
  alt?: string;
}

export interface ImageOptimizationOptions {
  quality?: number; // 0-100
  format?: "jpeg" | "png" | "webp" | "avif";
  width?: number;
  height?: number;
  fit?: "cover" | "contain" | "fill" | "inside" | "outside";
  position?:
    | "top"
    | "right-top"
    | "right"
    | "right-bottom"
    | "bottom"
    | "left-bottom"
    | "left"
    | "left-top"
    | "center";
}

export interface ImageManagementStats {
  totalImages: number;
  totalSize: number;
  formats: Record<string, number>;
  averageSize: number;
  oldestImage?: Date;
  newestImage?: Date;
}

/**
 * Image Management Service
 */
export class ImageManagementService {
  /**
   * Upload image with metadata
   */
  static async uploadImage(
    file: File,
    metadata: Partial<Omit<ImageMetadata, "url" | "uploadedAt">> = {}
  ): Promise<ImageMetadata> {
    try {
      // Upload to UploadThing
      const uploadResult = await utapi.uploadFiles({
        files: [file],
        endpoint: "productImage",
      });

      if (!uploadResult.data?.[0]) {
        throw new Error("Upload failed");
      }

      const uploadedFile = uploadResult.data[0];

      return {
        url: uploadedFile.url,
        filename: uploadedFile.name,
        size: uploadedFile.size,
        width: metadata.width,
        height: metadata.height,
        format: metadata.format || file.type.split("/")[1],
        uploadedAt: new Date(),
        tags: metadata.tags || [],
        alt: metadata.alt || file.name,
      };
    } catch (error) {
      console.error("Image upload failed:", error);
      throw new Error(
        `Failed to upload image: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * Delete image from UploadThing
   */
  static async deleteImage(imageUrl: string): Promise<boolean> {
    try {
      const result = await deleteUploadThingFiles([imageUrl]);
      return result.success;
    } catch (error) {
      console.error("Image deletion failed:", error);
      return false;
    }
  }

  /**
   * Delete multiple images
   */
  static async deleteImages(
    imageUrls: string[]
  ): Promise<{ success: boolean; deleted: number; failed: number }> {
    try {
      const result = await deleteUploadThingFiles(imageUrls);
      return {
        success: result.success,
        deleted: result.success ? imageUrls.length : 0,
        failed: result.success ? 0 : imageUrls.length,
      };
    } catch (error) {
      console.error("Bulk image deletion failed:", error);
      return {
        success: false,
        deleted: 0,
        failed: imageUrls.length,
      };
    }
  }

  /**
   * Get image information from UploadThing
   */
  static async getImageInfo(
    imageUrl: string
  ): Promise<Partial<ImageMetadata> | null> {
    try {
      // Extract file key from UploadThing URL
      const fileKey = this.extractFileKeyFromUrl(imageUrl);
      if (!fileKey) return null;

      // Get file info from UploadThing
      const fileInfo = await utapi.getFileInfo(fileKey);

      if (!fileInfo) return null;

      return {
        url: imageUrl,
        filename: fileInfo.name,
        size: fileInfo.size,
        uploadedAt: fileInfo.uploadedAt,
      };
    } catch (error) {
      console.error("Failed to get image info:", error);
      return null;
    }
  }

  /**
   * Extract file key from UploadThing URL
   */
  private static extractFileKeyFromUrl(url: string): string | null {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split("/");
      const fileIndex = pathParts.findIndex(part => part === "f");

      if (fileIndex !== -1 && pathParts[fileIndex + 1]) {
        return pathParts[fileIndex + 1];
      }

      return null;
    } catch {
      return null;
    }
  }

  /**
   * Generate optimized image URL with query parameters
   * This can be used with image optimization services like Cloudinary, ImageKit, etc.
   */
  static generateOptimizedUrl(
    originalUrl: string,
    options: ImageOptimizationOptions = {}
  ): string {
    try {
      const url = new URL(originalUrl);

      // Add optimization parameters
      if (options.quality !== undefined) {
        url.searchParams.set("q", options.quality.toString());
      }

      if (options.format) {
        url.searchParams.set("f", options.format);
      }

      if (options.width) {
        url.searchParams.set("w", options.width.toString());
      }

      if (options.height) {
        url.searchParams.set("h", options.height.toString());
      }

      if (options.fit) {
        url.searchParams.set("fit", options.fit);
      }

      if (options.position) {
        url.searchParams.set("pos", options.position);
      }

      return url.toString();
    } catch {
      return originalUrl;
    }
  }

  /**
   * Generate responsive image URLs for different breakpoints
   */
  static generateResponsiveUrls(
    originalUrl: string,
    breakpoints: { [key: string]: number } = {
      sm: 640,
      md: 768,
      lg: 1024,
      xl: 1280,
      "2xl": 1536,
    }
  ): { [key: string]: string } {
    const responsiveUrls: { [key: string]: string } = {};

    Object.entries(breakpoints).forEach(([breakpoint, width]) => {
      responsiveUrls[breakpoint] = this.generateOptimizedUrl(originalUrl, {
        width,
      });
    });

    return responsiveUrls;
  }

  /**
   * Validate image URLs (check if they're still accessible)
   */
  static async validateImageUrls(
    imageUrls: string[]
  ): Promise<{ [url: string]: boolean }> {
    const results: { [url: string]: boolean } = {};

    await Promise.allSettled(
      imageUrls.map(async url => {
        try {
          const response = await fetch(url, { method: "HEAD" });
          results[url] = response.ok;
        } catch {
          results[url] = false;
        }
      })
    );

    return results;
  }

  /**
   * Clean up orphaned images (images not referenced in database)
   */
  static async cleanupOrphanedImages(
    referencedImageUrls: string[],
    allImageUrls: string[]
  ): Promise<{ cleaned: number; failed: number }> {
    const orphanedUrls = allImageUrls.filter(
      url => !referencedImageUrls.includes(url)
    );

    if (orphanedUrls.length === 0) {
      return { cleaned: 0, failed: 0 };
    }

    try {
      const result = await this.deleteImages(orphanedUrls);
      return {
        cleaned: result.deleted,
        failed: result.failed,
      };
    } catch (error) {
      console.error("Cleanup failed:", error);
      return { cleaned: 0, failed: orphanedUrls.length };
    }
  }

  /**
   * Get image management statistics
   */
  static async getImageStats(
    imageUrls: string[]
  ): Promise<ImageManagementStats> {
    if (imageUrls.length === 0) {
      return {
        totalImages: 0,
        totalSize: 0,
        formats: {},
        averageSize: 0,
      };
    }

    const imageInfos = await Promise.allSettled(
      imageUrls.map(url => this.getImageInfo(url))
    );

    const validInfos = imageInfos
      .filter(
        (
          result
        ): result is PromiseFulfilledResult<Partial<ImageMetadata> | null> =>
          result.status === "fulfilled" && result.value !== null
      )
      .map(result => result.value!);

    const totalSize = validInfos.reduce(
      (sum, info) => sum + (info.size || 0),
      0
    );
    const formats: Record<string, number> = {};

    validInfos.forEach(info => {
      if (info.format) {
        formats[info.format] = (formats[info.format] || 0) + 1;
      }
    });

    const uploadDates = validInfos
      .map(info => info.uploadedAt)
      .filter((date): date is Date => date !== undefined)
      .sort((a, b) => a.getTime() - b.getTime());

    return {
      totalImages: validInfos.length,
      totalSize,
      formats,
      averageSize: totalSize / validInfos.length,
      oldestImage: uploadDates[0],
      newestImage: uploadDates[uploadDates.length - 1],
    };
  }

  /**
   * Generate image placeholder for missing images
   */
  static generatePlaceholderUrl(
    dimensions: { width: number; height: number },
    text?: string,
    backgroundColor?: string,
    textColor?: string
  ): string {
    const { width, height } = dimensions;
    const bg = backgroundColor || "f3f4f6";
    const color = textColor || "6b7280";
    const placeholderText = text || `${width}×${height}`;

    return `https://via.placeholder.com/${width}x${height}/${bg}/${color}?text=${encodeURIComponent(placeholderText)}`;
  }

  /**
   * Check if URL is an UploadThing URL
   */
  static isUploadThingUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return (
        urlObj.hostname.includes("uploadthing.com") ||
        urlObj.hostname.includes("utfs.io")
      );
    } catch {
      return false;
    }
  }

  /**
   * Get image dimensions from URL (requires image to be loaded)
   */
  static getImageDimensions(
    url: string
  ): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve({ width: img.width, height: img.height });
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = url;
    });
  }
}
