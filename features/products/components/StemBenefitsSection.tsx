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
                className="rounded-lg border border-white/12 bg-slate-950/40 p-1.5 sm:p-2 shadow-sm shadow-indigo-900/20 hover:shadow-indigo-500/30 transition-shadow flex flex-col items-center text-center backdrop-blur"
              >
                <div className="p-0.5 sm:p-1 rounded-full bg-gradient-to-br from-indigo-500/40 to-sky-500/40 text-slate-100 mb-0.5 sm:mb-1 shadow-sm shadow-indigo-500/30">
                  <BenefitIcon className="h-2.5 w-2.5 sm:h-4 sm:w-4" />
                </div>
                <h3 className="font-bold text-xs mb-0.5 text-slate-100">
                  {t(benefit.titleKey)}
                </h3>
                <p className="text-slate-300 text-xs leading-tight">
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
