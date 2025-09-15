"use client";

import Image from "next/image";
import React from "react";

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

// [REFAC] CategoriesSection: Mobile-first, touch-friendly, accessible, and visually stunning
// - 1-col grid on mobile, 2-col on small tablets, 3-col on medium, 5-col on large screens
// - Cards are full-width and touch-friendly on mobile (min-h-[44px], py-4, gap-y-6)
// - Increased spacing between cards for easier tapping
// - All interactive elements have ARIA labels, focus/hover/active states
// - Responsive typography, no text overflow
// - All styling via Tailwind utilities (no custom CSS)
// - No horizontal scrolling at any breakpoint
// - Comments explain all major changes and rationale

const CategoriesSectionComponent = ({
  categories,
  t,
}: CategoriesSectionProps) => (
  <section className="py-4 sm:py-6 md:py-8 lg:py-10 bg-muted">
    <div className="container mx-auto px-4 max-w-7xl">
      <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold mb-2 sm:mb-3 md:mb-4 text-center leading-tight">
        {t("stemCategories")}
      </h2>
      <p className="text-center text-muted-foreground mb-4 sm:mb-6 md:mb-8 max-w-3xl mx-auto px-4 text-xs sm:text-sm md:text-base lg:text-lg leading-relaxed">
        {t("stemCategoriesDesc")}
      </p>
      {/* Responsive grid: 2-col mobile, 2-col sm, 3-col md, 4-col lg+ for compact mobile experience */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4 lg:gap-6 justify-items-center">
        {categories.map(category => {
          // Get translated category name and description based on slug
          const getCategoryName = (slug: string) => {
            switch (slug) {
              case "science":
                return t("scienceCategory");
              case "technology":
                return t("technologyCategory");
              case "engineering":
                return t("engineeringCategory");
              case "mathematics":
                return t("mathematicsCategory");
              case "educational-books":
                return t("educationalBooksCategory");
              default:
                return category.name;
            }
          };

          const getCategoryDescription = (slug: string) => {
            switch (slug) {
              case "science":
                return t("scienceCategoryDesc");
              case "technology":
                return t("technologyCategoryDesc");
              case "engineering":
                return t("engineeringCategoryDesc");
              case "mathematics":
                return t("mathCategoryDesc");
              case "educational-books":
                return t("educationalBooksCategoryDesc");
              default:
                return category.description;
            }
          };

          const translatedName = getCategoryName(category.slug);
          const translatedDescription = getCategoryDescription(category.slug);

          return (
            <a
              href="/categories"
              key={category.slug}
              aria-label={`Explore ${translatedName} category`}
              tabIndex={0}
              data-conversion="cta"
              data-conversion-type="click"
              data-conversion-category="navigation"
              data-conversion-action="explore_category"
              data-conversion-element={`category_${category.slug}`}
              data-conversion-metadata={`{"category":"${category.slug}","categoryName":"${translatedName}"}`}
              className="bg-background rounded-lg overflow-hidden shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-1 min-h-[120px] sm:min-h-[140px] md:min-h-[160px] lg:min-h-[180px] flex flex-col focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 w-full max-w-xs sm:max-w-sm"
            >
              {/* Category image, always object-cover and responsive */}
              <div className="relative h-12 sm:h-16 md:h-20 lg:h-24 w-full">
                <Image
                  src={category.image}
                  alt={translatedName}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  className="object-cover w-full h-full rounded-t-lg"
                  priority={false}
                  loading="lazy"
                />
              </div>
              <div className="p-2 sm:p-3 md:p-4 flex flex-col flex-grow">
                <h3 className="text-xs sm:text-sm md:text-base lg:text-lg font-bold mb-1 sm:mb-2 text-gray-900 leading-tight truncate">
                  {translatedName}
                </h3>
                <p
                  className="text-muted-foreground text-[10px] sm:text-xs md:text-sm mb-2 sm:mb-3 flex-grow overflow-hidden"
                  style={{
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                  }}
                >
                  {translatedDescription}
                </p>
                <div className="mt-auto">
                  <span className="text-primary text-[10px] sm:text-xs md:text-sm font-medium inline-flex items-center hover:text-primary/80 transition-colors">
                    <span className="truncate">
                      {t("exploreCategories").split(" ")[0]} {translatedName}
                    </span>
                    <svg
                      className="ml-1 w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </span>
                </div>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  </section>
);

export const CategoriesSection = React.memo(CategoriesSectionComponent);
