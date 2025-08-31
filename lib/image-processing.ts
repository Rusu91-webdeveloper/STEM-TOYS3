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

/**
 * Generate multiple image sizes for responsive design
 * This creates optimized versions for different use cases
 */
export async function generateImageSizes(
  originalUrl: string,
  fileName: string
): Promise<ImageSizes> {
  try {
    // For now, we'll use placeholder URLs with different sizes
    // In production, you would integrate with an image processing service
    // like Cloudinary, ImageKit, or AWS Lambda with Sharp

    const baseUrl = "https://via.placeholder.com";
    const sizes = {
      thumbnail: `${baseUrl}/150x150?text=${encodeURIComponent(fileName)}&bg=random`,
      small: `${baseUrl}/300x300?text=${encodeURIComponent(fileName)}&bg=random`,
      medium: `${baseUrl}/600x600?text=${encodeURIComponent(fileName)}&bg=random`,
      large: `${baseUrl}/1200x1200?text=${encodeURIComponent(fileName)}&bg=random`,
      original: originalUrl,
    };

    return sizes;
  } catch (error) {
    console.error("Error generating image sizes:", error);

    // Fallback to single size
    return {
      thumbnail: originalUrl,
      small: originalUrl,
      medium: originalUrl,
      large: originalUrl,
      original: originalUrl,
    };
  }
}

/**
 * Process uploaded images and generate multiple sizes
 */
export async function processProductImages(
  imageUrls: string[]
): Promise<ProcessedImage[]> {
  const processedImages: ProcessedImage[] = [];

  for (const imageUrl of imageUrls) {
    try {
      if (imageUrl.startsWith("placeholder://")) {
        // Handle placeholder URLs from the form
        const url = new URL(imageUrl);
        const fileName = url.hostname;
        const params = new URLSearchParams(url.search);
        const size = params.get("size");
        const type = params.get("type");

        // Generate multiple sizes for placeholder images
        const sizes = await generateImageSizes(imageUrl, fileName);

        processedImages.push({
          id: Math.random().toString(36).substr(2, 9),
          originalUrl: imageUrl,
          sizes,
          metadata: {
            width: 400,
            height: 400,
            size: parseInt(size || "0"),
            format: type || "unknown",
            aspectRatio: 1,
          },
        });
      } else if (imageUrl.startsWith("blob:")) {
        // Handle blob URLs (temporary file uploads)
        const fileName = "uploaded-image";
        const sizes = await generateImageSizes(imageUrl, fileName);

        processedImages.push({
          id: Math.random().toString(36).substr(2, 9),
          originalUrl: imageUrl,
          sizes,
          metadata: {
            width: 400,
            height: 400,
            size: 0,
            format: "unknown",
            aspectRatio: 1,
          },
        });
      } else if (imageUrl.startsWith("http")) {
        // Handle existing HTTP URLs
        const fileName = imageUrl.split("/").pop() || "image";
        const sizes = await generateImageSizes(imageUrl, fileName);

        processedImages.push({
          id: Math.random().toString(36).substr(2, 9),
          originalUrl: imageUrl,
          sizes,
          metadata: {
            width: 400,
            height: 400,
            size: 0,
            format: "unknown",
            aspectRatio: 1,
          },
        });
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
 * Extract image URLs for storage in database
 * This stores the processed image data as JSON
 */
export function extractImageUrlsForStorage(
  processedImages: ProcessedImage[]
): string[] {
  return processedImages.map(img =>
    JSON.stringify({
      id: img.id,
      originalUrl: img.originalUrl,
      sizes: img.sizes,
      metadata: img.metadata,
    })
  );
}

/**
 * Parse stored image data back to ProcessedImage objects
 */
export function parseStoredImages(storedImages: string[]): ProcessedImage[] {
  return storedImages.map(imgStr => {
    try {
      return JSON.parse(imgStr) as ProcessedImage;
    } catch (error) {
      console.error("Error parsing stored image:", imgStr, error);

      // Return fallback image
      return {
        id: Math.random().toString(36).substr(2, 9),
        originalUrl: imgStr,
        sizes: {
          thumbnail: imgStr,
          small: imgStr,
          medium: imgStr,
          large: imgStr,
          original: imgStr,
        },
        metadata: {
          width: 400,
          height: 400,
          size: 0,
          format: "unknown",
          aspectRatio: 1,
        },
      };
    }
  });
}
