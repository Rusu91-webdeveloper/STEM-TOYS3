/**
 * A/B Testing Hook for Frontend Components
 *
 * Provides easy integration of A/B testing in React components
 */

import { useState, useEffect, useCallback } from "react";

export interface ABTestVariant {
  id: string;
  name: string;
  content: string;
  isControl: boolean;
}

export interface ABTestConfig {
  testId: string;
  variant: ABTestVariant | null;
  isLoading: boolean;
  error: string | null;
}

export interface ABTestTracking {
  trackImpression: () => void;
  trackClick: () => void;
  trackConversion: () => void;
  trackSocialShare: () => void;
  trackTimeOnPage: (timeInSeconds: number) => void;
  trackBounceRate: (hasBounced: boolean) => void;
}

/**
 * Hook for A/B testing integration
 *
 * @param testId - The ID of the A/B test
 * @param userId - Optional user ID for consistent variant assignment
 * @returns A/B test configuration and tracking functions
 */
export function useABTest(
  testId: string,
  userId?: string
): ABTestConfig & ABTestTracking {
  const [variant, setVariant] = useState<ABTestVariant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch A/B test variant
  useEffect(() => {
    const fetchVariant = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const params = new URLSearchParams({ testId });
        if (userId) {
          params.append("userId", userId);
        }

        const response = await fetch(`/api/ab-testing/track?${params}`);

        if (!response.ok) {
          throw new Error("Failed to fetch A/B test variant");
        }

        const data = await response.json();

        if (data.success && data.variant) {
          setVariant(data.variant);
        } else {
          setVariant(null);
        }
      } catch (err) {
        console.error("Error fetching A/B test variant:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
        setVariant(null);
      } finally {
        setIsLoading(false);
      }
    };

    if (testId) {
      fetchVariant();
    } else {
      setIsLoading(false);
    }
  }, [testId, userId]);

  // Tracking functions
  const trackMetric = useCallback(
    async (metricType: string, value: number = 1) => {
      if (!variant) return;

      try {
        await fetch("/api/ab-testing/track", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            testId,
            variantId: variant.id,
            metricType,
            value,
            userId,
          }),
        });
      } catch (err) {
        console.error("Error tracking metric:", err);
      }
    },
    [testId, variant, userId]
  );

  const trackImpression = useCallback(() => {
    trackMetric("impressions");
  }, [trackMetric]);

  const trackClick = useCallback(() => {
    trackMetric("clicks");
  }, [trackMetric]);

  const trackConversion = useCallback(() => {
    trackMetric("conversions");
  }, [trackMetric]);

  const trackSocialShare = useCallback(() => {
    trackMetric("socialShares");
  }, [trackMetric]);

  const trackTimeOnPage = useCallback(
    (timeInSeconds: number) => {
      trackMetric("timeOnPage", timeInSeconds);
    },
    [trackMetric]
  );

  const trackBounceRate = useCallback(
    (hasBounced: boolean) => {
      if (hasBounced) {
        trackMetric("bounceRate", 1);
      }
    },
    [trackMetric]
  );

  return {
    testId,
    variant,
    isLoading,
    error,
    trackImpression,
    trackClick,
    trackConversion,
    trackSocialShare,
    trackTimeOnPage,
    trackBounceRate,
  };
}

/**
 * Hook for tracking page time automatically
 */
export function usePageTimeTracking() {
  const [startTime] = useState(Date.now());

  useEffect(() => {
    const handleBeforeUnload = () => {
      const timeSpent = Math.floor((Date.now() - startTime) / 1000);

      // Send time tracking data
      if (timeSpent > 0) {
        navigator.sendBeacon(
          "/api/ab-testing/track",
          JSON.stringify({
            metricType: "timeOnPage",
            value: timeSpent,
            timestamp: new Date().toISOString(),
          })
        );
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [startTime]);

  return {
    trackTime: (timeInSeconds: number) => {
      fetch("/api/ab-testing/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          metricType: "timeOnPage",
          value: timeInSeconds,
        }),
      }).catch(console.error);
    },
  };
}
