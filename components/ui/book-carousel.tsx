"use client";

import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import React, { useState, useEffect, useCallback } from "react";

import { Button } from "@/components/ui/button";


type BookImage = {
  src: string;
  alt: string;
  language: "english" | "romanian";
};

interface BookCarouselProps {
  books: {
    english: BookImage;
    romanian: BookImage;
  }[];
  onLanguageToggle?: (index: number) => void;
  currentLanguages: ("english" | "romanian")[];
  autoplayDelay?: number;
  showLanguageToggle?: boolean;
}

export function BookCarousel({
  books,
  onLanguageToggle,
  currentLanguages,
  autoplayDelay = 5000,
  showLanguageToggle = false,
}: BookCarouselProps) {
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
    }, autoplayDelay);

    return () => clearInterval(intervalId);
  }, [emblaApi, autoplay, autoplayDelay]);

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
    <div
      className="relative"
      onMouseEnter={stopAutoplay}
      onMouseLeave={startAutoplay}
      onTouchStart={stopAutoplay}
      onTouchEnd={startAutoplay}>
      <div
        className="overflow-hidden"
        ref={emblaRef}>
        <div className="flex">
          {books.map((book, index) => {
            const currentLang = currentLanguages[index] || "english";
            const currentBook = book[currentLang];

            return (
              <div
                className="flex-[0_0_100%] min-w-0 relative h-[300px] sm:h-[350px] md:h-[400px] px-2 sm:px-4"
                key={index}>
                <div className="h-full rounded-lg overflow-hidden shadow-xl group flex items-center justify-center bg-white">
                  <div className="relative w-full h-full">
                    <Image
                      src={currentBook.src}
                      alt={currentBook.alt}
                      fill
                      sizes="(max-width: 640px) 100vw, 50vw"
                      style={{ objectFit: "contain", objectPosition: "center" }}
                      className="transition-transform group-hover:scale-105 duration-500"
                    />
                  </div>
                  {showLanguageToggle && onLanguageToggle && (
                    <div className="absolute top-3 sm:top-4 right-3 sm:right-4 z-10">
                      <Button
                        size="sm"
                        variant="outline"
                        className="bg-white/80 hover:bg-white border-indigo-300 text-indigo-700 text-xs h-6 sm:h-7 px-1.5 sm:px-2 py-0"
                        onClick={() => onLanguageToggle(index)}>
                        {currentLang === "english" ? "🇷🇴 RO" : "🇬🇧 EN"}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Button
        variant="outline"
        size="icon"
        className="absolute left-1 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white border-indigo-300 text-indigo-700 z-10 rounded-full h-8 w-8 sm:h-10 sm:w-10"
        onClick={() => {
          scrollPrev();
          stopAutoplay();
          setTimeout(startAutoplay, 10000); // Resume autoplay after 10 seconds of inactivity
        }}
        disabled={!prevBtnEnabled}>
        <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
      </Button>

      <Button
        variant="outline"
        size="icon"
        className="absolute right-1 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white border-indigo-300 text-indigo-700 z-10 rounded-full h-8 w-8 sm:h-10 sm:w-10"
        onClick={() => {
          scrollNext();
          stopAutoplay();
          setTimeout(startAutoplay, 10000); // Resume autoplay after 10 seconds of inactivity
        }}
        disabled={!nextBtnEnabled}>
        <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
      </Button>

      <div className="flex justify-center mt-4">
        {books.map((_, index) => (
          <button
            key={index}
            className={`mx-1 w-2 h-2 rounded-full ${selectedIndex === index ? "bg-indigo-600" : "bg-indigo-200"}`}
            onClick={() => {
              emblaApi?.scrollTo(index);
              stopAutoplay();
              setTimeout(startAutoplay, 10000); // Resume autoplay after 10 seconds of inactivity
            }}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
