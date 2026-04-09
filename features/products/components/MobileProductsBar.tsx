"use client";

import { Grid2X2, List, Search, X } from "lucide-react";
import React from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface MobileProductsBarProps {
  bundleViewMode: "all" | "bundles" | "products";
  onBundleViewModeChange: (mode: "all" | "bundles" | "products") => void;
  bundleCount: number;
  regularCount: number;
  totalCount: number;
  sortOption: string;
  onSortChange: (value: string) => void;
  viewMode: "grid" | "list";
  onViewModeChange: (mode: "grid" | "list") => void;
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  onClearSearch: () => void;
  t: (key: string, fallback?: string) => string;
}

export function MobileProductsBar({
  bundleViewMode,
  onBundleViewModeChange,
  bundleCount,
  regularCount,
  totalCount,
  sortOption,
  onSortChange,
  viewMode,
  onViewModeChange,
  searchQuery,
  onSearchQueryChange,
  onClearSearch,
  t,
}: MobileProductsBarProps) {
  const scrollbarHideStyle = {
    scrollbarWidth: "none" as const,
    msOverflowStyle: "none" as const,
  };

  return (
    <div className="xl:hidden border-b border-slate-200/80 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/90">
      {/* Row A: Tabs + Sort + View toggle */}
      <div className="flex items-center gap-2 px-3 py-2">
        {/* Bundle/All/Products tabs as compact pills */}
        <div
          className="flex items-center gap-1 overflow-x-auto flex-1 min-w-0"
          style={scrollbarHideStyle}
        >
          <button
            type="button"
            onClick={() => onBundleViewModeChange("all")}
            className={`flex-shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all border ${
              bundleViewMode === "all"
                ? "bg-slate-900 text-white border-slate-900"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            }`}
          >
            {t("all", "Toate")}
            <span
              className={`ml-1 text-[10px] ${bundleViewMode === "all" ? "text-white/70" : "text-slate-400"}`}
            >
              ({totalCount})
            </span>
          </button>

          {bundleCount > 0 && (
            <button
              type="button"
              onClick={() => onBundleViewModeChange("bundles")}
              className={`flex-shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all border ${
                bundleViewMode === "bundles"
                  ? "bg-cyan-600 text-white border-cyan-600"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              {t("bundles", "Bundles")}
              <span
                className={`ml-1 text-[10px] ${bundleViewMode === "bundles" ? "text-white/70" : "text-slate-400"}`}
              >
                ({bundleCount})
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={() => onBundleViewModeChange("products")}
            className={`flex-shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all border ${
              bundleViewMode === "products"
                ? "bg-slate-900 text-white border-slate-900"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            }`}
          >
            {t("products", "Produse")}
            <span
              className={`ml-1 text-[10px] ${bundleViewMode === "products" ? "text-white/70" : "text-slate-400"}`}
            >
              ({regularCount})
            </span>
          </button>
        </div>

        {/* Sort select (compact) */}
        <div className="flex-shrink-0">
          <Select value={sortOption} onValueChange={onSortChange}>
            <SelectTrigger className="h-8 w-28 text-xs bg-white border-slate-200 text-slate-700 shadow-none rounded-lg hover:border-slate-300 focus:ring-1 focus:ring-sky-200 px-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="border-slate-200 bg-white text-slate-700 shadow-lg">
              <SelectItem value="featured" className="text-xs">
                {t("featured", "Recomandate")}
              </SelectItem>
              <SelectItem value="price-low" className="text-xs">
                {t("priceLowToHigh", "Preț ↑")}
              </SelectItem>
              <SelectItem value="price-high" className="text-xs">
                {t("priceHighToLow", "Preț ↓")}
              </SelectItem>
              <SelectItem value="newest" className="text-xs">
                {t("newest", "Nou")}
              </SelectItem>
              <SelectItem value="rating" className="text-xs">
                {t("topRated", "Top")}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* View toggle (grid / list) */}
        <div className="flex-shrink-0 inline-flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5">
          <button
            type="button"
            onClick={() => onViewModeChange("grid")}
            aria-label={t("gridView", "Grid")}
            className={`flex items-center justify-center w-7 h-7 rounded-md transition-all ${
              viewMode === "grid"
                ? "bg-slate-900 text-white shadow-sm"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <Grid2X2 className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange("list")}
            aria-label={t("listView", "Lista")}
            className={`flex items-center justify-center w-7 h-7 rounded-md transition-all ${
              viewMode === "list"
                ? "bg-slate-900 text-white shadow-sm"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <List className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Row B: Search */}
      <div className="px-3 pb-2">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            type="search"
            value={searchQuery}
            onChange={e => onSearchQueryChange(e.currentTarget.value)}
            placeholder={t("productsSearchPlaceholder", "Search toys by name...")}
            className="h-9 w-full rounded-xl border border-slate-200/90 bg-white/95 pl-10 pr-10 text-base shadow-sm transition placeholder:text-sm focus:outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-200 sm:text-sm"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={onClearSearch}
              className="absolute right-2 top-1/2 inline-flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              aria-label={t("clearSearch", "Clear search")}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
