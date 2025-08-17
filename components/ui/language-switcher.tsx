"use client";

import { Globe } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import React from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { languages, useTranslation } from "@/lib/i18n";

export function LanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const { language, setLanguage } = useTranslation();

  const switchLanguage = (langCode: string) => {
    if (language === langCode) return;

    // Update the language in the i18n context
    setLanguage(langCode);

    // Force a client-side re-render of the page
    // This approach doesn't trigger a full page refresh but updates the UI
    setTimeout(() => {
      router.refresh();
    }, 0);
  };

  // Find current language details
  const currentLanguage =
    languages.find(l => l.code === language) || languages[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-1.5 h-9 px-3 bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700 hover:border-indigo-700 shadow-sm transition-all cursor-pointer font-medium"
        >
          <Globe className="h-4 w-4" />
          <span className="hidden md:inline-block text-xs font-medium">
            {currentLanguage.flag} {currentLanguage.name}
          </span>
          <span className="inline-block md:hidden">{currentLanguage.flag}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-40 bg-white border border-gray-200 shadow-lg rounded-md p-1"
      >
        {languages.map(lang => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => switchLanguage(lang.code)}
            className={`cursor-pointer rounded-sm px-3 py-2 text-sm ${
              language === lang.code
                ? "font-medium bg-indigo-50 text-indigo-700"
                : "text-gray-700 hover:bg-gray-50"
            } transition-colors hover:text-indigo-600`}
          >
            <span className="mr-2 text-lg">{lang.flag}</span>
            {lang.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
