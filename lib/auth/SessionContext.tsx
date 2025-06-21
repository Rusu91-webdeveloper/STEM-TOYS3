"use client";

import React, { createContext, useContext, ReactNode } from "react";
import { useSession, SessionContextValue } from "next-auth/react";

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
 * Optimized session hook that uses centralized session when available
 * Falls back to regular useSession if not in centralized context
 */
export function useOptimizedSession(): SessionContextValue {
  const centralizedContext = useContext(CentralizedSessionContext);
  const directSession = useSession();

  // Use centralized session if available, otherwise fall back to direct session
  return centralizedContext || directSession;
}
