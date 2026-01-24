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

/**
 * Client Component wrapper for analytics scripts
 * Required because Next.js 15 doesn't allow ssr: false in Server Components
 */
export default function AnalyticsWrapper() {
  return (
    <>
      <GoogleAnalytics />
      <FacebookPixel />
    </>
  );
}
