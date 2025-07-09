"use client";

import React from "react";
import Image from "next/image";

interface HeroSectionProps {
  t: (key: string, defaultValue?: string) => string;
}

const HeroSectionComponent = ({ t }: HeroSectionProps) => {
  return (
    <section className="relative h-[50vh] sm:h-[60vh] md:h-[70vh] min-h-[300px] sm:min-h-[400px] md:min-h-[600px] max-h-[800px] flex items-center">
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/homepage_hero_banner_01.png"
          alt={t("discoverCollection")}
          fill
          priority
          className="object-cover w-full h-full"
          style={{ objectFit: "cover" }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-black/30" />
      </div>
      <div className="container relative z-10 text-white mx-auto px-4 md:px-6 lg:px-8 max-w-7xl">
        <div className="max-w-xl sm:max-w-2xl md:max-w-3xl">
          <h1 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-bold mb-2 md:mb-4 drop-shadow-md animate-fade-in">
            {t("inspireMinds")}
          </h1>
          <p className="text-base sm:text-lg md:text-2xl mb-4 md:mb-8 max-w-2xl drop-shadow-md animate-fade-in">
            {t("discoverCollection")}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <a
              href="/products"
              aria-label={t("shopAllProducts")}
              className="text-sm sm:text-base md:text-lg px-4 sm:px-6 md:px-8 py-2 sm:py-5 md:py-6 rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white border-0 relative overflow-hidden group animate-bounce text-center"
            >
              {t("shopAllProducts")}
              <span className="ml-2 transform transition-transform group-hover:translate-x-1 inline-block align-middle">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-4 h-4 sm:w-5 sm:h-5 inline-block"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                  />
                </svg>
              </span>
            </a>
            <a
              href="/categories"
              aria-label={t("exploreCategories")}
              className="text-sm sm:text-base md:text-lg px-4 sm:px-6 md:px-8 py-2 sm:py-5 md:py-6 bg-orange-500 text-white border-orange-500 hover:bg-orange-600 hover:border-orange-600 rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105 mt-3 sm:mt-0 animate-bounce text-center"
            >
              {t("exploreCategories")}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export const HeroSection = React.memo(HeroSectionComponent);
