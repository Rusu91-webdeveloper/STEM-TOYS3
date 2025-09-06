import sharp from "sharp";
import { utapi } from "./uploadthing";

export interface ImageSizes {
  thumbnail: string; // 150x150 - for lists, thumbnails
  small: string; // 300x300 - for cards, previews
  medium: string; // 600x600 - for product pages
  large: string; // 1200x1200 - for full-size viewing
  original: string; // Original size - for downloads
}

export interface ProcessedImage {
  id: string;
  originalUrl: string;
  sizes: ImageSizes;
  metadata: {
    width: number;
    height: number;
    size: number;
    format: string;
    aspectRatio: number;
  };
}

export interface ImageMetadata {
  width: number;
  height: number;
  format: string;
  size: number;
  aspectRatio: number;
}

/**
 * Extract image metadata using Sharp
 */
export async function extractImageMetadata(
  imageBuffer: Buffer
): Promise<ImageMetadata> {
  try {
    const metadata = await sharp(imageBuffer).metadata();

    return {
      width: metadata.width || 0,
      height: metadata.height || 0,
      format: metadata.format || "unknown",
      size: imageBuffer.length,
      aspectRatio:
        metadata.width && metadata.height
          ? metadata.width / metadata.height
          : 1,
    };
  } catch (error) {
    console.error("Error extracting image metadata:", error);
    throw new Error("Failed to extract image metadata");
  }
}

/**
 * Process image with Sharp to create multiple sizes
 */
export async function processImageWithSharp(
  imageBuffer: Buffer,
  fileName: string,
  originalUrl: string
): Promise<ProcessedImage> {
  try {
    const metadata = await extractImageMetadata(imageBuffer);

    // Generate different sizes
    const sizes = await generateMultipleSizes(imageBuffer, fileName);

    return {
      id: Math.random().toString(36).substr(2, 9),
      originalUrl,
      sizes,
      metadata,
    };
  } catch (error) {
    console.error("Error processing image with Sharp:", error);
    throw new Error("Failed to process image");
  }
}

/**
 * Generate multiple image sizes using Sharp
 */
export async function generateMultipleSizes(
  imageBuffer: Buffer,
  fileName: string
): Promise<ImageSizes> {
  try {
    const baseFileName = fileName.replace(/\.[^/.]+$/, "");

    // Create different sizes
    const thumbnail = await sharp(imageBuffer)
      .resize(150, 150, { fit: "cover", position: "center" })
      .jpeg({ quality: 85 })
      .toBuffer();

    const small = await sharp(imageBuffer)
      .resize(300, 300, { fit: "cover", position: "center" })
      .jpeg({ quality: 85 })
      .toBuffer();

    const medium = await sharp(imageBuffer)
      .resize(600, 600, { fit: "cover", position: "center" })
      .jpeg({ quality: 85 })
      .toBuffer();

    const large = await sharp(imageBuffer)
      .resize(1200, 1200, { fit: "cover", position: "center" })
      .jpeg({ quality: 85 })
      .toBuffer();

    // Upload all sizes to UploadThing
    const [thumbnailUpload, smallUpload, mediumUpload, largeUpload] =
      await Promise.all([
        utapi.upload(thumbnail, { name: `${baseFileName}-thumbnail.jpg` }),
        utapi.upload(small, { name: `${baseFileName}-small.jpg` }),
        utapi.upload(medium, { name: `${baseFileName}-medium.jpg` }),
        utapi.upload(large, { name: `${baseFileName}-large.jpg` }),
      ]);

    return {
      thumbnail: thumbnailUpload.data?.url || "",
      small: smallUpload.data?.url || "",
      medium: mediumUpload.data?.url || "",
      large: largeUpload.data?.url || "",
      original: "", // Will be set separately
    };
  } catch (error) {
    console.error("Error generating multiple sizes:", error);
    throw new Error("Failed to generate image sizes");
  }
}

/**
 * Optimize image for web delivery
 */
export async function optimizeImage(
  imageBuffer: Buffer,
  options: {
    quality?: number;
    format?: "jpeg" | "png" | "webp";
    maxWidth?: number;
    maxHeight?: number;
  } = {}
): Promise<Buffer> {
  try {
    const {
      quality = 85,
      format = "jpeg",
      maxWidth = 1200,
      maxHeight = 1200,
    } = options;

    let sharpInstance = sharp(imageBuffer);

    // Resize if needed
    if (maxWidth || maxHeight) {
      sharpInstance = sharpInstance.resize(maxWidth, maxHeight, {
        fit: "inside",
        withoutEnlargement: true,
      });
    }

    // Convert format and optimize
    switch (format) {
      case "jpeg":
        return await sharpInstance.jpeg({ quality }).toBuffer();
      case "png":
        return await sharpInstance.png({ quality }).toBuffer();
      case "webp":
        return await sharpInstance.webp({ quality }).toBuffer();
      default:
        return await sharpInstance.jpeg({ quality }).toBuffer();
    }
  } catch (error) {
    console.error("Error optimizing image:", error);
    throw new Error("Failed to optimize image");
  }
}

