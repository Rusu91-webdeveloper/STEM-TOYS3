// Server-side i18n helper functions
import { en } from "./translations/en";
import { ro } from "./translations/ro";

// Type for translation keys
export type TranslationKey = keyof typeof en;

// Simple translation function for server components
// Defaults to Romanian as the primary language
export function getTranslations(locale: string) {
  return (key: TranslationKey): string => {
    if (locale === "ro" && key in ro) {
      return String(ro[key as keyof typeof ro]);
    }
    return String(en[key]);
  };
}
