"use client";

import React from "react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import type { FilterGroup } from "./EnhancedProductFilters";
import { EnhancedProductFilters } from "./EnhancedProductFilters";
import type { PriceRange } from "./ProductsSidebar";

interface MobileFiltersModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: FilterGroup;
  filters: FilterGroup[];
  priceRange: PriceRange;
  selectedCategories: string[];
  selectedFilters: Record<string, string[]>;
  noPriceFilter: boolean;
  selectedLearningOutcomes: string[];
  selectedProductType: string;
  selectedSpecialCategories: string[];
  onCategoryChange: (category: string) => void;
  onFilterChange: (filterId: string, optionId: string) => void;
  onPriceChange: (range: [number, number]) => void;
  onNoPriceFilterChange: (enabled: boolean) => void;
  onLearningOutcomesChange: (outcomes: string[]) => void;
  onProductTypeChange: (type: string) => void;
  onSpecialCategoriesChange: (categories: string[]) => void;
  onClearFilters: () => void;
  t: (key: string, fallback?: string) => string;
}

export function MobileFiltersModal({
  isOpen,
  onClose,
  categories,
  filters,
  priceRange,
  selectedCategories,
  selectedFilters,
  noPriceFilter,
  selectedLearningOutcomes,
  selectedProductType,
  selectedSpecialCategories,
  onCategoryChange,
  onFilterChange,
  onPriceChange,
  onNoPriceFilterChange,
  onLearningOutcomesChange,
  onProductTypeChange,
  onSpecialCategoriesChange,
  onClearFilters,
  t,
}: MobileFiltersModalProps) {
  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent
        side="bottom"
        className="h-[80vh] w-full rounded-t-2xl p-0 overflow-hidden flex flex-col shadow-xl border-t border-gray-100"
      >
        <SheetHeader className="px-4 py-4 border-b border-gray-100 flex-shrink-0 bg-gradient-to-r from-gray-50 to-white">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-base font-bold text-gray-800">
              {t("filterOptions", "Filtrează")}
            </SheetTitle>
            <div className="w-12 h-1 bg-gray-200 rounded-full absolute top-2 left-1/2 transform -translate-x-1/2"></div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 py-4 bg-white">
          <EnhancedProductFilters
            categories={categories}
            filters={filters}
            priceRange={priceRange}
            selectedCategories={selectedCategories}
            selectedFilters={selectedFilters}
            noPriceFilter={noPriceFilter}
            selectedLearningOutcomes={selectedLearningOutcomes}
            selectedProductType={selectedProductType}
            selectedSpecialCategories={selectedSpecialCategories}
            onCategoryChange={onCategoryChange}
            onFilterChange={onFilterChange}
            onPriceChange={onPriceChange}
            onNoPriceFilterChange={onNoPriceFilterChange}
            onLearningOutcomesChange={onLearningOutcomesChange}
            onProductTypeChange={onProductTypeChange}
            onSpecialCategoriesChange={onSpecialCategoriesChange}
            onClearFilters={onClearFilters}
            onCloseMobile={undefined}
            className="block"
            isInsideModal={true}
            t={t}
          />
        </div>

        <div className="border-t border-gray-100 p-4 bg-gradient-to-b from-white to-gray-50 flex-shrink-0">
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClearFilters}
              className="flex-1 text-sm h-12 bg-white border-gray-200 text-gray-700 hover:bg-gray-50 transition-all duration-300"
            >
              {t("clearAll", "Șterge tot")}
            </Button>
            <Button
              onClick={onClose}
              className="flex-1 text-sm h-12 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary text-white font-semibold transition-all duration-300 shadow-md hover:shadow-lg"
            >
              {t("applyFilters", "Aplică")}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
