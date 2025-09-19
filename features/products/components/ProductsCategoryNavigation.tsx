"use client";

import { SlidersHorizontal, LucideIcon } from "lucide-react";
import React from "react";

import { Button } from "@/components/ui/button";
import { normalizeCategory } from "@/lib/utils/product-filters-url";

interface CategoryIconInfo {
  icon: LucideIcon;
  bgColor: string;
  textColor: string;
  letter: string;
}

interface ProductsCategoryNavigationProps {
  categoryInfo: Record<string, CategoryIconInfo>;
  selectedCategories: string[];
  handleCategoryChange: (key: string) => void;
  setMobileFiltersOpen: (open: boolean) => void;
  t: (key: string, fallback?: string) => string;
}

export function ProductsCategoryNavigation({
  categoryInfo,
  selectedCategories,
  handleCategoryChange,
  setMobileFiltersOpen,
  t,
}: ProductsCategoryNavigationProps) {
  return (
    <>
      {/* Premium STEM Category Navigation - Enhanced for mobile */}
      <div className="sticky top-14 sm:top-16 z-30 bg-gradient-to-b from-white via-white/98 to-white/95 backdrop-blur-xl border-b border-gray-100/60 shadow-lg">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          {/* Premium category navigation with better mobile UX */}
          <div className="flex items-center justify-center relative">
            {/* Mobile scroll indicators */}
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-8 h-full bg-gradient-to-r from-white via-white/80 to-transparent pointer-events-none z-10 md:hidden"></div>
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-8 h-full bg-gradient-to-l from-white via-white/80 to-transparent pointer-events-none z-10 md:hidden"></div>

            <div
              className="flex gap-2 sm:gap-3 justify-start md:justify-center w-full max-w-6xl overflow-x-auto scrollbar-hide pb-1 pt-1"
              style={{
                scrollbarWidth: "none",
                msOverflowStyle: "none",
                WebkitScrollbar: { display: "none" },
              }}
            >
              {Object.entries(categoryInfo)
                .filter(
                  ([key, _]) =>
                    // Filter out engineeringlearning from top nav to prevent duplication with engineering
                    key !== "engineeringlearning"
                )
                .map(([key, category]) => {
                  const CategoryIcon = category.icon;

                  // Premium color schemes for each category
                  const categoryStyles = {
                    science: {
                      inactive:
                        "border-blue-200 bg-gradient-to-r from-blue-50 to-blue-100/80 text-blue-700 hover:from-blue-100 hover:to-blue-200 hover:border-blue-300",
                      active:
                        "bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 text-white border-blue-600 shadow-blue-200/50",
                    },
                    technology: {
                      inactive:
                        "border-green-200 bg-gradient-to-r from-green-50 to-green-100/80 text-green-700 hover:from-green-100 hover:to-green-200 hover:border-green-300",
                      active:
                        "bg-gradient-to-r from-green-500 via-green-600 to-green-700 text-white border-green-600 shadow-green-200/50",
                    },
                    engineering: {
                      inactive:
                        "border-orange-200 bg-gradient-to-r from-orange-50 to-orange-100/80 text-orange-700 hover:from-orange-100 hover:to-orange-200 hover:border-orange-300",
                      active:
                        "bg-gradient-to-r from-orange-500 via-orange-600 to-orange-700 text-white border-orange-600 shadow-orange-200/50",
                    },
                    mathematics: {
                      inactive:
                        "border-purple-200 bg-gradient-to-r from-purple-50 to-purple-100/80 text-purple-700 hover:from-purple-100 hover:to-purple-200 hover:border-purple-300",
                      active:
                        "bg-gradient-to-r from-purple-500 via-purple-600 to-purple-700 text-white border-purple-600 shadow-purple-200/50",
                    },
                    "educational-books": {
                      inactive:
                        "border-red-200 bg-gradient-to-r from-red-50 to-red-100/80 text-red-700 hover:from-red-100 hover:to-red-200 hover:border-red-300",
                      active:
                        "bg-gradient-to-r from-red-500 via-red-600 to-red-700 text-white border-red-600 shadow-red-200/50",
                    },
                  };

                  const styles =
                    categoryStyles[key as keyof typeof categoryStyles] ||
                    categoryStyles.science;

                  // Convert both to lowercase for comparison
                  const isSelected = selectedCategories.some(
                    cat => normalizeCategory(cat) === normalizeCategory(key)
                  );

                  const categoryLabel = t(
                    `${key}Category`,
                    key.charAt(0).toUpperCase() + key.slice(1)
                  );

                  return (
                    <Button
                      key={key}
                      variant="outline"
                      size="sm"
                      className={`
                        group flex-shrink-0 h-11 sm:h-12 px-3 sm:px-5 rounded-2xl text-xs sm:text-sm font-black 
                        flex items-center justify-center gap-1.5 sm:gap-2 border-2 
                        transition-all duration-300 hover:scale-105 active:scale-95 
                        shadow-lg hover:shadow-xl backdrop-blur-sm
                        ${
                          isSelected
                            ? `${styles.active} shadow-xl transform scale-105`
                            : styles.inactive
                        }
                      `}
                      onClick={() => handleCategoryChange(key)}
                      title={categoryLabel}
                    >
                      <CategoryIcon className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 group-hover:rotate-12 transition-transform duration-300" />

                      {/* Desktop and large mobile text */}
                      <span className="hidden xs:inline truncate font-black">
                        {key === "mathematics"
                          ? "Math"
                          : key === "educational-books"
                            ? "Books"
                            : categoryLabel.length > 8
                              ? categoryLabel.substring(0, 8) + "..."
                              : categoryLabel}
                      </span>

                      {/* Small mobile - show letter only */}
                      <span className="xs:hidden text-sm font-black tracking-tight">
                        {category.letter}
                      </span>

                      {/* Active indicator */}
                      {isSelected && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full shadow-md flex items-center justify-center">
                          <div className="w-1.5 h-1.5 bg-current rounded-full animate-pulse"></div>
                        </div>
                      )}
                    </Button>
                  );
                })}
            </div>
          </div>

          {/* Premium scroll hint for mobile */}
          <div className="md:hidden flex justify-center mt-2">
            <div className="flex items-center gap-1 text-xs text-gray-500 bg-gray-50 px-3 py-1 rounded-full">
              <div className="flex gap-0.5">
                <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"></div>
                <div
                  className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.1s" }}
                ></div>
                <div
                  className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                ></div>
              </div>
              <span className="ml-1">Swipe to explore</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
