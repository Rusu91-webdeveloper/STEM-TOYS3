"use client";

import Link from "next/link";
import React, { useState, useEffect, useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  
  // Carousel setup for mobile only
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: "start",
    slidesToScroll: 1,
    breakpoints: {
      "(min-width: 768px)": { active: false }, // Disable carousel on md and up
    },
  });
  const [prevBtnEnabled, setPrevBtnEnabled] = useState(false);
  const [nextBtnEnabled, setNextBtnEnabled] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const scrollPrev = useCallback(
    () => emblaApi && emblaApi.scrollPrev(),
    [emblaApi]
  );
  const scrollNext = useCallback(
    () => emblaApi && emblaApi.scrollNext(),
    [emblaApi]
  );

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
    setPrevBtnEnabled(emblaApi.canScrollPrev());
    setNextBtnEnabled(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi, onSelect]);

  // Pillar card component
  const PillarCard = ({ item }: { item: PillarItem }) => (
    <Link
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
  );

  return (
    <section
      aria-label="TechTots Pillars"
      className="hidden lg:block relative py-4 sm:py-6 md:py-8 lg:py-10"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className={`${glassPanelClass} mx-auto max-w-6xl p-4 sm:p-6`}>
          <div className="mb-4 text-center sm:mb-6 md:mb-8">
            <span className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-emerald-200 sm:text-xs">
              {t("pillarSectionTag")}
            </span>
            <h2 className="mt-3 bg-gradient-to-r from-emerald-200 via-sky-200 to-indigo-200 bg-clip-text text-xl font-extrabold tracking-tight text-transparent sm:text-3xl md:text-4xl">
              {t("pillarSectionTitle")}
            </h2>
            <p className="mt-2 text-[0.85rem] text-slate-200/80 sm:text-sm md:text-base">
              {t("pillarSectionSubtitle")}
            </p>
          </div>

          {/* Mobile Carousel (visible only on small screens) */}
          <div className="relative md:hidden">
            <div className="overflow-hidden" ref={emblaRef}>
              <div className="flex">
                {items.map((item, index) => (
                  <div
                    key={item.href}
                    className="flex-[0_0_100%] min-w-0 px-2"
                  >
                    <PillarCard item={item} />
                  </div>
                ))}
              </div>
            </div>
            {/* Navigation buttons for mobile */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full border border-white/20 bg-white/10 text-white hover:bg-white/20 disabled:opacity-30"
              onClick={scrollPrev}
              disabled={!prevBtnEnabled}
              aria-label="Previous pillar"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full border border-white/20 bg-white/10 text-white hover:bg-white/20 disabled:opacity-30"
              onClick={scrollNext}
              disabled={!nextBtnEnabled}
              aria-label="Next pillar"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Desktop Grid (visible only on md and larger screens) */}
          <div className="hidden md:grid md:grid-cols-4 md:gap-4 lg:gap-6">
            {items.map(item => (
              <PillarCard key={item.href} item={item} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default React.memo(PillarSection);
