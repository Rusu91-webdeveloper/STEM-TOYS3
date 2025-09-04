"use client";

import React from "react";

interface ValuePropositionSectionProps {
  t: (key: string, defaultValue?: string) => string;
}

function ValuePropositionSection({ t }: ValuePropositionSectionProps) {
  const cards = [
    {
      key: "cognitive",
      title: t("cognitiveDevelopment"),
      description: t("cognitiveDevelopmentDesc"),
      image: "/images/category_banner_science_01.png",
      badge: t("features", "Features"),
    },
    {
      key: "quality",
      title: t("qualitySafety", "Quality & Safety"),
      description: t(
        "qualitySafetyDesc",
        "All our products meet or exceed safety standards and are built to last."
      ),
      image: "/images/category_banner_engineering_01.png",
      badge: t("features", "Features"),
    },
    {
      key: "future",
      title: t("futureReady"),
      description: t("futureReadyDesc"),
      image: "/images/category_banner_technology_01.png",
      badge: t("features", "Features"),
    },
    {
      key: "b2b",
      title: t("b2bSolutions", "B2B Programs"),
      description: t(
        "b2bSolutionsDesc",
        "Wholesale pricing, bulk orders, and partnerships for schools and businesses."
      ),
      image: "/images/blog_homepage_hero_01.png",
      badge: t("programs", "Programs"),
    },
  ];

  return (
    <section className="py-3 sm:py-10 md:py-16 bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300 text-gray-900">
      <div className="container mx-auto px-4 max-w-7xl">
        <h2 className="text-sm xs:text-lg sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-6 md:mb-8 text-center">
          {t("whyChooseTechTots")}
        </h2>

        <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-y-3 sm:gap-y-6 gap-x-4 sm:gap-x-6 md:gap-x-8">
          {cards.map(card => (
            <div
              key={card.key}
              className="group relative w-full overflow-hidden rounded-2xl shadow-md transition-all duration-500 hover:shadow-2xl focus-within:ring-2 focus-within:ring-white/80"
              aria-label={card.title}
              role="region"
            >
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${card.image})` }}
                aria-hidden="true"
              />
              <div
                className="absolute inset-0 bg-gradient-to-b from-black/25 via-black/50 to-black/80"
                aria-hidden="true"
              />

              <div className="relative flex min-h-[140px] xs:min-h-[180px] sm:min-h-[260px] md:min-h-[300px] flex-col justify-end p-4 xs:p-5 sm:p-6">
                <div className="mb-2 inline-flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_0_3px_rgba(16,185,129,0.35)]" />
                  <span className="text-[10px] xs:text-xs tracking-wider uppercase text-white/90">
                    {card.badge}
                  </span>
                </div>

                <div className="w-full max-w-[98%] backdrop-blur-sm bg-black/40 hover:bg-black/50 transition-colors rounded-xl px-3.5 py-3 md:px-4 md:py-4">
                  <h3 className="text-base xs:text-lg sm:text-xl md:text-2xl font-extrabold text-white drop-shadow-md">
                    {card.title}
                  </h3>
                  <p className="mt-2 text-[11px] xs:text-sm md:text-base text-white/95 leading-snug">
                    {card.description}
                  </p>
                  <div className="mt-3 md:mt-4 flex items-center gap-2 text-white/90">
                    <div className="h-6 w-6 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="h-3.5 w-3.5"
                      >
                        <path
                          fillRule="evenodd"
                          d="M12 2.25a.75.75 0 0 1 .75.75v8.19l5.03 2.9a.75.75 0 1 1-.75 1.3l-5.4-3.11a.75.75 0 0 1-.38-.65V3a.75.75 0 0 1 .75-.75Z"
                          clipRule="evenodd"
                        />
                        <path
                          d="M3.375 12C3.375 6.753 7.753 2.375 13 2.375S22.625 6.753 22.625 12 18.247 21.625 13 21.625 3.375 17.247 3.375 12Z"
                          opacity=".2"
                        />
                      </svg>
                    </div>
                    <span className="text-xs xs:text-sm">
                      {t("inspiringMinds", "Inspiring young minds")}
                    </span>
                  </div>
                </div>
              </div>

              <div
                className="absolute inset-0 ring-1 ring-white/10 rounded-2xl"
                aria-hidden="true"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default ValuePropositionSection;
