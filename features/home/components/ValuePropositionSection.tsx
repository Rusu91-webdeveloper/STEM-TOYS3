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
    <section className="py-6 sm:py-8 md:py-12 lg:py-16 bg-green-50 text-gray-900">
      <div className="container mx-auto px-4 max-w-5xl">
        {/* Simplified headline section */}
        <div className="text-center mb-4 sm:mb-6 md:mb-8">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 leading-tight">
            {t("whyChooseTechTots")}
          </h2>
          {/* Simple subheading */}
          <p className="text-gray-600 text-sm sm:text-base max-w-xl mx-auto">
            {t("provenResults", "Proven Results")} •{" "}
            {t("qualityProducts", "Quality Products")} •{" "}
            {t("parentsLoveThisBecause", "Parents Love This")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {cards.slice(0, 3).map(card => (
            <div
              key={card.key}
              className="group relative w-full overflow-hidden rounded-lg shadow-sm transition-all duration-300 hover:shadow-md bg-white border border-gray-100"
              aria-label={card.title}
              role="region"
            >
              {/* Card header with icon */}
              <div className="px-5 pt-5 pb-3 border-b border-gray-100 flex items-center justify-between">
                <span className="text-green-600 font-medium text-sm">
                  {card.badge}
                </span>
                <span className="text-2xl">{card.icon}</span>
              </div>

              {/* Card content */}
              <div className="p-3 sm:p-4">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                  {card.title}
                </h3>
                <p className="text-sm text-gray-600 mb-4">{card.description}</p>

                {/* Simple checkmark */}
                <div className="mt-auto pt-2 flex items-center gap-2 text-green-600">
                  <svg
                    className="h-4 w-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-xs font-medium">Rezultat Dovedit</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Simplified Social Proof and SEO Category Links */}
        <div className="mt-6 sm:mt-8 text-center">
          <div className="inline-flex items-center gap-2 bg-white rounded-lg px-3 py-2 shadow-sm border border-gray-100">
            <div className="flex -space-x-1">
              <div className="w-5 h-5 bg-green-400 rounded-full border-2 border-white"></div>
              <div className="w-5 h-5 bg-blue-400 rounded-full border-2 border-white"></div>
              <div className="w-5 h-5 bg-purple-400 rounded-full border-2 border-white"></div>
            </div>
            <p className="text-xs sm:text-sm font-medium text-gray-900">
              {t("socialProofNumber")} {t("socialProofText")}
            </p>
          </div>

          {/* Simplified category links */}
          <div className="mt-4 sm:mt-6 text-center">
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-xs sm:text-sm">
              <a
                href="/categories/science"
                className="text-green-600 hover:underline"
              >
                {t("scienceCategory", "Science")}
              </a>
              <a
                href="/categories/technology"
                className="text-green-600 hover:underline"
              >
                {t("technologyCategory", "Technology")}
              </a>
              <a
                href="/categories/engineering"
                className="text-green-600 hover:underline"
              >
                {t("engineeringCategory", "Engineering")}
              </a>
              <a
                href="/categories/mathematics"
                className="text-green-600 hover:underline"
              >
                {t("mathematicsCategory", "Mathematics")}
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ValuePropositionSection;
