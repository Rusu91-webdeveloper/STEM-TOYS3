/**
 * A/B Testing Call-to-Action Component
 *
 * A reusable CTA component that supports A/B testing
 */

"use client";

import { Button } from "@/components/ui/button";
import { useABTest } from "@/hooks/useABTest";

interface ABTestCTAProps {
  testId: string;
  userId?: string;
  fallbackText: string;
  fallbackAction: () => void;
  className?: string;
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
  size?: "default" | "sm" | "lg" | "icon";
}

export function ABTestCTA({
  testId,
  userId,
  fallbackText,
  fallbackAction,
  className,
  variant = "default",
  size = "default",
}: ABTestCTAProps) {
  const { variant: abVariant, trackClick } = useABTest(testId, userId);

  const handleClick = () => {
    trackClick();

    // Use variant content or fallback
    if (abVariant?.content) {
      try {
        const content = JSON.parse(abVariant.content);
        if (content.action) {
          content.action();
          return;
        }
      } catch (error) {
        console.warn("Failed to parse A/B test variant content:", error);
      }
    }

    // Fallback to default action
    fallbackAction();
  };

  // Use variant text or fallback
  const buttonText = abVariant?.content
    ? (() => {
        try {
          const content = JSON.parse(abVariant.content);
          return content.text || fallbackText;
        } catch {
          return fallbackText;
        }
      })()
    : fallbackText;

  return (
    <Button
      className={className}
      variant={variant}
      size={size}
      onClick={handleClick}
    >
      {buttonText}
    </Button>
  );
}

/**
 * Example usage:
 *
 * ```tsx
 * <ABTestCTA
 *   testId="cta_optimization_2025"
 *   userId={userId}
 *   fallbackText="Shop Now"
 *   fallbackAction={() => router.push('/products')}
 *   variant="default"
 *   size="lg"
 * />
 * ```
 */
