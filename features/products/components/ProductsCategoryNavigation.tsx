"use client";

import { SlidersHorizontal, LucideIcon } from "lucide-react";
import React from "react";

import { Button } from "@/components/ui/button";

interface CategoryIconInfo {
  icon: LucideIcon;
  bgColor: string;
  textColor: string;
  letter: string;
}

interface ProductsCategoryNavigationProps {
  categoryInfo: Record<string, CategoryIconInfo>;
  selectedCategories: string[];
  normalizeCategory: (name: string) => string;
  handleCategoryChange: (key: string) => void;
  setMobileFiltersOpen: (open: boolean) => void;
  t: (key: string, fallback?: string) => string;
}

export function ProductsCategoryNavigation({
  categoryInfo,
  selectedCategories,
  normalizeCategory,
  handleCategoryChange,
  setMobileFiltersOpen,
  t,
}: ProductsCategoryNavigationProps) {
  return (
    <>
      {/* Enhanced STEM Category Filters - Prominent positioning */}
      <div className="sticky top-14 sm:top-16 z-20 bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-4">
          {/* Top navigation buttons - Filter out duplicates by key */}
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4">
            <div className="flex flex-wrap gap-1.5 sm:gap-3 justify-center">
              {Object.entries(categoryInfo)
                .filter(
                  ([key, _]) =>
                    // Filter out engineeringlearning from top nav to prevent duplication with engineering
                    key !== "engineeringlearning"
                )
                .map(([key, category]) => {
                  const CategoryIcon = category.icon;
                  const categoryColor =
                    key === "science"
                      ? "border-blue-500 text-blue-700 hover:bg-blue-50"
                      : key === "technology"
                        ? "border-green-500 text-green-700 hover:bg-green-50"
                        : key === "engineering"
                          ? "border-orange-500 text-orange-700 hover:bg-orange-50"
                          : "border-purple-500 text-purple-700 hover:bg-purple-50";

                  const activeColor =
                    key === "science"
                      ? "bg-blue-500 text-white"
                      : key === "technology"
                        ? "bg-green-500 text-white"
                        : key === "engineering"
                          ? "bg-orange-500 text-white"
                          : "bg-purple-500 text-white";

                  // Convert both to lowercase for comparison
                  const isSelected = selectedCategories.some(
                    cat => normalizeCategory(cat) === normalizeCategory(key)
                  );

                  return (
                    <Button
                      key={key}
                      variant="outline"
                      size="sm"
                      className={`h-8 sm:h-12 px-2 sm:px-5 rounded-full text-xs sm:text-sm font-medium flex items-center gap-1 sm:gap-2 border-2 transition-all hover:scale-105 ${
                        isSelected ? activeColor : categoryColor
                      }`}
                      onClick={() => handleCategoryChange(key)}
                    >
                      <CategoryIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                      <span className="hidden xs:inline">
                        {t(
                          `${key}Category`,
                          key.charAt(0).toUpperCase() + key.slice(1)
                        )}
                      </span>
                      <span className="xs:hidden">{category.letter}</span>
                    </Button>
                  );
                })}
            </div>
          </div>
        </div>
      </div>

      {/* After the category icon row, add a Filter button for mobile/tablet */}
      <div className="md:hidden flex justify-center py-2">
        <Button
          className="w-full max-w-xs rounded-full bg-primary text-white text-base font-semibold py-3 shadow-md"
          onClick={() => setMobileFiltersOpen(true)}
          aria-label="Open filters"
        >
          <SlidersHorizontal className="inline-block mr-2 h-5 w-5" />
          {t("filterOptions", "Filtrează")}
        </Button>
      </div>
    </>
  );
}
