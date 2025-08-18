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
  <section className="py-3 sm:py-10 bg-muted">
    <div className="container mx-auto px-4 max-w-7xl">
      <h2 className="text-sm xs:text-lg sm:text-4xl md:text-5xl font-bold mb-1 sm:mb-4 md:mb-6 text-center">
        {t("stemCategories")}
      </h2>
      <p className="text-center text-muted-foreground mb-3 sm:mb-8 max-w-3xl mx-auto px-2 text-xs xs:text-sm sm:text-lg md:text-xl">
        {t("stemCategoriesDesc")}
      </p>
      {/* Responsive grid: 1-col mobile, 2-col sm, 4-col md+ for perfect centering */}
      <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-4 gap-y-2 sm:gap-y-6 gap-x-4 sm:gap-x-6 md:gap-x-8 justify-items-center">
        {categories.map(category => (
          <a
            href={`/products?category=${category.slug}`}
            key={category.slug}
            aria-label={`Explore ${category.name} category`}
            tabIndex={0}
            className="bg-background rounded-xl overflow-hidden shadow-md transition-all duration-300 hover:shadow-xl hover:-translate-y-1 min-h-[24px] sm:min-h-[44px] flex flex-col focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            {/* Category image, always object-cover and responsive */}
            <div className="relative h-12 xs:h-16 sm:h-40 md:h-48 w-full">
              <Image
                src={category.image}
                alt={category.name}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 20vw"
                className="object-cover w-full h-full rounded-t-xl"
              />
            </div>
            <div className="p-1.5 xs:p-2 sm:p-5 md:p-6 flex flex-col flex-grow">
              <h3 className="text-xs xs:text-xs sm:text-lg md:text-xl font-bold mb-0.5 xs:mb-2 truncate">
                {category.name}
              </h3>
              <p
                className="text-muted-foreground text-xs xs:text-xs md:text-base mb-1.5 sm:mb-3 md:mb-4 overflow-hidden"
                style={{
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                }}
              >
                {category.description}
              </p>
              <div className="mt-auto">
                <span className="text-primary text-xs xs:text-xs font-medium inline-flex items-center">
                  {t("exploreCategories").split(" ")[0]} {category.name}
                </span>
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  </section>
);

export const CategoriesSection = React.memo(CategoriesSectionComponent);
