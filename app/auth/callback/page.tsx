"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, Suspense } from "react";

import { Button } from "@/components/ui/button";
import { useOptimizedSession } from "@/lib/auth/SessionContext";

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useOptimizedSession();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Get the intended redirect URL, fallback to /account
  const callbackUrl = searchParams.get("callbackUrl") || "/account";
  const errorParam = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

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

    // Timeout in case polling never resolves
    timeoutRef.current = setTimeout(() => {
      if (isMounted) {
        setLoading(false);
        setError("Authentication failed or timed out. Please try again.");
      }
    }, 6000);

    return () => {
      isMounted = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [errorParam, errorDescription, retryCount]);

  useEffect(() => {
    if (status !== "authenticated" || !session?.user) return;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    setLoading(false);
    localStorage.removeItem("googleAuthInProgress");
    router.replace(callbackUrl);
  }, [status, session, callbackUrl, router]);

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
