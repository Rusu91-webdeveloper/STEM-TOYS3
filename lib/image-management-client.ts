/**
 * Client-safe image management service for handling image operations
 * This version doesn't import server-only modules and can be used in client components
 */

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
 * Client-safe Image Management Service
 */
export class ImageManagementServiceClient {
  /**
   * Get image statistics from mock data (for client-side display)
   */
  static async getMockStats(): Promise<ImageManagementStats> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));

    return {
      totalImages: 150,
      totalSize: 256 * 1024 * 1024, // 256MB
      formats: {
        jpeg: 80,
        png: 45,
        webp: 15,
        avif: 10,
      },
      averageSize: 1.7 * 1024 * 1024, // 1.7MB
      oldestImage: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 90 days ago
      newestImage: new Date(),
    };
  }

  /**
   * Get mock images for client-side display
   */
  static async getMockImages(): Promise<ImageMetadata[]> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 800));

    const mockImages: ImageMetadata[] = [
      {
        url: "https://via.placeholder.com/800x600",
        filename: "product-1.jpg",
        size: 1024 * 1024, // 1MB
        width: 800,
        height: 600,
        format: "jpeg",
        uploadedAt: new Date(Date.now() - 86400000), // 1 day ago
        tags: ["product", "electronics"],
        alt: "Product image 1",
      },
      {
        url: "https://via.placeholder.com/1200x800",
        filename: "banner-1.png",
        size: 2 * 1024 * 1024, // 2MB
        width: 1200,
        height: 800,
        format: "png",
        uploadedAt: new Date(Date.now() - 172800000), // 2 days ago
        tags: ["banner", "marketing"],
        alt: "Marketing banner",
      },
      {
        url: "https://via.placeholder.com/600x400",
        filename: "icon-set.svg",
        size: 256 * 1024, // 256KB
        width: 600,
        height: 400,
        format: "svg",
        uploadedAt: new Date(Date.now() - 259200000), // 3 days ago
        tags: ["icon", "ui"],
        alt: "Icon set",
      },
      {
        url: "https://via.placeholder.com/1600x900",
        filename: "hero-image.webp",
        size: 3.5 * 1024 * 1024, // 3.5MB
        width: 1600,
        height: 900,
        format: "webp",
        uploadedAt: new Date(Date.now() - 345600000), // 4 days ago
        tags: ["hero", "landing"],
        alt: "Hero section image",
      },
      {
        url: "https://via.placeholder.com/400x300",
        filename: "thumbnail.jpg",
        size: 512 * 1024, // 512KB
        width: 400,
        height: 300,
        format: "jpeg",
        uploadedAt: new Date(Date.now() - 432000000), // 5 days ago
        tags: ["thumbnail", "product"],
        alt: "Product thumbnail",
      },
    ];

    return mockImages;
  }

  /**
   * Analyze image performance and generate recommendations
   */
  static async analyzeImagePerformance(images: ImageMetadata[]): Promise<{
    totalImages: number;
    totalSize: number;
    averageSize: number;
    formats: Record<string, number>;
    sizeDistribution: {
      small: number;
      medium: number;
      large: number;
      huge: number;
    };
    recommendations: string[];
  }> {
    if (images.length === 0) {
      return {
        totalImages: 0,
        totalSize: 0,
        averageSize: 0,
        formats: {},
        sizeDistribution: { small: 0, medium: 0, large: 0, huge: 0 },
        recommendations: ["No images to analyze"],
      };
    }

    const totalSize = images.reduce((sum, img) => sum + (img.size || 0), 0);
    const averageSize = totalSize / images.length;

    // Count formats
    const formats = images.reduce(
      (acc, img) => {
        const format = img.format || "unknown";
        acc[format] = (acc[format] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    // Size distribution
    const sizeDistribution = {
      small: images.filter(img => (img.size || 0) < 100 * 1024).length,
      medium: images.filter(
        img => (img.size || 0) >= 100 * 1024 && (img.size || 0) < 1024 * 1024
      ).length,
      large: images.filter(
        img =>
          (img.size || 0) >= 1024 * 1024 && (img.size || 0) < 5 * 1024 * 1024
      ).length,
      huge: images.filter(img => (img.size || 0) >= 5 * 1024 * 1024).length,
    };

    // Generate recommendations
    const recommendations: string[] = [];

    if (sizeDistribution.huge > 0) {
      recommendations.push(
        `Consider optimizing ${sizeDistribution.huge} large images (>5MB) for better performance`
      );
    }

    if (sizeDistribution.large > 5) {
      recommendations.push(
        `Optimize ${sizeDistribution.large} medium-large images (1-5MB) to reduce loading times`
      );
    }

    if (formats.jpeg && formats.jpeg > formats.webp + formats.avif) {
      recommendations.push(
        "Consider converting JPEG images to WebP or AVIF for better compression"
      );
    }

    if (averageSize > 2 * 1024 * 1024) {
      recommendations.push(
        "Average image size is high - implement responsive images and optimization"
      );
    }

    return {
      totalImages: images.length,
      totalSize,
      averageSize,
      formats,
      sizeDistribution,
      recommendations,
    };
  }

  /**
   * Format file size for display
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))  } ${  sizes[i]}`;
  }

  /**
   * Get performance score color
   */
  static getPerformanceScoreColor(score: number): string {
    if (score >= 90) return "text-green-600";
    if (score >= 70) return "text-yellow-600";
    if (score >= 50) return "text-orange-600";
    return "text-red-600";
  }

  /**
   * Get performance score badge variant
   */
  static getPerformanceScoreBadgeVariant(
    score: number
  ): "default" | "secondary" | "destructive" {
    if (score >= 90) return "default";
    if (score >= 70) return "secondary";
    return "destructive";
  }

  /**
   * Delete images (mock implementation for client-side)
   */
  static async deleteImages(
    imageUrls: string[]
  ): Promise<{ success: boolean; message: string }> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // In a real implementation, this would call an API endpoint
    console.log(`Mock deletion of ${imageUrls.length} images:`, imageUrls);

    return {
      success: true,
      message: `Successfully deleted ${imageUrls.length} images`,
    };
  }
}
