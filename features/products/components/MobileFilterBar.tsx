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
    <div className="md:hidden sticky top-16 z-30 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 border-b border-gray-100 shadow-sm">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gray-900 text-white">
              <Filter className="w-5 h-5" />
            </div>
            <div>
              <span className="text-base font-semibold text-gray-900">
                {t("filters", "Filters")}
              </span>
              {activeFilterCount > 0 && (
                <div className="mt-0.5 text-xs text-gray-500">
                  {activeFilterCount} {t("active", "active")}
                </div>
              )}
            </div>
          </div>

          {/* Clear All */}
          {activeFilterCount > 0 && (
            <button
              onClick={onClearFilters}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 hover:text-red-600 rounded-lg border border-gray-200 hover:border-red-300 transition-colors"
            >
              <X className="w-4 h-4" />
              <span>{t("clear", "Clear")}</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Filter Content */}
      <div className="px-4 py-4 overflow-x-hidden bg-white/60">
        <div className="flex flex-col gap-4">
          {/* Quick Categories */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-1 h-4 bg-gray-900 rounded"></div>
              <span className="text-sm font-semibold text-gray-900">
                Categories
              </span>
            </div>
            <div
              className="flex gap-2 overflow-x-auto pb-1"
              style={scrollbarHideStyle}
            >
              {QUICK_CATEGORIES.map(category => {
                const isSelected = selectedCategories.includes(category.id);
                return (
                  <button
                    key={category.id}
                    onClick={() => onCategoryQuickSelect(category.id)}
                    className={`flex-shrink-0 inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-colors border ${
                      isSelected
                        ? "bg-gray-900 text-white border-gray-900"
                        : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                    }`}
                    title={category.label}
                  >
                    <span className="text-base">{category.icon}</span>
                    <span className="whitespace-nowrap">{category.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Price Ranges */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-1 h-4 bg-gray-900 rounded"></div>
              <span className="text-sm font-semibold text-gray-900">
                Price Range
              </span>
            </div>
            <div
              className="flex gap-2 overflow-x-auto pb-1"
              style={scrollbarHideStyle}
            >
              {QUICK_PRICE_RANGES.map(priceRange => {
                const isSelected =
                  selectedPriceRange &&
                  selectedPriceRange[0] === priceRange.range[0] &&
                  selectedPriceRange[1] === priceRange.range[1];

                return (
                  <button
                    key={priceRange.id}
                    onClick={() => onPriceQuickSelect(priceRange.id)}
                    className={`flex-shrink-0 px-3.5 py-2 rounded-xl text-sm font-medium transition-colors border ${
                      isSelected
                        ? "bg-gray-900 text-white border-gray-900"
                        : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    {priceRange.label} RON
                  </button>
                );
              })}
            </div>
          </div>

          {/* Special Categories */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-1 h-4 bg-gray-900 rounded"></div>
              <span className="text-sm font-semibold text-gray-900">
                Special Offers
              </span>
            </div>
            <div
              className="flex gap-2 overflow-x-auto pb-1"
              style={scrollbarHideStyle}
            >
              <button
                onClick={() => onCategoryQuickSelect("BEST_SELLERS")}
                className="flex-shrink-0 inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium border bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
              >
                <Star className="w-4 h-4" />
                <span className="whitespace-nowrap">
                  {t("best", "Bestsellers")}
                </span>
              </button>
              <button
                onClick={() => onCategoryQuickSelect("NEW_ARRIVALS")}
                className="flex-shrink-0 inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium border bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
              >
                <Zap className="w-4 h-4" />
                <span className="whitespace-nowrap">
                  {t("new", "New Arrivals")}
                </span>
              </button>
              <button
                onClick={() => onCategoryQuickSelect("GIFT_IDEAS")}
                className="flex-shrink-0 inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium border bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
              >
                <Gift className="w-4 h-4" />
                <span className="whitespace-nowrap">
                  {t("gifts", "Gift Ideas")}
                </span>
              </button>
              <button
                onClick={() => onCategoryQuickSelect("SALE_ITEMS")}
                className="flex-shrink-0 inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium border bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
              >
                <TrendingUp className="w-4 h-4" />
                <span className="whitespace-nowrap">
                  {t("sale", "On Sale")}
                </span>
              </button>
            </div>
          </div>

          {/* Open Filters */}
          <div className="flex justify-center pt-2">
            <Button
              onClick={onOpenFilters}
              className="h-11 px-6 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                <span>{t("advancedFilters", "Advanced Filters")}</span>
                {activeFilterCount > 0 && (
                  <span className="ml-1 inline-flex items-center justify-center h-5 min-w-5 px-1 rounded-full bg-white text-gray-900 text-xs font-bold">
                    {activeFilterCount}
                  </span>
                )}
              </div>
            </Button>
          </div>
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
                    className="flex items-center gap-1 text-xs py-1 px-2 bg-gray-100 text-gray-800 border-gray-200"
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
                  className="flex items-center gap-1 text-xs py-1 px-2 bg-gray-100 text-gray-800 border-gray-200"
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
