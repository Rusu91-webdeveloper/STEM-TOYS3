"use client";

import { Globe } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";


// Define languages locally to ensure they're always available
const languages = [
  { code: "ro", name: "Română", flag: "🇷🇴" },
  { code: "en", name: "English", flag: "🇬🇧" },
];

export function LanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const [currentLangCode, setCurrentLangCode] = useState("ro");
  const [isClient, setIsClient] = useState(false);

  // Try to use the translation context - hooks must be called unconditionally at top level
  let contextLanguage, contextSetLanguage;
  try {
    const { useTranslation } = require("@/lib/i18n");
    const translationContext = useTranslation();
    contextLanguage = translationContext.language;
    contextSetLanguage = translationContext.setLanguage;
  } catch (error) {
    // If the context is not available, silently continue with local state
    contextLanguage = null;
    contextSetLanguage = null;
  }

  useEffect(() => {
    setIsClient(true);
    // Try to get language from localStorage
    if (typeof window !== "undefined") {
      const storedLang = localStorage.getItem("language");
      if (storedLang && languages.some((l) => l.code === storedLang)) {
        setCurrentLangCode(storedLang);
      }
    }
  }, []);

  const language = contextLanguage || currentLangCode;
  const setLanguage =
    contextSetLanguage ||
    ((lang: string) => {
      setCurrentLangCode(lang);
      if (typeof window !== "undefined") {
        localStorage.setItem("language", lang);
      }
    });

  const switchLanguage = (langCode: string) => {
    // Update the language in the i18n context
    setLanguage(langCode);

    // Force a refresh to update all components
    router.refresh();
  };

  // Find current language details
  const currentLanguage =
    languages.find((l) => l.code === language) || languages[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center gap-1 h-8 px-2">
          <Globe className="h-4 w-4" />
          <span className="hidden md:inline-block text-xs">
            {currentLanguage.flag} {currentLanguage.name}
          </span>
          <span className="inline-block md:hidden">{currentLanguage.flag}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => switchLanguage(lang.code)}
            className={`cursor-pointer ${language === lang.code ? "font-bold bg-accent" : ""}`}>
            <span className="mr-2">{lang.flag}</span>
            {lang.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
