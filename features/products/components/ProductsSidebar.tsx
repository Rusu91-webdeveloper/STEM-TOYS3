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
    <div className="w-full md:w-64 shrink-0 hidden md:block">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 sm:p-4 sticky top-20 sm:top-24">
        <h3 className="text-sm sm:text-base font-bold mb-2 sm:mb-3 flex items-center gap-1.5 sm:gap-2">
          <div className="p-1 sm:p-1.5 rounded-full bg-primary/10">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-primary"
            >
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
            </svg>
          </div>
          {t("filterOptions")}
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
        />
      </div>
    </div>
  );
}
