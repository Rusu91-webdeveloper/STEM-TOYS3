"use client";

import dynamic from "next/dynamic";
import React from "react";

const EnhancedProductFilters = dynamic(
  () =>
    import("./EnhancedProductFilters").then(mod => ({
      default: mod.EnhancedProductFilters,
    })),
  {
    loading: () => (
      <div className="animate-pulse space-y-3">
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="h-8 bg-gray-200 rounded"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        <div className="h-8 bg-gray-200 rounded"></div>
        <div className="h-4 bg-gray-200 rounded w-2/3"></div>
      </div>
    ),
    ssr: false, // Disable SSR for better performance
  }
);

import type { FilterGroup } from "./EnhancedProductFilters";

interface PriceRange {
  min: number;
  max: number;
  current: [number, number];
}

interface ProductsSidebarProps {
  categoryFilter: FilterGroup[];
  dynamicFilters: FilterGroup[];
  priceRangeFilter: [number, number];
  products: Array<{ price: number }>; // Add products prop for price calculation
  selectedCategories: string[];
  selectedFilters: Record<string, string[]>;
  noPriceFilter: boolean;
  selectedLearningOutcomes: string[];
  selectedProductType: string;
  selectedSpecialCategories: string[];
  handleCategoryChange: (category: string) => void;
  handleFilterChange: (filterId: string, optionId: string) => void;
  handlePriceChange: (range: [number, number]) => void;
  handleNoPriceFilterChange: (enabled: boolean) => void;
  setSelectedLearningOutcomes: (value: string[]) => void;
  setSelectedProductType: (value: string) => void;
  setSelectedSpecialCategories: (value: string[]) => void;
  handleClearFilters: () => void;
  setMobileFiltersOpen: (open: boolean) => void;
  t: (key: string, fallback?: string) => string;
}

export function ProductsSidebar({
  categoryFilter,
  dynamicFilters,
  priceRangeFilter,
  products,
  selectedCategories,
  selectedFilters,
  noPriceFilter,
  selectedLearningOutcomes,
  selectedProductType,
  selectedSpecialCategories,
  handleCategoryChange,
  handleFilterChange,
  handlePriceChange,
  handleNoPriceFilterChange,
  setSelectedLearningOutcomes,
  setSelectedProductType,
  setSelectedSpecialCategories,
  handleClearFilters,
  setMobileFiltersOpen,
  t,
}: ProductsSidebarProps) {
  // Calculate actual price range from products
  const actualPriceRange = React.useMemo(() => {
    if (!products || products.length === 0) {
      return { min: 0, max: 1000 }; // Fallback values
    }

    const prices = products
      .map(p => {
        const price =
          typeof p.price === "string" ? parseFloat(p.price) : p.price;
        return isNaN(price) ? 0 : price;
      })
      .filter(price => price > 0);

    if (prices.length === 0) {
      return { min: 0, max: 1000 }; // Fallback if no valid prices
    }

    const min = Math.floor(Math.min(...prices));
    const max = Math.ceil(Math.max(...prices));

    return { min, max };
  }, [products]);

  const priceRange: PriceRange = {
    min: actualPriceRange.min,
    max: actualPriceRange.max,
    current: priceRangeFilter,
  };

  return (
    <div className="w-full md:w-72 lg:w-80 shrink-0 hidden md:block max-w-full overflow-hidden">
      <div className="bg-gradient-to-br from-white via-gray-50/30 to-white rounded-2xl shadow-xl border border-gray-200/50 p-4 sm:p-6 sticky top-20 sm:top-24 max-w-full backdrop-blur-sm">
        <h3 className="text-base sm:text-lg font-black mb-3 sm:mb-4 flex items-center gap-2 sm:gap-3">
          <div className="p-2 sm:p-2.5 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-500 shadow-lg">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-white sm:w-4 sm:h-4"
            >
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
            </svg>
          </div>
          <span className="bg-gradient-to-r from-gray-900 to-gray-700 text-transparent bg-clip-text">
            {t("filterOptions", "Filter Options")}
          </span>
        </h3>
        <EnhancedProductFilters
          categories={categoryFilter[0]}
          filters={dynamicFilters}
          priceRange={priceRange}
          selectedCategories={selectedCategories}
          selectedFilters={selectedFilters}
          noPriceFilter={noPriceFilter}
          selectedLearningOutcomes={selectedLearningOutcomes}
          selectedProductType={selectedProductType}
          selectedSpecialCategories={selectedSpecialCategories}
          onCategoryChange={handleCategoryChange}
          onFilterChange={handleFilterChange}
          onPriceChange={handlePriceChange}
          onNoPriceFilterChange={handleNoPriceFilterChange}
          onLearningOutcomesChange={setSelectedLearningOutcomes}
          onProductTypeChange={setSelectedProductType}
          onSpecialCategoriesChange={setSelectedSpecialCategories}
          onClearFilters={handleClearFilters}
          onCloseMobile={() => setMobileFiltersOpen(false)}
          isInsideModal={false}
          t={t}
        />
      </div>
    </div>
  );
}
