"use client";

import { useSession, SessionContextValue } from "next-auth/react";
import React, { createContext, useContext, ReactNode } from "react";

// Create a centralized session context to reduce multiple useSession calls
const CentralizedSessionContext = createContext<SessionContextValue | null>(
  null
);

interface CentralizedSessionProviderProps {
  children: ReactNode;
}

/**
 * Centralized Session Provider - Single useSession call for the entire app
 * This prevents multiple session validation requests and improves performance
 */
export function CentralizedSessionProvider({
  children,
}: CentralizedSessionProviderProps) {
  const sessionData = useSession();

  // Always use the actual session data, don't modify or cache it
  return (
    <CentralizedSessionContext.Provider value={sessionData}>
      {children}
    </CentralizedSessionContext.Provider>
  );
}

/**
 * Hook to access the centralized session data
 * Use this instead of useSession to prevent multiple API calls
 */
export function useCentralizedSession(): SessionContextValue {
  const context = useContext(CentralizedSessionContext);
  if (!context) {
    throw new Error(
      "useCentralizedSession must be used within CentralizedSessionProvider"
    );
  }
  return context;
}

/**
 * Optimized session hook that provides immediate fallback
 * Falls back to regular useSession if not in centralized context
 */
export function useOptimizedSession(): SessionContextValue {
  const centralizedContext = useContext(CentralizedSessionContext);

  // If we're within the centralized context, use it
  if (centralizedContext) {
    return centralizedContext;
  }

  // Otherwise, we need to use the regular useSession hook
  // This should rarely happen since we wrap the app with CentralizedSessionProvider
  console.warn(
    "useOptimizedSession: Falling back to regular useSession. Consider wrapping your app with CentralizedSessionProvider."
  );
  return useSession();
}
