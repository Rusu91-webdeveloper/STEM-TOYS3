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
}> = [
  { id: "PRESCHOOL_3_5", labelKey: "age3to5H2" },
  { id: "ELEMENTARY_6_8", labelKey: "age6to8H2" },
  { id: "MIDDLE_SCHOOL_9_12", labelKey: "age9to12H2" },
  { id: "TEENS_13_PLUS", labelKey: "age13plusH2" },
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
                className={`flex-shrink-0 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                  isActive
                    ? "bg-gray-900 text-white border-gray-900 shadow-sm"
                    : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                }`}
              >
                {t(opt.labelKey)}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
