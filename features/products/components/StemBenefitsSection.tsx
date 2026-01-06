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

// Color schemes for each benefit card
const benefitColorSchemes = [
  {
    // Cognitive Development - Blue/Indigo
    gradient: "from-blue-500/20 via-indigo-500/15 to-blue-600/20",
    iconBg: "from-blue-500 to-indigo-600",
    iconText: "text-blue-100",
    border: "border-blue-400/30",
    hoverBorder: "hover:border-blue-400/50",
    glow: "hover:shadow-blue-500/20",
    titleGradient: "from-blue-200 to-indigo-200",
  },
  {
    // Creativity and Innovation - Purple/Pink
    gradient: "from-purple-500/20 via-pink-500/15 to-purple-600/20",
    iconBg: "from-purple-500 to-pink-600",
    iconText: "text-purple-100",
    border: "border-purple-400/30",
    hoverBorder: "hover:border-purple-400/50",
    glow: "hover:shadow-purple-500/20",
    titleGradient: "from-purple-200 to-pink-200",
  },
  {
    // Prepare for the Future - Orange/Amber
    gradient: "from-orange-500/20 via-amber-500/15 to-orange-600/20",
    iconBg: "from-orange-500 to-amber-600",
    iconText: "text-orange-100",
    border: "border-orange-400/30",
    hoverBorder: "hover:border-orange-400/50",
    glow: "hover:shadow-orange-500/20",
    titleGradient: "from-orange-200 to-amber-200",
  },
  {
    // Fun Learning - Green/Emerald
    gradient: "from-emerald-500/20 via-teal-500/15 to-emerald-600/20",
    iconBg: "from-emerald-500 to-teal-600",
    iconText: "text-emerald-100",
    border: "border-emerald-400/30",
    hoverBorder: "hover:border-emerald-400/50",
    glow: "hover:shadow-emerald-500/20",
    titleGradient: "from-emerald-200 to-teal-200",
  },
];

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
    <div className="relative py-6 sm:py-8 md:py-10 overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-indigo-950/40 to-slate-950" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(56,189,248,0.08),transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(168,85,247,0.08),transparent_60%)]" />
      
      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-4 sm:mb-6 md:mb-7">
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-slate-100 via-indigo-100 to-purple-100 bg-clip-text text-transparent mb-2">
            {t("whyStemEssential")}
          </h2>
          <div className="w-16 h-0.5 mx-auto bg-gradient-to-r from-transparent via-indigo-400 to-transparent rounded-full" />
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
          {stemBenefits.map((benefit, index) => {
            const BenefitIcon = benefit.icon;
            const colorScheme = benefitColorSchemes[index] || benefitColorSchemes[0];
            
            return (
              <div
                key={index}
                className={`group relative rounded-xl sm:rounded-2xl border ${colorScheme.border} ${colorScheme.hoverBorder} bg-gradient-to-br ${colorScheme.gradient} p-3 sm:p-4 md:p-4 shadow-lg ${colorScheme.glow} transition-all duration-500 hover:-translate-y-1.5 hover:scale-[1.02] flex flex-col items-center text-center backdrop-blur-xl overflow-hidden`}
              >
                {/* Animated background gradient on hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${colorScheme.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                
                {/* Decorative corner accent */}
                <div className={`absolute top-0 right-0 w-14 h-14 bg-gradient-to-br ${colorScheme.iconBg} opacity-5 group-hover:opacity-10 rounded-bl-full transition-opacity duration-500`} />
                
                {/* Icon container with dynamic gradient */}
                <div className={`relative z-10 mb-2 sm:mb-3 p-2 sm:p-3 rounded-xl bg-gradient-to-br ${colorScheme.iconBg} ${colorScheme.iconText} shadow-xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}>
                  <BenefitIcon className="h-4 w-4 sm:h-5 sm:w-5 md:h-5 md:w-5" />
                  {/* Icon glow effect */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${colorScheme.iconBg} opacity-50 blur-xl group-hover:opacity-75 transition-opacity duration-500`} />
                </div>
                
                {/* Title with gradient text */}
                <h3 className={`relative z-10 font-bold text-xs sm:text-sm md:text-base mb-1.5 sm:mb-2 bg-gradient-to-r ${colorScheme.titleGradient} bg-clip-text text-transparent group-hover:scale-105 transition-transform duration-300`}>
                  {t(benefit.titleKey)}
                </h3>
                
                {/* Description */}
                <p className="relative z-10 text-slate-300 text-[10px] sm:text-xs leading-relaxed group-hover:text-slate-200 transition-colors duration-300">
                  {t(benefit.descKey)}
                </p>
                
                {/* Bottom accent line */}
                <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r ${colorScheme.iconBg} opacity-0 group-hover:opacity-60 transition-opacity duration-500`} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
