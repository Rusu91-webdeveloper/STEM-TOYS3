"use client";

import Link from "next/link";
import React from "react";
import { useTranslation } from "@/lib/i18n";
import {
  glassCardClass,
  glassPanelClass,
} from "@/features/home/components/homeTheme";

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
      className="relative py-8 sm:py-10 md:py-12 lg:py-14"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className={`${glassPanelClass} mx-auto max-w-6xl p-6 sm:p-8`}>
          <div className="mb-6 text-center sm:mb-8">
            <span className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-emerald-200 sm:text-xs">
              {t("pillarSectionTag")}
            </span>
            <h2 className="mt-3 bg-gradient-to-r from-emerald-200 via-sky-200 to-indigo-200 bg-clip-text text-2xl font-extrabold tracking-tight text-transparent sm:text-3xl md:text-4xl">
              {t("pillarSectionTitle")}
            </h2>
            <p className="mt-2 text-xs text-slate-200/80 sm:text-sm md:text-base">
              {t("pillarSectionSubtitle")}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-2 sm:gap-3 md:grid-cols-4 md:gap-4 lg:gap-6">
            {items.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className={`${glassCardClass} group relative overflow-hidden p-3 sm:p-4 transition-all duration-300 hover:border-emerald-400/60 hover:shadow-emerald-500/20`}
              >
                <div
                  className={`pointer-events-none absolute inset-0 opacity-80 transition-opacity duration-300 group-hover:opacity-100 bg-gradient-to-br ${item.accent}`}
                  aria-hidden="true"
                />
                <div className="relative flex h-16 items-center justify-center sm:h-20 md:h-24 lg:h-28">
                  <div className="text-3xl font-bold text-white/40 sm:text-4xl md:text-5xl">
                    {t(item.titleKey).charAt(0)}
                  </div>
                </div>

                <div className="relative rounded-2xl bg-slate-950/60 p-3 backdrop-blur-sm sm:p-4">
                  <h3 className="flex items-center gap-2 text-xs font-semibold text-white sm:text-sm md:text-base">
                    <span className="truncate">{t(item.titleKey)}</span>
                    <span className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/10 px-2 py-0.5 text-[0.55rem] uppercase tracking-wide text-slate-200">
                      {t("pillarNewBadge")}
                    </span>
                  </h3>
                  <p className="mt-2 line-clamp-2 text-[0.7rem] text-slate-300 sm:text-xs md:text-sm">
                    {t(item.descriptionKey)}
                  </p>

                  <div className="mt-3 flex items-center text-[0.7rem] font-semibold text-emerald-200 transition group-hover:text-white sm:text-xs md:text-sm">
                    <span className="truncate">{t("pillarSeeDetails")}</span>
                    <svg
                      className="ml-2 h-3 w-3 flex-shrink-0 sm:h-4 sm:w-4"
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
      </div>
    </section>
  );
}

export default React.memo(PillarSection);
