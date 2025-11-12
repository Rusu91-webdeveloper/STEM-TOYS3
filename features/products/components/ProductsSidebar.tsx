"use client";

import { Filter, Sparkles, SlidersHorizontal } from "lucide-react";
import React from "react";

import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

// Import directly instead of dynamic to prevent CLS
import { EnhancedProductFilters } from "./EnhancedProductFilters";

import type { FilterGroup } from "./EnhancedProductFilters";

interface PriceRange {
  min: number;
  max: number;
  current: [number, number];
}

interface ProductsSidebarProps {
  categoryFilter: FilterGroup[];
  dynamicFilters: FilterGroup[];
  priceRangeFilter: [number, number];
  products: Array<{ price: number }>; // Add products prop for price calculation
  selectedCategories: string[];
  selectedFilters: Record<string, string[]>;
  noPriceFilter: boolean;
  selectedLearningOutcomes: string[];
  selectedProductType: string;
  selectedSpecialCategories: string[];
  handleCategoryChange: (category: string) => void;
  handleFilterChange: (filterId: string, optionId: string) => void;
  handlePriceChange: (range: [number, number]) => void;
  handleNoPriceFilterChange: (enabled: boolean) => void;
  setSelectedLearningOutcomes: (value: string[]) => void;
  setSelectedProductType: (value: string) => void;
  setSelectedSpecialCategories: (value: string[]) => void;
  handleClearFilters: () => void;
  setMobileFiltersOpen: (open: boolean) => void;
  t: (key: string, fallback?: string) => string;
}

