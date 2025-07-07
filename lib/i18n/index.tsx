"use client";

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
}

// Provider component to wrap the app with
export function I18nProvider({ children }: I18nProviderProps) {
  const [language, setLanguage] = useState("ro");

  // On mount, try to get the language from localStorage
  useEffect(() => {
    const storedLang =
      typeof window !== "undefined" ? localStorage.getItem("language") : null;

    if (storedLang && languages.some(lang => lang.code === storedLang)) {
      setLanguage(storedLang);
    } else {
      // If no stored language or invalid language, set to Romanian
      setLanguage("ro");
      if (typeof window !== "undefined") {
        localStorage.setItem("language", "ro");
      }
    }
  }, []);

  // When language changes, update localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("language", language);
    }
  }, [language]);

  // Translation function
  const t = (key: string, defaultValue?: string): string => {
    const currentTranslations =
      translations[language as keyof typeof translations];

    if (currentTranslations && key in currentTranslations) {
      return (currentTranslations as any)[key];
    }

    if (translations.en && key in translations.en) {
      return (translations.en as any)[key];
    }

    if (process.env.NODE_ENV !== "production") {
      console.warn(
        `Missing translation for key: '${key}' in language: '${language}'`
      );
    }
    return defaultValue || String(key);
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

// Export the I18nContextType for use in other components
export type { I18nContextType, TranslationKey };
