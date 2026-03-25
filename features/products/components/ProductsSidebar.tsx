"use client";

import React from "react";

import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

import { EnhancedProductFilters } from "./EnhancedProductFilters";
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
  products: Array<{ price: number }>;
  selectedCategories: string[];
  selectedFilters: Record<string, string[]>;
  noPriceFilter: boolean;
  selectedLearningOutcomes: string[];
  selectedProductType: string;
  selectedSpecialCategories: string[];
  selectedAgeGroup?:
    | "TODDLERS_1_3"
    | "PRESCHOOL_3_5"
    | "ELEMENTARY_6_8"
    | "MIDDLE_SCHOOL_9_12"
    | "TEENS_13_PLUS";
  handleCategoryChange: (category: string) => void;
  handleFilterChange: (filterId: string, optionId: string) => void;
  handlePriceChange: (range: [number, number]) => void;
  handleNoPriceFilterChange: (enabled: boolean) => void;
  setSelectedLearningOutcomes: (value: string[]) => void;
  setSelectedProductType: (value: string) => void;
  setSelectedSpecialCategories: (value: string[]) => void;
  setSelectedAgeGroup?: (
    ageGroup:
      | "PRESCHOOL_3_5"
      | "ELEMENTARY_6_8"
      | "MIDDLE_SCHOOL_9_12"
      | "TEENS_13_PLUS"
      | undefined
  ) => void;
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
  selectedAgeGroup,
  handleCategoryChange,
  handleFilterChange,
  handlePriceChange,
  handleNoPriceFilterChange,
  setSelectedLearningOutcomes,
  setSelectedProductType,
  setSelectedSpecialCategories,
  setSelectedAgeGroup,
  handleClearFilters,
  setMobileFiltersOpen,
  t,
}: ProductsSidebarProps) {
  const actualPriceRange = React.useMemo(() => {
    if (!products || products.length === 0) return { min: 0, max: 1000 };

    const prices = products
      .map(p => {
        const price =
          typeof p.price === "string" ? parseFloat(p.price) : p.price;
        return isNaN(price) ? 0 : price;
      })
      .filter(price => price > 0);

    if (prices.length === 0) return { min: 0, max: 1000 };

    return {
      min: Math.floor(Math.min(...prices)),
      max: Math.ceil(Math.max(...prices)),
    };
  }, [products]);

  const priceRange: PriceRange = {
    min: actualPriceRange.min,
    max: actualPriceRange.max,
    current: priceRangeFilter,
  };

  const activeFiltersCount =
    selectedCategories.length +
    Object.values(selectedFilters).reduce(
      (count, options) => count + (Array.isArray(options) ? options.length : 0),
      0
    ) +
    (!noPriceFilter &&
    (priceRangeFilter[0] > priceRange.min || priceRangeFilter[1] < priceRange.max)
      ? 1
      : 0) +
    selectedLearningOutcomes.length +
    selectedSpecialCategories.length +
    (selectedProductType && selectedProductType !== "all" ? 1 : 0) +
    (selectedAgeGroup ? 1 : 0);

  return (
    <aside
      className={cn(
        "hidden xl:block shrink-0 w-56 2xl:w-64"
      )}
    >
      <div className="sticky top-24">
        <ScrollArea className="h-[calc(100vh-10rem)] pr-2">
          <div className="space-y-6 pb-4">
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
              selectedAgeGroup={selectedAgeGroup}
              onCategoryChange={handleCategoryChange}
              onFilterChange={handleFilterChange}
              onPriceChange={handlePriceChange}
              onNoPriceFilterChange={handleNoPriceFilterChange}
              onLearningOutcomesChange={setSelectedLearningOutcomes}
              onProductTypeChange={setSelectedProductType}
              onSpecialCategoriesChange={setSelectedSpecialCategories}
              onAgeGroupChange={setSelectedAgeGroup}
              onClearFilters={handleClearFilters}
              onCloseMobile={() => setMobileFiltersOpen(false)}
              isInsideModal={false}
              t={t}
              className="space-y-6 text-slate-900"
            />

            {activeFiltersCount > 0 && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="w-full rounded-lg border border-slate-200 bg-white py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
              >
                {t("resetFilters", "Resetează Filtre")}
              </button>
            )}
          </div>
        </ScrollArea>
      </div>
    </aside>
  );
}
