"use client";

import React, { useState, useEffect, useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  ];

  // Carousel setup
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: "center",
    slidesToScroll: 1,
  });
  const [prevBtnEnabled, setPrevBtnEnabled] = useState(false);
  const [nextBtnEnabled, setNextBtnEnabled] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [autoplay, setAutoplay] = useState(true);

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

  // Handle autoplay
  useEffect(() => {
    if (!emblaApi || !autoplay) return;

    const intervalId = setInterval(() => {
      if (document.visibilityState === "visible") {
        emblaApi.scrollNext();
      }
    }, 5000); // 5 seconds

    return () => clearInterval(intervalId);
  }, [emblaApi, autoplay]);

  // Pause autoplay on hover or touch
  const stopAutoplay = useCallback(() => setAutoplay(false), []);
  const startAutoplay = useCallback(() => setAutoplay(true), []);

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

  return (
    <section className="py-4 sm:py-6 md:py-8 h-full">
      <div className="h-full flex flex-col">
        <div className={`${glassPanelClass} flex flex-col h-full`}>
          {/* Header */}
          <div className="border-b border-white/10 px-4 py-4 sm:px-6 sm:py-5 flex-shrink-0">
            <h2 className="bg-gradient-to-r from-emerald-200 via-sky-200 to-indigo-200 bg-clip-text text-lg font-bold text-transparent sm:text-2xl md:text-3xl">
              {t("whyChooseTechTots")}
            </h2>
            <p className="mt-2 text-xs text-slate-200/80 sm:text-sm">
              {t("provenResults", "Proven Results")} •{" "}
              {t("qualityProducts", "Quality Products")} •{" "}
              {t("parentsLoveThisBecause", "Parents Love This")}
            </p>
          </div>

          {/* Carousel */}
          <div
            className="relative flex-1 flex flex-col min-h-0"
            onMouseEnter={stopAutoplay}
            onMouseLeave={startAutoplay}
            onTouchStart={stopAutoplay}
            onTouchEnd={startAutoplay}
          >
            <div className="overflow-hidden flex-1" ref={emblaRef}>
              <div className="flex h-full">
                {cards.map((card, index) => (
                  <div
                    key={card.key}
                    className="flex-[0_0_100%] min-w-0 px-4 py-4 sm:px-6 sm:py-6 flex"
                  >
                    <div
                      className={`${glassCardClass} group relative flex w-full flex-col overflow-hidden p-4 sm:p-6 transition hover:border-emerald-400/60 hover:shadow-emerald-500/20`}
                      aria-label={card.title}
                      role="region"
                    >
                      <div className="flex items-center justify-between">
                        <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-200">
                          {card.badge}
                        </span>
                        <span className="text-2xl sm:text-3xl">{card.icon}</span>
                      </div>

                      <div className="mt-4 sm:mt-6 text-left flex-1">
                        <h3 className="text-base font-semibold text-white sm:text-lg md:text-xl">
                          {card.title}
                        </h3>
                        <p className="mt-2 sm:mt-3 text-sm text-slate-200/80 sm:text-base">
                          {card.description}
                        </p>
                      </div>

                      <div className="mt-auto pt-4 sm:pt-6 text-left">
                        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/40 bg-emerald-400/10 px-3 py-1.5 text-xs font-medium text-emerald-100">
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
                  </div>
                ))}
              </div>
            </div>

            {/* Navigation Buttons */}
            <Button
              variant="outline"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 border-white/20 text-white z-10 rounded-full h-8 w-8 sm:h-10 sm:w-10 backdrop-blur-sm"
              onClick={() => {
                scrollPrev();
                stopAutoplay();
                setTimeout(startAutoplay, 10000);
              }}
              disabled={!prevBtnEnabled}
              aria-label="Previous card"
            >
              <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>

            <Button
              variant="outline"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 border-white/20 text-white z-10 rounded-full h-8 w-8 sm:h-10 sm:w-10 backdrop-blur-sm"
              onClick={() => {
                scrollNext();
                stopAutoplay();
                setTimeout(startAutoplay, 10000);
              }}
              disabled={!nextBtnEnabled}
              aria-label="Next card"
            >
              <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>

            {/* Dots Indicator */}
            <div className="flex justify-center mt-4 pb-2 flex-shrink-0">
              {cards.map((_, index) => (
                <button
                  key={index}
                  className={`mx-1 w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full transition-colors ${
                    selectedIndex === index
                      ? "bg-emerald-400"
                      : "bg-white/30"
                  }`}
                  onClick={() => {
                    emblaApi?.scrollTo(index);
                    stopAutoplay();
                    setTimeout(startAutoplay, 10000);
                  }}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="px-4 py-3 sm:px-6 sm:py-4 border-t border-white/10 flex-shrink-0">
            <div className="inline-flex items-center gap-2 sm:gap-3 rounded-full border border-white/15 bg-white/10 px-3 sm:px-4 py-1.5 sm:py-2 text-xs font-medium text-white/90 sm:text-sm">
              <div className="flex -space-x-1">
                <div className="h-5 w-5 sm:h-6 sm:w-6 rounded-full border-2 border-white bg-emerald-400"></div>
                <div className="h-5 w-5 sm:h-6 sm:w-6 rounded-full border-2 border-white bg-sky-400"></div>
                <div className="h-5 w-5 sm:h-6 sm:w-6 rounded-full border-2 border-white bg-indigo-400"></div>
              </div>
              {t("socialProofNumber")} {t("socialProofText")}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ValuePropositionSection;
