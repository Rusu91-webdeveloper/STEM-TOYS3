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
        className="flex items-center gap-2 bg-white border-gray-200 hover:bg-gray-50 transition-colors min-w-[120px]"
      >
        <Globe className="h-4 w-4" />
        <span className="text-lg">{currentLang.flag}</span>
        <span className="hidden sm:inline text-sm font-medium">
          {currentLang.name}
        </span>
      </Button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-[9999]">
          {languages.map(lang => (
            <button
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center gap-3 ${
                currentLanguage === lang.code
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-700"
              } ${lang.code === languages[0].code ? "rounded-t-lg" : ""} ${
                lang.code === languages[languages.length - 1].code
                  ? "rounded-b-lg"
                  : ""
              }`}
            >
              <span className="text-lg">{lang.flag}</span>
              <span className="font-medium">{lang.name}</span>
              {currentLanguage === lang.code && (
                <span className="ml-auto text-blue-600">✓</span>
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
