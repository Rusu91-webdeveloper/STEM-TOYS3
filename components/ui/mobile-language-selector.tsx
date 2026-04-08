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
  const {
    language: contextLanguage,
    setLanguage: contextSetLanguage,
    t,
  } =
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
    <div className="w-full space-y-3">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
          <Globe className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-900">
            {t("language", "Limbă")}
          </p>
          <p className="text-xs text-slate-500">
            {t("languageSelectorDescription", "Alege experiența preferată")}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {languages.map(lang => {
          const isActive = language === lang.code;
          return (
            <button
              key={lang.code}
              type="button"
              onClick={() => switchLanguage(lang.code)}
              className={cn(
                "relative flex min-h-[72px] flex-col items-center justify-center gap-1.5 rounded-[1rem] border px-3 py-3 text-sm font-medium transition-all duration-200 touch-target",
                isActive
                  ? "border-sky-200 bg-sky-50 text-sky-900 shadow-[0_16px_32px_-28px_rgba(2,132,199,0.35)]"
                  : "border-slate-200 bg-slate-50/80 text-slate-700 hover:border-slate-300 hover:bg-slate-50"
              )}
            >
              <span className="text-xl leading-none">{lang.flag}</span>
              <span className="text-[11px] font-semibold tracking-[0.2em] text-current/80">
                {lang.code.toUpperCase()}
              </span>
              <span className="text-xs text-current/70">{lang.name}</span>
              {isActive && (
                <div className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-sky-600 text-white">
                  <span className="h-1.5 w-1.5 rounded-full bg-white"></span>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
