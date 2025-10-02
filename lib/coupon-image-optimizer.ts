/**
 * Coupon Image Utilities - Client-Safe
 * Provides basic image handling for coupon promotional images
 * No server-side dependencies to avoid client-side import issues
 */

export interface CouponImageOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: "webp" | "avif" | "jpeg" | "png";
  lazy?: boolean;
  priority?: boolean;
}

/**
 * Validate coupon image URL (client-safe)
 */
export function isValidCouponImageUrl(url: string | null | undefined): boolean {
  if (!url) return false;

  try {
    const parsedUrl = new URL(url);
    // Check if it's a valid HTTP/HTTPS URL
    return parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Get coupon image placeholder (client-safe)
 */
export function getCouponImagePlaceholder(
  width: number = 400,
  height: number = 300
): string {
  // Default placeholder for coupons without images
  return `data:image/svg+xml;base64,${btoa(
    `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f3f4f6"/>
      <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#9ca3af" font-size="16" font-family="system-ui, sans-serif">
        🎫 No Image
      </text>
    </svg>`
  )}`;
}

/**
 * Get coupon image dimensions based on usage context
 */
export function getCouponImageDimensions(
  context: "popup" | "admin" | "email" | "default" = "default"
) {
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
}
