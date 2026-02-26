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
  selectedAgeGroup?:
    | "TODDLERS_1_3"
    | "PRESCHOOL_3_5"
    | "ELEMENTARY_6_8"
    | "MIDDLE_SCHOOL_9_12"
    | "TEENS_13_PLUS";
  handleCategoryChange: (category: string) => void;
  handleFilterChange: (filterId: string, optionId: string) => void;
  handlePriceChange: (range: [number, number]) => void;
  handleNoPriceFilterChange: (enabled: boolean) => void;
  setSelectedLearningOutcomes: (value: string[]) => void;
  setSelectedProductType: (value: string) => void;
  setSelectedSpecialCategories: (value: string[]) => void;
  setSelectedAgeGroup?: (
    ageGroup:
      | "PRESCHOOL_3_5"
      | "ELEMENTARY_6_8"
      | "MIDDLE_SCHOOL_9_12"
      | "TEENS_13_PLUS"
      | undefined
  ) => void;
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
  selectedAgeGroup,
  handleCategoryChange,
  handleFilterChange,
  handlePriceChange,
  handleNoPriceFilterChange,
  setSelectedLearningOutcomes,
  setSelectedProductType,
  setSelectedSpecialCategories,
  setSelectedAgeGroup,
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
    (selectedProductType && selectedProductType !== "all" ? 1 : 0) +
    (selectedAgeGroup ? 1 : 0);

  return (
    <aside
      className={cn(
        "hidden xl:block shrink-0",
        "w-full xl:w-80 2xl:w-96",
        "min-w-0 max-w-full"
      )}
    >
      <div className="sticky top-24 overflow-hidden rounded-2xl border border-slate-200/70 bg-white/85 shadow-[0_18px_45px_-35px_rgba(15,23,42,0.45)] backdrop-blur-sm">
        <div className="relative flex flex-col gap-4 sm:gap-5 px-4 py-4 sm:px-5 sm:py-5 md:px-5 md:py-5 lg:px-6 lg:py-6">
          <div className="flex items-start justify-between gap-2 sm:gap-4 min-w-0">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-700 ring-1 ring-sky-200/60">
                <SlidersHorizontal className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm sm:text-base font-semibold text-slate-900 truncate">
                  {t("filterOptions", "Filters")}
                </h3>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setMobileFiltersOpen(true)}
              className="inline-flex shrink-0 items-center gap-1.5 sm:gap-2 rounded-lg border border-slate-200 bg-white/80 px-2.5 py-1.5 sm:px-3 text-xs font-medium text-slate-600 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2"
            >
              <Filter className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">{t("openFilters", "Open")}</span>
            </button>
          </div>

          {activeFiltersCount > 0 && (
            <div className="flex items-center justify-between rounded-xl border border-sky-100 bg-sky-50/80 px-4 py-2.5 text-sm">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-sky-600" />
                <span className="font-medium text-slate-700">
                  {t("activeFilters", "Active Filters")}
                </span>
              </div>
              <span className="rounded-full bg-sky-600 px-2.5 py-1 text-xs font-semibold text-white shadow-sm">
                {activeFiltersCount}
              </span>
            </div>
          )}

          <ScrollArea
            className={cn(
              "pr-2 sm:pr-3",
              "h-[50vh] min-h-[280px] sm:h-[55vh] md:h-[60vh] lg:h-[65vh] max-h-[calc(100vh-20rem)]"
            )}
          >
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
              selectedAgeGroup={selectedAgeGroup}
              onCategoryChange={handleCategoryChange}
              onFilterChange={handleFilterChange}
              onPriceChange={handlePriceChange}
              onNoPriceFilterChange={handleNoPriceFilterChange}
              onLearningOutcomesChange={setSelectedLearningOutcomes}
              onProductTypeChange={setSelectedProductType}
              onSpecialCategoriesChange={setSelectedSpecialCategories}
              onAgeGroupChange={setSelectedAgeGroup}
              onClearFilters={handleClearFilters}
              onCloseMobile={() => setMobileFiltersOpen(false)}
              isInsideModal={false}
              t={t}
              className={cn(
                "space-y-5 text-slate-900",
                "[&_.text-muted-foreground]:text-slate-500",
                "[&_.text-gray-600]:text-slate-600",
                "[&_.text-gray-700]:text-slate-700",
                "[&_.text-gray-500]:text-slate-500",
                "[&_.border-gray-200]:border-slate-200",
                "[&_.border-gray-100]:border-slate-100",
                "[&_.bg-white]:bg-white/80",
                "[&_.bg-gray-50]:bg-slate-50",
                "[&_.bg-gray-100]:bg-slate-100",
                "[&_.shadow-sm]:shadow-[0_10px_30px_-24px_rgba(15,23,42,0.25)]",
                "[&_.ring-offset-background]:ring-offset-white"
              )}
            />
          </ScrollArea>

          <div className="flex flex-col gap-2 rounded-xl border border-emerald-100 bg-emerald-50/70 px-3 py-2.5 sm:px-4 sm:py-3 text-xs text-slate-600 sm:text-sm">
            <p className="font-medium text-slate-900">
              {t(
                "filterTipTitle",
                "Tip: Combine age group + learning outcomes to see ultra-relevant kits."
              )}
            </p>
            <p className="text-slate-600">
              {t(
                "filterTipDescription",
                'Use the "Learning Outcomes" and "Special Categories" filters together to surface curated picks for your young inventor.'
              )}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
