"use client";

import Image from "next/image";
import Link from "next/link";
import React from "react";
import { useABTest, useConversionTracking } from "@/hooks/useABTest";

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

const HeroSectionComponent = ({ t }: HeroSectionProps) => {
  // A/B Testing for hero headline
  const { variant: headlineVariant, trackConversion: trackHeadlineConversion } =
    useABTest("hero_headline");

  // A/B Testing for CTA button
  const { variant: ctaVariant, trackConversion: trackCTAConversion } =
    useABTest("cta_button");

  // General conversion tracking
  const { trackEvent } = useConversionTracking();

  // Get headline based on A/B test variant
  const getHeadline = () => {
    switch (headlineVariant?.id) {
      case "variant_a":
        return "De la Dependent de Ecran la Geniu STEM - În Doar 30 Zile";
      case "variant_b":
        return "Stop Luptelor cu Temele - Transformă Copilul Într-un Inventator";
      default:
        return t("homepageH1");
    }
  };

  // Get CTA text based on A/B test variant
  const getCTAText = () => {
    switch (ctaVariant?.id) {
      case "variant_a":
        return "Demo Gratuit";
      case "variant_b":
        return "Începe Transformarea";
      default:
        return t("shopAllProducts");
    }
  };

  return (
    <section
      className="relative flex items-center justify-center min-h-[75vh] sm:min-h-[80vh] md:min-h-[85vh] max-h-[900px] overflow-hidden"
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
          fetchPriority="high"
          placeholder="blur"
          blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R+Kcp"
        />
        {/* Gradient overlay for text readability */}
        <div
          className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/30"
          aria-hidden="true"
        />
      </div>
      {/* Content is perfectly centered and responsive */}
      <div className="relative z-10 w-full flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 max-w-4xl text-center">
        {/* Social Proof Badge */}
        <div className="mb-4 animate-fade-in">
          <span className="inline-flex items-center px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white text-sm font-medium">
            <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
            {t("socialProofNumber")} {t("socialProofText")}
          </span>
        </div>

        {/* Main Headline - A/B Tested */}
        <h1 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 md:mb-8 drop-shadow-lg animate-fade-in text-white leading-tight">
          {getHeadline()}
        </h1>

        {/* Subheadline - Transformation focused */}
        <p className="text-base xs:text-lg sm:text-xl md:text-2xl mb-4 sm:mb-6 max-w-3xl mx-auto drop-shadow-md animate-fade-in text-white/90 leading-relaxed font-medium">
          {t("homepageH1Subtitle")}
        </p>

        {/* Pain-focused description */}
        <p className="text-sm xs:text-base sm:text-lg mb-8 sm:mb-10 max-w-2xl mx-auto drop-shadow-md animate-fade-in text-white/80 leading-relaxed">
          {t("discoverCollection")}
        </p>
        {/* Primary CTAs - Hormozi Style */}
        <div className="flex flex-col xs:flex-row gap-3 sm:gap-4 w-full max-w-xs xs:max-w-none mx-auto items-center justify-center mb-6">
          {/* Primary CTA - Free Demo */}
          <Link
            href="/products"
            aria-label={getCTAText()}
            tabIndex={0}
            onClick={() => {
              trackCTAConversion("cta_click", "hero", {
                element: "primary_button",
                label: getCTAText(),
              });
              trackEvent("hero_cta_click", "conversion", {
                element: "primary_button",
                variant: ctaVariant?.name,
              });
            }}
            className="w-full xs:w-auto min-h-[48px] sm:min-h-[52px] px-6 sm:px-8 py-3 sm:py-4 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white text-sm sm:text-base md:text-lg font-bold border-0 relative overflow-hidden group focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-green-700 text-center flex items-center justify-center"
          >
            {getCTAText()}
            <span className="ml-1 sm:ml-2 transform transition-transform group-hover:translate-x-1 inline-block align-middle">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-3 h-3 sm:w-5 sm:h-5 inline-block align-middle"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                />
              </svg>
            </span>
          </Link>

          {/* Secondary CTA - Personalized Recommendations */}
          <Link
            href="/categories"
            aria-label={t("exploreCategories")}
            tabIndex={0}
            data-conversion="cta"
            data-conversion-type="click"
            data-conversion-category="cta"
            data-conversion-action="personalized_recommendations"
            data-conversion-element="hero_secondary_button"
            className="w-full xs:w-auto min-h-[48px] sm:min-h-[52px] px-6 sm:px-8 py-3 sm:py-4 bg-white/20 backdrop-blur-sm text-white border-2 border-white/30 hover:bg-white/30 hover:border-white/50 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105 text-sm sm:text-base md:text-lg font-semibold mt-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-transparent text-center flex items-center justify-center"
          >
            {t("exploreCategories")}
          </Link>
        </div>

        {/* Urgency Element */}
        <div className="text-center animate-fade-in">
          <p className="text-xs sm:text-sm text-white/70 mb-2">
            {t("limitedSpots")} {t("consultationThisMonth")}
          </p>
          <div className="flex items-center justify-center gap-2 text-white/80">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-xs sm:text-sm font-medium">
              {t("guarantee")}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export const HeroSection = React.memo(HeroSectionComponent);
