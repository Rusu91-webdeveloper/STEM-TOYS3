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
    <section className="py-4 sm:py-6 md:py-8 lg:py-12 bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300 text-gray-900">
      <div className="container mx-auto px-4 max-w-7xl">
        <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold mb-3 sm:mb-4 md:mb-6 text-center leading-tight">
          {t("whyChooseTechTots")}
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4 lg:gap-6">
          {cards.map(card => (
            <div
              key={card.key}
              className="group relative w-full overflow-hidden rounded-lg shadow-sm transition-all duration-300 hover:shadow-md focus-within:ring-2 focus-within:ring-white/80"
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

              <div className="relative flex min-h-[100px] sm:min-h-[120px] md:min-h-[140px] lg:min-h-[160px] flex-col justify-end p-2 sm:p-3 md:p-4">
                <div className="mb-1 inline-flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_0_2px_rgba(16,185,129,0.35)]" />
                  <span className="text-[8px] sm:text-[10px] tracking-wider uppercase text-white/90">
                    {card.badge}
                  </span>
                </div>

                <div className="w-full max-w-[98%] backdrop-blur-sm bg-black/40 hover:bg-black/50 transition-colors rounded-lg px-2 py-2 sm:px-3 sm:py-3">
                  <h3 className="text-xs sm:text-sm md:text-base lg:text-lg font-extrabold text-white drop-shadow-md truncate">
                    {card.title}
                  </h3>
                  <p className="mt-1 text-[9px] sm:text-[10px] md:text-xs lg:text-sm text-white/95 leading-tight line-clamp-2">
                    {card.description}
                  </p>
                  <div className="mt-2 flex items-center gap-1 text-white/90">
                    <div className="h-4 w-4 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="h-2.5 w-2.5"
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
                    <span className="text-[8px] sm:text-[10px] truncate">
                      {t("inspiringMinds", "Inspiring young minds")}
                    </span>
                  </div>
                </div>
              </div>

              <div
                className="absolute inset-0 ring-1 ring-white/10 rounded-lg"
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
