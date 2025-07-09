"use client";

import { Loader2, Globe, FileText } from "lucide-react";
import React, { useState, useEffect, useRef, useCallback } from "react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Language {
  code: string;
  name: string;
  formats: string[];
}

interface BookLanguageSelectorProps {
  productSlug: string;
  selectedLanguage?: string;
  onLanguageSelect: (languageCode: string) => void;
  className?: string;
  compact?: boolean;
}

// **PERFORMANCE**: Global cache to prevent duplicate requests across component instances
const languageCache = new Map<
  string,
  {
    data: Language[];
    timestamp: number;
    promise?: Promise<Language[]>;
  }
>();
const CACHE_DURATION = 1 * 60 * 1000; // Reduced to 1 minute cache for fresh data

// **FIX**: Function to clear cache for a specific product
export const clearLanguageCache = (productSlug?: string) => {
  if (productSlug) {
    languageCache.delete(productSlug);
  } else {
    languageCache.clear();
  }
};

export function BookLanguageSelector({
  productSlug,
  selectedLanguage,
  onLanguageSelect,
  className = "",
  compact = false,
}: BookLanguageSelectorProps) {
  const [availableLanguages, setAvailableLanguages] = useState<Language[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);

  // **PERFORMANCE**: Memoized fetch function to prevent unnecessary recreations
  const fetchLanguages = useCallback(async () => {
    if (!productSlug) return;

    // **PERFORMANCE**: Check cache first
    const cached = languageCache.get(productSlug);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      setAvailableLanguages(cached.data);
      setIsLoading(false);
      setError(null);

      // Auto-select first language if none selected
      if (!selectedLanguage && cached.data.length > 0) {
        onLanguageSelect(cached.data[0].code);
      }
      return;
    }

    // **PERFORMANCE**: If there's already a pending request, wait for it
    if (cached?.promise) {
      try {
        const data = await cached.promise;
        if (isMountedRef.current) {
          setAvailableLanguages(data);
          setIsLoading(false);
          setError(null);

          if (!selectedLanguage && data.length > 0) {
            onLanguageSelect(data[0].code);
          }
        }
      } catch (error) {
        if (isMountedRef.current) {
          console.error("Error from cached promise:", error);
          setError("Failed to load language options");
          setIsLoading(false);
        }
      }
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Cancel previous request if exists
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();

      // **PERFORMANCE**: Create and cache the promise to prevent duplicate requests
      const fetchPromise = fetch(`/api/books/${productSlug}/languages`, {
        signal: abortControllerRef.current.signal,
        // **PERFORMANCE**: Use browser cache with headers from our optimized API
        cache: "default",
        headers: {
          Accept: "application/json",
        },
      }).then(async (response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch languages");
        }
        const data = await response.json();
        return data.availableLanguages || [];
      });

      // Cache the promise immediately to prevent duplicate requests
      languageCache.set(productSlug, {
        data: [],
        timestamp: Date.now(),
        promise: fetchPromise,
      });

      const data = await fetchPromise;

      if (isMountedRef.current) {
        setAvailableLanguages(data);

        // **PERFORMANCE**: Cache the successful result
        languageCache.set(productSlug, {
          data,
          timestamp: Date.now(),
        });

        // Auto-select first language if none selected
        if (!selectedLanguage && data.length > 0) {
          onLanguageSelect(data[0].code);
        }
      }
    } catch (error) {
      if (isMountedRef.current) {
        // Only show error if it's not an abort error
        if (error instanceof Error && error.name !== "AbortError") {
          console.error("Error fetching book languages:", error);
          setError("Failed to load language options");
        }
      }
      // Remove failed promise from cache
      languageCache.delete(productSlug);
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [productSlug, selectedLanguage, onLanguageSelect]);

  useEffect(() => {
    isMountedRef.current = true;
    fetchLanguages();

    // Cleanup function
    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchLanguages]);

  // **PERFORMANCE**: Clean up cache periodically
  useEffect(() => {
    const cleanup = () => {
      const now = Date.now();
      for (const [key, cached] of languageCache.entries()) {
        if (now - cached.timestamp > CACHE_DURATION) {
          languageCache.delete(key);
        }
      }
    };

    const interval = setInterval(cleanup, CACHE_DURATION);
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className={cn("flex items-center gap-2 py-2", className)}>
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        <span className="text-sm text-muted-foreground">
          Loading formats...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("text-sm text-red-500 py-2", className)}>{error}</div>
    );
  }

  if (availableLanguages.length === 0) {
    return (
      <div className={cn("text-sm text-muted-foreground py-2", className)}>
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          <span>Digital formats coming soon</span>
        </div>
        <p className="text-xs mt-1">
          This book is available for purchase. Digital files will be added after upload.
        </p>
      </div>
    );
  }

  // If only one language available, show it as info without selection
  if (availableLanguages.length === 1) {
    const language = availableLanguages[0];
    return (
      <div className={cn("py-2", className)}>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <FileText className="h-4 w-4" />
          <span>Available in {language.name}</span>
          <Badge
            variant="secondary"
            className="text-xs">
            {language.formats.join(", ").toUpperCase()}
          </Badge>
        </div>
      </div>
    );
  }

  if (compact) {
    return (
      <div className={cn("space-y-2", className)}>
        <div className="text-sm font-medium text-gray-700 flex items-center gap-2">
          <Globe className="h-4 w-4" />
          Choose Language:
        </div>
        <div className="flex flex-wrap gap-2">
          {availableLanguages.map((language) => (
            <Badge
              key={language.code}
              variant={
                selectedLanguage === language.code ? "default" : "outline"
              }
              className={cn(
                "cursor-pointer transition-colors hover:bg-primary/90",
                selectedLanguage === language.code &&
                  "bg-primary text-primary-foreground"
              )}
              onClick={() => onLanguageSelect(language.code)}>
              {language.name}
            </Badge>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="text-sm font-medium text-gray-900 flex items-center gap-2">
        <Globe className="h-4 w-4" />
        Choose Language & Format:
      </div>
      <div className="grid gap-2">
        {availableLanguages.map((language) => (
          <label
            key={language.code}
            className={cn(
              "flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors",
              selectedLanguage === language.code
                ? "border-primary bg-primary/5"
                : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
            )}>
            <div className="flex items-center gap-3">
              <input
                type="radio"
                name="language"
                value={language.code}
                checked={selectedLanguage === language.code}
                onChange={() => onLanguageSelect(language.code)}
                className="sr-only"
              />
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{language.name}</span>
                <Badge
                  variant="secondary"
                  className="text-xs">
                  {language.formats.join(", ").toUpperCase()}
                </Badge>
              </div>
            </div>
            {selectedLanguage === language.code && (
              <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-white" />
              </div>
            )}
          </label>
        ))}
      </div>
    </div>
  );
}
