"use client";

import { useState, useCallback, useEffect } from "react";
import { getErrorInfo, createRetryableError } from "../lib/errorHandling";
import { useTranslation } from "@/lib/i18n";

export interface CheckoutSettings {
  taxSettings: {
    active: boolean;
    rate: string;
    includeInPrice: boolean;
  };
  shippingSettings: {
    standard: { price: string; active: boolean };
    express: { price: string; active: boolean };
    priority: { price: string; active: boolean };
    freeThreshold: { active: boolean; price: string };
  };
}

interface UseCheckoutSettingsReturn {
  settings: CheckoutSettings | null;
  isLoading: boolean;
  error: string | null;
  errorInfo: ReturnType<typeof getErrorInfo> | null;
  refetch: () => Promise<void>;
}

// Cache for settings to avoid repeated API calls
let settingsCache: CheckoutSettings | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Track pending requests to prevent duplicate calls
let pendingRequest: Promise<CheckoutSettings> | null = null;

export function useCheckoutSettings(): UseCheckoutSettingsReturn {
  const [settings, setSettings] = useState<CheckoutSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorInfo, setErrorInfo] = useState<ReturnType<
    typeof getErrorInfo
  > | null>(null);
  const { t } = useTranslation();

  const fetchSettings = useCallback(async (): Promise<CheckoutSettings> => {
    // Check if we have a valid cached version
    const now = Date.now();
    if (settingsCache && now - cacheTimestamp < CACHE_DURATION) {
      return settingsCache;
    }

    // If there's already a pending request, wait for it
    if (pendingRequest) {
      return pendingRequest;
    }

    // Create new request
    pendingRequest = fetch("/api/checkout/settings")
      .then(async response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        // Update cache
        settingsCache = data;
        cacheTimestamp = now;

        return data;
      })
      .finally(() => {
        pendingRequest = null;
      });

    return pendingRequest;
  }, []);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setErrorInfo(null);

    try {
      // Clear cache to force fresh fetch
      settingsCache = null;
      cacheTimestamp = 0;

      const data = await fetchSettings();
      setSettings(data);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch settings";
      setError(errorMessage);
      setErrorInfo(
        getErrorInfo(createRetryableError("SETTINGS_ERROR", errorMessage), t)
      );
    } finally {
      setIsLoading(false);
    }
  }, [fetchSettings, t]);

  useEffect(() => {
    const loadSettings = async () => {
      setIsLoading(true);
      setError(null);
      setErrorInfo(null);

      try {
        const data = await fetchSettings();
        setSettings(data);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to fetch settings";
        setError(errorMessage);
        setErrorInfo(
          getErrorInfo(createRetryableError("SETTINGS_ERROR", errorMessage), t)
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, [fetchSettings, t]);

  return {
    settings,
    isLoading,
    error,
    errorInfo,
    refetch,
  };
}
