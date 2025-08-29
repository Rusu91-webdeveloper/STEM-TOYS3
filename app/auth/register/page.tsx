"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckIcon, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";

import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { useTranslation, type TranslationKey } from "@/lib/i18n";
import { userSchema } from "@/lib/validations";

// Create a registration schema factory that uses translation function
const createRegisterSchema = (t: (key: TranslationKey) => string) =>
  userSchema
    .extend({
      password: userSchema.shape.password.unwrap(),
      confirmPassword: z.string(),
      agreeToTerms: z.boolean().refine(value => value === true, {
        message: t("termsMustAgree"),
      }),
    })
    .refine(data => data.password === data.confirmPassword, {
      message: t("passwordsNoMatch"),
      path: ["confirmPassword"],
    });

type RegisterFormValues = z.infer<ReturnType<typeof createRegisterSchema>>;

export default function RegisterPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRegistered, setIsRegistered] = useState<boolean>(false);
  const [verificationUrl, setVerificationUrl] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(createRegisterSchema(t)),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      agreeToTerms: true,
    },
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Call to register API endpoint
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          password: data.password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        // Handle specific error status codes
        if (response.status === 409) {
          setError(result.error || t("emailExists"));
        } else if (response.status === 400) {
          setError(result.error || t("checkInfoAndTryAgain"));
        } else {
          setError(result.error || t("registrationFailed"));
        }
        setIsLoading(false);
        return;
      }

      // Show success message
      setSuccess(result.message || t("registrationSuccess"));
      setIsRegistered(true);
      // Save verification URL if provided (development mode)
      if (result.devInfo?.verificationUrl) {
        setVerificationUrl(result.devInfo.verificationUrl);
      }
      setIsLoading(false);
    } catch (error) {
      console.error("Registration error:", error);
      setError(t("registrationError"));
      setIsLoading(false);
    }
  };

  if (isRegistered) {
    return (
      <div className="container mx-auto py-10">
        <div className="flex flex-col items-center justify-center space-y-6 max-w-md mx-auto">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckIcon className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-center">
            {t("registrationSuccessful")}
          </h1>
          <p className="text-center text-muted-foreground">
            {t("verificationEmailSent")}
          </p>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 w-full">
            <p className="text-amber-800 text-sm">
              <strong>{t("importantNote")}</strong> {t("checkSpamFolder")}
            </p>
          </div>

          {/* Display verification link in development mode */}
          {verificationUrl && (
            <div className="w-full bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-800 text-sm mb-2">
                <strong>{t("developmentMode")}</strong>{" "}
                {t("useVerificationLink")}
              </p>
              <div className="bg-white p-2 rounded border border-blue-100 overflow-x-auto">
                <code className="text-xs break-all">{verificationUrl}</code>
              </div>
              <div className="mt-3">
                <Button
                  onClick={() => window.open(verificationUrl, "_blank")}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  {t("openVerificationLink")}
                </Button>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-4 w-full">
            <Button
              onClick={() => router.push("/auth/login?from=register")}
              className="w-full flex items-center justify-center gap-2"
            >
              {t("goToLoginPage")} <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex flex-col items-center justify-center space-y-6 max-w-md mx-auto">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold">{t("createAnAccount")}</h1>
          <p className="text-muted-foreground">{t("signUpDescription")}</p>
        </div>

        <div className="w-full p-6 space-y-6 bg-card rounded-lg border shadow-sm">
          {error && (
            <div className="p-4 rounded-md bg-destructive/15 text-destructive border border-destructive/30 flex flex-col space-y-1">
              <p className="font-medium">{t("registrationFailed")}</p>
              <p className="text-sm">{error}</p>
              {error.includes("email already exists") && (
                <div className="mt-2 text-sm">
                  <Link
                    href="/auth/login"
                    className="text-primary hover:underline font-medium"
                  >
                    {t("goToLoginPage")}
                  </Link>
                </div>
              )}
            </div>
          )}

          {success && (
            <div className="p-4 rounded-md bg-green-100 text-green-800 border border-green-200 flex flex-col space-y-1">
              <p className="font-medium">{t("authSuccess")}</p>
              <p className="text-sm">{success}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t("fullName")}</Label>
              <Input
                id="name"
                placeholder={t("johnDoe")}
                autoComplete="name"
                {...register("name")}
                className={errors.name ? "border-destructive" : ""}
              />
              {errors.name && (
                <p className="text-sm text-destructive">
                  {errors.name.message}
                </p>
              )}
            </div>

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
                <p className="text-sm text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{t("password")}</Label>
              <PasswordInput
                id="password"
                placeholder={t("passwordPlaceholder")}
                autoComplete="new-password"
                {...register("password")}
                className={errors.password ? "border-destructive" : ""}
              />
              {errors.password && (
                <p className="text-sm text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t("confirmPassword")}</Label>
              <PasswordInput
                id="confirmPassword"
                placeholder={t("passwordPlaceholder")}
                autoComplete="new-password"
                {...register("confirmPassword")}
                className={errors.confirmPassword ? "border-destructive" : ""}
              />
              {errors.confirmPassword && (
                <p className="text-sm text-destructive">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            <div className="flex items-center space-x-2 py-2">
              <Controller
                name="agreeToTerms"
                control={control}
                render={({ field }) => (
                  <Checkbox
                    id="agreeToTerms"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
              <label
                htmlFor="agreeToTerms"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {t("agreeToTerms")}{" "}
                <Link href="/terms" className="text-primary hover:underline">
                  {t("termsOfService")}
                </Link>
              </label>
            </div>
            {errors.agreeToTerms && (
              <p className="text-sm text-destructive mt-1">
                {errors.agreeToTerms.message}
              </p>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? t("creatingAccount") : t("createAccount")}
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
            {t("alreadyHaveAccount")}{" "}
            <Link
              href="/auth/login"
              className="font-medium text-primary hover:underline"
            >
              {t("signIn")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
