"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import React, {
  createContext,
  useState,
  useContext,
  ReactNode,
  useEffect,
} from "react";

import { CheckoutTransition } from "../components/CheckoutTransition";

type TransitionDestination = "checkout" | "login" | null;

interface CheckoutTransitionContextType {
  startTransition: (
    destination: "checkout" | "login",
    callbackUrl?: string
  ) => void;
  isTransitioning: boolean;
}

const CheckoutTransitionContext = createContext<CheckoutTransitionContextType>({
  startTransition: () => {},
  isTransitioning: false,
});

export const useCheckoutTransition = () =>
  useContext(CheckoutTransitionContext);

export function CheckoutTransitionProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [destination, setDestination] = useState<TransitionDestination>(null);
  const [callbackUrl, setCallbackUrl] = useState<string | undefined>();
  const router = useRouter();
  const { data: session, status } = useSession();

  // Track if we're authenticated
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  // Update authentication state when session changes
  useEffect(() => {
    if (status !== "loading") {
      setIsAuthenticated(status === "authenticated");
    }
  }, [status]);

  const startTransition = (dest: "checkout" | "login", callback?: string) => {
    setDestination(dest);
    if (callback) {
      setCallbackUrl(callback);
    }
  };

  const handleTransitionComplete = () => {
    // Always use relative URLs to avoid port mismatches
    if (destination === "checkout") {
      // For security, only add auth bypass if the user is actually authenticated
      if (status === "authenticated") {
        // Create and append a timestamp to prevent caching
        const timestamp = Date.now();
        const url = `/checkout?_auth=${timestamp}`;

        // For debugging, you can see this log in the console
        console.log("Direct navigating to checkout with auth param");

        // Use direct location navigation to bypass Next.js routing
        // Use relative URL to maintain the current hostname and port
        window.location.href = url;
      } else {
        // Not authenticated, go to login page with correct port
        // Get the current origin to ensure correct port
        const origin = window.location.origin;
        const callbackParam = encodeURIComponent("/checkout");
        const loginUrl = `${origin}/auth/login?callbackUrl=${callbackParam}`;

        // Log the redirect for debugging
        console.log("Redirecting to login page:", loginUrl);

        // Use window.location.replace to avoid adding to history
        window.location.replace(loginUrl);
      }
    } else if (destination === "login") {
      // Get the current origin to ensure correct port
      const origin = window.location.origin;
      const url = callbackUrl
        ? `${origin}/auth/login?callbackUrl=${encodeURIComponent(callbackUrl)}`
        : `${origin}/auth/login`;

      // Log the redirect for debugging
      console.log("Redirecting to login page:", url);

      // Use window.location.replace to avoid adding to history
      window.location.replace(url);
    }

    // No need to reset state here as page will reload
  };

  return (
    <CheckoutTransitionContext.Provider
      value={{
        startTransition,
        isTransitioning: destination !== null,
      }}
    >
      {children}
      {destination && status !== "loading" && (
        <CheckoutTransition
          destination={destination}
          onComplete={handleTransitionComplete}
        />
      )}
    </CheckoutTransitionContext.Provider>
  );
}
