"use client";

import { useState, useEffect, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";

export interface ABTestVariant {
  id: string;
  name: string;
  content: string;
  isControl: boolean;
  testId: string;
}

export interface UseABTestResult {
  variant: ABTestVariant | null;
  isLoading: boolean;
  error: string | null;
  track: (
    metric: "impressions" | "clicks" | "conversions",
    value?: number
  ) => Promise<void>;
}

const USER_ID_STORAGE_KEY = "ab_testing_user_id";

export function useABTest(
  testName: string,
  autoTrackImpression: boolean = true,
  enabled: boolean = true
): UseABTestResult {
  const [variant, setVariant] = useState<ABTestVariant | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(enabled);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [hasTrackedImpression, setHasTrackedImpression] = useState(false);

  // Initialize User ID
  useEffect(() => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }

    // 1. Check if we have a logged-in user (optional, if you have a useAuth hook)
    // For now, we rely on a persistent device ID for consistency across anonymous sessions
    let storedId = localStorage.getItem(USER_ID_STORAGE_KEY);

    if (!storedId) {
      storedId = uuidv4();
      localStorage.setItem(USER_ID_STORAGE_KEY, storedId);
    }

    setUserId(storedId);
  }, [enabled]);

  // Fetch Variant
  useEffect(() => {
    if (!enabled) {
      setVariant(null);
      setIsLoading(false);
      return;
    }

    if (!userId || !testName) return;

    const fetchVariant = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(
          `/api/ab-test/variant?testName=${encodeURIComponent(testName)}&userId=${userId}`
        );

        if (!response.ok) {
          if (response.status === 404) {
            // No active test found, that's fine, we just return null variant
            setVariant(null);
            return;
          }
          throw new Error("Failed to fetch variant");
        }

        // Guard against non-JSON responses (e.g. HTML error pages or auth redirects)
        const contentType = response.headers.get("content-type");
        if (!contentType?.includes("application/json")) {
          setVariant(null);
          return;
        }

        const data = await response.json();
        setVariant(data);
      } catch (err: any) {
        console.error("Error fetching AB test variant:", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVariant();
  }, [enabled, testName, userId]);

  // Track function
  const track = useCallback(
    async (
      metric: "impressions" | "clicks" | "conversions",
      value: number = 1
    ) => {
      if (!variant) return;

      try {
        await fetch("/api/ab-test/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            testId: variant.testId,
            variantId: variant.id,
            metric,
            value,
          }),
        });
      } catch (err) {
        console.error("Error tracking AB metric:", err);
      }
    },
    [variant]
  );

  // Auto-track impression
  useEffect(() => {
    if (!enabled) return;

    if (autoTrackImpression && variant && !hasTrackedImpression) {
      track("impressions");
      setHasTrackedImpression(true);
    }
  }, [enabled, variant, autoTrackImpression, hasTrackedImpression, track]);

  return { variant, isLoading, error, track };
}
