/**
 * Comprehensive image validation and processing utilities
 * Handles file validation, optimization, and management
 */

import { z } from "zod";

// Supported image formats and their MIME types
export const SUPPORTED_IMAGE_FORMATS = {
  jpeg: ["image/jpeg", "image/jpg"],
  png: ["image/png"],
  webp: ["image/webp"],
  avif: ["image/avif"],
  gif: ["image/gif"],
} as const;

export const SUPPORTED_IMAGE_EXTENSIONS = Object.keys(SUPPORTED_IMAGE_FORMATS);

// Image validation schema
export const imageValidationSchema = z.object({
  file: z.instanceof(File),
  maxSize: z.number().default(4 * 1024 * 1024), // 4MB default
  maxWidth: z.number().default(4000),
  maxHeight: z.number().default(4000),
  minWidth: z.number().default(100),
  minHeight: z.number().default(100),
  allowedFormats: z
    .array(z.enum(SUPPORTED_IMAGE_EXTENSIONS))
    .default(["jpeg", "png", "webp"]),
});

export type ImageValidationOptions = z.infer<typeof imageValidationSchema>;

// Image validation result
export interface ImageValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  metadata?: {
    width: number;
    height: number;
    size: number;
    format: string;
    aspectRatio: number;
  };
}

// File type validation
export function validateImageFileType(
  file: File,
  allowedFormats: string[] = SUPPORTED_IMAGE_EXTENSIONS
): boolean {
  const mimeType = file.type.toLowerCase();
  const extension = file.name.split(".").pop()?.toLowerCase();

  // Check MIME type
  const isValidMimeType = Object.values(SUPPORTED_IMAGE_FORMATS)
    .flat()
    .some(type => type === mimeType);

  // Check file extension
  const isValidExtension = extension && allowedFormats.includes(extension);

  return isValidMimeType && isValidExtension;
}

// File size validation
export function validateImageFileSize(file: File, maxSize: number): boolean {
  return file.size <= maxSize;
}

// Image dimensions validation using canvas
export async function validateImageDimensions(
  file: File,
  maxWidth: number,
  maxHeight: number,
  minWidth: number = 100,
  minHeight: number = 100
): Promise<{ width: number; height: number; isValid: boolean }> {
  return new Promise(resolve => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      const { width, height } = img;

      const isValid =
        width >= minWidth &&
        height >= minHeight &&
        width <= maxWidth &&
        height <= maxHeight;

      resolve({ width, height, isValid });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({ width: 0, height: 0, isValid: false });
    };

    img.src = url;
  });
}

// Comprehensive image validation
export async function validateImage(
  file: File,
  options: Partial<ImageValidationOptions> = {}
): Promise<ImageValidationResult> {
  const validationOptions = imageValidationSchema.parse({
    file,
    ...options,
  });

  const errors: string[] = [];
  const warnings: string[] = [];

  // File type validation
  if (!validateImageFileType(file, validationOptions.allowedFormats)) {
    errors.push(
      `Invalid file type. Allowed formats: ${validationOptions.allowedFormats.join(", ")}`
    );
  }

  // File size validation
  if (!validateImageFileSize(file, validationOptions.maxSize)) {
    const maxSizeMB = validationOptions.maxSize / (1024 * 1024);
    errors.push(`File size too large. Maximum size: ${maxSizeMB}MB`);
  }

  // Image dimensions validation
  try {
    const dimensions = await validateImageDimensions(
      file,
      validationOptions.maxWidth,
      validationOptions.maxHeight,
      validationOptions.minWidth,
      validationOptions.minHeight
    );

    if (!dimensions.isValid) {
      errors.push(
        `Invalid image dimensions. Must be between ${validationOptions.minWidth}x${validationOptions.minHeight} and ${validationOptions.maxWidth}x${validationOptions.maxHeight}`
      );
    }

    // Add metadata if validation passes
    if (dimensions.isValid) {
      const aspectRatio = dimensions.width / dimensions.height;

      // Warning for extreme aspect ratios
      if (aspectRatio > 3 || aspectRatio < 0.33) {
        warnings.push(
          "Image has extreme aspect ratio. Consider using a more balanced image."
        );
      }

      // Warning for very small images
      if (dimensions.width < 400 || dimensions.height < 400) {
        warnings.push(
          "Image resolution is low. Consider using a higher resolution image for better quality."
        );
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        metadata: {
          width: dimensions.width,
          height: dimensions.height,
          size: file.size,
          format: file.type.split("/")[1] || "unknown",
          aspectRatio,
        },
      };
    }
  } catch (error) {
    errors.push("Failed to validate image dimensions");
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

// Generate human-readable file size
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))  } ${  sizes[i]}`;
}

// Get recommended image dimensions for different use cases
export const IMAGE_DIMENSIONS = {
  thumbnail: { width: 150, height: 150 },
  small: { width: 300, height: 300 },
  medium: { width: 600, height: 600 },
  large: { width: 1200, height: 1200 },
  hero: { width: 1920, height: 1080 },
} as const;

// Validate image for specific use case
export async function validateImageForUseCase(
  file: File,
  useCase: keyof typeof IMAGE_DIMENSIONS
): Promise<ImageValidationResult> {
  const dimensions = IMAGE_DIMENSIONS[useCase];

  return validateImage(file, {
    maxWidth: dimensions.width * 2, // Allow 2x for retina displays
    maxHeight: dimensions.height * 2,
    minWidth: dimensions.width,
    minHeight: dimensions.height,
  });
}
