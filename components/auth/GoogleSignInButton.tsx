"use client";

import { Chrome } from "lucide-react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface GoogleSignInButtonProps {
  callbackUrl?: string;
}

export function GoogleSignInButton({
  callbackUrl = "/account",
}: GoogleSignInButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const _router = useRouter();

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      // Set a local storage flag to indicate we're in the OAuth flow
      // This will be used to prevent error messages from showing briefly
      localStorage.setItem("googleAuthInProgress", "true");

      // Add a cleanup timeout in case the flow is interrupted
      const timeoutId = setTimeout(() => {
        localStorage.removeItem("googleAuthInProgress");
      }, 60000); // 1 minute timeout

      // Use the standard NextAuth callback URL format
      // NextAuth will handle the OAuth callback at /api/auth/callback/google
      // Then redirect to our custom callback page with the intended destination
      const finalCallbackUrl = callbackUrl || "/account";
      
      // Build the callback URL that NextAuth will redirect to after OAuth
      const customCallbackUrl = new URL("/auth/callback", window.location.origin);
      customCallbackUrl.searchParams.set("callbackUrl", finalCallbackUrl);

      // Use signIn with proper error handling
      // Note: When redirect: true, signIn will redirect the browser
      // so the code after this may not execute
      const result = await signIn("google", {
        callbackUrl: customCallbackUrl.toString(),
        redirect: true,
      });

      // If signIn returns an error (shouldn't happen with redirect: true, but handle it)
      if (result?.error) {
        throw new Error(result.error);
      }

      // Clear the timeout if the function completes normally
      clearTimeout(timeoutId);
    } catch (error) {
      console.error("Google sign-in error:", error);
      // Clear the in-progress flag if there's an error
      localStorage.removeItem("googleAuthInProgress");
      setIsLoading(false);
      
      // Re-throw the error so it can be handled by error boundaries
      throw error;
    }
  };

  return (
    <Button
      variant="outline"
      type="button"
      disabled={isLoading}
      onClick={handleGoogleSignIn}
      className={cn(
        "w-full flex items-center justify-center gap-2 bg-white text-gray-900 hover:bg-gray-100",
        "dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
      )}
    >
      {isLoading ? (
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-900 border-t-transparent" />
      ) : (
        <Chrome className="h-5 w-5 text-red-500" />
      )}
      <span>Sign in with Google</span>
    </Button>
  );
}
