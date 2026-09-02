"use client";

import Image from "next/image";
import Link from "next/link";
import React, { useState, useEffect, useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import {
  ArrowUpRight,
  BookOpen,
  Brain,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Sparkles,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n";
import {
  glassPanelClass,
} from "@/features/home/components/homeTheme";

type PillarItem = {
  titleKey: string;
  descriptionKey: string;
  href: string;
  accent: string; // tailwind color class for gradient background
};

type PillarVisual = {
  image: string;
  imagePosition?: string;
  chip: string;
  chipClass: string;
  icon: React.ComponentType<{ className?: string }>;
  iconClass: string;
  headerTint: string;
  previewLabel: string;
};

interface PillarSectionProps {
  items?: PillarItem[];
}

const DEFAULT_PILLARS: PillarItem[] = [
  {
    titleKey: "pillarGuide2026Title",
    descriptionKey: "pillarGuide2026Description",
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

  const getPillarVisual = (href: string): PillarVisual => {
    const visuals: Record<string, PillarVisual> = {
      "/ghid-jucarii-stem-2025": {
        image: "/HeroImageTechTechtots.png",
        imagePosition: "object-center",
        chip: "Ghid practic",
        chipClass: "border-indigo-200 bg-indigo-50 text-indigo-700",
        icon: BookOpen,
        iconClass: "text-indigo-600",
        headerTint:
          "from-indigo-900/30 via-blue-900/10 to-transparent",
        previewLabel: "Trenduri & recomandări 2026",
      },
      "/jucarii-stem-dupa-varsta": {
        image: "/Engineering.png",
        imagePosition: "object-center",
        chip: "Selecție rapidă",
        chipClass: "border-emerald-200 bg-emerald-50 text-emerald-700",
        icon: Users,
        iconClass: "text-emerald-600",
        headerTint:
          "from-emerald-900/25 via-emerald-800/5 to-transparent",
        previewLabel: "Alege ușor după vârstă",
      },
      "/beneficiile-jucariilor-stem": {
        image: "/Mathematic.png",
        imagePosition: "object-center",
        chip: "Educație & impact",
        chipClass: "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700",
        icon: Brain,
        iconClass: "text-fuchsia-600",
        headerTint:
          "from-fuchsia-900/14 via-indigo-900/4 to-transparent",
        previewLabel: "Curiozitate • logică • creativitate",
      },
      "/faq": {
        image: "/Technology.png",
        imagePosition: "object-center",
        chip: "Răspunsuri clare",
        chipClass: "border-amber-200 bg-amber-50 text-amber-700",
        icon: CircleHelp,
        iconClass: "text-amber-600",
        headerTint:
          "from-amber-900/18 via-orange-900/5 to-transparent",
        previewLabel: "Livrare • vârstă • siguranță",
      },
    };

    return (
      visuals[href] ?? {
        image: "/HeroImageTechTechtots.png",
        imagePosition: "object-center",
        chip: "Ghid",
        chipClass: "border-slate-200 bg-slate-50 text-slate-700",
        icon: Sparkles,
        iconClass: "text-slate-600",
        headerTint: "from-slate-900/20 via-slate-900/5 to-transparent",
        previewLabel: "Resurse utile",
      }
    );
  };

  // Pillar card component
  const PillarCard = ({ item }: { item: PillarItem }) => {
    const visual = getPillarVisual(item.href);
    const Icon = visual.icon;

    return (
      <Link
        href={item.href}
        className="group relative block overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_22px_50px_-36px_rgba(15,23,42,0.25)] transition-all duration-300 hover:-translate-y-1 hover:border-cyan-200 hover:shadow-[0_28px_60px_-38px_rgba(14,165,233,0.24)]"
      >
        <div className="relative h-44 sm:h-48 md:h-44 lg:h-48 overflow-hidden">
          <Image
            src={visual.image}
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, 25vw"
            className={`object-cover ${visual.imagePosition ?? "object-center"} blur-[1px] saturate-110 contrast-105 scale-[1.03] transition duration-500 group-hover:scale-100`}
            aria-hidden
            onError={(e) => {
              const target = e.currentTarget as HTMLImageElement;
              if (target.src && !target.src.includes("HeroImageTechTechtots.png")) {
                target.src = "/HeroImageTechTechtots.png";
              }
            }}
          />
          <div
            className={`absolute inset-0 bg-gradient-to-br ${visual.headerTint}`}
            aria-hidden
          />
          <div
            className="absolute inset-0 bg-[radial-gradient(circle_at_16%_18%,rgba(255,255,255,0.18),transparent_34%),radial-gradient(circle_at_88%_12%,rgba(255,255,255,0.12),transparent_36%)]"
            aria-hidden
          />
          <div
            className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white via-white/90 to-transparent"
            aria-hidden
          />

          <div className="absolute left-4 top-4 flex items-center gap-2">
            <span
              className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold ${visual.chipClass}`}
            >
              {visual.chip}
            </span>
          </div>

          <div className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-2xl border border-white/70 bg-white/85 shadow-[0_10px_20px_-16px_rgba(15,23,42,0.35)] backdrop-blur">
            <Icon className={`h-5 w-5 ${visual.iconClass}`} />
          </div>

          <div className="absolute left-4 right-4 bottom-4">
            <div className="inline-flex max-w-full items-center rounded-xl border border-white/70 bg-white/85 px-3 py-1.5 text-[11px] font-semibold text-slate-700 shadow-[0_10px_20px_-16px_rgba(15,23,42,0.2)] backdrop-blur">
              <span className="truncate">{visual.previewLabel}</span>
            </div>
          </div>
        </div>

        <div className="relative p-4 sm:p-5">
          <div className="flex items-start gap-2">
            <h3 className="flex-1 text-base font-bold leading-tight text-slate-900 sm:text-lg">
              {t(item.titleKey)}
            </h3>
            <span className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-[0.16em] text-slate-600">
              {t("pillarNewBadge")}
            </span>
          </div>

          <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-slate-600">
            {t(item.descriptionKey)}
          </p>

          <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 transition group-hover:text-cyan-700">
            <span>{t("pillarSeeDetails")}</span>
            <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </div>
        </div>
      </Link>
    );
  };

  return (
    <section
      aria-label="TechTots Pillars"
      className="relative py-4 sm:py-6 md:py-8 lg:py-10"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div
          className={`${glassPanelClass} mx-auto max-w-6xl border-slate-200/80 bg-white/95 p-4 shadow-[0_28px_70px_-42px_rgba(15,23,42,0.2)] sm:p-6 lg:p-8`}
        >
          <div className="mb-4 text-center sm:mb-6 md:mb-8">
            <span className="inline-flex items-center justify-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-emerald-700 sm:text-xs">
              {t("pillarSectionTag")}
            </span>
            <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl md:text-4xl lg:text-5xl">
              {t("pillarSectionTitle")}
            </h2>
            <p className="mx-auto mt-3 max-w-3xl text-sm leading-relaxed text-slate-600 sm:text-base md:text-lg">
              {t("pillarSectionSubtitle")}
            </p>
          </div>

          {/* Mobile Carousel (visible only on small screens) */}
          <div className="relative md:hidden">
            <div className="overflow-hidden" ref={emblaRef}>
              <div className="flex">
                {items.map((item) => (
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
              className="absolute left-0 top-1/2 z-10 h-9 w-9 -translate-y-1/2 rounded-full border border-slate-200 bg-white text-slate-700 shadow-md hover:bg-slate-50 disabled:opacity-30"
              onClick={scrollPrev}
              disabled={!prevBtnEnabled}
              aria-label="Previous pillar"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-0 top-1/2 z-10 h-9 w-9 -translate-y-1/2 rounded-full border border-slate-200 bg-white text-slate-700 shadow-md hover:bg-slate-50 disabled:opacity-30"
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
