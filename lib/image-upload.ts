/**
 * Enhanced Image Upload Service for Email Templates
 * Provides optimized image upload, processing, and management for email campaigns
 */

export interface ImageUploadOptions {
  maxSizeInMB?: number;
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: "jpeg" | "png" | "webp";
  folder?: string;
}

export interface UploadedImage {
  id: string;
  url: string;
  name: string;
  size: number;
  width: number;
  height: number;
  format: string;
  alt?: string;
  title?: string;
  uploadedAt: Date;
}

// Client-safe image upload service that uses API endpoints
export class EmailImageUploadService {
  constructor() {
    // No server-side dependencies in constructor
  }

  /**
   * Upload image with email-specific optimizations
   */
  async uploadImage(
    file: File,
    options: ImageUploadOptions = {}
  ): Promise<UploadedImage> {
    const {
      maxSizeInMB = 5,
      maxWidth = 1200,
      maxHeight = 800,
      quality = 85,
      format = "jpeg",
      folder = "email-templates",
    } = options;

    try {
      // Validate file
      this.validateImageFile(file, maxSizeInMB);

      // Process image
      const processedFile = await this.processImage(file, {
        maxWidth,
        maxHeight,
        quality,
        format,
      });

      // Create FormData for upload
      const formData = new FormData();
      formData.append("file", processedFile);

      // Upload via API endpoint
      const response = await fetch("/api/uploadthing/email-template", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Upload failed: ${errorData.error || response.statusText}`
        );
      }

      const uploadResult = await response.json();

      if (!uploadResult.success || !uploadResult.data) {
        throw new Error("Upload failed");
      }

      const uploadedFile = uploadResult.data;

      return {
        id: uploadedFile.id || `img_${Date.now()}`,
        url: uploadedFile.url,
        name: uploadedFile.name || file.name,
        size: uploadedFile.size || processedFile.size,
        width: maxWidth,
        height: maxHeight,
        format: format,
        alt: file.name,
        title: file.name,
        uploadedAt: new Date(),
      };
    } catch (error) {
      console.error("Image upload error:", error);
      throw new Error(
        `Failed to upload image: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * Delete uploaded image
   */
  async deleteImage(imageId: string): Promise<void> {
    try {
      const response = await fetch("/api/uploadthing/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ imageId }),
      });

      if (!response.ok) {
        throw new Error(`Delete failed: ${response.statusText}`);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error("Delete failed");
      }
    } catch (error) {
      console.error("Image deletion error:", error);
      throw new Error(
        `Failed to delete image: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * Get image metadata
   */
  async getImageMetadata(imageId: string): Promise<UploadedImage | null> {
    try {
      const response = await fetch(`/api/uploadthing/metadata/${imageId}`);

      if (!response.ok) {
        return null;
      }

      const result = await response.json();
      if (!result.success || !result.data) {
        return null;
      }

      const file = result.data;
      return {
        id: file.id,
        url: file.url,
        name: file.name,
        size: file.size,
        width: file.width || 0,
        height: file.height || 0,
        format: file.type?.split("/")[1] || "unknown",
        uploadedAt: new Date(file.uploadedAt),
      };
    } catch (error) {
      console.error("Get image metadata error:", error);
      return null;
    }
  }

  /**
   * Generate responsive image URLs for email
   */
  generateResponsiveUrls(baseUrl: string): {
    original: string;
    thumbnail: string;
    medium: string;
    large: string;
  } {
    // UploadThing provides automatic image transformations
    return {
      original: baseUrl,
      thumbnail: `${baseUrl}?w=150&h=150&fit=crop&q=80`,
      medium: `${baseUrl}?w=400&h=300&fit=crop&q=85`,
      large: `${baseUrl}?w=800&h=600&fit=crop&q=90`,
    };
  }

  /**
   * Validate image file
   */
  private validateImageFile(file: File, maxSizeInMB: number): void {
    // Check file type
    if (!file.type.startsWith("image/")) {
      throw new Error("File must be an image");
    }

    // Check file size
    const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
    if (file.size > maxSizeInBytes) {
      throw new Error(`File size must be less than ${maxSizeInMB}MB`);
    }

    // Check supported formats
    const supportedFormats = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
    ];
    if (!supportedFormats.includes(file.type)) {
      throw new Error(
        "Unsupported image format. Please use JPEG, PNG, WebP, or GIF"
      );
    }
  }

  /**
   * Process image for email optimization
   */
  private async processImage(
    file: File,
    options: {
      maxWidth: number;
      maxHeight: number;
      quality: number;
      format: string;
    }
  ): Promise<File> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();

      img.onload = () => {
        try {
          // Calculate new dimensions
          let { width, height } = img;

          if (width > options.maxWidth || height > options.maxHeight) {
            const ratio = Math.min(
              options.maxWidth / width,
              options.maxHeight / height
            );
            width = Math.floor(width * ratio);
            height = Math.floor(height * ratio);
          }

          // Set canvas dimensions
          canvas.width = width;
          canvas.height = height;

          // Draw and compress image
          ctx?.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            blob => {
              if (!blob) {
                reject(new Error("Failed to process image"));
                return;
              }

              // Create new file with processed blob
              const processedFile = new File([blob], file.name, {
                type: `image/${options.format}`,
                lastModified: Date.now(),
              });

              resolve(processedFile);
            },
            `image/${options.format}`,
            options.quality / 100
          );
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => {
        reject(new Error("Failed to load image"));
      };

      img.src = URL.createObjectURL(file);
    });
  }
}

// Singleton instance
export const emailImageUploadService = new EmailImageUploadService();

/**
 * Email-specific image optimization utilities
 */
export const emailImageUtils = {
  /**
   * Generate email-safe image HTML
   */
  generateEmailImageHtml(
    image: UploadedImage,
    options: {
      alt?: string;
      title?: string;
      link?: string;
      width?: number;
      height?: number;
      align?: "left" | "center" | "right";
      style?: string;
    } = {}
  ): string {
    const {
      alt = image.alt || "",
      title = image.title || "",
      link,
      width = image.width,
      height = image.height,
      align = "center",
      style = "",
    } = options;

    const imageTag = `
      <img 
        src="${image.url}" 
        alt="${alt}" 
        title="${title}" 
        width="${width}" 
        height="${height}" 
        style="max-width: 100%; height: auto; display: block; margin: 0 auto; ${style}"
        border="0"
      />
    `.trim();

    if (link) {
      return `
        <a href="${link}" target="_blank" style="text-decoration: none;">
          ${imageTag}
        </a>
      `.trim();
    }

    return imageTag;
  },

  /**
   * Generate responsive image HTML for email
   */
  generateResponsiveImageHtml(
    image: UploadedImage,
    options: {
      alt?: string;
      title?: string;
      link?: string;
      align?: "left" | "center" | "right";
    } = {}
  ): string {
    const {
      alt = image.alt || "",
      title = image.title || "",
      link,
      align = "center",
    } = options;

    // Generate responsive URLs
    const urls = emailImageUploadService.generateResponsiveUrls(image.url);

    const responsiveImage = `
      <picture>
        <source media="(max-width: 600px)" srcset="${urls.medium}">
        <source media="(max-width: 900px)" srcset="${urls.large}">
        <img 
          src="${urls.original}" 
          alt="${alt}" 
          title="${title}" 
          style="max-width: 100%; height: auto; display: block; margin: 0 auto;"
          border="0"
        />
      </picture>
    `.trim();

    if (link) {
      return `
        <a href="${link}" target="_blank" style="text-decoration: none;">
          ${responsiveImage}
        </a>
      `.trim();
    }

    return responsiveImage;
  },

  /**
   * Validate image for email compatibility
   */
  validateForEmail(image: UploadedImage): {
    isValid: boolean;
    warnings: string[];
    recommendations: string[];
  } {
    const warnings: string[] = [];
    const recommendations: string[] = [];

    // Check file size (email clients have limitations)
    if (image.size > 1024 * 1024) {
      // 1MB
      warnings.push("Image size is large for email (over 1MB)");
      recommendations.push("Consider compressing the image further");
    }

    // Check dimensions
    if (image.width > 600) {
      warnings.push("Image width exceeds recommended 600px for email");
      recommendations.push(
        "Consider using responsive images or smaller dimensions"
      );
    }

    // Check format
    if (!["jpeg", "jpg", "png", "gif"].includes(image.format.toLowerCase())) {
      warnings.push("Image format may not be supported by all email clients");
      recommendations.push("Use JPEG, PNG, or GIF for better compatibility");
    }

    return {
      isValid: warnings.length === 0,
      warnings,
      recommendations,
    };
  },
};
