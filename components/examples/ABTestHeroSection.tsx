/**
 * Example A/B Testing Hero Section Component
 *
 * Demonstrates how to integrate A/B testing with React components
 */

"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useABTest, usePageTimeTracking } from "@/hooks/useABTest";

interface ABTestHeroSectionProps {
  testId: string;
  userId?: string;
  fallbackContent?: {
    title: string;
    subtitle: string;
    ctaText: string;
    ctaAction: () => void;
  };
}

export function ABTestHeroSection({
  testId,
  userId,
  fallbackContent,
}: ABTestHeroSectionProps) {
  const { variant, isLoading, error, trackImpression, trackClick } = useABTest(
    testId,
    userId
  );
  const { trackTime } = usePageTimeTracking();

  // Track impression when variant is loaded
  useEffect(() => {
    if (variant) {
      trackImpression();
    }
  }, [variant, trackImpression]);

  // Handle CTA click with tracking
  const handleCTAClick = () => {
    trackClick();
    // Add your CTA action here
    console.log("CTA clicked for variant:", variant?.name);
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="animate-pulse">
            <div className="h-8 bg-white/20 rounded w-3/4 mx-auto mb-4"></div>
            <div className="h-4 bg-white/20 rounded w-1/2 mx-auto mb-8"></div>
            <div className="h-10 bg-white/20 rounded w-32 mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    console.warn("A/B test error:", error);
    // Fall back to default content or show error
  }

  // Use variant content or fallback
  const content = variant?.content
    ? JSON.parse(variant.content)
    : fallbackContent;

  if (!content) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20">
      <div className="container mx-auto px-4 text-center">
        <h1 className="text-4xl md:text-6xl font-bold mb-6">{content.title}</h1>
        <p className="text-xl md:text-2xl mb-8 opacity-90">
          {content.subtitle}
        </p>
        <Button
          size="lg"
          className="bg-white text-blue-600 hover:bg-gray-100"
          onClick={handleCTAClick}
        >
          {content.ctaText}
        </Button>

        {/* Debug info (remove in production) */}
        {process.env.NODE_ENV === "development" && variant && (
          <div className="mt-8 text-sm opacity-60">
            A/B Test: {variant.name} {variant.isControl ? "(Control)" : ""}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Example usage in a page component:
 *
 * ```tsx
 * export default function HomePage() {
 *   const userId = getCurrentUserId(); // Your user ID logic
 *
 *   return (
 *     <div>
 *       <ABTestHeroSection
 *         testId="title_optimization_2025"
 *         userId={userId}
 *         fallbackContent={{
 *           title: "Welcome to Our STEM Store",
 *           subtitle: "Discover amazing educational toys for your children",
 *           ctaText: "Shop Now",
 *           ctaAction: () => router.push('/products')
 *         }}
 *       />
 *     </div>
 *   );
 * }
 * ```
 */