/**
 * Process uploaded images and generate multiple sizes
 */
export async function processProductImagesReal(
  imageUrls: string[]
): Promise<ProcessedImage[]> {
  const processedImages: ProcessedImage[] = [];

  for (const imageUrl of imageUrls) {
    try {
      if (
        imageUrl.startsWith("blob:") ||
        imageUrl.startsWith("placeholder://")
      ) {
        // Skip blob URLs and placeholders for now
        // In a real implementation, you'd need to handle these differently
        console.warn("Skipping blob/placeholder URL:", imageUrl);
        continue;
      }

      if (imageUrl.startsWith("http")) {
        // Download the image
        const response = await fetch(imageUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch image: ${response.statusText}`);
        }

        const imageBuffer = Buffer.from(await response.arrayBuffer());
        const fileName = imageUrl.split("/").pop() || "image";

        // Process with Sharp
        const processedImage = await processImageWithSharp(
          imageBuffer,
          fileName,
          imageUrl
        );
        processedImages.push(processedImage);
      }
    } catch (error) {
      console.error("Error processing image:", imageUrl, error);

      // Add fallback image
      processedImages.push({
        id: Math.random().toString(36).substr(2, 9),
        originalUrl: imageUrl,
        sizes: {
          thumbnail: "https://via.placeholder.com/150x150?text=Error&bg=red",
          small: "https://via.placeholder.com/300x300?text=Error&bg=red",
          medium: "https://via.placeholder.com/600x600?text=Error&bg=red",
          large: "https://via.placeholder.com/1200x1200?text=Error&bg=red",
          original: imageUrl,
        },
        metadata: {
          width: 400,
          height: 400,
          size: 0,
          format: "unknown",
          aspectRatio: 1,
        },
      });
    }
  }

  return processedImages;
}

/**
 * Calculate storage savings from optimization
 */
export function calculateStorageSavings(
  originalSize: number,
  optimizedSize: number
): {
  bytesSaved: number;
  percentageSaved: number;
  formattedSavings: string;
} {
  const bytesSaved = originalSize - optimizedSize;
  const percentageSaved =
    originalSize > 0 ? (bytesSaved / originalSize) * 100 : 0;

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return {
    bytesSaved,
    percentageSaved: Math.round(percentageSaved * 100) / 100,
    formattedSavings: formatBytes(bytesSaved),
  };
}

/**
 * Validate image file
 */
export async function validateImageFile(
  file: File | Buffer,
  options: {
    maxSize?: number; // in bytes
    allowedFormats?: string[];
    minWidth?: number;
    minHeight?: number;
  } = {}
): Promise<{
  isValid: boolean;
  errors: string[];
  metadata?: ImageMetadata;
}> {
  const {
    maxSize = 10 * 1024 * 1024, // 10MB default
    allowedFormats = ["jpeg", "jpg", "png", "webp"],
    minWidth = 100,
    minHeight = 100,
  } = options;

  const errors: string[] = [];

  try {
    const buffer = Buffer.isBuffer(file)
      ? file
      : Buffer.from(await file.arrayBuffer());

    // Check file size
    if (buffer.length > maxSize) {
      errors.push(
        `File size exceeds maximum allowed size of ${Math.round(maxSize / 1024 / 1024)}MB`
      );
    }

    // Extract metadata
    const metadata = await extractImageMetadata(buffer);

    // Check format
    if (!allowedFormats.includes(metadata.format.toLowerCase())) {
      errors.push(
        `File format '${metadata.format}' is not allowed. Allowed formats: ${allowedFormats.join(", ")}`
      );
    }

    // Check dimensions
    if (metadata.width < minWidth) {
      errors.push(
        `Image width (${metadata.width}px) is below minimum required width (${minWidth}px)`
      );
    }

    if (metadata.height < minHeight) {
      errors.push(
        `Image height (${metadata.height}px) is below minimum required height (${minHeight}px)`
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
      metadata,
    };
  } catch (error) {
    errors.push(
      `Failed to validate image: ${error instanceof Error ? error.message : "Unknown error"}`
    );
    return {
      isValid: false,
      errors,
    };
  }
}
