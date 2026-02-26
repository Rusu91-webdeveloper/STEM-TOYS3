"use client";

import { LucideIcon } from "lucide-react";
import Image from "next/image";
import React from "react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useConversionTracking } from "@/lib/conversion-tracking";

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
  const { getVariant, trackConversion } = useConversionTracking();
  const [resolvedCategoryImagePath, setResolvedCategoryImagePath] =
    useState(categoryImagePath);
  const variant = getVariant("products_hero_headline");
  const variantName = variant?.id || "control";
  const isControl = variant?.isControl ?? true;
  
  // Create trackEvent wrapper that matches the expected signature
  const trackEvent = (action: string, category: string, options?: {
    label?: string;
    value?: number;
    element?: string;
    variant?: string;
  }) => {
    trackConversion(action, category, {
      ...options,
      variant: variant?.name,
    });
  };

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
      variant: variant?.name,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setResolvedCategoryImagePath(categoryImagePath);
  }, [categoryImagePath]);

  const mobileStats = [
    { label: t("heroStatProducts", "Produse STEM"), value: "120+" },
    { label: t("heroStatFamilies", "Familii fericite"), value: "2.5k+" },
    { label: t("heroStatDelivery", "Livrare rapidă"), value: "24h" },
  ];

  return (
    <section className="relative">
      <div className="relative overflow-hidden rounded-[1.5rem] border border-[#e5dcc9] bg-[#f7f1e5] shadow-[0_28px_55px_-45px_rgba(30,41,59,0.55)] sm:rounded-[2rem]">
        <div className="pointer-events-none absolute inset-0 opacity-40 bg-[radial-gradient(circle,_rgba(15,23,42,0.10)_1px,_transparent_1px)] bg-[length:16px_16px]" />

        <div className="grid min-h-[320px] grid-cols-1 md:min-h-[360px] lg:min-h-[380px] lg:grid-cols-[1.05fr_0.95fr]">
          <div className="relative order-2 min-h-[180px] lg:order-1 lg:min-h-full">
            <Image
              src={resolvedCategoryImagePath}
              alt={
                activeCategory ? `${activeCategory.label} category` : "STEM Toys"
              }
              fill
              sizes="(max-width: 1024px) 100vw, 48vw"
              priority
              className="object-cover object-center"
              onError={() => {
                if (resolvedCategoryImagePath !== "/HeroImageTechTechtots.png") {
                  setResolvedCategoryImagePath("/HeroImageTechTechtots.png");
                }
              }}
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-900/55 via-slate-900/15 to-transparent lg:bg-gradient-to-r lg:from-slate-900/35 lg:via-transparent lg:to-transparent" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#f7f1e5] to-transparent lg:hidden" />
          </div>

          <div className="order-1 p-3 sm:p-4 lg:order-2 lg:p-6 xl:p-8">
            <div className="relative h-full rounded-2xl border border-white/80 bg-white/80 p-4 shadow-[0_16px_30px_-24px_rgba(15,23,42,0.35)] backdrop-blur-sm sm:p-5 lg:flex lg:flex-col lg:justify-between">
              <div>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    {t("curatedStemStore", "Curated STEM Store")}
                  </div>
                  <div
                    className={`${activeCategoryInfo.bgColor} flex h-9 w-9 items-center justify-center rounded-xl border border-white/60 shadow-sm`}
                  >
                    <IconComponent className="h-4 w-4 text-white" />
                  </div>
                </div>

                <div className="mb-3 inline-flex items-center rounded-full border border-[#eadfca] bg-[#fbf7ef] px-3 py-1 text-xs font-medium text-slate-700">
                  {activeCategory ? activeCategory.label : t("allCategories")}
                </div>

                <h1 className="font-serif text-[1.7rem] leading-tight text-slate-900 sm:text-[2rem] md:text-[2.1rem] lg:text-[2.15rem] xl:text-[2.35rem]">
                  {headline}
                </h1>

                <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-600 sm:text-base">
                  {subheadline}
                </p>
              </div>

              <div className="mt-4 space-y-3 sm:mt-5">
                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                  <Link
                    href="/blog"
                    onClick={() =>
                      trackEvent("cta_click", "products", {
                        label: "see_success_stories",
                        element: "products-hero-secondary",
                        variant: variantName,
                      })
                    }
                    className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
                  >
                    {t("seeSuccessStories")}
                  </Link>

                  <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs sm:text-sm text-slate-600">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    <span className="font-semibold text-slate-900">
                      {t("socialProofNumber")}
                    </span>
                    <span>{t("socialProofText")}</span>
                  </div>
                </div>

                <div className="hidden sm:grid sm:grid-cols-2 xl:grid-cols-3 gap-2.5">
                  {mobileStats.map(stat => (
                    <div
                      key={stat.label}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2.5"
                    >
                      <div className="text-lg font-semibold text-slate-900">
                        {stat.value}
                      </div>
                      <div className="text-[10px] uppercase tracking-[0.14em] text-slate-500">
                        {stat.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 px-1 sm:hidden">
        {mobileStats.map(stat => (
          <div
            key={stat.label}
            className="rounded-xl border border-slate-200 bg-white/95 px-3 py-2.5 shadow-sm"
          >
            <div className="text-lg font-semibold text-slate-900">
              {stat.value}
            </div>
            <div className="text-[10px] uppercase tracking-[0.14em] text-slate-500">
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
