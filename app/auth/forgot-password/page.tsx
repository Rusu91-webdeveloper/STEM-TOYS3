"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle, ArrowLeft, AlertCircle } from "lucide-react";
import Link from "next/link";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslation } from "@/lib/i18n";

// Form validation schema
const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const { t } = useTranslation();

  return (
    <div className="container flex flex-col items-center justify-center min-h-screen py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">{t("forgotPassword")}</h1>
          <p className="mt-2 text-muted-foreground">
            {t("enterEmailToReset", "Enter your email to reset your password")}
          </p>
        </div>

        <ForgotPasswordForm />
      </div>
    </div>
  );
}

function ForgotPasswordForm() {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isOAuthUser, setIsOAuthUser] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    setIsLoading(true);
    setError(null);
    setIsOAuthUser(false);

    try {
      // Call the API to send password reset email
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email }),
      });

      const result = await response.json();

      if (!response.ok) {
        // Check if this is an OAuth user error
        if (result.isOAuthUser) {
          setIsOAuthUser(true);
          setError(result.message);
        } else {
          setError(
            result.message ??
              t("failedToSendResetEmail", "Failed to send reset email")
          );
        }
        return;
      }

      setSuccess(true);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : t("anErrorOccurred", "An error occurred")
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="p-6 bg-card rounded-lg border shadow-sm space-y-6">
        <div className="flex flex-col items-center justify-center text-center space-y-4">
          <div className="bg-green-100 p-3 rounded-full">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h2 className="text-xl font-semibold">
            {t("passwordResetEmailSent")}
          </h2>
          <p className="text-muted-foreground">
            {t("passwordResetInstructions")}
          </p>
        </div>
        <Button asChild variant="outline" className="w-full">
          <Link href="/auth/login">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("backToLogin")}
          </Link>
        </Button>
      </div>
    );
  }

  // Special handling for OAuth users
  if (isOAuthUser) {
    return (
      <div className="p-6 bg-card rounded-lg border shadow-sm space-y-6">
        <div className="flex flex-col items-center justify-center text-center space-y-4">
          <div className="bg-blue-100 p-3 rounded-full">
            <AlertCircle className="h-10 w-10 text-blue-600" />
          </div>
          <h2 className="text-xl font-semibold">
            {t("googleAccountDetected")}
          </h2>
          <p className="text-muted-foreground">{t("oauthUserPasswordReset")}</p>
          <p className="text-sm text-muted-foreground">
            {t("oauthUserExplanation")}
          </p>
        </div>

        <div className="space-y-4">
          <GoogleSignInButton />

          <Button asChild variant="outline" className="w-full">
            <Link href="/auth/login">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t("backToLogin")}
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-card rounded-lg border shadow-sm space-y-6">
      {error && (
        <div className="p-4 rounded-md bg-destructive/15 text-destructive border border-destructive/30">
          <p className="font-medium">{t("error")}</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">{t("email")}</Label>
          <Input
            id="email"
            type="email"
            placeholder={t("emailPlaceholderExample")}
            {...register("email")}
            autoComplete="email"
            disabled={isLoading}
          />
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email.message}</p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? t("sendingResetInstructions") : t("resetPassword")}
        </Button>
      </form>

      <div className="text-center text-sm">
        <Link href="/auth/login" className="text-primary hover:underline">
          {t("backToLogin")}
        </Link>
      </div>
    </div>
  );
}
