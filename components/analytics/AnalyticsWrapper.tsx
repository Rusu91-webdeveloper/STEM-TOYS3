"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

import { hasAnalyticsConsent } from "@/lib/analytics/consent";

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
  const [canLoadAnalytics, setCanLoadAnalytics] = useState(false);

  useEffect(() => {
    const activate = () => setCanLoadAnalytics(hasAnalyticsConsent());

    if ("requestIdleCallback" in window) {
      const idleId = window.requestIdleCallback(activate, { timeout: 3000 });
      return () => window.cancelIdleCallback(idleId);
    }

    const timeoutId = window.setTimeout(activate, 1200);
    return () => window.clearTimeout(timeoutId);
  }, []);

  if (!canLoadAnalytics) {
    return null;
  }

  return (
    <>
      <GoogleAnalytics />
      <FacebookPixel />
      <InstagramPixel />
      <TikTokPixel />
    </>
  );
}
