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
        <div className="container mx-auto px-2 sm:px-4 py-1.5 sm:py-4">
          {/* Top navigation buttons - Filter out duplicates by key */}
          <div className="flex items-center justify-center">
            <div className="flex gap-1 sm:gap-3 justify-center w-full max-w-5xl">
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
                          : key === "mathematics"
                            ? "border-purple-500 text-purple-700 hover:bg-purple-50"
                            : "border-red-500 text-red-700 hover:bg-red-50";

                  const activeColor =
                    key === "science"
                      ? "bg-blue-500 text-white"
                      : key === "technology"
                        ? "bg-green-500 text-white"
                        : key === "engineering"
                          ? "bg-orange-500 text-white"
                          : key === "mathematics"
                            ? "bg-purple-500 text-white"
                            : "bg-red-500 text-white";

                  // Convert both to lowercase for comparison
                  const isSelected = selectedCategories.some(
                    cat => normalizeCategory(cat) === normalizeCategory(key)
                  );

                  return (
                    <Button
                      key={key}
                      variant="outline"
                      size="sm"
                      className={`flex-1 sm:flex-none h-8 sm:h-12 px-1 sm:px-5 rounded-full text-[10px] sm:text-sm font-bold flex items-center justify-center gap-0.5 sm:gap-2 border-2 transition-all hover:scale-105 shadow-sm ${
                        isSelected ? activeColor : categoryColor
                      }`}
                      onClick={() => handleCategoryChange(key)}
                    >
                      <CategoryIcon className="h-3 w-3 sm:h-5 sm:w-5 flex-shrink-0" />
                      <span className="hidden sm:inline truncate">
                        {t(
                          `${key}Category`,
                          key.charAt(0).toUpperCase() + key.slice(1)
                        )}
                      </span>
                      <span className="sm:hidden text-[10px] font-extrabold tracking-tight">
                        {category.letter}
                      </span>
                    </Button>
                  );
                })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
