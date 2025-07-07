"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { getSession, signIn } from "next-auth/react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

export default function AuthCallbackPage() {
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

    // Poll for session state
    const pollSession = async () => {
      const start = Date.now();
      intervalId = setInterval(async () => {
        const session = await getSession();
        if (session && session.user) {
          clearInterval(intervalId);
          clearTimeout(timeoutId);
          if (isMounted) {
            setLoading(false);
            router.replace(callbackUrl);
          }
        } else if (Date.now() - start > 5000) {
          clearInterval(intervalId);
          if (isMounted) {
            setLoading(false);
            setError("Authentication failed or timed out. Please try again.");
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