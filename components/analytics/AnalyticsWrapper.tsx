"use client";

import dynamic from "next/dynamic";

// Dynamically import client-only analytics components to avoid SSR issues
// This must be a Client Component to use ssr: false
const GoogleAnalytics = dynamic(
  () => import("@/components/analytics/GoogleAnalytics"),
  { ssr: false }
);

const FacebookPixel = dynamic(
  () => import("@/components/analytics/FacebookPixel"),
  { ssr: false }
);

const InstagramPixel = dynamic(
  () => import("@/components/analytics/InstagramPixel"),
  { ssr: false }
);

const TikTokPixel = dynamic(
  () => import("@/components/analytics/TikTokPixel"),
  { ssr: false }
);

/**
 * Client Component wrapper for analytics scripts
 * Required because Next.js 15 doesn't allow ssr: false in Server Components
 * 
 * Includes:
 * - Google Analytics (GA4)
 * - Facebook Pixel (Meta)
 * - Instagram Pixel (Meta - for Instagram traffic tracking)
 * - TikTok Pixel (for TikTok traffic tracking)
 * 
 * Each pixel component fetches its config from the database
 * and only renders if the pixel is configured and active.
 */
export default function AnalyticsWrapper() {
  return (
    <>
      <GoogleAnalytics />
      <FacebookPixel />
      <InstagramPixel />
      <TikTokPixel />
    </>
  );
}
