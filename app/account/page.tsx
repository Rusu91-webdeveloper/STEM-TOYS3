import { User } from "lucide-react";
import React from "react";

import { ProfileForm } from "@/features/account/components/ProfileForm";
import { glassPanelClass } from "@/features/home/components/homeTheme";
import { db } from "@/lib/db";
import { getTranslations } from "@/lib/i18n/server";
import { auth } from "@/lib/server/auth";
import { cn } from "@/lib/utils";

export default async function ProfilePage() {
  const session = await auth();
  const t = await getTranslations("ro"); // Default to Romanian

  let userData = {
    name: session?.user?.name || "",
    email: session?.user?.email || "",
  };

  try {
    if (session?.user?.id) {
      const user = await db.user.findUnique({
        where: { id: session.user.id },
        select: {
          name: true,
          email: true,
        },
      });
      if (user) {
        userData = {
          name: user.name || "",
          email: user.email || "",
        };
      }
    }
  } catch (error) {
    console.error("Error fetching user data:", error);
    // Continue with session data if database fetch fails
  }

  return (
    <div className="space-y-6 text-slate-100">
      <div
        className={cn(
          glassPanelClass,
          "flex items-center gap-3 border-white/10 bg-slate-900/70 px-5 py-4 text-slate-100 shadow-xl shadow-black/30"
        )}
      >
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-sky-200 shadow-inner shadow-white/10">
          <User className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{t("profile")}</h2>
          <p className="text-sm text-slate-300">{t("managePersonalInfo")}</p>
        </div>
      </div>
      <ProfileForm initialData={userData} />
    </div>
  );
}
