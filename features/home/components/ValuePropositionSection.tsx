"use client";

import Image from "next/image";
import { useState, useEffect, useCallback } from "react";
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
      image: "/Science.png",
      badge: "Rezultat",
      category: "Stiinta",
      icon: "Ecran -> Experiment",
    },
    {
      key: "transformation2",
      title: t("transformation2"),
      description: t("transformation2Desc"),
      image: "/Mathematic.png",
      badge: "Rezultat",
      category: "Matematica",
      icon: "Nesiguranta -> Incredere",
    },
    {
      key: "transformation3",
      title: t("transformation3"),
      description: t("transformation3Desc"),
      image: "/coding-robotic.png",
      badge: "Rezultat",
      category: "Coding si robotica",
      icon: "Plictiseala -> Inventator",
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
    <section className="py-5 sm:py-7 md:py-9 h-full">
      <div className="h-full flex flex-col">
        <div
          className={`${glassPanelClass} flex h-full flex-col border-slate-200/90 bg-white/95 shadow-[0_28px_60px_-38px_rgba(15,23,42,0.28)]`}
        >
          {/* Header */}
          <div className="border-b border-slate-200/80 px-4 py-4 sm:px-6 sm:py-5 flex-shrink-0">
            <h2 className="text-xl font-extrabold tracking-tight text-slate-900 sm:text-3xl md:text-4xl">
              {t("whyChooseTechTots")}
            </h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {[t("provenResults", "Rezultate clare"), t("qualityProducts", "Produse bine alese"), t("parentsLoveThisBecause", "Apreciat de parinti")].map((item) => (
                <span
                  key={item}
                  className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50/90 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-600 sm:text-[11px]"
                >
                  {item}
                </span>
              ))}
            </div>
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
                {cards.map((card) => (
                  <div
                    key={card.key}
                    className="flex-[0_0_100%] min-w-0 px-4 py-4 sm:px-6 sm:py-6 flex"
                  >
                    <div
                      className={`${glassCardClass} group relative flex w-full flex-col overflow-hidden rounded-[1.75rem] border-slate-200/90 bg-white/92 p-4 shadow-[0_22px_45px_-32px_rgba(15,23,42,0.22)] transition duration-300 hover:-translate-y-0.5 hover:border-cyan-300/40 hover:shadow-[0_26px_55px_-34px_rgba(14,165,233,0.22)] sm:p-6`}
                      aria-label={card.title}
                      role="region"
                    >
                      <div className="absolute inset-0">
                        <Image
                          src={card.image}
                          alt=""
                          fill
                          sizes="(max-width: 768px) 100vw, 80vw"
                          className="scale-105 object-cover object-center opacity-90 blur-[2px] saturate-105 transition duration-700 group-hover:scale-100 group-hover:opacity-95"
                          aria-hidden
                        />
                        <div
                          className="absolute inset-0 bg-gradient-to-br from-white/34 via-white/20 to-white/26"
                          aria-hidden
                        />
                        <div
                          className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(255,255,255,0.14),transparent_32%),radial-gradient(circle_at_85%_15%,rgba(255,255,255,0.08),transparent_35%)]"
                          aria-hidden
                        />
                        <div
                          className="absolute inset-0 opacity-20 bg-[linear-gradient(180deg,rgba(255,255,255,0.02),rgba(15,23,42,0.05))]"
                          aria-hidden
                        />
                      </div>

                      <div className="relative z-10 flex items-start justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full border border-emerald-200 bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-700 backdrop-blur-sm sm:text-xs">
                            {card.badge}
                          </span>
                          <span className="rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-[11px] font-medium text-slate-800 backdrop-blur-sm sm:text-xs">
                            {card.category}
                          </span>
                        </div>
                        <span className="inline-flex items-center justify-center rounded-2xl border border-white/80 bg-white/82 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-700 shadow-[0_10px_25px_-18px_rgba(15,23,42,0.25)] backdrop-blur-sm sm:text-[11px]">
                          {card.icon}
                        </span>
                      </div>

                      <div className="relative z-10 mt-5 sm:mt-6 text-left flex-1">
                        <h3 className="max-w-4xl text-xl font-bold leading-tight text-black sm:text-2xl md:text-[1.95rem]">
                          {card.title}
                        </h3>
                        <p className="mt-3 max-w-4xl text-sm leading-relaxed text-slate-900 sm:text-base md:text-lg">
                          {card.description}
                        </p>
                      </div>

                      <div className="relative z-10 mt-auto pt-5 sm:pt-6 text-left">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/85 px-3 py-1.5 text-xs font-semibold text-emerald-700 shadow-[0_10px_25px_-20px_rgba(52,211,153,0.25)] backdrop-blur-sm">
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
                            Beneficiu clar
                          </div>
                          <span className="text-xs font-medium text-slate-800">
                            progres vizibil prin joaca aplicata
                          </span>
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
              className="absolute left-2 top-1/2 z-10 h-9 w-9 -translate-y-1/2 rounded-full border-slate-200 bg-white/90 text-slate-700 shadow-lg backdrop-blur-md transition hover:border-cyan-300/40 hover:text-cyan-700 hover:bg-white disabled:opacity-40 sm:left-3 sm:h-11 sm:w-11"
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
              className="absolute right-2 top-1/2 z-10 h-9 w-9 -translate-y-1/2 rounded-full border-slate-200 bg-white/90 text-slate-700 shadow-lg backdrop-blur-md transition hover:border-cyan-300/40 hover:text-cyan-700 hover:bg-white disabled:opacity-40 sm:right-3 sm:h-11 sm:w-11"
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
                  className={`mx-1 rounded-full transition-all duration-300 ${
                    selectedIndex === index
                      ? "h-2.5 w-7 bg-gradient-to-r from-emerald-400 to-cyan-400 shadow-[0_0_0_3px_rgba(52,211,153,0.16)]"
                      : "h-2.5 w-2.5 bg-slate-300 hover:bg-slate-400"
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
          <div className="border-t border-slate-200/80 px-4 py-3 sm:px-6 sm:py-4 flex-shrink-0">
            <div className="inline-flex items-center gap-2.5 sm:gap-3 rounded-full border border-slate-200 bg-white px-3 sm:px-4 py-1.5 sm:py-2 text-xs font-medium text-slate-800 shadow-[0_12px_25px_-22px_rgba(15,23,42,0.18)] sm:text-sm">
              <div className="flex -space-x-1.5">
                <div className="h-5 w-5 sm:h-6 sm:w-6 rounded-full border-2 border-white bg-emerald-400"></div>
                <div className="h-5 w-5 sm:h-6 sm:w-6 rounded-full border-2 border-white bg-sky-400"></div>
                <div className="h-5 w-5 sm:h-6 sm:w-6 rounded-full border-2 border-white bg-indigo-400"></div>
              </div>
              <span>
                <span className="font-semibold text-slate-900">
                  {t("socialProofNumber")}
                </span>{" "}
                <span className="text-slate-600">{t("socialProofText")}</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ValuePropositionSection;
