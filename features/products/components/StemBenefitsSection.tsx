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
    <div className="bg-white py-6 sm:py-8">
      <div className="container mx-auto px-4">
        <h2 className="text-lg sm:text-xl font-bold text-center mb-4 sm:mb-6">
          {t("whyStemEssential")}
        </h2>
        <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {stemBenefits.map((benefit, index) => {
            const BenefitIcon = benefit.icon;
            return (
              <div
                key={index}
                className="bg-gray-50 rounded-xl p-3 sm:p-4 shadow-sm hover:shadow-md transition-shadow border border-gray-100 flex flex-col items-center text-center"
              >
                <div className="p-1.5 sm:p-2 rounded-full bg-primary/10 text-primary mb-1.5 sm:mb-2">
                  <BenefitIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <h3 className="font-bold text-xs sm:text-sm mb-1">
                  {t(benefit.titleKey)}
                </h3>
                <p className="text-gray-600 text-xs">{t(benefit.descKey)}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
