"use client";

import { Button } from "@/components/ui/button";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { FcGoogle } from "react-icons/fc";
import { useRouter } from "next/navigation";

interface GoogleSignInButtonProps {
  callbackUrl?: string;
}

export function GoogleSignInButton({
  callbackUrl = "/account",
}: GoogleSignInButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

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

      // Start the Google sign-in flow - always use /account as callback
      // This ensures consistent user experience regardless of where the login was initiated from
      await signIn("google", {
        callbackUrl: "/account",
        redirect: true,
      });

      // Clear the timeout if the function completes normally
      clearTimeout(timeoutId);
    } catch (error) {
      console.error("Google sign-in error:", error);
      // Clear the in-progress flag if there's an error
      localStorage.removeItem("googleAuthInProgress");
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      type="button"
      disabled={isLoading}
      onClick={handleGoogleSignIn}
      className="w-full flex items-center justify-center gap-2">
      {isLoading ? (
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-900 border-t-transparent" />
      ) : (
        <FcGoogle className="h-5 w-5" />
      )}
      <span>Sign in with Google</span>
    </Button>
  );
}
