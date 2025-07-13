"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle, ArrowLeft, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import React, { useState, useEffect, Suspense } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslation } from "@/lib/i18n";

// Form validation schema
const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/,
        "Password must contain at least one uppercase letter, one lowercase letter, and one number"
      ),
    confirmPassword: z.string(),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const [isOAuthUser, setIsOAuthUser] = useState(false);

  const token = searchParams.get("token");
  const email = searchParams.get("email");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  // Check if the current user is an OAuth user
  useEffect(() => {
    if (session?.user?.email && email && session.user.email === email) {
      // If user is logged in with the same email, check if they're an OAuth user
      // OAuth users typically don't have a password reset token flow
      // We'll show a message suggesting they use Google sign-in instead
      setIsOAuthUser(true);
    }
  }, [session, email]);

  // Verify token on component mount
  useEffect(() => {
    if (!token) {
      setError(
        t("invalidOrMissingResetToken", "Invalid or missing reset token")
      );
      setTokenValid(false);
      return;
    }

    const verifyToken = async () => {
      try {
        const response = await fetch(
          `/api/auth/verify-reset-token?token=${token}`
        );
        const data = await response.json();

        if (data.valid) {
          setTokenValid(true);
        } else {
          setTokenValid(false);
          if (data.reason === "token_expired") {
            setError(
              t(
                "tokenExpiredMessage",
                "Reset token has expired. Please request a new password reset."
              )
            );
          } else if (data.reason === "token_not_found") {
            setError(
              t(
                "invalidResetToken",
                "Invalid reset token. Please request a new password reset."
              )
            );
          } else {
            setError(
              t(
                "invalidResetToken",
                "Invalid reset token. Please request a new password reset."
              )
            );
          }
        }
      } catch (error) {
        setTokenValid(false);
        setError(
          t(
            "unableToVerifyToken",
            "Unable to verify reset token. Please try again."
          )
        );
      }
    };

    verifyToken();
  }, [token, t]);

  const onSubmit = async (data: ResetPasswordFormValues) => {
    if (!token) {
      setError(t("invalidResetToken"));
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          email: email || undefined,
          password: data.password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(
          result.message ||
            t("failedToResetPassword", "Failed to reset password")
        );
        return;
      }

      setSuccess(true);
    } catch (error) {
      setError(error instanceof Error ? error.message : t("anErrorOccurred"));
    } finally {
      setIsLoading(false);
    }
  };

  // Show OAuth user message if they're trying to reset password
  if (isOAuthUser) {
    return (
      <div className="container flex flex-col items-center justify-center min-h-screen py-12">
        <div className="w-full max-w-md space-y-8">
          <div className="p-6 bg-card rounded-lg border shadow-sm space-y-6">
            <div className="flex flex-col items-center justify-center text-center space-y-4">
              <div className="bg-blue-100 p-3 rounded-full">
                <AlertCircle className="h-10 w-10 text-blue-600" />
              </div>
              <h2 className="text-xl font-semibold">
                {t("googleAccountDetected")}
              </h2>
              <p className="text-muted-foreground">
                {t("alreadySignedInOauth")}
              </p>
              <p className="text-sm text-muted-foreground">
                {t("oauthAccountExplanation")}
              </p>
            </div>

            <div className="space-y-4">
              <Button
                onClick={() => router.push("/account")}
                className="w-full"
              >
                {t("goToYourAccount")}
              </Button>

              <Button asChild variant="outline" className="w-full">
                <Link href="/auth/login">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  {t("backToLogin")}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="container flex flex-col items-center justify-center min-h-screen py-12">
        <div className="w-full max-w-md space-y-8">
          <div className="p-6 bg-card rounded-lg border shadow-sm space-y-6">
            <div className="flex flex-col items-center justify-center text-center space-y-4">
              <div className="bg-green-100 p-3 rounded-full">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              <h2 className="text-xl font-semibold">
                {t("passwordResetSuccessful")}
              </h2>
              <p className="text-muted-foreground">
                {t("passwordResetSuccessMessage")}
              </p>
            </div>
            <Button
              onClick={() => router.push("/auth/login")}
              className="w-full"
            >
              {t("signInNow")}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (tokenValid === false) {
    return (
      <div className="container flex flex-col items-center justify-center min-h-screen py-12">
        <div className="w-full max-w-md space-y-8">
          <div className="p-6 bg-card rounded-lg border shadow-sm space-y-6">
            <div className="flex flex-col items-center justify-center text-center space-y-4">
              <div className="bg-red-100 p-3 rounded-full">
                <AlertCircle className="h-10 w-10 text-red-600" />
              </div>
              <h2 className="text-xl font-semibold">
                {t("invalidResetToken")}
              </h2>
              <p className="text-muted-foreground">
                {error || t("tokenExpiredMessage")}
              </p>
            </div>
            <div className="space-y-4">
              <Button asChild className="w-full">
                <Link href="/auth/forgot-password">
                  {t("requestNewResetLink")}
                </Link>
              </Button>

              <Button asChild variant="outline" className="w-full">
                <Link href="/auth/login">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  {t("backToLogin")}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (tokenValid === null) {
    return (
      <div className="container flex flex-col items-center justify-center min-h-screen py-12">
        <div className="w-full max-w-md space-y-8">
          <div className="flex flex-col items-center justify-center text-center space-y-4">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600" />
            <p className="text-lg font-medium">{t("verifyingResetToken")}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container flex flex-col items-center justify-center min-h-screen py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">{t("resetPassword")}</h1>
          <p className="mt-2 text-muted-foreground">
            {t("enterNewPasswordBelow")}
          </p>
        </div>

        <div className="p-6 bg-card rounded-lg border shadow-sm space-y-6">
          {error && (
            <div className="p-4 rounded-md bg-destructive/15 text-destructive border border-destructive/30">
              <p className="font-medium">{t("error")}</p>
              <p className="text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">{t("newPassword")}</Label>
              <Input
                id="password"
                type="password"
                placeholder={t("enterYourNewPassword")}
                {...register("password")}
                autoComplete="new-password"
                disabled={isLoading}
              />
              {errors.password && (
                <p className="text-sm text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t("confirmNewPassword")}</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder={t("confirmYourNewPassword")}
                {...register("confirmPassword")}
                autoComplete="new-password"
                disabled={isLoading}
              />
              {errors.confirmPassword && (
                <p className="text-sm text-destructive">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? t("resettingPassword") : t("resetPassword")}
            </Button>
          </form>

          <div className="text-center text-sm">
            <Link href="/auth/login" className="text-primary hover:underline">
              {t("backToLogin")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  const { t } = useTranslation();

  return (
    <Suspense
      fallback={
        <div className="container flex flex-col items-center justify-center min-h-screen py-12">
          <div className="w-full max-w-md space-y-8">
            <div className="flex flex-col items-center justify-center text-center space-y-4">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600" />
              <p className="text-lg font-medium">{t("loading")}</p>
            </div>
          </div>
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