export function ProductsSidebar({
  categoryFilter,
  dynamicFilters,
  priceRangeFilter,
  products,
  selectedCategories,
  selectedFilters,
  noPriceFilter,
  selectedLearningOutcomes,
  selectedProductType,
  selectedSpecialCategories,
  handleCategoryChange,
  handleFilterChange,
  handlePriceChange,
  handleNoPriceFilterChange,
  setSelectedLearningOutcomes,
  setSelectedProductType,
  setSelectedSpecialCategories,
  handleClearFilters,
  setMobileFiltersOpen,
  t,
}: ProductsSidebarProps) {
  // Calculate actual price range from products
  const actualPriceRange = React.useMemo(() => {
    if (!products || products.length === 0) {
      return { min: 0, max: 1000 }; // Fallback values
    }

    const prices = products
      .map(p => {
        const price =
          typeof p.price === "string" ? parseFloat(p.price) : p.price;
        return isNaN(price) ? 0 : price;
      })
      .filter(price => price > 0);

    if (prices.length === 0) {
      return { min: 0, max: 1000 }; // Fallback if no valid prices
    }

    const min = Math.floor(Math.min(...prices));
    const max = Math.ceil(Math.max(...prices));

    return { min, max };
  }, [products]);

  const priceRange: PriceRange = {
    min: actualPriceRange.min,
    max: actualPriceRange.max,
    current: priceRangeFilter,
  };

  const priceFilterActive =
    !noPriceFilter &&
    (priceRangeFilter[0] > priceRange.min ||
      priceRangeFilter[1] < priceRange.max);

  const activeFiltersCount =
    selectedCategories.length +
    Object.values(selectedFilters).reduce(
      (count, options) => count + (Array.isArray(options) ? options.length : 0),
      0
    ) +
    (priceFilterActive ? 1 : 0) +
    selectedLearningOutcomes.length +
    selectedSpecialCategories.length +
    (selectedProductType && selectedProductType !== "all" ? 1 : 0);

  return (
    <aside className="hidden md:block w-full md:max-w-xs lg:max-w-sm xl:max-w-md">
      <div className="relative sticky top-20 sm:top-24 isolate overflow-hidden rounded-3xl border border-white/10 bg-slate-950/70 shadow-[0_25px_70px_-20px_rgba(15,23,42,0.8)] backdrop-blur-2xl">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-indigo-500/15 via-slate-900/40 to-sky-500/10" />
        <div className="pointer-events-none absolute -top-40 -right-32 h-64 w-64 rounded-full bg-sky-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-48 -left-24 h-72 w-72 rounded-full bg-violet-500/20 blur-[120px]" />

        <div className="relative flex flex-col gap-6 px-5 py-6 sm:px-6 sm:py-7">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/15 bg-gradient-to-br from-sky-500/80 via-indigo-500/80 to-purple-500/80 text-white shadow-[0_15px_40px_rgba(99,102,241,0.45)] sm:h-14 sm:w-14">
                <SlidersHorizontal className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-300/80">
                  {t("filters", "Filters")}
                </p>
                <h3 className="text-lg font-semibold text-white sm:text-xl">
                  {t("filterOptions", "Curate Your Experience")}
                </h3>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setMobileFiltersOpen(true)}
              className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-sky-100 transition hover:border-white/25 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
            >
              <Filter className="h-4 w-4" />
              {t("openFilters", "Open")}
            </button>
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-slate-100 shadow-inner shadow-black/20 sm:text-sm">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-sky-200" />
              <span className="font-medium tracking-wide">
                {t("activeFilters", "Active Filters")}
              </span>
            </div>
            <span className="rounded-full bg-gradient-to-r from-sky-500/90 via-indigo-500/90 to-purple-500/90 px-3 py-1 text-[0.7rem] font-semibold text-white shadow-[0_12px_30px_rgba(56,189,248,0.35)]">
              {activeFiltersCount}
            </span>
          </div>

          <ScrollArea className="h-[60vh] md:h-[62vh] lg:h-[65vh] pr-3">
            <EnhancedProductFilters
              categories={categoryFilter[0]}
              filters={dynamicFilters}
              priceRange={priceRange}
              selectedCategories={selectedCategories}
              selectedFilters={selectedFilters}
              noPriceFilter={noPriceFilter}
              selectedLearningOutcomes={selectedLearningOutcomes}
              selectedProductType={selectedProductType}
              selectedSpecialCategories={selectedSpecialCategories}
              onCategoryChange={handleCategoryChange}
              onFilterChange={handleFilterChange}
              onPriceChange={handlePriceChange}
              onNoPriceFilterChange={handleNoPriceFilterChange}
              onLearningOutcomesChange={setSelectedLearningOutcomes}
              onProductTypeChange={setSelectedProductType}
              onSpecialCategoriesChange={setSelectedSpecialCategories}
              onClearFilters={handleClearFilters}
              onCloseMobile={() => setMobileFiltersOpen(false)}
              isInsideModal={false}
              t={t}
              className={cn(
                "space-y-6 text-slate-100",
                "[&_.text-muted-foreground]:text-slate-300/85",
                "[&_.text-gray-600]:text-slate-300/85",
                "[&_.text-gray-700]:text-slate-200",
                "[&_.text-gray-500]:text-slate-300/80",
                "[&_.border-gray-200]:border-white/10",
                "[&_.border-gray-100]:border-white/10",
                "[&_.bg-white]:bg-slate-900/70",
                "[&_.bg-gray-50]:bg-slate-900/60",
                "[&_.bg-gray-100]:bg-slate-900/60",
                "[&_.shadow-sm]:shadow-none",
                "[&_.ring-offset-background]:ring-offset-slate-900"
              )}
            />
          </ScrollArea>

          <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-4 text-xs text-slate-300 shadow-inner shadow-black/30 sm:text-sm">
            <p className="font-medium text-slate-100">
              {t(
                "filterTipTitle",
                "Pro Tip: Combine age group + skill outcomes to see hyper-relevant kits."
              )}
            </p>
            <p className="text-slate-300/80">
              {t(
                "filterTipDescription",
                "Use the “Learning Outcomes” and “Special Categories” filters together to surface curated picks for your young inventor."
              )}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
