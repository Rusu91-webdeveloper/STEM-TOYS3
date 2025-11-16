"use client";

import Image from "next/image";
import React from "react";
import {
  glassPanelClass,
  // glassCardClass,
  // gradientButtonClass,
} from "@/features/home/components/homeTheme";

interface Category {
  name: string;
  description: string;
  slug: string;
  image: string;
}

interface CategoriesSectionProps {
  categories: Category[];
  t: (key: string, defaultValue?: string) => string;
}

// [REFAC] CategoriesSection: Single professional card design
// - Replaced multiple category cards with single premium design
// - Modern image grid layout with category previews
// - Professional enterprise-level design
// - Reduced visual clutter while maintaining SEO value
// - Clear call-to-action directing users to categories page

const CategoriesSectionComponent = ({
  categories,
  t,
}: CategoriesSectionProps) => {
  // Get category names for the combined card
  const categoryNames = categories.map(category => {
    switch (category.slug) {
      case "science":
        return t("scienceCategory", "Science");
      case "technology":
        return t("technologyCategory", "Technology");
      case "engineering":
        return t("engineeringCategory", "Engineering");
      case "mathematics":
        return t("mathematicsCategory", "Mathematics");
      case "educational-books":
        return t("educationalBooksCategory", "Educational Books");
      default:
        return category.name;
    }
  });

  return (
    <section className="py-4 sm:py-6 md:py-8">
      <div className="container mx-auto max-w-4xl px-3 sm:px-4">
        <div className="mb-5 text-center sm:mb-8">
          <h2 className="bg-gradient-to-r from-emerald-200 via-sky-200 to-indigo-200 bg-clip-text text-xl font-bold tracking-tight text-transparent sm:text-3xl">
            {t("stemCategories", "Explore STEM Categories")}
          </h2>
          <p className="mt-2 text-[0.92rem] text-slate-200/80 sm:mt-3 sm:text-base">
            {t(
              "stemCategoriesDesc",
              "Discover educational toys organized by subject area to find the perfect match for your child's interests"
            )}
          </p>
        </div>

        {/* Single professional card for all categories */}
        <a
          href="/categories"
          aria-label={t(
            "exploreAllCategoriesLabel",
            "Explore all STEM categories"
          )}
          data-conversion="cta"
          data-conversion-type="click"
          data-conversion-category="navigation"
          data-conversion-action="explore_all_categories"
          data-conversion-element="categories_main_card"
          className={`${glassPanelClass} block w-full max-w-3xl transform rounded-3xl border-white/15 transition duration-300 hover:-translate-y-1 hover:border-emerald-400/60 hover:shadow-emerald-500/20`}
        >
          {/* Image collage section */}
          <div className="relative h-[180px] w-full overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-r from-slate-900/80 via-indigo-900/80 to-slate-900/90 sm:h-[230px]">
            <div className="absolute inset-0">
              <svg
                className="h-full w-full text-white/10"
                viewBox="0 0 100 100"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  <pattern
                    id="categories-grid"
                    width="10"
                    height="10"
                    patternUnits="userSpaceOnUse"
                  >
                    <path
                      d="M 10 0 L 0 0 0 10"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="0.5"
                    />
                  </pattern>
                </defs>
                <rect width="100" height="100" fill="url(#categories-grid)" />
              </svg>
            </div>

            <div className="absolute inset-0 flex">
              <div className="flex flex-1 items-center justify-center p-4">
                <div className="relative h-full w-full overflow-hidden rounded-2xl border border-white/10">
                  <Image
                    src="/images/category_banner_science_01.png"
                    alt={t("scienceCategory", "Science")}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-xs text-white sm:text-sm">
                    <span>{t("scienceCategory", "Science")}</span>
                    <span className="rounded-full bg-white/10 px-2 py-0.5 text-[0.65rem] uppercase tracking-wide">
                      STEM
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex flex-1 flex-col gap-4 p-4">
                <div className="relative h-1/2 overflow-hidden rounded-2xl border border-white/10">
                  <Image
                    src="/images/category_banner_technology_01.png"
                    alt={t("technologyCategory", "Technology")}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 25vw, 16vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="absolute bottom-2 left-2 right-2 text-[0.7rem] text-white sm:text-xs">
                    {t("technologyCategory", "Technology")}
                  </div>
                </div>
                <div className="relative h-1/2 overflow-hidden rounded-2xl border border-white/10">
                  <Image
                    src="/images/category_banner_math_01.png"
                    alt={t("mathematicsCategory", "Mathematics")}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 25vw, 16vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="absolute bottom-2 left-2 right-2 text-[0.7rem] text-white sm:text-xs">
                    {t("mathematicsCategory", "Mathematics")}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Content section */}
          <div className="px-4 py-4 sm:px-7 sm:py-6">
            <h3 className="text-base font-semibold text-white sm:text-xl">
              {t("exploreAllCategories", "Explore All STEM Categories")}
            </h3>

            <p className="mt-2 text-sm text-slate-200/80 sm:mt-3 sm:text-base">
              {t(
                "categoriesCardDescription",
                "Discover our complete collection of Science, Technology, Engineering, and Mathematics toys carefully selected for optimal learning and fun."
              )}
            </p>

            {/* Category pills */}
            <div className="mt-4 flex flex-wrap gap-2">
              {categoryNames.map((name, index) => (
                <span
                  key={index}
                  className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-slate-100"
                >
                  {name}
                </span>
              ))}
            </div>

            {/* Call to action */}
            <div className="mt-5 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-4 text-sm sm:flex-row sm:text-base">
              <div className="flex items-center gap-2 font-semibold text-emerald-200">
                {t("viewAllCategories", "View all categories")}
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                  />
                </svg>
              </div>

              <span className="text-xs text-slate-300 sm:text-sm">
                {categories.length} {t("categories", "categories")}
              </span>
            </div>
          </div>
        </a>
      </div>
    </section>
  );
};

export const CategoriesSection = React.memo(CategoriesSectionComponent);
