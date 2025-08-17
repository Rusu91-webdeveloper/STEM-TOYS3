// Server-side i18n helper functions
import { en } from "./translations/en";
import { ro } from "./translations/ro";

// Type for translation keys
export type TranslationKey = keyof typeof en;

// Simple translation function for server components
// Defaults to Romanian as the primary language
export function getTranslations(
  language: string = "ro"
): (key: TranslationKey) => string {
  return (key: TranslationKey): string => {
    if (language === "ro" && key in ro) {
      return ro[key as keyof typeof ro];
    }
    return en[key];
  };
}

// Synchronous version for direct use in server components
export function getTranslation(language: string = "ro") {
  return (key: TranslationKey): string => {
    if (language === "ro" && key in ro) {
      return ro[key as keyof typeof ro];
    }
    return en[key];
  };
}
