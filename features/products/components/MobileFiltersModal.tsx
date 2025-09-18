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
        {/* Premium Header with Enhanced Glass Effect */}
        <SheetHeader className="relative px-5 py-6 sm:px-6 sm:py-7 flex-shrink-0 bg-gradient-to-br from-white via-indigo-50/30 to-purple-50/20 backdrop-blur-xl border-b border-white/40">
          {/* Drag Handle - Premium style */}
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2">
            <div className="w-16 h-2 bg-gradient-to-r from-gray-300 to-gray-400 rounded-full hover:from-gray-400 hover:to-gray-500 transition-all duration-300 cursor-grab active:cursor-grabbing shadow-sm" />
          </div>

          {/* Header Content */}
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-indigo-500 via-purple-600 to-indigo-700 rounded-2xl shadow-xl relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
                <SlidersHorizontal className="w-6 h-6 text-white relative z-10" />
              </div>
              <div>
                <SheetTitle className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 via-indigo-800 to-purple-800 bg-clip-text text-transparent">
                  {t("advancedFilters", "Filtre Avansate")}
                </SheetTitle>
                <p className="text-sm text-gray-600 mt-1">
                  {t("refineYourSearch", "Rafinează căutarea")}
                </p>
              </div>
            </div>

            {/* Premium Close Button */}
            <button
              onClick={onClose}
              className="p-3 hover:bg-white/60 rounded-2xl transition-all duration-300 hover:scale-110 active:scale-95 backdrop-blur-sm"
            >
              <X className="w-6 h-6 text-gray-700" />
            </button>
          </div>

          {/* Active Filters Summary */}
          {activeFiltersCount > 0 && (
            <div className="mt-4 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-gray-800">
                  {t("activeFilters", "Filtre Active")} ({activeFiltersCount})
                </span>
                <button
                  onClick={handleClearAll}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-medium hover:underline transition-colors"
                >
                  {t("clearAll", "Șterge toate")}
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedCategories.map(cat => (
                  <span
                    key={cat}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-100 text-indigo-800 rounded-full text-xs font-medium shadow-sm"
                  >
                    <Check className="w-3 h-3" />
                    {cat}
                  </span>
                ))}
                {selectedProductType && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-100 text-purple-800 rounded-full text-xs font-medium shadow-sm">
                    <Check className="w-3 h-3" />
                    {selectedProductType}
                  </span>
                )}
                {!noPriceFilter && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 text-emerald-800 rounded-full text-xs font-medium shadow-sm">
                    <Check className="w-3 h-3" />
                    {t("price", "Preț")}
                  </span>
                )}
              </div>
            </div>
          )}
        </SheetHeader>

        {/* Enhanced Filters Content with Better Mobile UX */}
        <div
          className="flex-1 overflow-y-auto px-4 py-4 sm:px-5 sm:py-5 bg-gradient-to-b from-gray-50/50 to-white"
          style={{
            scrollbarWidth: "thin",
            scrollbarColor: "#CBD5E1 transparent",
          }}
        >
          {/* Filter Sections with Improved Spacing */}
          <div className="space-y-5">
            {/* Quick Actions Section */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-4 border border-blue-200/50">
              <div className="flex items-center gap-2 mb-3">
                <ShoppingBag className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-gray-900 text-base">
                  {t("quickActions", "Acțiuni Rapide")}
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    onClearFilters();
                    setTimeout(() => onClose(), 300);
                  }}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-white rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 border border-gray-200 transition-all duration-300 hover:scale-105 active:scale-95"
                >
                  <X className="w-4 h-4" />
                  {t("reset", "Resetează")}
                </button>
                <button
                  onClick={() => {
                    handleApplyFilters();
                  }}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl text-sm font-medium transition-all duration-300 hover:scale-105 active:scale-95 shadow-md"
                >
                  <Check className="w-4 h-4" />
                  {t("apply", "Aplică")}
                </button>
              </div>
            </div>

            {/* Special Categories with Enhanced Touch Targets */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-amber-600" />
                <h3 className="font-semibold text-gray-900 text-base">
                  {t("specialOffers", "Oferte Speciale")}
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: "BEST_SELLERS", label: "Bestsellers", icon: "🔥" },
                  { id: "NEW_ARRIVALS", label: "Noutăți", icon: "✨" },
                  { id: "GIFT_IDEAS", label: "Cadouri", icon: "🎁" },
                  { id: "SALE_ITEMS", label: "Reduceri", icon: "🏷️" },
                ].map(item => {
                  const isSelected = selectedSpecialCategories.includes(
                    item.id as any
                  );
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        const newCategories = isSelected
                          ? selectedSpecialCategories.filter(c => c !== item.id)
                          : [...selectedSpecialCategories, item.id as any];
                        onSpecialCategoriesChange(newCategories);
                      }}
                      className={cn(
                        "flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 min-h-[48px]",
                        "border-2 active:scale-95",
                        isSelected
                          ? "bg-gradient-to-r from-amber-400 to-orange-400 text-white border-transparent shadow-md"
                          : "bg-gray-50 border-gray-200 text-gray-700 hover:border-amber-400 hover:bg-amber-50"
                      )}
                    >
                      <span className="text-lg">{item.icon}</span>
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Main Filters with Improved Mobile Layout */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <SlidersHorizontal className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-semibold text-gray-900 text-base">
                    {t("detailedFilters", "Filtre Detaliate")}
                  </h3>
                </div>
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
                  className="space-y-4"
                  isInsideModal={true}
                  t={t}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Premium Bottom Actions with Enhanced Design */}
        <div className="border-t border-gray-200/60 bg-gradient-to-t from-white to-gray-50/50 flex-shrink-0 backdrop-blur-sm">
          <div className="px-5 py-5 sm:px-6 sm:py-6">
            {/* Results Summary with Enhanced Design */}
            <div className="text-center mb-5">
              <div className="inline-flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-full border border-indigo-100/50">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-semibold text-gray-800">
                    {activeFiltersCount} {t("activeFilters", "filtre active")}
                  </span>
                </div>
                <div className="w-px h-4 bg-gray-300"></div>
                <div className="flex items-center gap-1.5">
                  <ShoppingBag className="w-4 h-4 text-indigo-600" />
                  <span className="text-sm font-medium text-gray-700">
                    {t("liveResults", "Rezultate live")}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons with Premium Design */}
            <div className="flex gap-4">
              {/* Clear All Button */}
              <button
                onClick={handleClearAll}
                disabled={activeFiltersCount === 0}
                className={`flex-1 h-12 rounded-2xl text-sm font-semibold transition-all duration-300 transform ${
                  activeFiltersCount > 0
                    ? "bg-white border-2 border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50 hover:scale-105 active:scale-95 shadow-md"
                    : "bg-gray-100 border-2 border-gray-200 text-gray-400 cursor-not-allowed"
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <X className="w-4 h-4" />
                  {t("reset", "Resetează")}
                </div>
              </button>

              {/* Apply Filters Button with Premium Gradient */}
              <button
                onClick={handleApplyFilters}
                className="flex-[1.5] h-12 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-700 hover:via-purple-700 hover:to-indigo-800 text-white text-sm font-bold transition-all duration-500 transform hover:scale-105 active:scale-95 shadow-xl hover:shadow-2xl relative overflow-hidden group"
              >
                {/* Animated background effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />

                {/* Button content */}
                <div className="relative flex items-center justify-center gap-2">
                  <Sparkles className="w-4 h-4 group-hover:rotate-12 transition-transform duration-300" />
                  <span>{t("applyFilters", "Aplică Filtre")}</span>
                  <Check className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                </div>

                {/* Active filters indicator */}
                {activeFiltersCount > 0 && (
                  <div className="absolute -top-1 -right-1 h-5 w-5 bg-white rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-xs font-bold text-indigo-600">
                      {activeFiltersCount}
                    </span>
                  </div>
                )}
              </button>
            </div>

            {/* Premium Bottom Safe Area for iPhone */}
            <div className="h-safe-area-inset-bottom" />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
