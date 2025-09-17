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
      {/* Hero Image with enhanced visuals */}
      <div className="relative h-[24vh] sm:h-[28vh] min-h-[200px] max-h-[320px] w-full overflow-hidden">
        {/* Decorative pattern overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(circle,_rgba(255,255,255,0.08)_1px,_transparent_1px)] bg-[length:16px_16px] z-20 mix-blend-soft-light"></div>

        <Image
          src={categoryImagePath}
          alt={
            activeCategory ? `${activeCategory.label} category` : "STEM Toys"
          }
          fill
          sizes="100vw"
          style={{ objectFit: "cover" }}
          priority
          className="brightness-85 scale-105 transform transition-transform duration-10000 animate-slow-zoom"
        />
        {/* Enhanced gradient overlay with brand color */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/50 to-black/80" />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-transparent mix-blend-multiply" />

        {/* Hero Content Overlay */}
        <div className="absolute inset-0 flex items-center">
          <div className="container mx-auto px-4 sm:px-6 text-white">
            <div className="max-w-3xl animate-fadeIn">
              <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-2.5">
                <div
                  className={`${activeCategoryInfo.bgColor} p-1.5 sm:p-2.5 rounded-full shadow-lg`}
                >
                  <IconComponent className="h-3.5 w-3.5 sm:h-5 sm:w-5 text-white" />
                </div>
                <span className="text-xs sm:text-sm md:text-lg font-extrabold bg-gradient-to-r from-primary to-primary/80 text-white px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full shadow-md">
                  {activeCategory ? activeCategory.label : t("allCategories")}
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold mb-1.5 sm:mb-3 drop-shadow-lg tracking-tight">
                {headline}
              </h1>
              <p className="text-xs sm:text-sm max-w-2xl text-white drop-shadow-md sm:block backdrop-blur-sm bg-black/10 inline-block px-3 py-1.5 rounded-lg sm:rounded-xl shadow-inner">
                {subheadline}
              </p>

              {/* Enhanced CTAs and Social Proof */}
              <div className="mt-3 sm:mt-5 flex flex-col sm:flex-row gap-2.5 sm:gap-3">
                <Link
                  href="/contact"
                  onClick={() =>
                    trackEvent("cta_click", "products", {
                      label: "get_personalized_recommendations",
                      element: "products-hero-primary",
                      variant: variantName,
                    })
                  }
                  className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-primary to-primary/80 px-4 py-2 sm:px-5 sm:py-2.5 text-xs sm:text-sm font-bold text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
                >
                  {t("getPersonalizedRecommendations")}
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
                  className="inline-flex items-center justify-center rounded-full bg-white/15 backdrop-blur-md px-4 py-2 sm:px-5 sm:py-2.5 text-xs sm:text-sm font-bold text-white border border-white/20 shadow-md hover:bg-white/25 transition-all duration-300"
                >
                  {t("seeSuccessStories")}
                </Link>
              </div>

              <div className="mt-2.5 sm:mt-4 text-[10px] sm:text-xs text-white backdrop-blur-sm bg-black/5 inline-block px-2.5 py-1 rounded-full">
                <span className="font-extrabold">{t("socialProofNumber")}</span>{" "}
                {t("socialProofText")}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced bubble decorations with animation */}
      <div className="absolute -bottom-4 left-0 w-10 sm:w-20 h-10 sm:h-20 rounded-full bg-blue-500/20 blur-2xl animate-pulse"></div>
      <div
        className="absolute -bottom-6 left-1/4 w-12 sm:w-24 h-12 sm:h-24 rounded-full bg-green-500/20 blur-2xl animate-pulse"
        style={{ animationDelay: "0.5s" }}
      ></div>
      <div
        className="absolute -bottom-8 right-1/3 w-16 sm:w-32 h-16 sm:h-32 rounded-full bg-yellow-500/20 blur-2xl animate-pulse"
        style={{ animationDelay: "1s" }}
      ></div>
      <div
        className="absolute -bottom-5 right-0 w-10 sm:w-20 h-10 sm:h-20 rounded-full bg-purple-500/20 blur-2xl animate-pulse"
        style={{ animationDelay: "1.5s" }}
      ></div>
    </div>
  );
}
