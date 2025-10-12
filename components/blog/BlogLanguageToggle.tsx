"use client";

import { Globe } from "lucide-react";
import { useState, useRef, useEffect } from "react";

import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n";

interface BlogLanguageToggleProps {
  onLanguageChange: (language: "en" | "ro") => void;
  currentLanguage: "en" | "ro";
  className?: string;
}

export function BlogLanguageToggle({
  onLanguageChange,
  currentLanguage,
  className = "",
}: BlogLanguageToggleProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const languages = [
    { code: "en" as const, name: "English", flag: "🇬🇧" },
    { code: "ro" as const, name: "Română", flag: "🇷🇴" },
  ];

  const currentLang =
    languages.find(lang => lang.code === currentLanguage) || languages[0];

  const handleLanguageChange = (langCode: "en" | "ro") => {
    if (langCode !== currentLanguage) {
      onLanguageChange(langCode);
      setIsOpen(false);
    }
  };

  return (
    <div className={`relative inline-block ${className}`} ref={dropdownRef}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 sm:gap-1.5 md:gap-2 bg-white/90 backdrop-blur-sm border-gray-300 hover:bg-white/95 transition-all shadow-sm h-7 sm:h-8 md:h-9 px-2 sm:px-2.5 md:px-3 min-w-[60px] sm:min-w-[80px] md:min-w-[100px]"
      >
        <Globe className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 text-gray-700" />
        <span className="text-sm sm:text-base">{currentLang.flag}</span>
        <span className="hidden md:inline text-xs sm:text-sm font-medium text-gray-700">
          {currentLang.name}
        </span>
      </Button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-36 sm:w-44 md:w-48 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg shadow-lg z-[9999]">
          {languages.map(lang => (
            <button
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              className={`w-full px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 text-left hover:bg-gray-50 transition-colors flex items-center gap-2 sm:gap-3 ${
                currentLanguage === lang.code
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-700"
              } ${lang.code === languages[0].code ? "rounded-t-lg" : ""} ${
                lang.code === languages[languages.length - 1].code
                  ? "rounded-b-lg"
                  : ""
              }`}
            >
              <span className="text-base sm:text-lg">{lang.flag}</span>
              <span className="text-xs sm:text-sm md:text-base font-medium">
                {lang.name}
              </span>
              {currentLanguage === lang.code && (
                <span className="ml-auto text-blue-600 text-sm sm:text-base">
                  ✓
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Backdrop to close dropdown */}
      {isOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
      )}
    </div>
  );
}
