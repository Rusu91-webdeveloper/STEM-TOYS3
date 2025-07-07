"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle, XCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useState, useEffect, Suspense } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";


// Form validation schema
const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(100)
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/,
        "Password must contain at least one uppercase letter, one lowercase letter, and one number"
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams?.get("token");
  const email = searchParams?.get("email");
  const [validToken, setValidToken] = useState<boolean | null>(null);
  const [isCheckingToken, setIsCheckingToken] = useState(true);

  useEffect(() => {
    // Verify the token with the API
    const checkToken = async () => {
      setIsCheckingToken(true);
      try {
        if (!token) {
          setValidToken(false);
          return;
        }

        const response = await fetch(
          `/api/auth/verify-reset-token?token=${token}`
        );

        if (!response.ok) {
          setValidToken(false);
          return;
        }

        const data = await response.json();
        setValidToken(data.valid);
      } catch (error) {
        console.error("Error validating token:", error);
        setValidToken(false);
      } finally {
        setIsCheckingToken(false);
      }
    };

    checkToken();
  }, [token]);

  if (isCheckingToken) {
    return (
      <div className="container flex flex-col items-center justify-center min-h-screen py-12">
        <div className="w-full max-w-md space-y-8 text-center">
          <h1 className="text-3xl font-bold">Verifying Link</h1>
          <p className="text-muted-foreground">
            Please wait while we verify your password reset link...
          </p>
          <div className="flex justify-center mt-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  if (validToken === false) {
    return (
      <div className="container flex flex-col items-center justify-center min-h-screen py-12">
        <div className="w-full max-w-md space-y-8">
          <div className="flex flex-col items-center justify-center text-center space-y-4">
            <div className="bg-red-100 p-3 rounded-full">
              <XCircle className="h-10 w-10 text-red-600" />
            </div>
            <h1 className="text-3xl font-bold">Invalid or Expired Link</h1>
            <p className="text-muted-foreground">
              The password reset link is invalid or has expired. Please request
              a new one.
            </p>
            <Button
              asChild
              className="mt-4">
              <Link href="/auth/forgot-password">Request New Link</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container flex flex-col items-center justify-center min-h-screen py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Reset Password</h1>
          <p className="mt-2 text-muted-foreground">
            Create a new password for your account
          </p>
        </div>

        <ResetPasswordForm
          token={token as string}
          email={email as string}
        />
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="container flex flex-col items-center justify-center min-h-screen py-12">
          <div className="w-full max-w-md space-y-8 text-center">
            <h1 className="text-3xl font-bold">Loading...</h1>
            <p className="text-muted-foreground">
              Please wait while we load the password reset form...
            </p>
            <div className="flex justify-center mt-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          </div>
        </div>
      }>
      <ResetPasswordContent />
    </Suspense>
  );
}

function ResetPasswordForm({
  token,
  email,
}: {
  token: string;
  email?: string;
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

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

  const onSubmit = async (data: ResetPasswordFormValues) => {
    setIsLoading(true);
    setError(null);

    try {
      // Call API to reset password
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          email,
          password: data.password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to reset password");
      }

      setSuccess(true);
    } catch (error) {
      setError(error instanceof Error ? error.message : "An error occurred");
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
          <h2 className="text-xl font-semibold">Password Reset Successful</h2>
          <p className="text-muted-foreground">
            Your password has been reset successfully. You can now login with
            your new password.
          </p>
        </div>
        <Button
          asChild
          className="w-full">
          <Link href="/auth/login">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Login
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 bg-card rounded-lg border shadow-sm space-y-6">
      {error && (
        <div className="p-4 rounded-md bg-destructive/15 text-destructive border border-destructive/30">
          <p className="font-medium">Error</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="password">New Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            {...register("password")}
            disabled={isLoading}
          />
          {errors.password && (
            <p className="text-sm text-destructive">
              {errors.password.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="••••••••"
            {...register("confirmPassword")}
            disabled={isLoading}
          />
          {errors.confirmPassword && (
            <p className="text-sm text-destructive">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={isLoading}>
          {isLoading ? "Resetting Password..." : "Reset Password"}
        </Button>
      </form>

      <div className="text-center text-sm">
        <Link
          href="/auth/login"
          className="text-primary hover:underline">
          Back to login
        </Link>
      </div>
    </div>
  );
}
