"use client";

import React from "react";
import {
  glassCardClass,
  glassPanelClass,
} from "@/features/home/components/homeTheme";

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
    <section className="py-10 sm:py-12 md:py-14">
      <div className="container mx-auto max-w-6xl px-4">
        <div className={`${glassPanelClass} text-center`}>
          <div className="border-b border-white/10 px-6 py-6 sm:px-8 sm:py-8">
            <h2 className="bg-gradient-to-r from-emerald-200 via-sky-200 to-indigo-200 bg-clip-text text-2xl font-bold text-transparent sm:text-3xl md:text-4xl">
              {t("whyChooseTechTots")}
            </h2>
            <p className="mt-3 text-xs text-slate-200/80 sm:text-sm">
              {t("provenResults", "Proven Results")} •{" "}
              {t("qualityProducts", "Quality Products")} •{" "}
              {t("parentsLoveThisBecause", "Parents Love This")}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 border-b border-white/10 px-6 py-6 sm:grid-cols-2 sm:gap-6 sm:px-8 sm:py-8 md:grid-cols-3">
            {cards.slice(0, 3).map(card => (
              <div
                key={card.key}
                className={`${glassCardClass} group relative flex h-full flex-col overflow-hidden p-5 transition hover:border-emerald-400/60 hover:shadow-emerald-500/20`}
                aria-label={card.title}
                role="region"
              >
                <div className="flex items-center justify-between">
                  <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-200">
                    {card.badge}
                  </span>
                  <span className="text-2xl">{card.icon}</span>
                </div>

                <div className="mt-4 text-left">
                  <h3 className="text-lg font-semibold text-white">
                    {card.title}
                  </h3>
                  <p className="mt-2 text-sm text-slate-200/80">
                    {card.description}
                  </p>
                </div>

                <div className="mt-auto pt-4 text-left">
                  <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/40 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-100">
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
                    Rezultat Dovedit
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="px-6 py-6 sm:px-8 sm:py-8">
            <div className="inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-medium text-white/90 sm:text-sm">
              <div className="flex -space-x-1">
                <div className="h-6 w-6 rounded-full border-2 border-white bg-emerald-400"></div>
                <div className="h-6 w-6 rounded-full border-2 border-white bg-sky-400"></div>
                <div className="h-6 w-6 rounded-full border-2 border-white bg-indigo-400"></div>
              </div>
              {t("socialProofNumber")} {t("socialProofText")}
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-xs text-emerald-200 sm:mt-6 sm:gap-4 sm:text-sm">
              <a
                href="/categories/science"
                className="transition hover:text-white hover:underline"
              >
                {t("scienceCategory", "Science")}
              </a>
              <a
                href="/categories/technology"
                className="transition hover:text-white hover:underline"
              >
                {t("technologyCategory", "Technology")}
              </a>
              <a
                href="/categories/engineering"
                className="transition hover:text-white hover:underline"
              >
                {t("engineeringCategory", "Engineering")}
              </a>
              <a
                href="/categories/mathematics"
                className="transition hover:text-white hover:underline"
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
