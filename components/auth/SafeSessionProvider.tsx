"use client";

import { SessionProvider } from "next-auth/react";
import { ReactNode, useEffect } from "react";

interface SafeSessionProviderProps {
  children: ReactNode;
}

/**
 * Safe Session Provider that handles ClientFetchError gracefully
 * This wrapper catches and handles Auth.js client-side fetch errors
 */
export function SafeSessionProvider({ children }: SafeSessionProviderProps) {
  useEffect(() => {
    // Listen for unhandled Auth.js errors
    const handleError = (event: ErrorEvent) => {
      if (
        event.error?.message?.includes("ClientFetchError") ||
        event.error?.message?.includes("autherror")
      ) {
        console.warn(
          "[SafeSessionProvider] Caught Auth.js ClientFetchError:",
          event.error
        );
        // Don't let the error crash the app
        event.preventDefault();
      }
    };

    window.addEventListener("error", handleError);
    return () => window.removeEventListener("error", handleError);
  }, []);

  return (
    <SessionProvider
      basePath="/api/auth"
      refetchInterval={5 * 60} // Refetch every 5 minutes
      refetchOnWindowFocus={false} // Don't refetch on window focus to reduce errors
      refetchWhenOffline={false} // Don't refetch when offline
    >
      {children}
    </SessionProvider>
  );
}

