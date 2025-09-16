"use client";

import React from "react";

interface ValuePropositionSectionProps {
  t: (key: string, defaultValue?: string) => string;
}

function ValuePropositionSection({ t }: ValuePropositionSectionProps) {
  // Hormozi Style: Transformation-focused cards instead of feature-focused
  const cards = [
    {
      key: "transformation1",
      title: t("transformation1"),
      description: t("transformation1Desc"),
      image: "/images/category_banner_science_01.png",
      badge: "Transformare",
      icon: "📱➡️🧪", // Screen to Science
    },
    {
      key: "transformation2",
      title: t("transformation2"),
      description: t("transformation2Desc"),
      image: "/images/category_banner_engineering_01.png",
      badge: "Transformare",
      icon: "😰➡️😍", // Struggles to Love
    },
    {
      key: "transformation3",
      title: t("transformation3"),
      description: t("transformation3Desc"),
      image: "/images/category_banner_technology_01.png",
      badge: "Transformare",
      icon: "😴➡️🚀", // Bored to Inventor
    },
    {
      key: "social_proof",
      title: t("socialProofNumber") + " " + t("socialProofText"),
      description: t("successStory1"),
      image: "/images/blog_homepage_hero_01.png",
      badge: "Rezultat",
      icon: "⭐", // Success
    },
  ];

  return (
    <section className="py-8 sm:py-12 md:py-16 lg:py-20 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 text-gray-900">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Hormozi Style: Social proof in headline */}
        <div className="text-center mb-8 sm:mb-12">
          <span className="inline-block px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-semibold mb-4">
            Rezultate Dovedite
          </span>
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold mb-4 leading-tight">
            {t("whyChooseTechTots")}
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
            De la copii care urăsc matematica la viitori inventatori - iată
            transformările reale
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {cards.map((card, index) => (
            <div
              key={card.key}
              className="group relative w-full overflow-hidden rounded-2xl shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 bg-white border border-gray-100"
              aria-label={card.title}
              role="region"
            >
              {/* Transformation Icon */}
              <div className="absolute top-4 right-4 z-10">
                <span className="text-2xl sm:text-3xl">{card.icon}</span>
              </div>

              {/* Background Image */}
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${card.image})` }}
                aria-hidden="true"
              />
              <div
                className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-black/70"
                aria-hidden="true"
              />

              {/* Content */}
              <div className="relative flex min-h-[200px] sm:min-h-[240px] flex-col justify-end p-4 sm:p-6">
                {/* Badge */}
                <div className="mb-3 inline-flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-xs sm:text-sm font-semibold text-white/90 bg-white/20 px-2 py-1 rounded-full">
                    {card.badge}
                  </span>
                </div>

                {/* Card Content */}
                <div className="backdrop-blur-sm bg-white/10 hover:bg-white/20 transition-colors rounded-xl p-4 sm:p-5">
                  <h3 className="text-sm sm:text-base md:text-lg font-bold text-white drop-shadow-lg mb-2 leading-tight">
                    {card.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-white/90 leading-relaxed line-clamp-3">
                    {card.description}
                  </p>

                  {/* Success Indicator */}
                  <div className="mt-3 flex items-center gap-2 text-white/80">
                    <div className="h-5 w-5 rounded-full bg-green-400/20 backdrop-blur-sm flex items-center justify-center">
                      <svg
                        className="h-3 w-3 text-green-400"
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
                    <span className="text-xs sm:text-sm font-medium">
                      Rezultat Dovedit
                    </span>
                  </div>
                </div>
              </div>

              {/* Hover Effect Border */}
              <div className="absolute inset-0 ring-2 ring-transparent group-hover:ring-green-400/50 rounded-2xl transition-all duration-300" />
            </div>
          ))}
        </div>

        {/* Additional Social Proof */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-4 bg-white/80 backdrop-blur-sm rounded-2xl px-6 py-4 shadow-lg">
            <div className="flex -space-x-2">
              <div className="w-8 h-8 bg-green-400 rounded-full border-2 border-white"></div>
              <div className="w-8 h-8 bg-blue-400 rounded-full border-2 border-white"></div>
              <div className="w-8 h-8 bg-purple-400 rounded-full border-2 border-white"></div>
              <div className="w-8 h-8 bg-orange-400 rounded-full border-2 border-white"></div>
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-gray-900">
                {t("socialProofNumber")} {t("socialProofText")}
              </p>
              <p className="text-xs text-gray-600">În ultimele 6 luni</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ValuePropositionSection;
