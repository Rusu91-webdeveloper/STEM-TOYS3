"use client";

import React from "react";
import Link from "next/link";
import {
  glassCardClass,
  glassPanelClass,
  gradientButtonClass,
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

  const testimonials = [
    {
      name: "Maria P.",
      location: "București",
      story:
        "În prima săptămână, fiul meu a trecut de la 'urăsc matematica' la 'când facem următorul experiment?'. Garanția m-a făcut să încerc fără teamă!",
      rating: 5,
    },
    {
      name: "Alexandru M.",
      location: "Cluj-Napoca",
      story:
        "Consultarea gratuită a fost exact ce aveam nevoie. Am primit recomandări perfecte pentru vârsta fiicei mele. Rezultatul? Ea îmi explică acum cum funcționează roboții!",
      rating: 5,
    },
  ];

  return (
    <section className="py-10 sm:py-12 md:py-14">
      <div className="container mx-auto max-w-6xl px-4">
        <div className={`${glassPanelClass} space-y-8 p-6 sm:p-8`}>
          {/* Main Risk Reversal Headline */}
          <div className="text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-emerald-200">
              Fără Riscuri
            </span>
            <h2 className="mt-4 bg-gradient-to-r from-emerald-200 via-sky-200 to-indigo-200 bg-clip-text text-2xl font-bold text-transparent sm:text-3xl md:text-4xl lg:text-5xl">
              Începe Fără Nicio Îngrijorare
            </h2>
            {/* Replace long paragraph with concise bullets */}
            <ul className="mt-4 flex flex-wrap justify-center gap-2 text-xs text-slate-200/80 sm:text-sm">
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
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
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

          {/* Consultation Booking Section */}
          <div className={`${glassPanelClass} border-white/15 p-6 sm:p-8`}>
            <div className="text-center">
              <div className="inline-flex items-center gap-2">
                <span className="text-xl">🎯</span>
                <span className="rounded-full border border-emerald-300/40 bg-emerald-400/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-100">
                  Consultare Gratuită
                </span>
              </div>

              <h3 className="mt-4 text-lg font-bold text-white sm:text-xl">
                Obține Recomandări Pentru Copilul Tău
              </h3>

              <p className="mt-3 text-xs text-slate-200/80 sm:text-sm">
                În 15 minute, expertul nostru STEM îți va recomanda jucăriile
                potrivite pentru copilul tău.
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
                <Link
                  href="/contact"
                  className={`${gradientButtonClass} inline-flex items-center justify-center gap-2 px-5 py-2 text-xs font-semibold sm:text-sm`}
                >
                  <span>📅</span>
                  Programează Consultare Gratuită
                </Link>

                <Link
                  href="/products"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-5 py-2 text-xs font-semibold text-white/90 transition hover:border-white/30 hover:bg-white/15 sm:text-sm"
                >
                  Vezi Jucăriile
                </Link>
              </div>
            </div>
          </div>

          {/* Final Risk Reversal CTA */}
          <div className="rounded-3xl border border-emerald-400/40 bg-gradient-to-r from-emerald-500/40 via-sky-500/30 to-indigo-500/40 p-6 text-center text-white shadow-lg shadow-emerald-500/25 sm:p-8">
            <h3 className="text-lg font-bold sm:text-xl">
              Începe Transformarea Copilului Tău
            </h3>
            <p className="mt-3 text-xs text-white/85 sm:text-sm">
              Alătură-te miilor de părinți care au transformat învățarea copiilor
              lor cu jucăriile noastre STEM de calitate.
            </p>

            <div className="mt-5 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/products"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-2 text-xs font-semibold text-emerald-600 transition hover:bg-white/90 sm:text-sm"
              >
                <span>🚀</span>
                Începe Transformarea
              </Link>

              <div className="flex items-center gap-2 text-white/85">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-xs font-medium">Calitate Garantată</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default React.memo(RiskReversalSection);
