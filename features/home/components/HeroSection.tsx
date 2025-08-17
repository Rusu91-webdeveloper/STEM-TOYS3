"use client";

import Image from "next/image";
import React from "react";

interface HeroSectionProps {
  t: (key: string, defaultValue?: string) => string;
}

// [REFAC] HeroSection: Mobile-first, perfectly centered, accessible, and visually stunning
// - Uses flex to center content both vertically and horizontally at all breakpoints
// - Background image uses object-center to maintain focal point
// - CTAs are at least 44x44px on mobile, with ARIA labels and keyboard accessibility
// - Responsive typography for headline and subheadline
// - All interactive elements have visible focus states
// - All styling via Tailwind utilities (no custom CSS)
// - No horizontal scrolling at any breakpoint
// - Comments explain all major changes and rationale

const HeroSectionComponent = ({ t }: HeroSectionProps) => (
  <section
    className="relative flex items-center justify-center min-h-[60vh] sm:min-h-[70vh] md:min-h-[80vh] max-h-[900px] overflow-hidden"
    aria-label={t("heroSection", "Homepage Hero Section")}
  >
    {/* Background Image with object-center for perfect cropping/focal point */}
    <div className="absolute inset-0 z-0">
      <Image
        src="/images/homepage_hero_banner_01.png"
        alt={t("discoverCollection")}
        fill
        priority
        className="object-cover object-center w-full h-full"
        sizes="100vw"
      />
      {/* Gradient overlay for text readability */}
      <div
        className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/30"
        aria-hidden="true"
      />
    </div>
    {/* Content is perfectly centered and responsive */}
    <div className="relative z-10 w-full flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 max-w-3xl text-center">
      <h1 className="text-3xl xs:text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-3 md:mb-5 drop-shadow-lg animate-fade-in text-white">
        {t("inspireMinds")}
      </h1>
      <p className="text-base xs:text-lg sm:text-xl md:text-2xl mb-6 md:mb-10 max-w-2xl mx-auto drop-shadow-md animate-fade-in text-white/90">
        {t("discoverCollection")}
      </p>
      <div className="flex flex-col xs:flex-row gap-4 w-full max-w-xs xs:max-w-none mx-auto items-center justify-center">
        {/* Shop All Products CTA */}
        <a
          href="/products"
          aria-label={t("shopAllProducts")}
          tabIndex={0}
          className="w-full xs:w-auto min-h-[44px] px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-base sm:text-lg font-semibold border-0 relative overflow-hidden group focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-purple-700 text-center"
        >
          {t("shopAllProducts")}
          <span className="ml-2 transform transition-transform group-hover:translate-x-1 inline-block align-middle">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-5 h-5 inline-block align-middle"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
              />
            </svg>
          </span>
        </a>
        {/* Explore Categories CTA */}
        <a
          href="/categories"
          aria-label={t("exploreCategories")}
          tabIndex={0}
          className="w-full xs:w-auto min-h-[44px] px-6 py-3 bg-orange-500 text-white border-orange-500 hover:bg-orange-600 hover:border-orange-600 rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105 text-base sm:text-lg font-semibold mt-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-orange-600 text-center"
        >
          {t("exploreCategories")}
        </a>
      </div>
    </div>
  </section>
);

export const HeroSection = React.memo(HeroSectionComponent);
