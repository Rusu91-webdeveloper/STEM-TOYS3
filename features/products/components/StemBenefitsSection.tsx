"use client";

import { LucideIcon } from "lucide-react";
import React from "react";

interface StemBenefit {
  icon: LucideIcon;
  titleKey: string;
  descKey: string;
}

interface StemBenefitsSectionProps {
  stemBenefits: StemBenefit[];
  activeCategory: { id: string; label: string } | null;
  t: (key: string, fallback?: string) => string;
}

export function StemBenefitsSection({
  stemBenefits,
  activeCategory,
  t,
}: StemBenefitsSectionProps) {
  // Only show when no category is selected
  if (activeCategory) {
    return null;
  }

  return (
    <div className="hidden sm:block py-2 sm:py-4">
      <div className="container mx-auto px-2 sm:px-4">
        <h2 className="text-sm sm:text-base font-bold text-center mb-2 sm:mb-3 text-slate-100">
          {t("whyStemEssential")}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5 sm:gap-2">
          {stemBenefits.map((benefit, index) => {
            const BenefitIcon = benefit.icon;
            return (
              <div
                key={index}
                className="rounded-2xl border border-white/25 bg-white/15 p-2 sm:p-3 shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 flex flex-col items-center text-center backdrop-blur-lg"
              >
                <div className="p-1 sm:p-1.5 rounded-full bg-gradient-to-br from-white/40 to-white/10 text-slate-900 mb-1 sm:mb-1.5 border border-white/30 shadow-sm">
                  <BenefitIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                </div>
                <h3 className="font-bold text-xs mb-0.5 text-slate-900">
                  {t(benefit.titleKey)}
                </h3>
                <p className="text-slate-800 text-[11px] sm:text-xs leading-tight">
                  {t(benefit.descKey)}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
