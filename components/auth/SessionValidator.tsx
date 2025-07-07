"use client";

import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { useEffect, useRef, useState } from "react";

import { useOptimizedSession } from "@/lib/auth/SessionContext";
import {
  validateSessionSmart,
  shouldAutoRedirect,
  getAuthPreferences,
} from "@/lib/auth/smartSessionManager";


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

  // Only validate on critical routes and limit frequency
  const criticalRoutes = ["/account", "/admin"];
  const shouldValidate =
    status === "authenticated" &&
    criticalRoutes.some(route => pathname.startsWith(route)) &&
    !pathname.startsWith("/auth") &&
    !pathname.includes("/api/auth") &&
    Date.now() - lastValidationRef.current > 30000; // Only validate every 30 seconds

  // Simplified validation logic - only for critical routes and not too frequently
  useEffect(() => {
    if (!shouldValidate || isValidatingRef.current || !session?.user?.id) {
      return;
    }

    const performValidation = async () => {
      if (isValidatingRef.current) return;

      try {
        isValidatingRef.current = true;
        setValidationError(null);

        // Check database health first
        const healthResponse = await fetch("/api/health/database", {
          cache: "no-cache",
        });
        const healthResult = await healthResponse.json();

        if (
          healthResult.status === "unhealthy" &&
          healthResult.error?.includes("DATABASE_URL not configured")
        ) {
          console.warn("Database not configured, clearing invalid session");
          await signOut({ redirect: false, callbackUrl: "/" });
          return undefined;
        }

        // Validate session
        const isValid = await validateSessionSmart(session.user.id);
        if (!isValid) {
          console.warn("Session validation failed, clearing session");
          await signOut({ redirect: false, callbackUrl: "/" });
        }

        lastValidationRef.current = Date.now();
      } catch (error) {
        console.error("Session validation error:", error);
        setValidationError(
          error instanceof Error ? error.message : "Unknown error"
        );
      } finally {
        isValidatingRef.current = false;
      }
    };

    // Debounce validation calls with longer delay
    const timeoutId = setTimeout(performValidation, 1000);
    return () => clearTimeout(timeoutId);
  }, [session, status, pathname, router, shouldValidate]);

  // Handle auto-redirect logic with user preferences
  useEffect(() => {
    if (status !== "authenticated" || !session) return;

    if (shouldAutoRedirect(pathname)) {
      const callbackUrl = new URLSearchParams(window.location.search).get(
        "callbackUrl"
      );

      if (callbackUrl && callbackUrl !== pathname) {
        console.warn("Auto-redirecting to:", callbackUrl);
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
