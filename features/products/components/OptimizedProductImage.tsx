"use client";

import Image from "next/image";
import React, { useState } from "react";

interface OptimizedProductImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  className?: string;
  priority?: boolean;
  sizes?: string;
  quality?: number;
  placeholder?: "blur" | "empty";
  blurDataURL?: string;
  onLoad?: () => void;
  onError?: () => void;
}

// Generate a better blur placeholder with proper aspect ratio
// Currently unused but kept for future enhancement
const _generateBlurDataURL = (width = 400, height = 400) => {
  // Check if we're in a browser environment
  if (typeof window === "undefined" || typeof document === "undefined") {
    return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";
  }

  try {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");

    if (!ctx)
      return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";

    // Create a subtle gradient blur
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, "#f3f4f6");
    gradient.addColorStop(0.5, "#e5e7eb");
    gradient.addColorStop(1, "#d1d5db");

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    return canvas.toDataURL();
  } catch (error) {
    console.warn("Error generating blur data URL:", error);
    return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";
  }
};

// Default blur data URL for SSR compatibility
const DEFAULT_BLUR_DATA_URL =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImciIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPjxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiNmM2Y0ZjYiLz48c3RvcCBvZmZzZXQ9IjUwJSIgc3RvcC1jb2xvcj0iI2U1ZTdlYiIvPjxzdG9wIG9mZnNldD0iMTAwJSIgc3RvcC1jb2xvcj0iI2QxZDViZCIvPjwvbGluZWFyR3JhZGllbnQ+PC9kZWZzPjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIiBmaWxsPSJ1cmwoI2cpIi8+PC9zdmc+";

export function OptimizedProductImage({
  src,
  alt,
  width,
  height,
  fill = false,
  className = "",
  priority = false,
  sizes = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw",
  quality = 85,
  placeholder = "blur",
  blurDataURL,
  onLoad,
  onError,
}: OptimizedProductImageProps) {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Generate WebP URL if supported
  const getOptimizedSrc = (originalSrc: string) => {
    if (!originalSrc) return originalSrc;

    // If it's already a WebP or external URL, return as-is
    if (originalSrc.includes(".webp") || originalSrc.startsWith("http")) {
      return originalSrc;
    }

    // For local images, try to use WebP version
    const extension = originalSrc.split(".").pop();
    if (extension && ["jpg", "jpeg", "png"].includes(extension.toLowerCase())) {
      return originalSrc.replace(`.${extension}`, ".webp");
    }

    return originalSrc;
  };

  const handleLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  const handleError = () => {
    setImageError(true);
    setIsLoading(false);
    onError?.();
  };

  const optimizedSrc = getOptimizedSrc(src);
  const fallbackBlurDataURL = blurDataURL ?? DEFAULT_BLUR_DATA_URL;

  // Error fallback component
  if (imageError) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 ${className}`}
      >
        <div className="text-center text-gray-400">
          <svg
            className="mx-auto h-8 w-8 mb-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <span className="text-xs">Image unavailable</span>
        </div>
      </div>
    );
  }

  const imageProps = {
    src: optimizedSrc,
    alt,
    className: `transition-opacity duration-300 ${isLoading ? "opacity-0" : "opacity-100"} ${className}`,
    priority,
    quality,
    sizes,
    onLoad: handleLoad,
    onError: handleError,
    placeholder: placeholder as "blur" | "empty",
    ...(placeholder === "blur" && { blurDataURL: fallbackBlurDataURL }),
    ...(fill ? { fill: true } : { width, height }),
  };

  return (
    <>
      <Image {...imageProps} alt={alt} />
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="animate-pulse">
            <div className="h-4 w-4 bg-gray-300 rounded-full animate-bounce"></div>
          </div>
        </div>
      )}
    </>
  );
}

// Higher-order component for responsive images
export function ResponsiveProductImage({
  src,
  alt,
  className = "",
  priority = false,
  aspectRatio = "square", // "square", "portrait", "landscape"
}: {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
  aspectRatio?: "square" | "portrait" | "landscape";
}) {
  const aspectClasses = {
    square: "aspect-square",
    portrait: "aspect-[3/4]",
    landscape: "aspect-[4/3]",
  };

  const responsiveSizes = {
    square: "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw",
    portrait: "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw",
    landscape: "(max-width: 640px) 100vw, (max-width: 1024px) 75vw, 50vw",
  };

  return (
    <div
      className={`relative overflow-hidden ${aspectClasses[aspectRatio]} ${className}`}
    >
      <OptimizedProductImage
        src={src}
        alt={alt}
        fill
        priority={priority}
        sizes={responsiveSizes[aspectRatio]}
        className="object-cover hover:scale-105 transition-transform duration-500"
      />
    </div>
  );
}
