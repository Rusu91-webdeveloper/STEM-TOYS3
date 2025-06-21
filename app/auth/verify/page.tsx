"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

function VerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get("token");
    const email = searchParams.get("email");

    if (token) {
      // Redirect to the API endpoint that handles verification
      window.location.href = `/api/auth/verify?token=${token}${email ? `&email=${email}` : ""}`;
    } else {
      // If no token is provided, redirect to error page
      router.push("/auth/error?error=missing_token");
    }
  }, [router, searchParams]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <h1 className="mt-4 text-xl font-semibold">Verifying your account...</h1>
      <p className="text-muted-foreground">
        Please wait while we verify your account.
      </p>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <h1 className="mt-4 text-xl font-semibold">Loading...</h1>
          <p className="text-muted-foreground">
            Please wait while we prepare verification...
          </p>
        </div>
      }>
      <VerifyContent />
    </Suspense>
  );
}
