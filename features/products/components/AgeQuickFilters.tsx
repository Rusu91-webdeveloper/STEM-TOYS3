"use client";

import React from "react";
import { useConversionTracking } from "@/hooks/useABTest";

interface AgeQuickFiltersProps {
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

export default function AgeQuickFilters({
  selectedAgeGroup,
  onSelectAgeGroup,
  t,
}: AgeQuickFiltersProps) {
  const { trackEvent } = useConversionTracking();

  return (
    <div className="container mx-auto px-2 sm:px-4 py-3 sm:py-5">
      <div className="bg-white/70 backdrop-blur shadow-sm rounded-xl p-3 sm:p-4 border border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
          <div className="text-sm sm:text-base font-semibold">
            {t("findPerfectToysForAge")}
          </div>
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-1.5 sm:gap-2">
            {AGE_OPTIONS.map(opt => {
              const isActive = selectedAgeGroup === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => {
                    onSelectAgeGroup(opt.id);
                    trackEvent("age_quick_filter_click", "products", {
                      label: opt.id,
                      element: "age-quick-filters",
                    });
                  }}
                  className={
                    "group flex items-center gap-2 px-2.5 py-1.5 sm:px-3 sm:py-1.5 text-xs sm:text-sm rounded-md border transition " +
                    (isActive
                      ? "bg-primary text-white border-primary"
                      : "bg-white text-gray-800 border-gray-200 hover:bg-gray-50")
                  }
                >
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-full ${opt.accent} bg-opacity-90`}
                    aria-hidden
                  >
                    <span className="text-sm">{opt.icon}</span>
                  </span>
                  <span className="min-w-0">
                    <span className="font-semibold">{t(opt.labelKey)}</span>
                    <span className="ml-1 text-[10px] text-gray-500 group-hover:text-gray-600">
                      {opt.short} {t("years", "yrs")}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
