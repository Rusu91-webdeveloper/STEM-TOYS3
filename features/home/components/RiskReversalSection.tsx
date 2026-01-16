"use client";

import React from "react";
import {
  glassCardClass,
  glassPanelClass,
} from "@/features/home/components/homeTheme";

interface RiskReversalSectionProps {
  t: (key: string, defaultValue?: string) => string;
}

// Hormozi Style Risk Reversal Section
// This component reduces purchase anxiety through guarantees, consultations, and trust elements
function RiskReversalSection({ t }: RiskReversalSectionProps) {
  const guaranteeFeatures = [
    {
      icon: "🛡️",
      title: "Calitate Garantată",
      description:
        "Produse testate și certificate care îndeplinesc standardele internaționale de siguranță",
    },
    {
      icon: "🎯",
      title: "Consultare Personalizată Gratuită",
      description:
        "Obține recomandări exacte pentru jucăriile perfecte pentru copilul tău",
    },
    {
      icon: "📞",
      title: "Suport Dedicat",
      description: "Echipa noastră de experți STEM te ghidează pas cu pas",
    },
    {
      icon: "🚚",
      title: "Livrare Rapidă",
      description: "Primiți jucăriile în 24-48 ore cu tracking complet",
    },
  ];

  return (
    <section className="py-4 sm:py-6 md:py-8">
      <div className="container mx-auto max-w-6xl px-4">
        <div className={`${glassPanelClass} space-y-5 p-4 sm:space-y-7 sm:p-6`}>
          {/* Main Risk Reversal Headline */}
          <div className="text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-emerald-200">
              Fără Riscuri
            </span>
            <h2 className="mt-4 bg-gradient-to-r from-emerald-200 via-sky-200 to-indigo-200 bg-clip-text text-xl font-bold text-transparent sm:text-3xl md:text-4xl lg:text-4xl">
              Începe Fără Nicio Îngrijorare
            </h2>
            {/* Replace long paragraph with concise bullets */}
            <ul className="mt-3 flex flex-wrap justify-center gap-2 text-[0.8rem] text-slate-200/80 sm:mt-4 sm:text-sm">
              <li className={`${glassCardClass} flex items-center gap-2 px-3 py-1`}>
                <span>🛡️</span>
                <span>{t("qualityGuaranteed", "Quality Guaranteed")}</span>
              </li>
              <li className={`${glassCardClass} flex items-center gap-2 px-3 py-1`}>
                <span>🎯</span>
                <span>{t("freeConsultation", "Free Consultation")}</span>
              </li>
              <li className={`${glassCardClass} flex items-center gap-2 px-3 py-1`}>
                <span>🚚</span>
                <span>Livrare Rapidă</span>
              </li>
            </ul>
          </div>

          {/* Guarantee Features Grid */}
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-4">
            {guaranteeFeatures.map((feature, index) => (
              <div
                key={index}
                className={`${glassCardClass} group relative flex flex-col items-center gap-2 rounded-2xl p-4 text-center transition hover:border-emerald-400/60 hover:shadow-emerald-500/20`}
              >
                <div
                  className="text-2xl sm:text-3xl transition-transform duration-300 group-hover:scale-110"
                  aria-hidden
                >
                  {feature.icon}
                </div>
                <h3 className="text-xs font-semibold text-white sm:text-sm">
                  {feature.title}
                </h3>
                <p className="text-[0.7rem] text-slate-200/70 sm:text-xs">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default React.memo(RiskReversalSection);
