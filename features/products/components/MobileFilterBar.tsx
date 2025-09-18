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
    <div className="md:hidden sticky top-[88px] sm:top-[96px] z-40 bg-gradient-to-b from-white via-white/98 to-white/95 backdrop-blur-2xl border-b border-gray-100/40 shadow-2xl animate-in slide-in-from-top duration-700">
      {/* Premium Header with Enhanced Glass Effect */}
      <div className="px-4 py-3 border-b border-gradient-to-r from-gray-100/30 via-gray-50/60 to-gray-100/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-indigo-500 via-purple-600 to-indigo-700 rounded-2xl shadow-xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
              <Filter className="w-5 h-5 text-white relative z-10" />
            </div>
            <div>
              <span className="text-base font-black text-gray-900">
                {t("filters", "Smart Filters")}
              </span>
              {activeFilterCount > 0 && (
                <div className="flex items-center gap-2 mt-1">
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
                  <span className="text-sm font-bold bg-gradient-to-r from-indigo-600 to-purple-600 text-transparent bg-clip-text">
                    {activeFilterCount} {t("active", "active")}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Premium Clear All Button */}
          {activeFilterCount > 0 && (
            <button
              onClick={onClearFilters}
              className="group flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-white bg-gradient-to-r from-gray-100 to-gray-200 hover:from-red-500 hover:to-red-600 rounded-2xl text-sm font-bold transition-all duration-500 hover:scale-110 active:scale-95 shadow-lg hover:shadow-xl border border-gray-200 hover:border-red-400"
            >
              <X className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
              <span>{t("clear", "Clear")}</span>
            </button>
          )}
        </div>
      </div>

      {/* Premium Main Filter Content with Enhanced Mobile UX */}
      <div className="px-4 py-4 overflow-x-hidden bg-gradient-to-b from-gray-50/30 to-white/50">
        <div className="flex flex-col gap-4">
          {/* Premium Quick Categories Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-1 h-4 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full"></div>
              <span className="text-sm font-black text-gray-800">
                Categories
              </span>
            </div>
            <div
              className="flex gap-2 overflow-x-auto pb-2"
              style={scrollbarHideStyle}
            >
              {QUICK_CATEGORIES.map(category => {
                const isSelected = selectedCategories.includes(category.id);
                return (
                  <button
                    key={category.id}
                    onClick={() => onCategoryQuickSelect(category.id)}
                    className={`group flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-black transition-all duration-500 border-2 shadow-lg hover:shadow-xl ${
                      isSelected
                        ? `bg-gradient-to-r ${category.color} text-white border-transparent shadow-xl scale-105`
                        : "bg-white border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50 hover:scale-105 active:scale-95"
                    }`}
                    title={category.label}
                  >
                    <span className="text-lg group-hover:scale-110 transition-transform duration-300">
                      {category.icon}
                    </span>
                    <span className="whitespace-nowrap">{category.label}</span>
                    {isSelected && (
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse shadow-lg"></div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Premium Price Ranges Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-1 h-4 bg-gradient-to-b from-green-500 to-emerald-500 rounded-full"></div>
              <span className="text-sm font-black text-gray-800">
                Price Range
              </span>
            </div>
            <div
              className="flex gap-2 overflow-x-auto pb-2"
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
                    className={`group flex-shrink-0 px-4 py-2.5 rounded-2xl text-sm font-black transition-all duration-500 border-2 shadow-lg hover:shadow-xl relative overflow-hidden ${
                      isSelected
                        ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-transparent shadow-xl scale-105"
                        : "bg-white border-gray-200 text-gray-700 hover:border-emerald-300 hover:bg-emerald-50 hover:scale-105 active:scale-95"
                    }`}
                  >
                    {!isSelected && (
                      <div className="absolute inset-0 bg-gradient-to-r from-emerald-50 to-teal-50 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
                    )}
                    <span className="relative z-10">
                      {priceRange.label} RON
                    </span>
                    {isSelected && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full shadow-md flex items-center justify-center">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Premium Special Categories Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-1 h-4 bg-gradient-to-b from-amber-500 to-orange-500 rounded-full"></div>
              <span className="text-sm font-black text-gray-800">
                Special Offers
              </span>
            </div>
            <div
              className="flex gap-2 overflow-x-auto pb-2"
              style={scrollbarHideStyle}
            >
              <button
                onClick={() => onCategoryQuickSelect("BEST_SELLERS")}
                className="group flex-shrink-0 flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-red-500 to-orange-500 text-white border-2 border-transparent rounded-2xl text-sm font-black hover:from-red-600 hover:to-orange-600 transition-all duration-500 transform hover:scale-105 active:scale-95 shadow-xl hover:shadow-2xl relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                <Star className="w-4 h-4 relative z-10 group-hover:rotate-12 transition-transform duration-300" />
                <span className="whitespace-nowrap relative z-10">
                  {t("best", "Bestsellers")}
                </span>
              </button>
              <button
                onClick={() => onCategoryQuickSelect("NEW_ARRIVALS")}
                className="group flex-shrink-0 flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-yellow-500 to-amber-500 text-white border-2 border-transparent rounded-2xl text-sm font-black hover:from-yellow-600 hover:to-amber-600 transition-all duration-500 transform hover:scale-105 active:scale-95 shadow-xl hover:shadow-2xl relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                <Zap className="w-4 h-4 relative z-10 group-hover:rotate-12 transition-transform duration-300" />
                <span className="whitespace-nowrap relative z-10">
                  {t("new", "New Arrivals")}
                </span>
              </button>
              <button
                onClick={() => onCategoryQuickSelect("GIFT_IDEAS")}
                className="group flex-shrink-0 flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white border-2 border-transparent rounded-2xl text-sm font-black hover:from-purple-600 hover:to-pink-600 transition-all duration-500 transform hover:scale-105 active:scale-95 shadow-xl hover:shadow-2xl relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                <Gift className="w-4 h-4 relative z-10 group-hover:rotate-12 transition-transform duration-300" />
                <span className="whitespace-nowrap relative z-10">
                  {t("gifts", "Gift Ideas")}
                </span>
              </button>
              <button
                onClick={() => onCategoryQuickSelect("SALE_ITEMS")}
                className="group flex-shrink-0 flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-2 border-transparent rounded-2xl text-sm font-black hover:from-emerald-600 hover:to-teal-600 transition-all duration-500 transform hover:scale-105 active:scale-95 shadow-xl hover:shadow-2xl relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                <TrendingUp className="w-4 h-4 relative z-10 group-hover:rotate-12 transition-transform duration-300" />
                <span className="whitespace-nowrap relative z-10">
                  {t("sale", "On Sale")}
                </span>
              </button>
            </div>
          </div>

          {/* Premium Main Filter Button */}
          <div className="flex justify-center pt-2">
            <Button
              onClick={onOpenFilters}
              className="group h-12 px-8 rounded-3xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-700 hover:via-purple-700 hover:to-indigo-800 text-white text-base font-black shadow-2xl hover:shadow-3xl transition-all duration-700 transform hover:scale-110 active:scale-95 relative overflow-hidden border-2 border-white/20"
            >
              {/* Premium animated background effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-white/30 via-white/10 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-white/20 transform skew-x-12 translate-x-full group-hover:-translate-x-full transition-transform duration-1000" />

              {/* Button content with enhanced design */}
              <div className="relative flex items-center gap-3 z-10">
                <div className="p-1 bg-white/20 rounded-full">
                  <Sparkles className="w-5 h-5 group-hover:rotate-180 transition-transform duration-700" />
                </div>
                <span className="font-black">
                  {t("advancedFilters", "Advanced Filters")}
                </span>
                <div className="flex items-center gap-1">
                  <div className="w-1 h-1 bg-white/60 rounded-full animate-pulse"></div>
                  <div
                    className="w-1 h-1 bg-white/60 rounded-full animate-pulse"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                  <div
                    className="w-1 h-1 bg-white/60 rounded-full animate-pulse"
                    style={{ animationDelay: "0.4s" }}
                  ></div>
                </div>
              </div>

              {/* Premium active filter indicator */}
              {activeFilterCount > 0 && (
                <div className="absolute -top-2 -right-2 h-6 w-6 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center shadow-xl animate-bounce border-2 border-white">
                  <span className="text-xs font-black text-white">
                    {activeFilterCount}
                  </span>
                </div>
              )}
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
