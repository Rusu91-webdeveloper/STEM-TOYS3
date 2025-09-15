"use client";

import Link from "next/link";
import React from "react";
import { useTranslation } from "@/lib/i18n";

type PillarItem = {
  titleKey: string;
  descriptionKey: string;
  href: string;
  accent: string; // tailwind color class for gradient background
};

interface PillarSectionProps {
  items?: PillarItem[];
}

const DEFAULT_PILLARS: PillarItem[] = [
  {
    titleKey: "pillarGuide2025Title",
    descriptionKey: "pillarGuide2025Description",
    href: "/ghid-jucarii-stem-2025",
    accent: "from-indigo-500 to-blue-500",
  },
  {
    titleKey: "pillarByAgeTitle",
    descriptionKey: "pillarByAgeDescription",
    href: "/jucarii-stem-dupa-varsta",
    accent: "from-emerald-500 to-teal-500",
  },
  {
    titleKey: "pillarBenefitsTitle",
    descriptionKey: "pillarBenefitsDescription",
    href: "/beneficiile-jucariilor-stem",
    accent: "from-fuchsia-500 to-pink-500",
  },
  {
    titleKey: "pillarFaqTitle",
    descriptionKey: "pillarFaqDescription",
    href: "/faq",
    accent: "from-amber-500 to-orange-500",
  },
];

export function PillarSection({ items = DEFAULT_PILLARS }: PillarSectionProps) {
  const { t } = useTranslation();
  return (
    <section
      aria-label="TechTots Pillars"
      className="relative py-6 sm:py-8 md:py-12 lg:py-16"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-4 sm:mb-6 md:mb-8 lg:mb-10 text-center">
          <span className="inline-flex items-center rounded-full bg-indigo-50 text-indigo-700 px-2 py-1 text-xs font-semibold tracking-wide">
            {t("pillarSectionTag")}
          </span>
          <h2 className="mt-2 text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold tracking-tight text-gray-900">
            {t("pillarSectionTitle")}
          </h2>
          <p className="mt-1 text-xs sm:text-sm md:text-base text-gray-600">
            {t("pillarSectionSubtitle")}
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4 lg:gap-6">
          {items.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={`group relative overflow-hidden rounded-2xl shadow-sm ring-1 ring-gray-100 hover:shadow-xl transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 bg-gradient-to-br ${item.accent}`}
            >
              <div className="relative h-16 sm:h-20 md:h-24 lg:h-32 flex items-center justify-center">
                <div className="text-white text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold opacity-20">
                  {t(item.titleKey).charAt(0)}
                </div>
              </div>

              <div className="p-2 sm:p-3 md:p-4 lg:p-5 bg-white/90 backdrop-blur-sm">
                <h3 className="text-xs sm:text-sm md:text-base lg:text-lg font-semibold text-gray-900 flex items-center gap-1">
                  <span className="truncate">{t(item.titleKey)}</span>
                  <span className="inline-flex items-center justify-center rounded-full bg-gray-100 text-gray-700 text-[8px] sm:text-[10px] px-1 py-0.5 group-hover:bg-gray-200 flex-shrink-0">
                    {t("pillarNewBadge")}
                  </span>
                </h3>
                <p className="mt-1 text-[10px] sm:text-xs md:text-sm text-gray-600 line-clamp-2">
                  {t(item.descriptionKey)}
                </p>

                <div className="mt-2 flex items-center text-[10px] sm:text-xs md:text-sm font-medium text-indigo-700 group-hover:text-indigo-800">
                  <span className="truncate">{t("pillarSeeDetails")}</span>
                  <svg
                    className="ml-1 h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 11-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export default React.memo(PillarSection);
