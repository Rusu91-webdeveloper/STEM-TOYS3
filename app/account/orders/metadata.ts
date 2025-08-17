import { getTranslations } from "@/lib/i18n/server";

export async function generateMetadata() {
  const t = await getTranslations("ro"); // Default to Romanian

  return {
    title: `${t("orders")} | ${t("account")}`,
  };
}
