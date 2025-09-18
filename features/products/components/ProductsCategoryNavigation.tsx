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

      {/* Premium Mobile Filter Button - Multi-Million Dollar Style */}
      <div className="md:hidden sticky top-[88px] sm:top-[96px] z-20 bg-gradient-to-b from-white via-white/95 to-white/90 backdrop-blur-sm">
        <div className="flex justify-center py-3 px-4 border-b border-gray-100">
          <Button
            className="w-full max-w-md h-12 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-sm font-bold shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden group"
            onClick={() => setMobileFiltersOpen(true)}
            aria-label="Open filters"
          >
            {/* Animated background effect */}
            <span className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />

            {/* Button content */}
            <span className="relative flex items-center justify-center gap-2">
              <span className="p-1.5 bg-white/20 rounded-lg">
                <SlidersHorizontal className="h-4 w-4" />
              </span>
              <span>{t("filterAndSort", "Filtrare și Sortare")}</span>
              <span className="ml-auto bg-white/20 px-2.5 py-1 rounded-full text-xs">
                {t("allFilters", "Toate")}
              </span>
            </span>

            {/* Pulse animation for attention */}
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
            </span>
          </Button>
        </div>

        {/* Quick filter chips for mobile - Premium style */}
        <div className="flex gap-2 px-4 py-2 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setMobileFiltersOpen(true)}
            className="px-4 py-1.5 bg-gradient-to-r from-yellow-100 to-yellow-50 text-yellow-700 border border-yellow-200 rounded-full text-xs font-medium whitespace-nowrap hover:from-yellow-200 hover:to-yellow-100 transition-all duration-300 shadow-sm"
          >
            {t("newArrivals", "Noutăți")} ✨
          </button>
          <button
            onClick={() => setMobileFiltersOpen(true)}
            className="px-4 py-1.5 bg-gradient-to-r from-red-100 to-orange-50 text-red-700 border border-red-200 rounded-full text-xs font-medium whitespace-nowrap hover:from-red-200 hover:to-orange-100 transition-all duration-300 shadow-sm"
          >
            {t("bestSellers", "Bestsellers")} 🔥
          </button>
          <button
            onClick={() => setMobileFiltersOpen(true)}
            className="px-4 py-1.5 bg-gradient-to-r from-green-100 to-emerald-50 text-green-700 border border-green-200 rounded-full text-xs font-medium whitespace-nowrap hover:from-green-200 hover:to-emerald-100 transition-all duration-300 shadow-sm"
          >
            {t("onSale", "Reduceri")} 🏷️
          </button>
          <button
            onClick={() => setMobileFiltersOpen(true)}
            className="px-4 py-1.5 bg-gradient-to-r from-purple-100 to-pink-50 text-purple-700 border border-purple-200 rounded-full text-xs font-medium whitespace-nowrap hover:from-purple-200 hover:to-pink-100 transition-all duration-300 shadow-sm"
          >
            {t("giftIdeas", "Cadouri")} 🎁
          </button>
          <button
            onClick={() => setMobileFiltersOpen(true)}
            className="px-4 py-1.5 bg-gradient-to-r from-blue-100 to-indigo-50 text-blue-700 border border-blue-200 rounded-full text-xs font-medium whitespace-nowrap hover:from-blue-200 hover:to-indigo-100 transition-all duration-300 shadow-sm"
          >
            {t("under50", "Sub 50 RON")} 💰
          </button>
        </div>
      </div>
    </>
  );
}
