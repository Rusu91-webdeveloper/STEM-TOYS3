/**
 * Optimized Coupon Image Component
 * Provides responsive, lazy-loaded images for coupon promotions
 */

"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

interface CouponImageProps {
  src: string | null | undefined;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  context?: "popup" | "admin" | "email" | "default";
  onLoad?: () => void;
  onError?: () => void;
  showPlaceholder?: boolean;
}

/**
 * Optimized image component for coupon promotional images
 */
export function CouponImage({
  src,
  alt,
  width,
  height,
  className = "",
  priority = false,
  context = "default",
  onLoad,
  onError,
  showPlaceholder = true,
}: CouponImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Get dimensions based on context
  const getDimensions = (context: string) => {
    switch (context) {
      case "popup":
        return { width: 300, height: 200, quality: 85 };
      case "admin":
        return { width: 200, height: 150, quality: 90 };
      case "email":
        return { width: 600, height: 400, quality: 80 };
      default:
        return { width: 400, height: 300, quality: 85 };
    }
  };

  const dimensions = getDimensions(context);
  const finalWidth = width || dimensions.width;
  const finalHeight = height || dimensions.height;

  // Simple client-side validation
  const isValidUrl = (url: string | null | undefined): boolean => {
    if (!url) return false;
    try {
      new URL(url);
      return url.startsWith("http://") || url.startsWith("https://");
    } catch {
      return false;
    }
  };

  useEffect(() => {
    if (!src || !isValidUrl(src)) {
      setHasError(true);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setHasError(false);

    // Simple client-side optimization - just use the original URL for now
    // In a production app, you might want to call an API endpoint for optimization
    setIsLoading(false);
  }, [src]);

  // Show placeholder or error state
  if (hasError || !src) {
    if (!showPlaceholder) return null;

    return (
      <div
        className={`flex items-center justify-center bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg ${className}`}
        style={{ width: finalWidth, height: finalHeight }}
      >
        <div className="text-center text-gray-500">
          <div className="text-2xl mb-2">🎫</div>
          <div className="text-sm">No Image</div>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div
        className={`animate-pulse bg-gray-200 rounded-lg ${className}`}
        style={{ width: finalWidth, height: finalHeight }}
      />
    );
  }

  // Simple image display
  return (
    <div className={`relative overflow-hidden rounded-lg ${className}`}>
      <Image
        src={src}
        alt={alt}
        width={finalWidth}
        height={finalHeight}
        className="object-cover w-full h-full"
        priority={priority}
        loading={priority ? "eager" : "lazy"}
        placeholder="blur"
        blurDataURL={`data:image/svg+xml;base64,${btoa(
          `<svg width="${finalWidth}" height="${finalHeight}" xmlns="http://www.w3.org/2000/svg">
            <rect width="100%" height="100%" fill="#f3f4f6"/>
            <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#9ca3af" font-size="16" font-family="system-ui, sans-serif">
              🎫 Loading...
            </text>
          </svg>`
        )}`}
        onLoad={() => {
          onLoad?.();
        }}
        onError={() => {
          setHasError(true);
          onError?.();
        }}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      />
    </div>
  );
}

/**
 * Simple coupon image without advanced optimization features
 */
export function SimpleCouponImage({
  src,
  alt,
  width = 200,
  height = 150,
  className = "",
  priority = false,
}: Omit<
  CouponImageProps,
  "context" | "onLoad" | "onError" | "showPlaceholder"
>) {
  // Simple client-side validation
  const isValidUrl = (url: string | null | undefined): boolean => {
    if (!url) return false;
    try {
      new URL(url);
      return url.startsWith("http://") || url.startsWith("https://");
    } catch {
      return false;
    }
  };

  if (!src || !isValidUrl(src)) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 border border-gray-200 rounded ${className}`}
        style={{ width, height }}
      >
        <span className="text-gray-400 text-sm">No Image</span>
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={`object-cover rounded ${className}`}
      priority={priority}
      loading={priority ? "eager" : "lazy"}
      placeholder="blur"
      blurDataURL={`data:image/svg+xml;base64,${btoa(
        `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
          <rect width="100%" height="100%" fill="#f3f4f6"/>
          <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#9ca3af" font-size="12" font-family="system-ui, sans-serif">
            🎫
          </text>
        </svg>`
      )}`}
    />
  );
}

export type { CouponImageProps };
