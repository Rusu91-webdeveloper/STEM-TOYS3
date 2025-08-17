"use client";

import React from "react";

import { EnhancedProductFilters } from "./EnhancedProductFilters";

interface FilterGroup {
  id: string;
  name: string;
  options: Array<{
    id: string;
    name: string;
    count: number;
  }>;
}

interface PriceRange {
  min: number;
  max: number;
  current: [number, number];
}

interface ProductsSidebarProps {
  categoryFilter: FilterGroup[];
  dynamicFilters: FilterGroup[];
  priceRangeFilter: [number, number];
  selectedCategories: string[];
  selectedFilters: Record<string, string[]>;
  noPriceFilter: boolean;
  selectedAgeGroup: string[];
  selectedStemDiscipline: string[];
  selectedLearningOutcomes: string[];
  selectedProductType: string[];
  selectedSpecialCategories: string[];
  handleCategoryChange: (category: string) => void;
  handleFilterChange: (filterId: string, optionId: string) => void;
  handlePriceChange: (range: [number, number]) => void;
  handleNoPriceFilterChange: (enabled: boolean) => void;
  setSelectedAgeGroup: (value: string[]) => void;
  setSelectedStemDiscipline: (value: string[]) => void;
  setSelectedLearningOutcomes: (value: string[]) => void;
  setSelectedProductType: (value: string[]) => void;
  setSelectedSpecialCategories: (value: string[]) => void;
  handleClearFilters: () => void;
  setMobileFiltersOpen: (open: boolean) => void;
  t: (key: string, fallback?: string) => string;
}

export function ProductsSidebar({
  categoryFilter,
  dynamicFilters,
  priceRangeFilter,
  selectedCategories,
  selectedFilters,
  noPriceFilter,
  selectedAgeGroup,
  selectedStemDiscipline,
  selectedLearningOutcomes,
  selectedProductType,
  selectedSpecialCategories,
  handleCategoryChange,
  handleFilterChange,
  handlePriceChange,
  handleNoPriceFilterChange,
  setSelectedAgeGroup,
  setSelectedStemDiscipline,
  setSelectedLearningOutcomes,
  setSelectedProductType,
  setSelectedSpecialCategories,
  handleClearFilters,
  setMobileFiltersOpen,
  t,
}: ProductsSidebarProps) {
  const priceRange: PriceRange = {
    min: 0,
    max: 500,
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
          categories={categoryFilter}
          filters={dynamicFilters}
          priceRange={priceRange}
          selectedCategories={selectedCategories}
          selectedFilters={selectedFilters}
          noPriceFilter={noPriceFilter}
          selectedAgeGroup={selectedAgeGroup}
          selectedStemDiscipline={selectedStemDiscipline}
          selectedLearningOutcomes={selectedLearningOutcomes}
          selectedProductType={selectedProductType}
          selectedSpecialCategories={selectedSpecialCategories}
          onCategoryChange={handleCategoryChange}
          onFilterChange={handleFilterChange}
          onPriceChange={handlePriceChange}
          onNoPriceFilterChange={handleNoPriceFilterChange}
          onAgeGroupChange={setSelectedAgeGroup}
          onStemDisciplineChange={setSelectedStemDiscipline}
          onLearningOutcomesChange={setSelectedLearningOutcomes}
          onProductTypeChange={setSelectedProductType}
          onSpecialCategoriesChange={setSelectedSpecialCategories}
          onClearFilters={handleClearFilters}
          onCloseMobile={() => setMobileFiltersOpen(false)}
        />
      </div>
    </div>
  );
}
