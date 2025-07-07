import React from "react";

import { AccountSettings } from "@/features/account/components/AccountSettings";
import { auth } from "@/lib/auth";
import { getTranslations } from "@/lib/i18n/server";

export async function generateMetadata() {
  const t = await getTranslations("ro"); // Default to Romanian

  return {
    title: `${t("settings")} | ${t("account")}`,
    description: t("manageAccountSettings"),
  };
}

export default async function SettingsPage() {
  const session = await auth();
  const t = await getTranslations("ro"); // Default to Romanian

  if (!session?.user) {
    // This should never happen since layout handles auth check
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">
          {t("settings")}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t("manageAccountSettings")}
        </p>
      </div>
      <AccountSettings />
    </div>
  );
}
