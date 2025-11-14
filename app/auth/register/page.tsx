"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckIcon, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";

import { AuthExperienceLayout } from "@/app/auth/components/AuthExperienceLayout";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { Separator } from "@/components/ui/separator";
// import { useToast } from "@/components/ui/use-toast";
import { useTranslation, type TranslationKey } from "@/lib/i18n";
import { cn } from "@/lib/utils";
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

      setSuccess(result.message || t("registrationSuccess"));
      setIsRegistered(true);
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

  const layoutCopy = {
    title: t(
      "registerHeroTitle",
      "Creează contul care transformă joaca în progres STEM"
    ),
    subtitle: t(
      "registerHeroDescription",
      "Primești acces la recomandări personalizate, garanție extinsă și consultanți educaționali reali."
    ),
    highlight: t(
      "registerHeroHighlight",
      "Crearea contului durează sub 3 minute și îți activează beneficii exclusive."
    ),
  };

  const successView = (
    <div className="space-y-6 text-center text-slate-100">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-400/20">
        <CheckIcon className="h-8 w-8 text-emerald-300" />
      </div>
      <div className="space-y-3">
        <h2 className="text-3xl font-bold text-white">
          {t("registrationSuccessful")}
        </h2>
        <p className="text-sm text-slate-300">{t("verificationEmailSent")}</p>
      </div>
      <div className="rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4 text-left text-amber-100">
        <p className="text-sm">
          <strong className="font-semibold">{t("importantNote")}</strong>{" "}
          {t("checkSpamFolder")}
        </p>
      </div>

      {verificationUrl && (
        <div className="space-y-3 rounded-2xl border border-sky-400/40 bg-sky-400/10 p-4 text-left">
          <p className="text-sm font-medium text-sky-100">
            {t("developmentMode")} · {t("useVerificationLink")}
          </p>
          <div className="rounded-xl border border-white/10 bg-black/20 p-3">
            <code className="block text-xs text-slate-100 break-all">
              {verificationUrl}
            </code>
          </div>
          <Button
            onClick={() => window.open(verificationUrl, "_blank")}
            variant="outline"
            size="sm"
            className="w-full border-white/20 text-white hover:bg-white/10"
          >
            {t("openVerificationLink")}
          </Button>
        </div>
      )}

      <div className="flex flex-col gap-4">
        <Button
          onClick={() => router.push("/auth/login?from=register")}
          className="w-full bg-gradient-to-r from-emerald-400 via-sky-500 to-indigo-500 text-white hover:from-emerald-300 hover:via-sky-400 hover:to-indigo-400"
        >
          <span className="flex items-center justify-center gap-2">
            {t("goToLoginPage")}
            <ArrowRight className="h-4 w-4" />
          </span>
        </Button>
      </div>
    </div>
  );

  const formView = (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <p className="text-sm uppercase tracking-[0.3em] text-emerald-300/80">
          {t("createAnAccount")}
        </p>
        <h2 className="text-3xl font-bold text-white">
          {t("signUpDescription")}
        </h2>
        <p className="text-sm text-slate-300">
          {t(
            "registerHeroSubtitle",
            "Fără taxe ascunse, doar suport real pentru parcursul educațional al copilului."
          )}
        </p>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-4 text-red-200">
          <p className="font-medium">{t("registrationFailed")}</p>
          <p className="text-sm">{error}</p>
          {error.includes("email already exists") && (
            <div className="mt-2 text-sm">
              <Link
                href="/auth/login"
                className="font-medium text-emerald-200 underline-offset-2 hover:underline"
              >
                {t("goToLoginPage")}
              </Link>
            </div>
          )}
        </div>
      )}

      {success && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-100">
          <p className="font-medium">{t("authSuccess")}</p>
          <p className="text-sm">{success}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-slate-200">
            {t("fullName")}
          </Label>
          <Input
            id="name"
            placeholder={t("johnDoe")}
            autoComplete="name"
            {...register("name")}
            className={cn(
              "bg-transparent text-white placeholder:text-slate-400",
              errors.name && "border-red-400 focus-visible:ring-red-400"
            )}
          />
          {errors.name && (
            <p className="text-sm text-red-300">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="text-slate-200">
            {t("email")}
          </Label>
          <Input
            id="email"
            type="email"
            placeholder={t("emailPlaceholderExample")}
            autoComplete="email"
            {...register("email")}
            className={cn(
              "bg-transparent text-white placeholder:text-slate-400",
              errors.email && "border-red-400 focus-visible:ring-red-400"
            )}
          />
          {errors.email && (
            <p className="text-sm text-red-300">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-slate-200">
            {t("password")}
          </Label>
          <PasswordInput
            id="password"
            placeholder={t("passwordPlaceholder")}
            autoComplete="new-password"
            {...register("password")}
            className={cn(
              "bg-transparent text-white placeholder:text-slate-400",
              errors.password && "border-red-400 focus-visible:ring-red-400"
            )}
          />
          {errors.password && (
            <p className="text-sm text-red-300">{errors.password.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword" className="text-slate-200">
            {t("confirmPassword")}
          </Label>
          <PasswordInput
            id="confirmPassword"
            placeholder={t("passwordPlaceholder")}
            autoComplete="new-password"
            {...register("confirmPassword")}
            className={cn(
              "bg-transparent text-white placeholder:text-slate-400",
              errors.confirmPassword && "border-red-400 focus-visible:ring-red-400"
            )}
          />
          {errors.confirmPassword && (
            <p className="text-sm text-red-300">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-left">
          <Controller
            name="agreeToTerms"
            control={control}
            render={({ field }) => (
              <Checkbox
                id="agreeToTerms"
                checked={field.value}
                onCheckedChange={field.onChange}
                className="border-white/30 data-[state=checked]:bg-emerald-400 data-[state=checked]:text-white"
              />
            )}
          />
          <label
            htmlFor="agreeToTerms"
            className="text-sm text-slate-200 leading-relaxed"
          >
            {t("agreeToTerms")}{" "}
            <Link
              href="/terms"
              className="text-emerald-200 underline-offset-2 hover:underline"
            >
              {t("termsOfService")}
            </Link>
          </label>
        </div>
        {errors.agreeToTerms && (
          <p className="text-sm text-red-300">{errors.agreeToTerms.message}</p>
        )}

        <Button
          type="submit"
          className="w-full bg-gradient-to-r from-emerald-400 via-sky-500 to-indigo-500 text-white shadow-lg shadow-emerald-500/40 hover:from-emerald-300 hover:via-sky-400 hover:to-indigo-400"
          disabled={isLoading}
        >
          {isLoading ? t("creatingAccount") : t("createAccount")}
        </Button>
      </form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <Separator className="w-full bg-white/10" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-slate-900 px-2 text-sm text-slate-400">
            {t("orContinueWith")}
          </span>
        </div>
      </div>

      <GoogleSignInButton />

      <div className="text-center text-sm text-slate-300">
        {t("alreadyHaveAccount")}{" "}
        <Link
          href="/auth/login"
          className="font-medium text-emerald-200 hover:text-emerald-100"
        >
          {t("signIn")}
        </Link>
      </div>
    </div>
  );

  return (
    <AuthExperienceLayout {...layoutCopy}>
      {isRegistered ? successView : formView}
    </AuthExperienceLayout>
  );
}
