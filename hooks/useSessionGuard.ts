"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState, useRef, useCallback } from "react";

// **PERFORMANCE**: Global cache shared across all hook instances
const globalValidationCache = new Map<
  string,
  {
    valid: boolean;
    timestamp: number;
    promise?: Promise<boolean>;
  }
>();

const CACHE_DURATION = 3 * 60 * 1000; // 3 minutes cache
const VALIDATION_COOLDOWN = 60 * 1000; // 1 minute between validations

/**
 * **OPTIMIZED** Custom hook to validate user sessions and redirect deleted users
 * Now includes intelligent caching and debouncing to prevent excessive API calls
 *
 * @param redirectPath - Path to redirect to if session is invalid (default: "/auth/login")
 * @returns Object containing session status information
 */
export function useSessionGuard(redirectPath = "/auth/login") {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const validateAttempted = useRef(false);
  const lastValidationTime = useRef(0);

  // **PERFORMANCE**: Clean up old cache entries
  const cleanupCache = useCallback(() => {
    const now = Date.now();
    for (const [key, value] of globalValidationCache.entries()) {
      if (now - value.timestamp > CACHE_DURATION) {
        globalValidationCache.delete(key);
      }
    }
  }, []);

  // **PERFORMANCE**: Get cached validation result
  const getCachedValidation = useCallback(
    (userId: string) => {
      cleanupCache();
      const cached = globalValidationCache.get(userId);
      return cached && Date.now() - cached.timestamp < CACHE_DURATION
        ? cached
        : null;
    },
    [cleanupCache]
  );

  // **PERFORMANCE**: Set cached validation result
  const setCachedValidation = useCallback((userId: string, valid: boolean) => {
    globalValidationCache.set(userId, {
      valid,
      timestamp: Date.now(),
    });
  }, []);

  // **PERFORMANCE**: Optimized validation function with deduplication
  const validateSession = useCallback(
    async (userId: string): Promise<boolean> => {
      // Check if there's already a validation in progress for this user
      const cached = globalValidationCache.get(userId);
      if (cached?.promise) {
        console.log("Deduplicating validation request for user:", userId);
        return cached.promise;
      }

      // Create validation promise
      const validationPromise = (async () => {
        try {
          setValidationError(null);

          // **PERFORMANCE**: Add timeout to prevent hanging
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 4000); // 4 second timeout

          const res = await fetch("/api/auth/validate-session", {
            signal: controller.signal,
            cache: "no-cache",
          });

          clearTimeout(timeoutId);

          if (!res.ok) {
            throw new Error(`Validation failed: ${res.status}`);
          }

          const data = await res.json();

          // Cache the result
          setCachedValidation(userId, data.valid);

          return data.valid;
        } catch (error) {
          if (error instanceof Error) {
            if (error.name === "AbortError") {
              console.warn("Session validation timeout - assuming valid");
              setValidationError("Validation timeout");
              return true; // Assume valid on timeout to avoid disrupting UX
            }
            console.error("Error validating session:", error.message);
            setValidationError(error.message);
          }
          // **PERFORMANCE**: Return true on error to avoid redirect loops
          return true;
        } finally {
          // Remove the promise from cache
          const cached = globalValidationCache.get(userId);
          if (cached) {
            delete cached.promise;
          }
        }
      })();

      // Store the promise in cache for deduplication
      const cacheEntry = globalValidationCache.get(userId) || {
        valid: true,
        timestamp: 0,
      };
      cacheEntry.promise = validationPromise;
      globalValidationCache.set(userId, cacheEntry);

      return validationPromise;
    },
    [setCachedValidation]
  );

  useEffect(() => {
    const performValidation = async () => {
      // **PERFORMANCE**: Skip validation if not authenticated or already validating
      if (isValidating || status !== "authenticated" || !session?.user?.id) {
        return;
      }

      const userId = session.user.id;
      const now = Date.now();

      // **PERFORMANCE**: Skip if validated recently
      if (
        validateAttempted.current &&
        now - lastValidationTime.current < VALIDATION_COOLDOWN
      ) {
        return;
      }

      // **PERFORMANCE**: Check cache first
      const cached = getCachedValidation(userId);
      if (cached && !cached.promise) {
        if (!cached.valid) {
          console.warn("Cached session invalid, redirecting...");
          router.push("/api/auth/clear-session");
        }
        return;
      }

      try {
        setIsValidating(true);
        validateAttempted.current = true;
        lastValidationTime.current = now;

        const isValid = await validateSession(userId);

        if (!isValid) {
          console.warn("Session invalid, redirecting to clear session...");
          router.push("/api/auth/clear-session");
        }
      } catch (error) {
        console.error("Validation error in useSessionGuard:", error);
        // **PERFORMANCE**: Don't redirect on validation errors
      } finally {
        setIsValidating(false);
      }
    };

    // **PERFORMANCE**: Debounce validation calls
    const timeoutId = setTimeout(performValidation, 100);
    return () => clearTimeout(timeoutId);
  }, [
    session,
    status,
    router,
    redirectPath,
    isValidating,
    getCachedValidation,
    validateSession,
  ]);

  // **DEBUG**: Log validation errors in development
  if (process.env.NODE_ENV === "development" && validationError) {
    console.warn("useSessionGuard validation error:", validationError);
  }

  return {
    isAuthenticated: status === "authenticated",
    isLoading: status === "loading" || isValidating,
    session,
    status,
    validationError:
      process.env.NODE_ENV === "development" ? validationError : null,
  };
}
