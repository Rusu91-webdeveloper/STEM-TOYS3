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
  selectedAgeGroup?:
    | "TODDLERS_1_3"
    | "PRESCHOOL_3_5"
    | "ELEMENTARY_6_8"
    | "MIDDLE_SCHOOL_9_12"
    | "TEENS_13_PLUS";
  onCategoryChange: (category: string) => void;
  onFilterChange: (filterId: string, optionId: string) => void;
  onPriceChange: (range: [number, number]) => void;
  onNoPriceFilterChange: (enabled: boolean) => void;
  onLearningOutcomesChange: (outcomes: string[]) => void;
  onProductTypeChange: (type: string) => void;
  onSpecialCategoriesChange: (categories: string[]) => void;
  onAgeGroupChange?: (
    ageGroup:
      | "PRESCHOOL_3_5"
      | "ELEMENTARY_6_8"
      | "MIDDLE_SCHOOL_9_12"
      | "TEENS_13_PLUS"
      | undefined
  ) => void;
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
  selectedAgeGroup,
  onCategoryChange,
  onFilterChange,
  onPriceChange,
  onNoPriceFilterChange,
  onLearningOutcomesChange,
  onProductTypeChange,
  onSpecialCategoriesChange,
  onAgeGroupChange,
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
    count += selectedProductType && selectedProductType !== "all" ? 1 : 0;
    count += selectedSpecialCategories.length;
    count += selectedAgeGroup ? 1 : 0;
    count += !noPriceFilter ? 1 : 0;
    setActiveFiltersCount(count);
  }, [
    selectedCategories,
    selectedFilters,
    selectedLearningOutcomes,
    selectedProductType,
    selectedSpecialCategories,
    selectedAgeGroup,
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
          "h-[92vh] sm:h-[88vh] w-full max-w-full",
          "rounded-t-[32px] sm:rounded-t-[40px]",
          "p-0 overflow-hidden flex flex-col",
          "bg-gradient-to-b from-white via-slate-50/60 to-emerald-50/30",
          "backdrop-blur-3xl",
          "shadow-[0_-20px_80px_-12px_rgba(0,0,0,0.25)]",
          "border-0",
          "animate-in slide-in-from-bottom duration-700 ease-out"
        )}
      >
        {/* Ultra-Premium Header with Advanced Glass Morphism */}
        <SheetHeader className="relative px-6 py-8 sm:px-8 sm:py-10 flex-shrink-0 bg-gradient-to-br from-white/95 via-sky-50/50 to-emerald-50/30 backdrop-blur-3xl border-b border-gradient-to-r from-white/60 via-gray-200/30 to-white/60">
          {/* Premium Drag Handle with Glow Effect */}
          <div className="absolute top-5 left-1/2 transform -translate-x-1/2">
            <div className="w-20 h-1.5 bg-gradient-to-r from-gray-300 via-gray-400 to-gray-300 rounded-full hover:from-sky-400 hover:via-emerald-400 hover:to-sky-400 transition-all duration-500 cursor-grab active:cursor-grabbing shadow-lg hover:shadow-xl relative">
              <div className="absolute inset-0 bg-gradient-to-r from-sky-400/50 to-emerald-400/50 rounded-full blur-sm animate-pulse"></div>
            </div>
          </div>

          {/* Enhanced Header Content */}
          <div className="flex items-center justify-between mt-6">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-gradient-to-br from-sky-600 via-emerald-600 to-sky-700 rounded-3xl shadow-2xl relative overflow-hidden border border-white/20">
                <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent"></div>
                <div className="absolute inset-0 bg-gradient-to-tl from-emerald-400/20 to-transparent"></div>
                <SlidersHorizontal className="w-7 h-7 text-white relative z-10" />
              </div>
              <div>
                <SheetTitle className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-slate-900 via-sky-900 to-emerald-900 bg-clip-text text-transparent leading-tight">
                  {t("advancedFilters", "Smart Filters")}
                </SheetTitle>
                <p className="text-base text-slate-600 mt-2 font-medium">
                  {t("refineYourSearch", "Find your perfect products")}
                </p>
              </div>
            </div>

            {/* Ultra-Premium Close Button */}
            <button
              onClick={onClose}
              className="group p-4 hover:bg-gradient-to-br from-red-50 to-red-100 rounded-3xl transition-all duration-500 hover:scale-110 active:scale-95 backdrop-blur-sm border border-gray-200/50 hover:border-red-200 shadow-lg hover:shadow-xl"
            >
              <X className="w-6 h-6 text-gray-700 group-hover:text-red-600 group-hover:rotate-90 transition-all duration-300" />
            </button>
          </div>

          {/* Premium Active Filters Summary */}
          {activeFiltersCount > 0 && (
            <div className="mt-6 p-6 bg-gradient-to-br from-sky-50/80 via-emerald-50/60 to-amber-50/40 rounded-3xl border border-sky-200/30 shadow-xl backdrop-blur-sm relative overflow-hidden">
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-sky-200/30 to-emerald-200/30 rounded-full blur-2xl"></div>
              <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-emerald-200/30 to-amber-200/30 rounded-full blur-xl"></div>

              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-r from-sky-500 to-emerald-500 rounded-2xl shadow-lg">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-lg font-black text-gray-900">
                      {t("activeFilters", "Active Filters")}
                      <span className="ml-2 px-3 py-1 bg-gradient-to-r from-sky-500 to-emerald-500 text-white rounded-full text-sm font-black shadow-lg">
                        {activeFiltersCount}
                      </span>
                    </span>
                  </div>
                  <button
                    onClick={handleClearAll}
                    className="group px-4 py-2 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white rounded-2xl text-sm font-black transition-all duration-500 hover:scale-110 active:scale-95 shadow-lg hover:shadow-xl relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                    <span className="relative z-10">
                      {t("clearAll", "Clear All")}
                    </span>
                  </button>
                </div>
                <div className="flex flex-wrap gap-3 max-w-full">
                  {selectedCategories.map(cat => (
                    <span
                      key={cat}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-sky-500 to-emerald-500 text-white rounded-2xl text-sm font-black shadow-lg flex-shrink-0 border border-white/20"
                    >
                      <Check className="w-4 h-4" />
                      {cat}
                    </span>
                  ))}
                  {selectedProductType && selectedProductType !== "all" && (
                    <span className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-500 to-amber-500 text-white rounded-2xl text-sm font-black shadow-lg border border-white/20">
                      <Check className="w-4 h-4" />
                      {selectedProductType}
                    </span>
                  )}
                  {!noPriceFilter && (
                    <span className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-2xl text-sm font-black shadow-lg border border-white/20">
                      <Check className="w-4 h-4" />
                      {t("price", "Price Range")}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </SheetHeader>

        {/* Premium Enhanced Filters Content with Advanced Mobile UX */}
        <div
          className="flex-1 overflow-y-auto overflow-x-hidden px-6 py-6 sm:px-8 sm:py-8 bg-gradient-to-b from-slate-50/40 via-white/60 to-emerald-50/20"
          style={{
            scrollbarWidth: "thin",
            scrollbarColor: "#38BDF8 transparent",
          }}
        >
          {/* Premium Filter Sections with Enhanced Spacing */}
          <div className="space-y-8">
            {/* Ultra-Premium Quick Actions Section */}
            <div className="bg-gradient-to-br from-blue-50/80 via-indigo-50/60 to-purple-50/40 rounded-3xl p-6 border border-blue-200/30 shadow-2xl backdrop-blur-sm relative overflow-hidden">
              {/* Decorative background elements */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-200/20 to-indigo-200/20 rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-20 h-20 bg-gradient-to-tr from-indigo-200/20 to-purple-200/20 rounded-full blur-2xl"></div>

              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-xl">
                    <ShoppingBag className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-black text-gray-900 text-xl">
                    {t("quickActions", "Quick Actions")}
                  </h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => {
                      onClearFilters();
                      setTimeout(() => onClose(), 300);
                    }}
                    className="group flex items-center justify-center gap-3 px-6 py-4 bg-white rounded-2xl text-base font-black text-gray-700 hover:text-red-600 border-2 border-gray-200 hover:border-red-300 transition-all duration-500 hover:scale-110 active:scale-95 shadow-lg hover:shadow-xl relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-red-50 to-transparent transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
                    <X className="w-5 h-5 relative z-10 group-hover:rotate-90 transition-transform duration-300" />
                    <span className="relative z-10">
                      {t("reset", "Reset All")}
                    </span>
                  </button>
                  <button
                    onClick={() => {
                      handleApplyFilters();
                    }}
                    className="group flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-green-500 via-emerald-500 to-green-600 hover:from-green-600 hover:via-emerald-600 hover:to-green-700 text-white rounded-2xl text-base font-black transition-all duration-500 hover:scale-110 active:scale-95 shadow-xl hover:shadow-2xl relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                    <Check className="w-5 h-5 relative z-10 group-hover:scale-110 transition-transform duration-300" />
                    <span className="relative z-10">
                      {t("apply", "Apply Now")}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Ultra-Premium Special Categories Section */}
            <div className="bg-gradient-to-br from-amber-50/80 via-orange-50/60 to-yellow-50/40 rounded-3xl shadow-2xl border border-amber-200/30 p-6 backdrop-blur-sm relative overflow-hidden">
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-200/20 to-orange-200/20 rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-orange-200/20 to-yellow-200/20 rounded-full blur-2xl"></div>

              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-gradient-to-r from-amber-600 to-orange-600 rounded-2xl shadow-xl">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-black text-gray-900 text-xl">
                    {t("specialOffers", "Special Collections")}
                  </h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    {
                      id: "BEST_SELLERS",
                      label: "Bestsellers",
                      icon: "🔥",
                      gradient: "from-red-500 to-orange-500",
                    },
                    {
                      id: "NEW_ARRIVALS",
                      label: "New Arrivals",
                      icon: "✨",
                      gradient: "from-yellow-500 to-amber-500",
                    },
                    {
                      id: "GIFT_IDEAS",
                      label: "Gift Ideas",
                      icon: "🎁",
                      gradient: "from-purple-500 to-pink-500",
                    },
                    {
                      id: "SALE_ITEMS",
                      label: "On Sale",
                      icon: "🏷️",
                      gradient: "from-emerald-500 to-teal-500",
                    },
                  ].map(item => {
                    const isSelected = selectedSpecialCategories.includes(
                      item.id as any
                    );
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          const newCategories = isSelected
                            ? selectedSpecialCategories.filter(
                                c => c !== item.id
                              )
                            : [...selectedSpecialCategories, item.id as any];
                          onSpecialCategoriesChange(newCategories);
                        }}
                        className={cn(
                          "group flex items-center justify-center gap-3 px-6 py-4 rounded-2xl text-base font-black transition-all duration-500 min-h-[60px] border-2 shadow-xl hover:shadow-2xl relative overflow-hidden",
                          "active:scale-95 hover:scale-110",
                          isSelected
                            ? `bg-gradient-to-r ${item.gradient} text-white border-transparent`
                            : "bg-white border-gray-200 text-gray-700 hover:border-amber-400"
                        )}
                      >
                        {!isSelected && (
                          <div
                            className={`absolute inset-0 bg-gradient-to-r ${item.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}
                          ></div>
                        )}
                        {isSelected && (
                          <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                        )}
                        <span className="text-xl relative z-10 group-hover:scale-110 transition-transform duration-300">
                          {item.icon}
                        </span>
                        <span className="relative z-10">{item.label}</span>
                        {isSelected && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full shadow-lg flex items-center justify-center">
                            <div className="w-2 h-2 bg-current rounded-full animate-pulse"></div>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Ultra-Premium Main Filters Section */}
            <div className="bg-gradient-to-br from-indigo-50/80 via-purple-50/60 to-blue-50/40 rounded-3xl shadow-2xl border border-indigo-200/30 overflow-hidden backdrop-blur-sm relative">
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-br from-indigo-200/20 to-purple-200/20 rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-20 h-20 bg-gradient-to-tr from-purple-200/20 to-blue-200/20 rounded-full blur-2xl"></div>

              <div className="relative z-10 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-xl">
                    <SlidersHorizontal className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-black text-gray-900 text-xl">
                    {t("detailedFilters", "Advanced Filters")}
                  </h3>
                </div>
                <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/40 shadow-inner">
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
                    selectedAgeGroup={selectedAgeGroup}
                    onCategoryChange={onCategoryChange}
                    onFilterChange={onFilterChange}
                    onPriceChange={onPriceChange}
                    onNoPriceFilterChange={onNoPriceFilterChange}
                    onLearningOutcomesChange={onLearningOutcomesChange}
                    onProductTypeChange={onProductTypeChange}
                    onSpecialCategoriesChange={onSpecialCategoriesChange}
                    onAgeGroupChange={onAgeGroupChange}
                    onClearFilters={onClearFilters}
                    onCloseMobile={undefined}
                    className="space-y-6"
                    isInsideModal={true}
                    t={t}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Ultra-Premium Bottom Actions with Advanced Glass Morphism */}
        <div className="border-t border-gradient-to-r from-gray-200/40 via-gray-100/60 to-gray-200/40 bg-gradient-to-t from-white via-gray-50/80 to-white/95 flex-shrink-0 backdrop-blur-3xl relative overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 opacity-30"></div>

          <div className="px-8 py-8 sm:px-10 sm:py-10">
            {/* Premium Results Summary */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-4 px-6 py-3 bg-gradient-to-r from-indigo-50/90 via-purple-50/80 to-indigo-50/90 rounded-3xl border border-indigo-200/40 shadow-xl backdrop-blur-sm relative overflow-hidden">
                {/* Background glow */}
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-100/20 to-purple-100/20 blur-xl"></div>

                <div className="relative z-10 flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full animate-pulse shadow-lg"></div>
                      <div
                        className="w-1.5 h-1.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-pulse shadow-md"
                        style={{ animationDelay: "0.2s" }}
                      ></div>
                      <div
                        className="w-1 h-1 bg-gradient-to-r from-pink-500 to-red-500 rounded-full animate-pulse shadow-sm"
                        style={{ animationDelay: "0.4s" }}
                      ></div>
                    </div>
                    <span className="text-base font-black bg-gradient-to-r from-indigo-700 to-purple-700 text-transparent bg-clip-text">
                      {activeFiltersCount}{" "}
                      {t("activeFilters", "Active Filters")}
                    </span>
                  </div>
                  <div className="w-px h-6 bg-gradient-to-b from-gray-300 to-gray-400"></div>
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full shadow-lg">
                      <ShoppingBag className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-base font-bold text-gray-700">
                      {t("liveResults", "Live Results")}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Ultra-Premium Action Buttons */}
            <div className="flex gap-6">
              {/* Premium Clear All Button */}
              <button
                onClick={handleClearAll}
                disabled={activeFiltersCount === 0}
                className={`group flex-1 h-14 rounded-3xl text-base font-black transition-all duration-700 transform border-2 shadow-xl hover:shadow-2xl relative overflow-hidden ${
                  activeFiltersCount > 0
                    ? "bg-white border-gray-300 text-gray-700 hover:border-red-400 hover:text-red-600 hover:scale-110 active:scale-95"
                    : "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed"
                }`}
              >
                {activeFiltersCount > 0 && (
                  <div className="absolute inset-0 bg-gradient-to-r from-red-50 to-transparent transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
                )}
                <div className="relative z-10 flex items-center justify-center gap-3">
                  <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-500" />
                  <span>{t("reset", "Reset All")}</span>
                </div>
              </button>

              {/* Ultra-Premium Apply Filters Button */}
              <button
                onClick={handleApplyFilters}
                className="group flex-[2] h-14 rounded-3xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-700 hover:via-purple-700 hover:to-indigo-800 text-white text-base font-black transition-all duration-700 transform hover:scale-110 active:scale-95 shadow-2xl hover:shadow-3xl relative overflow-hidden border-2 border-white/20"
              >
                {/* Multiple animated background effects */}
                <div className="absolute inset-0 bg-gradient-to-r from-white/30 via-white/10 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-white/20 transform skew-x-12 translate-x-full group-hover:-translate-x-full transition-transform duration-1000" />
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-400/20 to-purple-400/20 blur-xl group-hover:blur-2xl transition-all duration-700"></div>

                {/* Premium button content */}
                <div className="relative z-10 flex items-center justify-center gap-3">
                  <div className="p-1.5 bg-white/20 rounded-full group-hover:bg-white/30 transition-all duration-300">
                    <Sparkles className="w-5 h-5 group-hover:rotate-180 transition-transform duration-700" />
                  </div>
                  <span className="font-black">
                    {t("applyFilters", "Apply Filters")}
                  </span>
                  <div className="p-1.5 bg-white/20 rounded-full group-hover:bg-white/30 transition-all duration-300">
                    <Check className="w-5 h-5 group-hover:scale-125 transition-transform duration-500" />
                  </div>
                </div>

                {/* Premium active filters indicator */}
                {activeFiltersCount > 0 && (
                  <div className="absolute -top-2 -right-2 h-7 w-7 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center shadow-2xl animate-bounce border-3 border-white">
                    <span className="text-sm font-black text-white">
                      {activeFiltersCount}
                    </span>
                  </div>
                )}
              </button>
            </div>

            {/* Premium Bottom Safe Area with Gradient */}
            <div className="h-safe-area-inset-bottom mt-4">
              <div className="w-full h-1 bg-gradient-to-r from-transparent via-gray-300/50 to-transparent rounded-full"></div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
