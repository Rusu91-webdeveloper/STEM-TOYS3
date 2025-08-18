"use client";

import { X } from "lucide-react";
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
        className="h-[90vh] w-full rounded-t-2xl p-0 overflow-hidden"
      >
        <SheetHeader className="px-4 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-lg font-semibold">
              {t("filterOptions", "Filtrează")}
            </SheetTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
              aria-label="Close filters"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 py-4">
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
            onCloseMobile={onClose}
            className="block"
            isInsideModal={true}
          />
        </div>

        <div className="border-t border-gray-200 p-4 bg-white">
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClearFilters}
              className="flex-1"
            >
              {t("clearAll", "Șterge tot")}
            </Button>
            <Button onClick={onClose} className="flex-1">
              {t("applyFilters", "Aplică")}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
