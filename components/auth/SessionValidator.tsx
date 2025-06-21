"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  validateSessionSmart,
  shouldAutoRedirect,
  getAuthPreferences,
} from "@/lib/auth/smartSessionManager";
import { useOptimizedSession } from "@/lib/auth/SessionContext";

/**
 * Smart Session Validator - Uses intelligent session management
 * Dramatically reduced validation calls for better performance
 */
export function SessionValidator() {
  const { data: session, status } = useOptimizedSession();
  const router = useRouter();
  const pathname = usePathname();
  const [validationError, setValidationError] = useState<string | null>(null);
  const lastValidationRef = useRef<number>(0);
  const isValidatingRef = useRef<boolean>(false);

  // Only validate on truly critical routes
  const criticalRoutes = ["/account", "/admin", "/checkout"];
  const shouldValidate =
    status === "authenticated" &&
    criticalRoutes.some((route) => pathname.startsWith(route)) &&
    !pathname.startsWith("/auth") &&
    !pathname.includes("/api/auth");

  useEffect(() => {
    // Skip if not on critical routes or already validating
    if (!shouldValidate || isValidatingRef.current) return;

    // Check for session errors that require immediate action
    if (session?.user && (session.user as any).error) {
      const error = (session.user as any).error;
      console.warn("Session error detected:", error);

      if (error === "UserNotFound" || error === "RefetchError") {
        router.push("/api/auth/clear-session");
        return;
      }
    }

    const performValidation = async () => {
      if (!session?.user?.id || isValidatingRef.current) return;

      try {
        isValidatingRef.current = true;
        setValidationError(null);

        const isValid = await validateSessionSmart(session.user.id);

        if (!isValid) {
          console.warn("Session validation failed, clearing session...");
          router.push("/api/auth/clear-session");
        }

        lastValidationRef.current = Date.now();
      } catch (error) {
        console.error("Validation error in SessionValidator:", error);
        setValidationError(
          error instanceof Error ? error.message : "Unknown error"
        );

        // Don't redirect on validation errors to avoid UX disruption
      } finally {
        isValidatingRef.current = false;
      }
    };

    // Debounce validation calls
    const timeoutId = setTimeout(performValidation, 100);
    return () => clearTimeout(timeoutId);
  }, [session, status, pathname, router, shouldValidate]);

  // Handle auto-redirect logic with user preferences
  useEffect(() => {
    if (status !== "authenticated" || !session) return;

    const preferences = getAuthPreferences();

    // Only redirect if user has enabled auto-login and it's safe
    if (shouldAutoRedirect(pathname)) {
      const callbackUrl = new URLSearchParams(window.location.search).get(
        "callbackUrl"
      );

      if (callbackUrl && callbackUrl !== pathname) {
        console.log("Auto-redirecting to:", callbackUrl);
        router.push(callbackUrl);
      }
    }
  }, [session, status, pathname, router]);

  // Log validation errors in development
  if (process.env.NODE_ENV === "development" && validationError) {
    console.warn("SessionValidator error:", validationError);
  }

  // This component doesn't render anything
  return null;
}
