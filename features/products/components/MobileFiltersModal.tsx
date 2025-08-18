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
        className="h-[75vh] w-full rounded-t-xl p-0 overflow-hidden flex flex-col"
      >
        <SheetHeader className="px-3 py-3 border-b border-gray-200 flex-shrink-0">
          <SheetTitle className="text-base font-semibold">
            {t("filterOptions", "Filtrează")}
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-3 py-3">
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
          />
        </div>

        <div className="border-t border-gray-200 p-3 bg-white flex-shrink-0">
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onClearFilters}
              className="flex-1 text-sm h-10"
            >
              {t("clearAll", "Șterge tot")}
            </Button>
            <Button onClick={onClose} className="flex-1 text-sm h-10">
              {t("applyFilters", "Aplică")}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
