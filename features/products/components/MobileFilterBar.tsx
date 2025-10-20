"use client";

import { X, Filter, Zap, Star, Gift, TrendingUp, Sparkles } from "lucide-react";
import React from "react";

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

const SPECIAL_FILTERS = [
  { id: "BEST_SELLERS", label: "Best", icon: Star },
  { id: "NEW_ARRIVALS", label: "New", icon: Zap },
  { id: "GIFT_IDEAS", label: "Gifts", icon: Gift },
  { id: "SALE_ITEMS", label: "Sale", icon: TrendingUp },
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
    <div className="md:hidden sticky top-16 z-30 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 border-b border-gray-200 shadow-sm">
      {/* Compact Header */}
      <div className="px-3 py-1.5 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-700" />
            <span className="text-sm font-semibold text-gray-900">
              {t("filters", "Filters")}
            </span>
            {activeFilterCount > 0 && (
              <span className="inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full bg-gray-900 text-white text-xs font-bold">
                {activeFilterCount}
              </span>
            )}
          </div>

          {/* Clear All - Compact */}
          {activeFilterCount > 0 && (
            <button
              onClick={onClearFilters}
              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-700 hover:text-red-600 rounded-lg border border-gray-200 hover:border-red-300 transition-colors"
            >
              <X className="w-3 h-3" />
              <span>{t("clear", "Clear")}</span>
            </button>
          )}
        </div>
      </div>

      {/* Ultra-Compact Single Row Filter Section */}
      <div className="px-3 py-2">
        <div
          className="flex gap-1.5 overflow-x-auto pb-1"
          style={scrollbarHideStyle}
        >
          {/* Category Chips */}
          {QUICK_CATEGORIES.map(category => {
            const isSelected = selectedCategories.includes(category.id);
            return (
              <button
                key={category.id}
                onClick={() => onCategoryQuickSelect(category.id)}
                className={`flex-shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                  isSelected
                    ? "bg-gray-900 text-white border-gray-900 shadow-sm"
                    : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                }`}
                title={category.label}
              >
                <span className="text-sm">{category.icon}</span>
                <span className="whitespace-nowrap">{category.label}</span>
              </button>
            );
          })}

          {/* Divider */}
          <div className="flex-shrink-0 w-px h-8 bg-gray-200 mx-1"></div>

          {/* Price Range Chips */}
          {QUICK_PRICE_RANGES.map(priceRange => {
            const isSelected =
              selectedPriceRange &&
              selectedPriceRange[0] === priceRange.range[0] &&
              selectedPriceRange[1] === priceRange.range[1];

            return (
              <button
                key={priceRange.id}
                onClick={() => onPriceQuickSelect(priceRange.id)}
                className={`flex-shrink-0 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                  isSelected
                    ? "bg-gray-900 text-white border-gray-900 shadow-sm"
                    : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                }`}
              >
                {priceRange.label}
              </button>
            );
          })}

          {/* Divider */}
          <div className="flex-shrink-0 w-px h-8 bg-gray-200 mx-1"></div>

          {/* Special Filter Chips */}
          {SPECIAL_FILTERS.map(special => {
            const IconComponent = special.icon;
            return (
              <button
                key={special.id}
                onClick={() => onCategoryQuickSelect(special.id)}
                className="flex-shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border bg-white text-gray-700 border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all"
              >
                <IconComponent className="w-3 h-3" />
                <span className="whitespace-nowrap">{special.label}</span>
              </button>
            );
          })}

          {/* Divider */}
          <div className="flex-shrink-0 w-px h-8 bg-gray-200 mx-1"></div>

          {/* Advanced Filters Button - Inline (removed per request) */}
          {/*
          <button
            onClick={onOpenFilters}
            className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-900 text-white text-xs font-semibold hover:bg-gray-800 transition-all shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="whitespace-nowrap">
              {t("advancedFilters", "More Filters")}
            </span>
            {activeFilterCount > 0 && (
              <span className="inline-flex items-center justify-center h-4 min-w-[16px] px-1 rounded-full bg-white text-gray-900 text-xs font-bold">
                {activeFilterCount}
              </span>
            )}
          </button>
          */}
        </div>
      </div>
    </div>
  );
}
