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
    <section className="py-12 sm:py-16 md:py-20 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Main Risk Reversal Headline */}
        <div className="text-center mb-12 sm:mb-16">
          <span className="inline-block px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold mb-4">
            Fără Riscuri
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-6 text-gray-900 leading-tight">
            Începe Fără Nicio Îngrijorare
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
            Vrem să fii 100% încrezător că alegerea ta este corectă. De aceea
            îți oferim cea mai puternică garanție din industrie.
          </p>
        </div>

        {/* Guarantee Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 mb-12 sm:mb-16">
          {guaranteeFeatures.map((feature, index) => (
            <div
              key={index}
              className="group relative bg-white rounded-2xl p-6 sm:p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-gray-100"
            >
              <div className="text-center">
                <div className="text-4xl sm:text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 leading-tight">
                  {feature.title}
                </h3>
                <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>

              {/* Hover Effect */}
              <div className="absolute inset-0 ring-2 ring-transparent group-hover:ring-blue-400/50 rounded-2xl transition-all duration-300" />
            </div>
          ))}
        </div>

        {/* Consultation Booking Section */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 sm:p-12 mb-12 sm:mb-16 border border-gray-100">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 items-center">
            {/* Left Side - Consultation Info */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">🎯</span>
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
                  Consultare Gratuită
                </span>
              </div>

              <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4 leading-tight">
                Obține Recomandări Perfecte Pentru Copilul Tău
              </h3>

              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                În 15 minute, expertul nostru STEM îți va recomanda exact
                jucăriile potrivite pentru vârsta, interesele și nivelul
                copilului tău.
              </p>

              <div className="space-y-3 mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-green-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <span className="text-gray-700 font-medium">
                    Evaluare personalizată a copilului
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-green-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <span className="text-gray-700 font-medium">
                    Lista exactă de jucării recomandate
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-green-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <span className="text-gray-700 font-medium">
                    Plan de dezvoltare personalizat
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                >
                  <span className="mr-2">📅</span>
                  Programează Consultarea Gratuită
                  <svg
                    className="ml-2 w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                    />
                  </svg>
                </Link>

                <Link
                  href="/products"
                  className="inline-flex items-center justify-center px-8 py-4 bg-white border-2 border-gray-300 hover:border-green-500 text-gray-700 hover:text-green-600 font-semibold rounded-xl transition-all duration-300"
                >
                  Vezi Jucăriile
                </Link>
              </div>
            </div>

            {/* Right Side - Testimonials */}
            <div className="space-y-6">
              <h4 className="text-xl font-bold text-gray-900 mb-6">
                Ce Spun Părinții Care Au Încercat:
              </h4>

              {testimonials.map((testimonial, index) => (
                <div
                  key={index}
                  className="bg-gray-50 rounded-2xl p-6 border border-gray-100"
                >
                  <div className="flex items-center gap-1 mb-3">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <svg
                        key={i}
                        className="w-5 h-5 text-yellow-400"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <p className="text-gray-700 italic mb-4 leading-relaxed">
                    "{testimonial.story}"
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                      {testimonial.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {testimonial.name}
                      </p>
                      <p className="text-sm text-gray-600">
                        {testimonial.location}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Final Risk Reversal CTA */}
        <div className="text-center bg-gradient-to-r from-green-600 to-emerald-600 rounded-3xl p-8 sm:p-12 text-white">
          <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 leading-tight">
            Începe Transformarea Astăzi - Fără Riscuri
          </h3>
          <p className="text-lg sm:text-xl mb-8 text-white/90 max-w-3xl mx-auto">
            Dacă copilul tău nu arată îmbunătățiri în 30 de zile, îți returnăm
            100% banii. Nu există întrebări, nu există probleme.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/products"
              className="inline-flex items-center justify-center px-8 py-4 bg-white text-green-600 hover:bg-gray-50 font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              <span className="mr-2">🚀</span>
              Începe Transformarea Acum
              <svg
                className="ml-2 w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                />
              </svg>
            </Link>

            <div className="flex items-center gap-2 text-white/80">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-sm font-medium">Garanție 30 zile</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default React.memo(RiskReversalSection);
