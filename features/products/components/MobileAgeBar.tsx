"use client";

import React from "react";

interface MobileAgeBarProps {
  selectedAgeGroup?:
    | "TODDLERS_1_3"
    | "PRESCHOOL_3_5"
    | "ELEMENTARY_6_8"
    | "MIDDLE_SCHOOL_9_12"
    | "TEENS_13_PLUS";
  onSelectAgeGroup: (
    ageGroup:
      | "PRESCHOOL_3_5"
      | "ELEMENTARY_6_8"
      | "MIDDLE_SCHOOL_9_12"
      | "TEENS_13_PLUS"
  ) => void;
  t: (key: string, fallback?: string) => string;
}

const AGE_OPTIONS: Array<{
  id:
    | "PRESCHOOL_3_5"
    | "ELEMENTARY_6_8"
    | "MIDDLE_SCHOOL_9_12"
    | "TEENS_13_PLUS";
  labelKey: string;
  short: string;
  icon: string;
  accent: string;
}> = [
  {
    id: "PRESCHOOL_3_5",
    labelKey: "age3to5H2",
    short: "3–5",
    icon: "🐣",
    accent: "bg-emerald-100 text-emerald-700",
  },
  {
    id: "ELEMENTARY_6_8",
    labelKey: "age6to8H2",
    short: "6–8",
    icon: "🎒",
    accent: "bg-indigo-100 text-indigo-700",
  },
  {
    id: "MIDDLE_SCHOOL_9_12",
    labelKey: "age9to12H2",
    short: "9–12",
    icon: "🧠",
    accent: "bg-fuchsia-100 text-fuchsia-700",
  },
  {
    id: "TEENS_13_PLUS",
    labelKey: "age13plusH2",
    short: "13+",
    icon: "🚀",
    accent: "bg-amber-100 text-amber-700",
  },
];

export default function MobileAgeBar({
  selectedAgeGroup,
  onSelectAgeGroup,
  t,
}: MobileAgeBarProps) {
  const scrollbarHideStyle = {
    scrollbarWidth: "none" as const,
    msOverflowStyle: "none" as const,
  };

  return (
    <div className="md:hidden bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 border-b border-gray-200">
      <div className="px-3 py-1.5">
        <div
          className="flex gap-1.5 overflow-x-auto pb-1"
          style={scrollbarHideStyle}
        >
          {AGE_OPTIONS.map(opt => {
            const isActive = selectedAgeGroup === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => onSelectAgeGroup(opt.id)}
                className={`flex-shrink-0 flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                  isActive
                    ? "bg-gray-900 text-white border-gray-900 shadow-sm"
                    : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                }`}
              >
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full ${opt.accent}`}
                  aria-hidden
                >
                  <span className="text-xs">{opt.icon}</span>
                </span>
                <span>
                  <span className="font-semibold">{t(opt.labelKey)}</span>
                  <span className="ml-1 text-[10px] text-gray-500">
                    {opt.short} {t("years", "yrs")}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
