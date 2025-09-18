"use client";

import { X, Filter, Zap, Star, Gift, TrendingUp, Sparkles } from "lucide-react";
import React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface MobileFilterBarProps {
  activeFilterCount: number;
  selectedCategories: string[];
  selectedPriceRange?: [number, number];
  onCategoryQuickSelect: (category: string) => void;
  onPriceQuickSelect: (range: string) => void;
  onOpenFilters: () => void;
  onClearFilters: () => void;
  t: (key: string, fallback?: string) => string;
}

const QUICK_CATEGORIES = [
  {
    id: "science",
    label: "Știință",
    icon: "🧪",
    color: "from-blue-500 to-cyan-500",
  },
  {
    id: "technology",
    label: "Tehnologie",
    icon: "💻",
    color: "from-green-500 to-emerald-500",
  },
  {
    id: "engineering",
    label: "Inginerie",
    icon: "⚙️",
    color: "from-orange-500 to-red-500",
  },
  {
    id: "mathematics",
    label: "Matematică",
    icon: "🔢",
    color: "from-purple-500 to-pink-500",
  },
];

const QUICK_PRICE_RANGES = [
  { id: "under-50", label: "<50", range: [0, 50] },
  { id: "50-100", label: "50-100", range: [50, 100] },
  { id: "100-200", label: "100-200", range: [100, 200] },
  { id: "over-200", label: "200+", range: [200, 1000] },
];

