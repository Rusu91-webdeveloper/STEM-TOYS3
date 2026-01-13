"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { getSession, signIn } from "next-auth/react";
import { useEffect, useState, Suspense } from "react";

import { Button } from "@/components/ui/button";

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Get the intended redirect URL, fallback to /account
  const callbackUrl = searchParams.get("callbackUrl") || "/account";

  useEffect(() => {
    let isMounted = true;
    let timeoutId: NodeJS.Timeout;
    let intervalId: NodeJS.Timeout;
    setLoading(true);
    setError(null);

    // Check for OAuth errors in URL params
    const urlParams = new URLSearchParams(window.location.search);
    const errorParam = urlParams.get("error");
    const errorDescription = urlParams.get("error_description");

    if (errorParam) {
      console.error("OAuth error detected:", errorParam, errorDescription);
      if (isMounted) {
        setLoading(false);
        setError(
          errorDescription ||
            `Authentication error: ${errorParam}. Please try again.`
        );
      }
      return;
    }

    // Poll for session state
    const pollSession = async () => {
      const start = Date.now();
      let attempts = 0;
      const maxAttempts = 20; // 5 seconds max (20 * 250ms)

      intervalId = setInterval(async () => {
        attempts++;
        try {
          const session = await getSession();
          if (session && session.user) {
            clearInterval(intervalId);
            clearTimeout(timeoutId);
            if (isMounted) {
              setLoading(false);
              // Clear the OAuth in-progress flag
              localStorage.removeItem("googleAuthInProgress");
              router.replace(callbackUrl);
            }
          } else if (attempts >= maxAttempts || Date.now() - start > 5000) {
            clearInterval(intervalId);
            if (isMounted) {
              setLoading(false);
              setError("Authentication failed or timed out. Please try again.");
            }
          }
        } catch (sessionError) {
          console.error("Error checking session:", sessionError);
          if (attempts >= maxAttempts) {
            clearInterval(intervalId);
            if (isMounted) {
              setLoading(false);
              setError("Failed to verify authentication. Please try again.");
            }
          }
        }
      }, 250);
    };

    pollSession();

    // Timeout in case polling never resolves
    timeoutId = setTimeout(() => {
      clearInterval(intervalId);
      if (isMounted) {
        setLoading(false);
        setError("Authentication failed or timed out. Please try again.");
      }
    }, 6000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
      clearTimeout(timeoutId);
    };
  }, [retryCount, callbackUrl, router]);

  const handleRetry = () => {
    setRetryCount(c => c + 1);
    setLoading(true);
    setError(null);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      {loading && (
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600" />
          <p className="text-lg font-medium">Signing you in…</p>
        </div>
      )}
      {!loading && error && (
        <div className="flex flex-col items-center gap-4">
          <p className="text-red-600 font-medium">{error}</p>
          <Button onClick={handleRetry}>Retry</Button>
        </div>
      )}
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-screen">
          <div className="flex flex-col items-center gap-4">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600" />
            <p className="text-lg font-medium">Loading...</p>
          </div>
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
