"use client";

import { LucideIcon } from "lucide-react";
import Image from "next/image";
import React from "react";
import Link from "next/link";
import { useEffect } from "react";
import { useABTest, useConversionTracking } from "@/hooks/useABTest";

interface CategoryIconInfo {
  icon: LucideIcon;
  bgColor: string;
  textColor: string;
  letter: string;
}

interface CategoryInfo {
  id: string;
  label: string;
}

interface ProductsHeroSectionProps {
  categoryImagePath: string;
  activeCategory: CategoryInfo | null;
  activeCategoryInfo: CategoryIconInfo;
  getCategoryTitle: () => string;
  getCategoryDescription: () => string;
  t: (key: string, fallback?: string) => string;
}

export function ProductsHeroSection({
  categoryImagePath,
  activeCategory,
  activeCategoryInfo,
  getCategoryTitle,
  getCategoryDescription,
  t,
}: ProductsHeroSectionProps) {
  const IconComponent = activeCategoryInfo.icon;
  const { variantName, isControl, trackConversion } = useABTest(
    "products-hero-headline"
  );
  const { trackEvent } = useConversionTracking();

  // Compute headline/subheadline based on AB variant (only for all-products view)
  const headline =
    !activeCategory && !isControl ? t("productsPageH1") : getCategoryTitle();
  const subheadline =
    !activeCategory && !isControl
      ? t("productsPageSubtitle")
      : getCategoryDescription();

  // Impression tracking once on mount
  useEffect(() => {
    trackConversion("hero_headline_impression", "products", {
      label: variantName,
      element: "products-hero",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="relative">
      {/* Premium Hero Image with enhanced mobile visuals */}
      <div className="relative h-[28vh] xs:h-[34vh] sm:h-[40vh] md:h-[48vh] lg:h-[56vh] xl:h-[60vh] min-h-[240px] sm:min-h-[300px] lg:min-h-[420px] w-full overflow-hidden rounded-b-[2rem] sm:rounded-b-[3rem]">
        {/* Decorative pattern overlay - non-interactive */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle,_rgba(255,255,255,0.12)_1px,_transparent_1px)] bg-[length:20px_20px] z-10 mix-blend-soft-light"></div>

        {/* Soft gradient mesh - non-interactive */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 motion-safe:animate-pulse z-0"></div>

        <Image
          src={categoryImagePath}
          alt={
            activeCategory ? `${activeCategory.label} category` : "STEM Toys"
          }
          fill
          sizes="100vw"
          style={{ objectFit: "cover" }}
          priority
          className="brightness-90"
        />

        {/* Gradient overlays - non-interactive */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/10 via-black/40 to-black/90" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-purple-600/20 mix-blend-multiply" />

        {/* Content overlay should capture clicks */}
        <div className="absolute inset-0 z-20 flex items-end sm:items-center">
          <div className="container mx-auto px-4 sm:px-6 pb-8 sm:pb-0 text-white">
            <div className="max-w-4xl animate-fadeIn">
              {/* Premium category badge */}
              <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                <div
                  className={`${activeCategoryInfo.bgColor} p-2 sm:p-3 rounded-2xl shadow-2xl backdrop-blur-sm border border-white/20`}
                >
                  <IconComponent className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
                </div>
                <span className="text-sm sm:text-base md:text-lg font-black bg-gradient-to-r from-white to-white/90 text-transparent bg-clip-text px-4 sm:px-5 py-2 sm:py-2.5 rounded-2xl backdrop-blur-md bg-white/10 border border-white/20 shadow-xl">
                  {activeCategory ? activeCategory.label : t("allCategories")}
                </span>
              </div>

              {/* Premium headline with better mobile typography */}
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black mb-3 sm:mb-4 drop-shadow-2xl tracking-tight leading-tight">
                <span className="bg-gradient-to-r from-white via-blue-100 to-purple-100 text-transparent bg-clip-text">
                  {headline}
                </span>
              </h1>

              {/* Premium subheadline */}
              <p className="text-sm sm:text-base md:text-lg max-w-2xl text-white/95 drop-shadow-lg backdrop-blur-md bg-black/20 px-4 sm:px-5 py-3 sm:py-4 rounded-2xl shadow-xl border border-white/10 leading-relaxed">
                {subheadline}
              </p>

              {/* CTAs */}
              <div className="mt-5 sm:mt-6 flex flex-col sm:flex-row gap-3 sm:gap-4">
                <Link
                  href="/contact"
                  onClick={() =>
                    trackEvent("cta_click", "products", {
                      label: "get_personalized_recommendations",
                      element: "products-hero-primary",
                      variant: variantName,
                    })
                  }
                  className="relative z-30 group inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-primary via-blue-600 to-purple-600 px-6 py-3 sm:px-7 sm:py-4 text-sm sm:text-base font-black text-white shadow-2xl hover:shadow-3xl transition-all duration-500 hover:scale-[1.03] border border-white/20 backdrop-blur-sm overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
                >
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                  <span className="relative z-10">
                    {t("getPersonalizedRecommendations")}
                  </span>
                </Link>
                <Link
                  href="/blog"
                  onClick={() =>
                    trackEvent("cta_click", "products", {
                      label: "see_success_stories",
                      element: "products-hero-secondary",
                      variant: variantName,
                    })
                  }
                  className="relative z-30 group inline-flex items-center justify-center rounded-2xl bg-white/15 backdrop-blur-xl px-6 py-3 sm:px-7 sm:py-4 text-sm sm:text-base font-black text-white border border-white/30 shadow-xl hover:bg-white/25 hover:shadow-2xl transition-all duration-500 hover:scale-[1.03] overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
                >
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-white/10 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                  <span className="relative z-10">
                    {t("seeSuccessStories")}
                  </span>
                </Link>
              </div>

              {/* Premium social proof */}
              <div className="mt-4 sm:mt-5 text-xs sm:text-sm text-white/90 backdrop-blur-md bg-gradient-to-r from-black/20 to-black/10 inline-flex items-center gap-2 px-4 py-2 rounded-2xl border border-white/10 shadow-lg">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-lg"></div>
                <span className="font-black">{t("socialProofNumber")}</span>
                <span>{t("socialProofText")}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative bubbles - non-interactive (hidden on small screens) */}
      <div className="hidden sm:block pointer-events-none absolute -bottom-4 left-0 w-20 h-20 rounded-full bg-blue-500/20 blur-2xl motion-safe:animate-pulse"></div>
      <div
        className="hidden sm:block pointer-events-none absolute -bottom-6 left-1/4 w-24 h-24 rounded-full bg-green-500/20 blur-2xl motion-safe:animate-pulse"
        style={{ animationDelay: "0.5s" }}
      ></div>
      <div
        className="hidden sm:block pointer-events-none absolute -bottom-8 right-1/3 w-32 h-32 rounded-full bg-yellow-500/20 blur-2xl motion-safe:animate-pulse"
        style={{ animationDelay: "1s" }}
      ></div>
      <div
        className="hidden sm:block pointer-events-none absolute -bottom-5 right-0 w-20 h-20 rounded-full bg-purple-500/20 blur-2xl motion-safe:animate-pulse"
        style={{ animationDelay: "1.5s" }}
      ></div>
    </div>
  );
}
