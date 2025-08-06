"use client";

import { getCookie } from "cookies-next";
import { Globe } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslation } from "@/lib/i18n";

// Define languages locally to ensure they're always available
const languages = [
  { code: "ro", name: "Română", flag: "🇷🇴" },
  { code: "en", name: "English", flag: "🇬🇧" },
];

export function LanguageSwitcher() {
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
    // Update the language in the i18n context
    setLanguage(langCode);

    // Force a refresh to update all components
    router.refresh();
  };

  // Find current language details
  const currentLanguage =
    languages.find(l => l.code === language) ?? languages[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center gap-1 h-8 px-2 touch-target"
        >
          <Globe className="h-4 w-4" />
          <span className="hidden md:inline-block text-xs">
            {currentLanguage.flag} {currentLanguage.name}
          </span>
          <span className="inline-block md:hidden">{currentLanguage.flag}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map(lang => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => switchLanguage(lang.code)}
            className={`cursor-pointer ${language === lang.code ? "font-bold bg-accent" : ""}`}
          >
            <span className="mr-2">{lang.flag}</span>
            {lang.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
