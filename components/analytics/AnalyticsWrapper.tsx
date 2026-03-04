"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

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
    const hasAnalyticsConsent = () => {
      try {
        const localStorageKeys = [
          "analytics_consent",
          "cookie_consent",
          "consent_analytics",
          "gdpr_analytics_consent",
        ];
        const acceptedValues = new Set([
          "true",
          "1",
          "yes",
          "accepted",
          "granted",
          "all",
        ]);
        const rejectedValues = new Set([
          "false",
          "0",
          "no",
          "denied",
          "rejected",
        ]);

        for (const key of localStorageKeys) {
          const value = window.localStorage.getItem(key);
          if (!value) continue;
          const normalized = value.toLowerCase();
          if (acceptedValues.has(normalized)) return true;
          if (rejectedValues.has(normalized)) return false;
        }

        const cookie = document.cookie
          .split(";")
          .map(item => item.trim())
          .find(item =>
            /^(analytics_consent|cookie_consent|consent_analytics)=/i.test(item)
          );

        if (cookie) {
          const [, rawValue = ""] = cookie.split("=");
          const normalized = decodeURIComponent(rawValue).toLowerCase();
          if (acceptedValues.has(normalized)) return true;
          if (rejectedValues.has(normalized)) return false;
        }
      } catch {
        // Keep defaults if storage/cookie access fails.
      }

      // Preserve current behavior when no explicit consent signal exists.
      return true;
    };

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
