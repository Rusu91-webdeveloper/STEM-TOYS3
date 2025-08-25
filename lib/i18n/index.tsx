"use client";

import { getCookie, setCookie } from "cookies-next";
import React, {
  useState,
  useEffect,
  createContext,
  useContext,
  ReactNode,
} from "react";

import { translations, TranslationKey } from "./translations";

// Define available languages
export const languages = [
  { code: "ro", name: "Română", flag: "🇷🇴" },
  { code: "en", name: "English", flag: "🇬🇧" },
];

// Create a context to store the current language and translations
type I18nContextType = {
  language: string;
  locale: string;
  setLanguage: (lang: string) => void;
  t: (key: string, defaultValue?: string) => string;
};

const I18nContext = createContext<I18nContextType>({
  language: "ro",
  locale: "ro",
  setLanguage: () => {},
  t: () => "",
});

interface I18nProviderProps {
  children: ReactNode;
  initialLanguage?: string;
}

// Provider component to wrap the app with
export function I18nProvider({
  children,
  initialLanguage = "ro", // Default to Romanian
}: I18nProviderProps) {
  const [language, setLanguageState] = useState(initialLanguage);

  // On mount, try to get the language from cookie
  useEffect(() => {
    const storedLang = getCookie("language") as string;

    if (storedLang && languages.some(lang => lang.code === storedLang)) {
      setLanguageState(storedLang);
    } else {
      // If no stored language or invalid language, set to Romanian
      setLanguageState("ro");
      setCookie("language", "ro");
    }
  }, []);

  // When language changes, update cookie
  const setLanguage = (lang: string) => {
    if (languages.some(l => l.code === lang)) {
      setLanguageState(lang);
      setCookie("language", lang);
    }
  };

  // Translation function
  const t = (key: string, defaultValue?: string): string => {
    const currentTranslations =
      translations[language as keyof typeof translations];

    if (currentTranslations && key in currentTranslations) {
      return (currentTranslations as Record<string, string>)[key];
    }

    if (translations.en && key in translations.en) {
      return (translations.en as Record<string, string>)[key];
    }

    if (process.env.NODE_ENV !== "production") {
      console.warn(
        `Missing translation for key: '${key}' in language: '${language}'`
      );
    }
    return defaultValue ?? String(key);
  };

  const value: I18nContextType = {
    language,
    locale: language,
    setLanguage,
    t,
  };

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

// Hook to use translations
export function useTranslation() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useTranslation must be used within an I18nProvider");
  }
  return context;
}

// Server-side translation function
export function getTranslations(language: string = "ro") {
  const currentTranslations =
    translations[language as keyof typeof translations];

  return {
    t: (key: string, defaultValue?: string): string => {
      if (currentTranslations && key in currentTranslations) {
        return (currentTranslations as Record<string, string>)[key];
      }

      if (translations.en && key in translations.en) {
        return (translations.en as Record<string, string>)[key];
      }

      return defaultValue ?? String(key);
    },
    language,
  };
}

// Export the I18nContextType for use in other components
export type { I18nContextType, TranslationKey };
