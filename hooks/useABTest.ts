import { useState, useEffect } from "react";
import { conversionTracker, ABTestVariant } from "@/lib/conversion-tracking";

// Hook for A/B testing with automatic variant assignment and tracking
export function useABTest(testId: string) {
  const [variant, setVariant] = useState<ABTestVariant | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const assignedVariant = conversionTracker.getVariant(testId);
    setVariant(assignedVariant);
    setIsLoading(false);
  }, [testId]);

  const trackConversion = (
    action: string,
    category: string,
    options?: {
      label?: string;
      value?: number;
      element?: string;
    }
  ) => {
    conversionTracker.trackEvent({
      action,
      category,
      ...options,
      variant: variant?.name,
    });
  };

  return {
    variant,
    isLoading,
    isControl: variant?.isControl ?? true,
    variantId: variant?.id ?? "control",
    variantName: variant?.name ?? "Control",
    trackConversion,
  };
}

// Hook for tracking specific conversion events
export function useConversionTracking() {
  const trackEvent = (
    action: string,
    category: string,
    options?: {
      label?: string;
      value?: number;
      element?: string;
      variant?: string;
    }
  ) => {
    conversionTracker.trackEvent({
      action,
      category,
      ...options,
    });
  };

  return { trackEvent };
}
