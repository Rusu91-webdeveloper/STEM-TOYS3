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
      {/* Hero Image */}
      <div className="relative h-[20vh] sm:h-[25vh] min-h-[180px] max-h-[300px] w-full">
        <Image
          src={categoryImagePath}
          alt={
            activeCategory ? `${activeCategory.label} category` : "STEM Toys"
          }
          fill
          sizes="100vw"
          style={{ objectFit: "cover" }}
          priority
          className="brightness-75"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-black/70" />

        {/* Hero Content Overlay */}
        <div className="absolute inset-0 flex items-center">
          <div className="container mx-auto px-3 sm:px-6 text-white">
            <div className="max-w-3xl">
              <div className="flex items-center gap-1.5 sm:gap-3 mb-1 sm:mb-2">
                <div
                  className={`${activeCategoryInfo.bgColor} p-1 sm:p-2 rounded-full`}
                >
                  <IconComponent className="h-3 w-3 sm:h-5 sm:w-5 text-white" />
                </div>
                <span className="text-xs sm:text-sm md:text-lg font-bold bg-primary/80 text-white px-1.5 sm:px-3 py-0.5 sm:py-1 rounded-md">
                  {activeCategory ? activeCategory.label : t("allCategories")}
                </span>
              </div>

              <h1 className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-1 sm:mb-2 drop-shadow-lg">
                {headline}
              </h1>
              <p className="text-xs sm:text-sm max-w-2xl text-white/90 drop-shadow-md hidden sm:block">
                {subheadline}
              </p>

              {/* CTAs and Social Proof */}
              <div className="mt-2 sm:mt-4 flex flex-col sm:flex-row gap-2 sm:gap-3">
                <Link
                  href="/contact"
                  onClick={() =>
                    trackEvent("cta_click", "products", {
                      label: "get_personalized_recommendations",
                      element: "products-hero-primary",
                      variant: variantName,
                    })
                  }
                  className="inline-flex items-center justify-center rounded-md bg-primary px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold text-white shadow hover:opacity-95"
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
                  className="inline-flex items-center justify-center rounded-md bg-white/10 backdrop-blur px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold text-white hover:bg-white/15"
                >
                  {t("seeSuccessStories")}
                </Link>
              </div>

              <div className="mt-2 sm:mt-3 text-[10px] sm:text-xs text-white/90">
                <span className="font-bold">{t("socialProofNumber")}</span>{" "}
                {t("socialProofText")}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bubble decorations - made smaller and less distracting */}
      <div className="absolute -bottom-4 left-0 w-8 sm:w-16 h-8 sm:h-16 rounded-full bg-blue-500/20 blur-xl"></div>
      <div className="absolute -bottom-6 left-1/4 w-10 sm:w-20 h-10 sm:h-20 rounded-full bg-green-500/20 blur-xl"></div>
      <div className="absolute -bottom-8 right-1/3 w-12 sm:w-24 h-12 sm:h-24 rounded-full bg-yellow-500/20 blur-xl"></div>
      <div className="absolute -bottom-5 right-0 w-8 sm:w-16 h-8 sm:h-16 rounded-full bg-purple-500/20 blur-xl"></div>
    </div>
  );
}
