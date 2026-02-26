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
    accent: "bg-sky-100 text-sky-700",
  },
  {
    id: "MIDDLE_SCHOOL_9_12",
    labelKey: "age9to12H2",
    short: "9–12",
    icon: "🧠",
    accent: "bg-violet-100 text-violet-700",
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
    <div className="xl:hidden border-b border-slate-200/80 bg-[#fbf8f1]/95 backdrop-blur supports-[backdrop-filter]:bg-[#fbf8f1]/90">
      <div className="px-3 py-2">
        <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
          {t("shopByAge", "Shop by age")}
        </div>
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
                className={`flex-shrink-0 flex items-center gap-2 px-2.5 py-1.5 rounded-full text-xs font-medium transition-all border ${
                  isActive
                    ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                }`}
              >
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full border border-white/70 ${opt.accent}`}
                  aria-hidden
                >
                  <span className="text-xs">{opt.icon}</span>
                </span>
                <span className="whitespace-nowrap">
                  <span className="font-semibold">{t(opt.labelKey)}</span>
                  <span
                    className={`ml-1 text-[10px] ${
                      isActive ? "text-white/80" : "text-slate-500"
                    }`}
                  >
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
