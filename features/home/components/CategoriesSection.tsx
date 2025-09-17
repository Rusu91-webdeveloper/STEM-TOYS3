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
    <section className="py-10 sm:py-14 md:py-18 lg:py-20 bg-gray-50">
      <div className="container mx-auto px-4 max-w-3xl">
        <h2 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4 text-center">
          {t("stemCategories", "Explore STEM Categories")}
        </h2>
        <p className="text-center text-gray-600 mb-6 sm:mb-8 max-w-xl mx-auto text-sm sm:text-base">
          {t(
            "stemCategoriesDesc",
            "Discover educational toys organized by subject area to find the perfect match for your child's interests"
          )}
        </p>

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
          className="block w-full max-w-2xl mx-auto bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg border border-gray-100 hover:border-gray-200 transition-all duration-300 transform hover:-translate-y-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          {/* Image collage section */}
          <div className="relative h-[220px] w-full bg-gradient-to-r from-green-50 to-blue-50">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-10">
              <svg
                className="w-full h-full"
                viewBox="0 0 100 100"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  <pattern
                    id="grid"
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
                <rect width="100" height="100" fill="url(#grid)" />
              </svg>
            </div>

            {/* Image grid */}
            <div className="absolute inset-0 flex">
              <div className="flex-1 p-3 flex items-center justify-center">
                <div className="w-full h-full relative rounded-lg overflow-hidden">
                  <Image
                    src="/images/category_banner_science_01.png"
                    alt={t("scienceCategory", "Science")}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, 33vw"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                    <span className="text-white text-xs font-medium">
                      {t("scienceCategory", "Science")}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex-1 p-3 flex flex-col justify-between">
                <div className="h-1/2 pb-1.5 relative rounded-lg overflow-hidden">
                  <Image
                    src="/images/category_banner_technology_01.png"
                    alt={t("technologyCategory", "Technology")}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 25vw, 16vw"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-1.5">
                    <span className="text-white text-[10px] font-medium">
                      {t("technologyCategory", "Technology")}
                    </span>
                  </div>
                </div>
                <div className="h-1/2 pt-1.5 relative rounded-lg overflow-hidden">
                  <Image
                    src="/images/category_banner_math_01.png"
                    alt={t("mathematicsCategory", "Mathematics")}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 25vw, 16vw"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-1.5">
                    <span className="text-white text-[10px] font-medium">
                      {t("mathematicsCategory", "Mathematics")}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Content section */}
          <div className="p-6 sm:p-8">
            <h3 className="text-lg sm:text-xl font-semibold mb-2 text-gray-900">
              {t("exploreAllCategories", "Explore All STEM Categories")}
            </h3>

            <p className="text-gray-600 text-sm mb-4">
              {t(
                "categoriesCardDescription",
                "Discover our complete collection of Science, Technology, Engineering, and Mathematics toys carefully selected for optimal learning and fun."
              )}
            </p>

            {/* Category pills */}
            <div className="flex flex-wrap gap-2 mb-4">
              {categoryNames.map((name, index) => (
                <span
                  key={index}
                  className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full"
                >
                  {name}
                </span>
              ))}
            </div>

            {/* Call to action */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <div className="text-green-600 font-medium text-sm flex items-center">
                {t("viewAllCategories", "View all categories")}
                <svg
                  className="ml-1.5 w-4 h-4"
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

              <span className="text-xs text-gray-500">
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
