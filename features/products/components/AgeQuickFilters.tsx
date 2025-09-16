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
}> = [
  { id: "PRESCHOOL_3_5", labelKey: "age3to5H2" },
  { id: "ELEMENTARY_6_8", labelKey: "age6to8H2" },
  { id: "MIDDLE_SCHOOL_9_12", labelKey: "age9to12H2" },
  { id: "TEENS_13_PLUS", labelKey: "age13plusH2" },
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
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
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
                    "px-2.5 py-1.5 sm:px-3 sm:py-1.5 text-xs sm:text-sm rounded-md border transition " +
                    (isActive
                      ? "bg-primary text-white border-primary"
                      : "bg-white text-gray-800 border-gray-200 hover:bg-gray-50")
                  }
                >
                  {t(opt.labelKey)}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
