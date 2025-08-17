import { getTranslations } from "@/lib/i18n/server";

export async function generateMetadata() {
  const t = await getTranslations("ro");
  return {
    title: `${t("account")} | NextCommerce`,
  };
}
