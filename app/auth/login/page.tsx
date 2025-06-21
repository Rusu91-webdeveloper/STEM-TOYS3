"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { signIn, useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginSchema } from "@/lib/validations";
import { CheckCircle, Info } from "lucide-react";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { Separator } from "@/components/ui/separator";
import { useTranslation } from "@/lib/i18n";

type LoginFormValues = z.infer<typeof loginSchema>;

// Helper to clear problematic cookies if we're stuck in a redirect loop
const clearProblemCookies = () => {
  // Check if we're in a loop by checking URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  if (
    urlParams.has("callbackUrl") &&
    urlParams.get("callbackUrl") === "/checkout"
  ) {
    const loopCount = parseInt(localStorage.getItem("loginLoopCount") || "0");
    localStorage.setItem("loginLoopCount", (loopCount + 1).toString());

    // If we detect multiple redirects in quick succession, clear auth cookies
    if (loopCount > 3) {
      console.log("Detected potential redirect loop, clearing auth cookies");
      document.cookie =
        "next-auth.session-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT";
      document.cookie =
        "__Secure-next-auth.session-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT";
      document.cookie =
        "next-auth.csrf-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT";
      localStorage.removeItem("loginLoopCount");
    }
  } else {
    // Reset counter if we're not in the loop
    localStorage.removeItem("loginLoopCount");
  }
};

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const { t } = useTranslation();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [debugVisible, setDebugVisible] = useState<boolean>(false);

  // Check for loop and clear cookies if needed
  useEffect(() => {
    if (typeof window !== "undefined") {
      clearProblemCookies();
    }
  }, []);

  // Check for verification success parameter or registration redirect
  useEffect(() => {
    if (searchParams.get("verified") === "true") {
      setSuccess(t("email_verification_greeting"));
    } else if (searchParams.get("from") === "register") {
      setSuccess(t("registrationSuccess"));
    } else if (searchParams.get("error") === "UserDeleted") {
      // Check if we're in an active Google auth flow first
      const isGoogleAuthInProgress = localStorage.getItem(
        "googleAuthInProgress"
      );

      if (isGoogleAuthInProgress) {
        console.log("Google auth in progress, suppressing error message");
        // Don't show error during OAuth flow, it might be temporary
        // Remove the error parameter from URL to prevent it from showing up
        // when the user is redirected back
        const params = new URLSearchParams(window.location.search);
        params.delete("error");

        const newUrl =
          window.location.pathname +
          (params.toString() ? `?${params.toString()}` : "");

        // Replace current URL without the error
        window.history.replaceState(null, "", newUrl);
        return;
      }

      // If we get here, it's not a temporary error, so show it
      setError(t("userDeleted"));

      // Force clear all authentication data
      const clearAuthData = async () => {
        try {
          // Sign out using NextAuth
          await signOut({ redirect: false });

          // Clear all cookies with more aggressive approach
          document.cookie.split(";").forEach((cookie) => {
            const [name] = cookie.trim().split("=");
            if (name) {
              const paths = [
                "/",
                "/account",
                "/profile",
                "/auth",
                "/checkout",
                "/api",
              ];
              const domains = [window.location.hostname, "", null, undefined];

              // Clear cookie on all paths and potential domains
              paths.forEach((path) => {
                domains.forEach((domain) => {
                  const domainStr = domain ? `domain=${domain}; ` : "";
                  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:01 GMT; ${domainStr}path=${path}; secure; samesite=lax`;
                  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:01 GMT; ${domainStr}path=${path}`;
                });
              });
            }
          });

          // Clear storage
          localStorage.clear();
          sessionStorage.clear();

          console.log("Cleared all auth data due to UserDeleted error");

          // Force reload to ensure clean state
          setTimeout(() => {
            window.location.href = "/auth/login";
          }, 100);
        } catch (error) {
          console.error("Error clearing auth data:", error);
        }
      };

      clearAuthData();
    }
  }, [searchParams, t]);

  // If user is already authenticated and there's a callbackUrl, redirect there
  useEffect(() => {
    if (status === "authenticated" && session) {
      const callbackUrl = searchParams.get("callbackUrl") || "/account";
      console.log("User is authenticated, redirecting to:", callbackUrl);

      // Add a small delay to allow state to settle
      const redirectTimer = setTimeout(() => {
        // Check if the callbackUrl is already in the browser history
        // This helps prevent redirect loops when changing language/currency
        const isRedirectedFromCallbackUrl =
          document.referrer && document.referrer.includes(callbackUrl);

        if (isRedirectedFromCallbackUrl) {
          console.log(
            "Detected potential redirect loop, navigating to homepage instead"
          );
          window.location.href = "/";
        } else {
          window.location.href = callbackUrl;
        }
      }, 500);

      return () => clearTimeout(redirectTimer);
    }
  }, [session, status, searchParams]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      console.log("Signing in with:", data.email);

      const result = await signIn("credentials", {
        redirect: false,
        email: data.email,
        password: data.password,
      });

      console.log("Sign in result:", result);

      if (!result) {
        setError(t("authServiceUnavailable"));
        setIsLoading(false);
        return;
      }

      if (result.error) {
        if (
          result.error === "CredentialsSignin" ||
          result.error.includes("credentials")
        ) {
          setError(t("invalidCredentials"));
        } else if (
          result.error.includes("not verified") ||
          result.error.includes("inactive")
        ) {
          setError(t("accountNotVerified"));
        } else {
          setError(result.error);
        }
        setIsLoading(false);
        return;
      }

      // Authentication successful
      setSuccess(t("loginSuccessful"));

      // Get the redirect URL
      const callbackUrl = searchParams.get("callbackUrl") || "/";
      console.log("Redirecting to:", callbackUrl);

      // Use window.location for a hard redirect instead of Next.js router
      window.location.href = callbackUrl;
    } catch (error) {
      console.error("Login error:", error);
      setError(t("registrationError"));
      setIsLoading(false);
    }
  };

  // Function to help debug authentication issues
  const handleSignOut = async () => {
    await signOut({ redirect: false });
    window.location.reload();
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-6 max-w-md mx-auto">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">{t("welcomeBack")}</h1>
        <p className="text-muted-foreground">{t("signInCredentials")}</p>
      </div>

      <div className="w-full p-6 space-y-6 bg-card rounded-lg border shadow-sm">
        {/* Debug information */}
        <div className="flex justify-end">
          <button
            onClick={() => setDebugVisible(!debugVisible)}
            className="text-gray-400 hover:text-gray-600 p-1">
            <Info size={16} />
          </button>
        </div>

        {debugVisible && (
          <div className="p-3 bg-gray-100 rounded-md text-xs mb-4">
            <p>
              <strong>Auth Status:</strong> {status}
            </p>
            {session && (
              <p>
                <strong>User:</strong> {session.user?.email}
              </p>
            )}
            <p>
              <strong>Callback URL:</strong>{" "}
              {searchParams.get("callbackUrl") || "None"}
            </p>
            <div className="mt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                className="text-xs h-7">
                Force Sign Out
              </Button>
            </div>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-md bg-destructive/15 text-destructive border border-destructive/30 flex flex-col space-y-1">
            <p className="font-medium">{t("signInFailed")}</p>
            <p className="text-sm">{error}</p>
            {error.includes("not verified") && (
              <div className="mt-2 text-sm">
                <p>
                  Need a new verification email?{" "}
                  <Link
                    href="/auth/resend-verification"
                    className="text-primary hover:underline font-medium">
                    Resend verification
                  </Link>
                </p>
              </div>
            )}
          </div>
        )}

        {success && (
          <div className="p-4 rounded-md bg-green-100 text-green-800 border border-green-200 flex items-start gap-3">
            <CheckCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">{t("authSuccess")}</p>
              <p className="text-sm">{success}</p>
            </div>
          </div>
        )}

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">{t("email")}</Label>
            <Input
              id="email"
              type="email"
              placeholder={t("emailPlaceholderExample")}
              autoComplete="email"
              {...register("email")}
              className={errors.email ? "border-destructive" : ""}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">{t("password")}</Label>
              <Link
                href="/auth/forgot-password"
                className="text-sm text-primary hover:underline">
                {t("forgotPassword")}
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              placeholder={t("passwordPlaceholder")}
              autoComplete="current-password"
              {...register("password")}
              className={errors.password ? "border-destructive" : ""}
            />
            {errors.password && (
              <p className="text-sm text-destructive">
                {errors.password.message}
              </p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}>
            {isLoading ? t("signingIn") : t("signIn")}
          </Button>
        </form>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <Separator className="w-full" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-card px-2 text-muted-foreground text-sm">
              {t("orContinueWith")}
            </span>
          </div>
        </div>

        <GoogleSignInButton />

        <div className="mt-4 text-center text-sm">
          {t("dontHaveAccount")}{" "}
          <Link
            href="/auth/register"
            className="font-medium text-primary hover:underline">
            {t("createAccount")}
          </Link>
        </div>
      </div>
    </div>
  );
}

// Fallback component to show while the main content is loading
function LoginFormFallback() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center space-y-6 max-w-md mx-auto">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">{t("welcomeBack")}</h1>
        <p className="text-muted-foreground">{t("signInCredentials")}</p>
      </div>

      <div className="w-full p-6 space-y-6 bg-card rounded-lg border shadow-sm">
        <div className="animate-pulse">
          <div className="h-10 bg-gray-200 rounded mb-4"></div>
          <div className="h-10 bg-gray-200 rounded mb-4"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="container mx-auto py-10">
      <Suspense fallback={<LoginFormFallback />}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
