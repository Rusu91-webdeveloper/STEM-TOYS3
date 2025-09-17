"use client";

import React from "react";
import Link from "next/link";

interface RiskReversalSectionProps {
  t: (key: string, defaultValue?: string) => string;
}

// Hormozi Style Risk Reversal Section
// This component reduces purchase anxiety through guarantees, consultations, and trust elements
function RiskReversalSection({ t }: RiskReversalSectionProps) {
  const guaranteeFeatures = [
    {
      icon: "🛡️",
      title: "Garanția STEM de 30 Zile",
      description:
        "Dacă copilul tău nu arată îmbunătățiri în 30 de zile, îți returnăm 100% banii",
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
    <section className="py-6 sm:py-8 md:py-10 lg:py-12 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 max-w-5xl">
        {/* Main Risk Reversal Headline */}
        <div className="text-center mb-4 sm:mb-6 md:mb-8">
          <span className="inline-block px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold mb-3">
            Fără Riscuri
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-gray-900 leading-tight">
            Începe Fără Nicio Îngrijorare
          </h2>
          {/* Replace long paragraph with concise bullets */}
          <ul className="flex flex-wrap justify-center gap-2 text-xs sm:text-sm text-gray-700 max-w-3xl mx-auto">
            <li className="inline-flex items-center gap-1 bg-white/80 border border-gray-200 rounded-full px-3 py-1">
              <span>🛡️</span>
              <span>{t("thirtyDayGuarantee", "30-Day Guarantee")}</span>
            </li>
            <li className="inline-flex items-center gap-1 bg-white/80 border border-gray-200 rounded-full px-3 py-1">
              <span>🎯</span>
              <span>{t("freeConsultation", "Free Consultation")}</span>
            </li>
            <li className="inline-flex items-center gap-1 bg-white/80 border border-gray-200 rounded-full px-3 py-1">
              <span>🚚</span>
              <span>Livrare Rapidă</span>
            </li>
          </ul>
        </div>

        {/* Guarantee Features Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          {guaranteeFeatures.map((feature, index) => (
            <div
              key={index}
              className="group relative bg-white rounded-lg p-3 sm:p-4 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105 border border-gray-100"
            >
              <div className="text-center">
                <div
                  className="text-2xl sm:text-3xl mb-2 sm:mb-3 group-hover:scale-110 transition-transform duration-300"
                  aria-hidden
                >
                  {feature.icon}
                </div>
                <h3 className="text-xs sm:text-sm font-bold text-gray-900 mb-1 sm:mb-2 leading-tight">
                  {feature.title}
                </h3>
                <p className="text-[10px] sm:text-xs text-gray-600 leading-tight line-clamp-1 sm:line-clamp-2">
                  {feature.description}
                </p>
              </div>

              {/* Hover Effect */}
              <div className="absolute inset-0 ring-1 ring-transparent group-hover:ring-blue-400/50 rounded-lg transition-all duration-300" />
            </div>
          ))}
        </div>

        {/* Simplified Consultation Booking Section */}
        <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 mb-6 sm:mb-8 border border-gray-100">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 mb-3">
              <span className="text-xl">🎯</span>
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                Consultare Gratuită
              </span>
            </div>

            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 leading-tight">
              Obține Recomandări Pentru Copilul Tău
            </h3>

            <p className="text-xs sm:text-sm text-gray-600 mb-4 max-w-md mx-auto">
              În 15 minute, expertul nostru STEM îți va recomanda jucăriile
              potrivite pentru copilul tău.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center mt-4">
              <Link
                href="/contact"
                className="flex items-center justify-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg text-xs sm:text-sm transition-colors"
              >
                <span className="mr-1">📅</span>
                Programează Consultare Gratuită
              </Link>

              <Link
                href="/products"
                className="flex items-center justify-center px-4 py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg text-xs sm:text-sm transition-colors"
              >
                Vezi Jucăriile
              </Link>
            </div>
          </div>
        </div>

        {/* Simplified Final Risk Reversal CTA */}
        <div className="text-center bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl p-4 sm:p-6 text-white">
          <h3 className="text-lg sm:text-xl font-bold mb-2 leading-tight">
            Începe Transformarea - Fără Riscuri
          </h3>
          <p className="text-xs sm:text-sm mb-3 sm:mb-4 text-white/90 max-w-md mx-auto">
            Dacă copilul tău nu arată îmbunătățiri în 30 de zile, îți returnăm
            100% banii.
          </p>

          <div className="flex gap-3 justify-center items-center">
            <Link
              href="/products"
              className="inline-flex items-center justify-center px-4 py-2 bg-white text-green-600 font-medium rounded-lg text-xs sm:text-sm"
            >
              <span className="mr-1">🚀</span>
              Începe Transformarea
            </Link>

            <div className="flex items-center gap-1 text-white/90">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-xs font-medium">Garanție 30 zile</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default React.memo(RiskReversalSection);
