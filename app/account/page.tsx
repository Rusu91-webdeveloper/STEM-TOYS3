import { User } from "lucide-react";
import React from "react";

import { ProfileForm } from "@/features/account/components/ProfileForm";
import { auth } from "@/lib/server/auth";
import { db } from "@/lib/db";
import { getTranslations } from "@/lib/i18n/server";

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
    <div className="space-y-6">
      <div className="flex items-center gap-3 pb-2 border-b border-gray-200/70">
        <div className="p-2 rounded-full bg-primary/10 backdrop-blur-sm">
          <User className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            {t("profile")}
          </h2>
          <p className="text-muted-foreground">{t("managePersonalInfo")}</p>
        </div>
      </div>
      <ProfileForm initialData={userData} />
    </div>
  );
}