export function MobileFilterBar({
  activeFilterCount,
  selectedCategories,
  selectedPriceRange,
  onCategoryQuickSelect,
  onPriceQuickSelect,
  onOpenFilters,
  onClearFilters,
  t,
}: MobileFilterBarProps) {
  // Custom styles for hiding scrollbars on mobile
  const scrollbarHideStyle = {
    scrollbarWidth: "none" as const,
    msOverflowStyle: "none" as const,
  };
  return (
    <div className="md:hidden sticky top-[88px] sm:top-[96px] z-30 bg-gradient-to-b from-white via-white/95 to-white/90 backdrop-blur-lg border-b border-gray-100/60 shadow-lg animate-in slide-in-from-top duration-700">
      {/* Premium Header with Active Filters Indicator */}
      <div className="px-3 py-2 border-b border-gray-50/80">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-lg">
              <Filter className="w-4 h-4 text-indigo-600" />
            </div>
            <div>
              <span className="text-sm font-semibold text-gray-900">
                {t("filters", "Filtre")}
              </span>
              {activeFilterCount > 0 && (
                <div className="flex items-center gap-1 mt-0.5">
                  <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-gray-600">
                    {activeFilterCount} {t("active", "active")}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Clear All Button */}
          {activeFilterCount > 0 && (
            <button
              onClick={onClearFilters}
              className="flex items-center gap-1.5 px-2.5 py-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full text-xs font-medium transition-all duration-300 hover:scale-105 active:scale-95"
            >
              <X className="w-3.5 h-3.5" />
              {t("clear", "Șterge")}
            </button>
          )}
        </div>
      </div>

      {/* Main Filter Content - Optimized for mobile */}
      <div className="px-3 py-2.5">
        <div className="flex items-center gap-3">
          {/* Quick Categories - Compact */}
          <div
            className="flex gap-1.5 flex-shrink-0 overflow-x-auto"
            style={scrollbarHideStyle}
          >
            {QUICK_CATEGORIES.slice(0, 3).map(category => {
              const isSelected = selectedCategories.includes(category.id);
              return (
                <button
                  key={category.id}
                  onClick={() => onCategoryQuickSelect(category.id)}
                  className={`flex-shrink-0 w-8 h-8 rounded-full text-sm font-medium transition-all duration-300 border-2 transform flex items-center justify-center ${
                    isSelected
                      ? `bg-gradient-to-r ${category.color} text-white border-transparent shadow-md scale-110`
                      : "bg-white border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50 hover:scale-105 active:scale-95"
                  }`}
                  title={category.label}
                >
                  {category.icon}
                </button>
              );
            })}
          </div>

          {/* Quick Price Ranges - Compact */}
          <div
            className="flex gap-1.5 flex-shrink-0 overflow-x-auto"
            style={scrollbarHideStyle}
          >
            {QUICK_PRICE_RANGES.slice(0, 2).map(priceRange => {
              const isSelected =
                selectedPriceRange &&
                selectedPriceRange[0] === priceRange.range[0] &&
                selectedPriceRange[1] === priceRange.range[1];

              return (
                <button
                  key={priceRange.id}
                  onClick={() => onPriceQuickSelect(priceRange.id)}
                  className={`flex-shrink-0 px-2.5 py-1.5 rounded-full text-xs font-medium transition-all duration-300 border transform ${
                    isSelected
                      ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-transparent shadow-md scale-105"
                      : "bg-white border-gray-200 text-gray-700 hover:border-emerald-300 hover:bg-emerald-50 hover:scale-105 active:scale-95"
                  }`}
                >
                  {priceRange.label}
                </button>
              );
            })}
          </div>

          {/* Special Categories - Enhanced for mobile visibility */}
          <div className="flex flex-col gap-1.5">
            <div className="text-xs font-semibold text-gray-700 px-1">
              {t("specialCategories", "Special")}
            </div>
            <div
              className="flex gap-1 flex-shrink-0 overflow-x-auto"
              style={scrollbarHideStyle}
            >
              <button
                onClick={() => onCategoryQuickSelect("BEST_SELLERS")}
                className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-red-100 to-orange-100 text-red-700 border border-red-200 rounded-full text-xs font-semibold hover:from-red-200 hover:to-orange-200 transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-sm"
              >
                <Star className="w-4 h-4" />
                <span className="whitespace-nowrap">{t("best", "Top")}</span>
              </button>
              <button
                onClick={() => onCategoryQuickSelect("NEW_ARRIVALS")}
                className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-700 border border-yellow-200 rounded-full text-xs font-semibold hover:from-yellow-200 hover:to-amber-200 transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-sm"
              >
                <Zap className="w-4 h-4" />
                <span className="whitespace-nowrap">{t("new", "Nou")}</span>
              </button>
              <button
                onClick={() => onCategoryQuickSelect("GIFT_IDEAS")}
                className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 border border-purple-200 rounded-full text-xs font-semibold hover:from-purple-200 hover:to-pink-200 transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-sm"
              >
                <Gift className="w-4 h-4" />
                <span className="whitespace-nowrap">
                  {t("gifts", "Cadouri")}
                </span>
              </button>
              <button
                onClick={() => onCategoryQuickSelect("SALE_ITEMS")}
                className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-700 border border-emerald-200 rounded-full text-xs font-semibold hover:from-emerald-200 hover:to-teal-200 transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-sm"
              >
                <TrendingUp className="w-4 h-4" />
                <span className="whitespace-nowrap">
                  {t("sale", "Reducere")}
                </span>
              </button>
            </div>
          </div>

          {/* Spacer to push main button to the right */}
          <div className="flex-1" />

          {/* Main Filter Button - Premium Design */}
          <Button
            onClick={onOpenFilters}
            className="flex-shrink-0 h-10 px-4 rounded-full bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-700 hover:via-purple-700 hover:to-indigo-800 text-white text-sm font-semibold shadow-lg hover:shadow-xl transition-all duration-500 transform hover:scale-105 active:scale-95 relative group overflow-hidden"
          >
            {/* Animated background effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />

            {/* Button content */}
            <div className="relative flex items-center gap-2">
              <Sparkles className="w-4 h-4 group-hover:rotate-12 transition-transform duration-300" />
              <span className="hidden xs:inline">{t("more", "Mai mult")}</span>
              <span className="xs:hidden">{t("all", "Tot")}</span>
            </div>

            {/* Active filter indicator */}
            {activeFilterCount > 0 && (
              <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs bg-white text-indigo-600 border-2 border-white shadow-md animate-bounce">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </div>

        {/* Active Filters Display */}
        {activeFilterCount > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="flex flex-wrap gap-1.5">
              {selectedCategories.map(cat => {
                const category = QUICK_CATEGORIES.find(c => c.id === cat);
                if (!category) return null;
                return (
                  <Badge
                    key={cat}
                    variant="secondary"
                    className="flex items-center gap-1 text-xs py-1 px-2 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border-blue-200 hover:from-blue-200 hover:to-indigo-200 transition-all duration-300"
                  >
                    {category.icon} {category.label}
                    <X
                      className="w-3 h-3 cursor-pointer hover:text-red-500 transition-colors"
                      onClick={() => onCategoryQuickSelect(cat)}
                    />
                  </Badge>
                );
              })}
              {selectedPriceRange && (
                <Badge
                  variant="secondary"
                  className="flex items-center gap-1 text-xs py-1 px-2 bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-800 border-emerald-200 hover:from-emerald-200 hover:to-teal-200 transition-all duration-300"
                >
                  <TrendingUp className="w-3 h-3" />
                  {selectedPriceRange[0]}-{selectedPriceRange[1]} RON
                  <X
                    className="w-3 h-3 cursor-pointer hover:text-red-500 transition-colors"
                    onClick={() => onPriceQuickSelect("clear")}
                  />
                </Badge>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
