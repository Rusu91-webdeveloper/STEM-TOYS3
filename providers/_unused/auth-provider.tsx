"use client";

import { SessionProvider } from "next-auth/react";
import { ReactNode } from "react";

interface SafeAuthProviderProps {
  children: ReactNode;
}

/**
 * Safe Auth Provider that handles authentication errors gracefully
 */
export function SafeAuthProvider({ children }: SafeAuthProviderProps) {
  // In development, provide a more forgiving session provider
  if (process.env.NODE_ENV === "development") {
    return (
      <SessionProvider
        // Provide a base URL to prevent relative URL issues
        basePath="/api/auth"
        // Reduce refetch interval in development
        refetchInterval={0}
        // Don't refetch on window focus in development
        refetchOnWindowFocus={false}
      >
        {children}
      </SessionProvider>
    );
  }

  // In production, use normal session provider
  return <SessionProvider>{children}</SessionProvider>;
}
