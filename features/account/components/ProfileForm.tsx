"use client";

import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import {
  glassPanelClass,
  gradientButtonClass,
} from "@/features/home/components/homeTheme";
import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface ProfileFormData {
  name: string;
  email: string;
  newPassword?: string;
  confirmPassword?: string;
}

interface ProfileFormProps {
  initialData: {
    name: string;
    email: string;
  };
}

export function ProfileForm({ initialData }: ProfileFormProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
  } = useForm<ProfileFormData>({
    defaultValues: {
      name: initialData.name,
      email: initialData.email,
      newPassword: "",
      confirmPassword: "",
    },
  });

  const watchNewPassword = watch("newPassword");

  const onSubmit = async (data: ProfileFormData) => {
    setIsLoading(true);
    try {
      // Validate password match if new password is provided
      if (data.newPassword && data.newPassword !== data.confirmPassword) {
        toast({
          title: t("passwordsDontMatch", "Parolele nu se potrivesc"),
          description: t(
            "passwordsMatchError",
            "Te rugăm să te asiguri că parolele se potrivesc"
          ),
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Prepare request data
      const requestData = {
        name: data.name,
        email: data.email,
        newPassword: data.newPassword || null,
      };

      // Call the API
      const response = await fetch("/api/account/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            t("profileUpdateFailed", "Nu s-a putut actualiza profilul")
        );
      }

      // If password is being updated, show specific message
      if (data.newPassword) {
        toast({
          title: t("passwordUpdated", "Parola a fost actualizată"),
          description: t(
            "passwordUpdateSuccess",
            "Parola ta a fost schimbată cu succes."
          ),
          variant: "default",
        });
      } else {
        toast({
          title: t("profileUpdated", "Profil actualizat"),
          description: t(
            "profileUpdateSuccess",
            "Informațiile profilului tău au fost actualizate cu succes."
          ),
        });
      }

      // Reset password fields
      reset({
        ...data,
        newPassword: "",
        confirmPassword: "",
      });

      // Refresh the page to update user session
      router.refresh();
    } catch (error) {
      console.error("Error updating profile:", error);
      // Determine if password change failed
      if (watchNewPassword) {
        toast({
          title: t("passwordUpdateFailed", "Actualizarea parolei a eșuat"),
          description:
            error instanceof Error
              ? error.message
              : t("tryAgain", "Te rugăm să încerci din nou."),
          variant: "destructive",
        });
      } else {
        toast({
          title: "Eroare",
          description:
            error instanceof Error
              ? error.message
              : t(
                  "profileUpdateError",
                  "A apărut o eroare la actualizarea profilului tău"
                ),
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 text-slate-100">
      <div
        className={cn(
          glassPanelClass,
          "space-y-4 border-white/10 bg-slate-900/70 p-6 shadow-xl shadow-black/30"
        )}
      >
        <h3 className="mb-4 text-lg font-semibold text-slate-100">
          {t("profile", "Informații personale")}
        </h3>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium text-slate-200">
              {t("name", "Nume")}
            </Label>
            <Input
              id="name"
              {...register("name", {
                required: t("nameRequired", "Numele este obligatoriu"),
              })}
              placeholder={t("yourName", "Numele tău")}
              disabled={isLoading}
              className="border border-white/15 bg-white/10 text-slate-100 placeholder:text-slate-400 transition-all focus:border-sky-400/60 focus:ring-sky-400/20"
            />
            {errors.name && (
              <p className="text-sm text-rose-300">{errors.name.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label
              htmlFor="email"
              className="text-sm font-medium text-slate-200"
            >
              {t("email", "Email")}
            </Label>
            <Input
              id="email"
              type="email"
              {...register("email", {
                required: t("emailRequired", "Emailul este obligatoriu"),
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: t("invalidEmail", "Adresă de email invalidă"),
                },
              })}
              placeholder={t("yourEmail", "Emailul tău")}
              disabled={isLoading}
              className="border border-white/15 bg-white/10 text-slate-100 placeholder:text-slate-400 transition-all focus:border-sky-400/60 focus:ring-sky-400/20"
            />
            {errors.email && (
              <p className="text-sm text-rose-300">{errors.email.message}</p>
            )}
          </div>
        </div>
      </div>

      <div
        className={cn(
          glassPanelClass,
          "border-white/10 bg-slate-900/70 p-6 shadow-xl shadow-black/30"
        )}
      >
        <h3 className="mb-4 text-lg font-semibold text-slate-100">
          {t("password", "Parolă")}
        </h3>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label
              htmlFor="newPassword"
              className="text-sm font-medium text-slate-200"
            >
              {t("newPassword", "Parolă nouă")}
            </Label>
            <Input
              id="newPassword"
              type="password"
              {...register("newPassword")}
              placeholder={t(
                "leaveBlankPassword",
                "Leave blank to keep current password"
              )}
              disabled={isLoading}
              className="border border-white/15 bg-white/10 text-slate-100 placeholder:text-slate-400 transition-all focus:border-sky-400/60 focus:ring-sky-400/20"
            />
            {errors.newPassword && (
              <p className="text-sm text-rose-300">
                {errors.newPassword.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label
              htmlFor="confirmPassword"
              className="text-sm font-medium text-slate-200"
            >
              {t("confirmNewPassword", "Confirmă parola")}
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              {...register("confirmPassword", {
                validate: value =>
                  !watchNewPassword ||
                  value === watchNewPassword ||
                  t("passwordsDontMatch", "Parolele nu se potrivesc"),
              })}
              placeholder={t("confirmNewPassword", "Confirmă parola nouă")}
              disabled={isLoading}
              className="border border-white/15 bg-white/10 text-slate-100 placeholder:text-slate-400 transition-all focus:border-sky-400/60 focus:ring-sky-400/20"
            />
            {errors.confirmPassword && (
              <p className="text-sm text-rose-300">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>
        </div>
        <div className="mt-6">
          <Button
            type="submit"
            disabled={isLoading}
            className={cn(
              "flex items-center gap-2 transition-all duration-300 hover:scale-[1.01]",
              gradientButtonClass
            )}
          >
            {isLoading ? (
              <>
                <span className="mr-2 animate-spin">⏳</span>
                {t("saving", "Se salvează...")}
              </>
            ) : (
              t("saveChanges", "Salvează modificările")
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}
