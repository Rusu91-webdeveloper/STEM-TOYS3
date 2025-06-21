// Server-side i18n helper functions
import { en } from "./translations/en";
import { ro } from "./translations/ro";

// Type for translation keys
export type TranslationKey = keyof typeof en;

// Simple translation function for server components
// Defaults to Romanian as the primary language
export async function getTranslations(
  language: string = "ro"
): Promise<(key: TranslationKey) => string> {
  return (key: TranslationKey): string => {
    if (language === "ro" && key in ro) {
      return ro[key as keyof typeof ro];
    }
    return en[key];
  };
}
