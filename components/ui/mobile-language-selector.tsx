"use client";

import { getCookie } from "cookies-next";
import { Globe } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";

// Define languages locally to ensure they're always available
const languages = [
  { code: "ro", name: "Română", flag: "🇷🇴" },
  { code: "en", name: "English", flag: "🇬🇧" },
];

export function MobileLanguageSelector() {
  const router = useRouter();
  const [currentLangCode, setCurrentLangCode] = useState("ro");

  // Use the translation context
  const { language: contextLanguage, setLanguage: contextSetLanguage } =
    useTranslation();

  useEffect(() => {
    // Try to get language from cookie
    const storedLang = getCookie("language") as string;
    if (storedLang && languages.some(l => l.code === storedLang)) {
      setCurrentLangCode(storedLang);
    }
  }, []);

  const language = contextLanguage ?? currentLangCode;
  const setLanguage =
    contextSetLanguage ??
    ((lang: string) => {
      setCurrentLangCode(lang);
    });

  const switchLanguage = (langCode: string) => {
    if (language === langCode) return;

    // Update the language in the i18n context
    setLanguage(langCode);

    // Force a refresh to update all components
    router.refresh();
  };

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 mb-2 px-1">
        <div className="p-0.5 rounded bg-indigo-50">
          <Globe className="h-3 w-3 text-indigo-600" />
        </div>
        <span className="text-[10px] font-semibold text-gray-700 uppercase tracking-wider">
          Language
        </span>
      </div>
      <div className="flex gap-2">
        {languages.map(lang => {
          const isActive = language === lang.code;
          return (
            <button
              key={lang.code}
              type="button"
              onClick={() => switchLanguage(lang.code)}
              className={cn(
                "flex-1 flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 min-h-[52px] touch-target border-2 relative",
                isActive
                  ? "bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow-md border-indigo-400"
                  : "bg-white text-gray-700 hover:bg-gray-50 active:bg-gray-100 border-gray-200 hover:border-indigo-200 shadow-sm"
              )}
            >
              <span className="text-xl">{lang.flag}</span>
              <span className="text-[10px] font-bold tracking-wide">
                {lang.code.toUpperCase()}
              </span>
              {isActive && (
                <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-green-400 rounded-full border border-white"></div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
