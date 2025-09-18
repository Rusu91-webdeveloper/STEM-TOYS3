"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Check,
  ChevronRight,
  Sparkles,
  SlidersHorizontal,
  ShoppingBag,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

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
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Calculate active filters count
  useEffect(() => {
    let count = selectedCategories.length;
    count += Object.values(selectedFilters).flat().length;
    count += selectedLearningOutcomes.length;
    count += selectedProductType ? 1 : 0;
    count += selectedSpecialCategories.length;
    count += !noPriceFilter ? 1 : 0;
    setActiveFiltersCount(count);
  }, [
    selectedCategories,
    selectedFilters,
    selectedLearningOutcomes,
    selectedProductType,
    selectedSpecialCategories,
    noPriceFilter,
  ]);

  const handleApplyFilters = () => {
    setShowConfirmation(true);
    setTimeout(() => {
      onClose();
      setShowConfirmation(false);
    }, 800);
  };

  const handleClearAll = () => {
    onClearFilters();
    // Add subtle haptic-like animation feedback
    if (typeof window !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(50);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent
        side="bottom"
        className={cn(
          "h-[90vh] sm:h-[85vh] w-full",
          "rounded-t-[24px] sm:rounded-t-[32px]",
          "p-0 overflow-hidden flex flex-col",
          "bg-white",
          "shadow-2xl",
          "border-0",
          "animate-in slide-in-from-bottom duration-500"
        )}
      >
        {/* Premium Header with Glass Effect */}
        <SheetHeader className="relative px-5 py-5 sm:px-6 sm:py-6 flex-shrink-0 bg-gradient-to-b from-white via-gray-50/50 to-transparent">
          {/* Drag Handle - Premium style */}
          <div className="absolute top-3 left-1/2 transform -translate-x-1/2">
            <div className="w-12 h-1.5 bg-gray-300 rounded-full hover:bg-gray-400 transition-colors cursor-grab active:cursor-grabbing" />
          </div>

          {/* Header Content */}
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg">
                <SlidersHorizontal className="w-5 h-5 text-white" />
              </div>
              <div>
                <SheetTitle className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  {t("filterOptions", "Filtrează")}
                </SheetTitle>
                {activeFiltersCount > 0 && (
                  <p className="text-xs text-gray-500 mt-0.5">
                    {activeFiltersCount} {t("activeFilters", "filtre active")}
                  </p>
                )}
              </div>
            </div>

            {/* Premium Close Button */}
            <button
              onClick={onClose}
              className="p-2.5 hover:bg-gray-100 rounded-2xl transition-all duration-300 hover:scale-105 active:scale-95"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Quick Stats Bar */}
          {activeFiltersCount > 0 && (
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              {selectedCategories.map(cat => (
                <span
                  key={cat}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium"
                >
                  <Check className="w-3 h-3" />
                  {cat}
                </span>
              ))}
              {selectedProductType && (
                <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                  <Check className="w-3 h-3" />
                  {selectedProductType}
                </span>
              )}
              {!noPriceFilter && (
                <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                  <Check className="w-3 h-3" />
                  {t("priceRange", "Interval preț")}
                </span>
              )}
            </div>
          )}
        </SheetHeader>

        {/* Filters Content with Premium Scrollbar */}
        <div
          className="flex-1 overflow-y-auto px-5 py-4 sm:px-6 sm:py-6 bg-gray-50/30"
          style={{
            scrollbarWidth: "thin",
            scrollbarColor: "#CBD5E1 transparent",
          }}
        >
          {/* Premium Filter Sections */}
          <div className="space-y-6">
            {/* Featured Section - Special Offers */}
            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl p-4 border border-yellow-200/50">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-yellow-600" />
                <h3 className="font-semibold text-gray-900 text-sm">
                  {t("specialOffers", "Oferte Speciale")}
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  "BEST_SELLERS",
                  "NEW_ARRIVALS",
                  "GIFT_IDEAS",
                  "SALE_ITEMS",
                ].map(item => {
                  const isSelected = selectedSpecialCategories.includes(item);
                  return (
                    <button
                      key={item}
                      onClick={() => {
                        const newCategories = isSelected
                          ? selectedSpecialCategories.filter(c => c !== item)
                          : [...selectedSpecialCategories, item];
                        onSpecialCategoriesChange(newCategories);
                      }}
                      className={cn(
                        "px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-300",
                        "border-2",
                        isSelected
                          ? "bg-gradient-to-r from-yellow-400 to-orange-400 text-white border-transparent shadow-md scale-105"
                          : "bg-white border-gray-200 text-gray-700 hover:border-yellow-400 hover:bg-yellow-50"
                      )}
                    >
                      {t(
                        item.toLowerCase().replace("_", ""),
                        item.replace("_", " ")
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Main Filters with Premium Card Design */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
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
                className="p-4"
                isInsideModal={true}
                t={t}
              />
            </div>
          </div>
        </div>

        {/* Premium Fixed Bottom Actions */}
        <div className="border-t border-gray-200 bg-white flex-shrink-0">
          <div className="px-5 py-4 sm:px-6 sm:py-5">
            {/* Results Preview */}
            <div className="mb-4 text-center">
              <p className="text-sm text-gray-600">
                {t("showingProducts", "Afișare produse")}
              </p>
              <p className="text-2xl font-bold text-gray-900 flex items-center justify-center gap-2">
                <ShoppingBag className="w-5 h-5 text-indigo-600" />
                <span>234</span>
                <span className="text-sm font-normal text-gray-500">
                  {t("products", "produse")}
                </span>
              </p>
            </div>

            {/* Action Buttons with Premium Style */}
            <div className="flex gap-3">
              {/* Clear All Button */}
              <Button
                variant="outline"
                onClick={handleClearAll}
                disabled={activeFiltersCount === 0}
                className={cn(
                  "flex-1 h-14 rounded-2xl text-sm font-semibold transition-all duration-300",
                  "border-2",
                  activeFiltersCount > 0
                    ? "bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 hover:scale-[0.98] active:scale-95"
                    : "bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed"
                )}
              >
                {t("clearAll", "Șterge tot")}
                {activeFiltersCount > 0 && (
                  <span className="ml-2 bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full text-xs">
                    {activeFiltersCount}
                  </span>
                )}
              </Button>

              {/* Apply Filters Button with Premium Gradient */}
              <Button
                onClick={handleApplyFilters}
                disabled={showConfirmation}
                className={cn(
                  "flex-[2] h-14 rounded-2xl text-sm font-bold transition-all duration-500",
                  "shadow-lg hover:shadow-xl",
                  "transform hover:scale-[1.02] active:scale-[0.98]",
                  showConfirmation
                    ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white"
                    : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white",
                  "relative overflow-hidden"
                )}
              >
                {/* Animated Background Effect */}
                <span className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full hover:translate-x-full transition-transform duration-1000" />

                {/* Button Content */}
                <span className="relative flex items-center justify-center gap-2">
                  {showConfirmation ? (
                    <>
                      <Check className="w-5 h-5 animate-in zoom-in duration-300" />
                      <span className="animate-in fade-in duration-300">
                        {t("filtersApplied", "Aplicat!")}
                      </span>
                    </>
                  ) : (
                    <>
                      <span>{t("applyFilters", "Aplică Filtrele")}</span>
                      <ChevronRight className="w-5 h-5 animate-pulse" />
                    </>
                  )}
                </span>

                {/* Active Filters Badge */}
                {activeFiltersCount > 0 && !showConfirmation && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-lg animate-bounce">
                    {activeFiltersCount}
                  </span>
                )}
              </Button>
            </div>

            {/* Premium Bottom Safe Area for iPhone */}
            <div className="h-safe-area-inset-bottom" />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
