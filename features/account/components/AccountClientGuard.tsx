"use client";

import { useSessionGuard } from "@/hooks/useSessionGuard";

/**
 * Client component that uses the useSessionGuard hook to check if user still exists
 * and force logout if they don't. This component renders nothing visually.
 */
export function AccountClientGuard() {
  // This hook will validate the session and force logout if the user was deleted
  useSessionGuard();

  // This component doesn't render anything
  return null;
}
