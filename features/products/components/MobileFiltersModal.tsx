"use client";

import { Check, Search, X } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";

import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { normalizeCategory } from "@/lib/utils/product-filters-url";

import type { FilterGroup } from "./EnhancedProductFilters";
import { MobileFilterBar, type MobileFilterPanel } from "./MobileFilterBar";

interface PriceRange {
  min: number;
  max: number;
  current: [number, number];
}

interface MobileFiltersModalProps {
  isOpen: boolean;
  activePanel: MobileFilterPanel;
  onClose: () => void;
  onActivePanelChange: (panel: MobileFilterPanel) => void;
  categories: FilterGroup;
  priceRange: PriceRange;
  selectedCategories: string[];
  noPriceFilter: boolean;
  selectedAgeGroup?:
    | "TODDLERS_1_3"
    | "PRESCHOOL_3_5"
    | "ELEMENTARY_6_8"
    | "MIDDLE_SCHOOL_9_12"
    | "TEENS_13_PLUS";
  activeFilterCount: number;
  categoryLabel: string;
  ageLabel: string;
  priceLabel: string;
  onCategoryChange: (category: string) => void;
  onPriceChange: (range: [number, number]) => void;
  onNoPriceFilterChange: (enabled: boolean) => void;
  onAgeGroupChange?: (
    ageGroup:
      | "PRESCHOOL_3_5"
      | "ELEMENTARY_6_8"
      | "MIDDLE_SCHOOL_9_12"
      | "TEENS_13_PLUS"
      | undefined
  ) => void;
  onClearCurrentPanel: (panel: MobileFilterPanel) => void;
  onClearFilters: () => void;
  t: (key: string, fallback?: string) => string;
}

const MOBILE_AGE_OPTIONS = [
  {
    id: "PRESCHOOL_3_5",
    labelKey: "age3to5H2",
    fallback: "3-5 years",
  },
  {
    id: "ELEMENTARY_6_8",
    labelKey: "age6to8H2",
    fallback: "6-8 years",
  },
  {
    id: "MIDDLE_SCHOOL_9_12",
    labelKey: "age9to12H2",
    fallback: "9-12 years",
  },
  {
    id: "TEENS_13_PLUS",
    labelKey: "age13plusH2",
    fallback: "13+ years",
  },
] as const;

interface PricePreset {
  id: string;
  label: string;
  range?: [number, number];
}

function formatCompactPrice(value: number) {
  return `${Math.round(value)} lei`;
}

function buildPricePresets(priceRange: PriceRange): PricePreset[] {
  const min = Math.max(0, Math.floor(priceRange.min));
  const max = Math.max(min + 1, Math.ceil(priceRange.max));
  const spread = max - min;

  if (spread <= 60) {
    const midpoint = Math.ceil((min + max) / 2);
    return [
      {
        id: "all",
        label: "All prices",
      },
      {
        id: "range-1",
        label: `${formatCompactPrice(min)} - ${formatCompactPrice(midpoint)}`,
        range: [min, midpoint],
      },
      {
        id: "range-2",
        label: `${formatCompactPrice(midpoint)} - ${formatCompactPrice(max)}`,
        range: [midpoint, max],
      },
    ];
  }

  const firstCut = Math.ceil(min + spread / 3);
  const secondCut = Math.ceil(min + (2 * spread) / 3);

  return [
    {
      id: "all",
      label: "All prices",
    },
    {
      id: "budget",
      label: `Up to ${formatCompactPrice(firstCut)}`,
      range: [min, firstCut],
    },
    {
      id: "mid",
      label: `${formatCompactPrice(firstCut)} - ${formatCompactPrice(secondCut)}`,
      range: [firstCut, secondCut],
    },
    {
      id: "premium",
      label: `${formatCompactPrice(secondCut)}+`,
      range: [secondCut, max],
    },
  ];
}

function isSameRange(
  first: [number, number] | undefined,
  second: [number, number] | undefined
) {
  if (!first || !second) return false;
  return first[0] === second[0] && first[1] === second[1];
}

export function MobileFiltersModal({
  isOpen,
  activePanel,
  onClose,
  onActivePanelChange,
  categories,
  priceRange,
  selectedCategories,
  noPriceFilter,
  selectedAgeGroup,
  activeFilterCount,
  categoryLabel,
  ageLabel,
  priceLabel,
  onCategoryChange,
  onPriceChange,
  onNoPriceFilterChange,
  onAgeGroupChange,
  onClearCurrentPanel,
  onClearFilters,
  t,
}: MobileFiltersModalProps) {
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setSearchQuery("");
    }
  }, [isOpen]);

  useEffect(() => {
    if (activePanel !== "category") {
      setSearchQuery("");
    }
  }, [activePanel]);

  const filteredCategories = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) return categories.options;

    return categories.options.filter(option =>
      option.label.toLowerCase().includes(query)
    );
  }, [categories.options, searchQuery]);

  const pricePresets = useMemo(
    () => buildPricePresets(priceRange),
    [priceRange]
  );

  const modalTitle =
    activePanel === "category"
      ? t("categories", "Category")
      : activePanel === "age"
        ? t("ageGroup", "Age")
        : t("price", "Price");

  const categoryEmptyState = t(
    "noMatchingCategories",
    "No categories match your search."
  );

  return (
    <Sheet open={isOpen} onOpenChange={open => !open && onClose()}>
      <SheetContent
        side="top"
        className="[&>button]:hidden left-0 right-0 top-[4.5rem] mx-3 h-auto max-h-[calc(100vh-6rem)] w-auto rounded-[28px] border border-slate-200 bg-white px-0 pb-0 pt-0 shadow-[0_20px_44px_rgba(15,23,42,0.18)]"
      >
        <SheetHeader className="border-b border-slate-100 px-4 pb-3 pt-3 text-left">
          <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-slate-200" />
          <div className="flex items-start justify-between gap-3">
            <div>
              <SheetTitle className="text-xl font-semibold text-slate-900">
                {modalTitle}
              </SheetTitle>
              <p className="mt-1 text-xs text-slate-500">
                {t("refineResults", "Refine the products you see on mobile.")}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-indigo-200 bg-white text-slate-500 shadow-sm transition-colors hover:bg-slate-50 hover:text-slate-700"
              aria-label={t("close", "Close")}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="-mx-4 mt-3">
            <MobileFilterBar
              activeFilterCount={activeFilterCount}
              categoryLabel={categoryLabel}
              ageLabel={ageLabel}
              priceLabel={priceLabel}
              categoryActive={selectedCategories.length > 0}
              ageActive={Boolean(selectedAgeGroup)}
              priceActive={
                !noPriceFilter &&
                (priceRange.current[0] !== priceRange.min ||
                  priceRange.current[1] !== priceRange.max)
              }
              onOpenPanel={onActivePanelChange}
              onClearFilters={onClearFilters}
              searchQuery=""
              onSearchQueryChange={() => {}}
              onClearSearch={() => {}}
              showSearch={false}
              t={t}
            />
          </div>
        </SheetHeader>

        <div className="overflow-y-auto px-4 py-3">
          {activePanel === "category" && (
            <div className="space-y-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={searchQuery}
                  onChange={event => setSearchQuery(event.target.value)}
                  placeholder={t("searchCategory", "Search categories")}
                  className="h-10 rounded-xl border-slate-200 bg-slate-50 pl-10 text-sm text-slate-700 focus-visible:ring-orange-200"
                />
              </div>

              {filteredCategories.length > 0 ? (
                <div className="grid grid-cols-2 gap-2.5">
                  {filteredCategories.map(option => {
                    const isSelected = selectedCategories.some(
                      selectedCategory =>
                        normalizeCategory(selectedCategory) ===
                        normalizeCategory(option.id)
                    );

                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => onCategoryChange(option.id)}
                        className={cn(
                          "flex min-h-[48px] items-center justify-between gap-2 rounded-xl border px-3 py-2 text-left transition-colors",
                          isSelected
                            ? "border-orange-400 bg-orange-50 text-orange-700"
                            : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                        )}
                      >
                        <span className="min-w-0 flex-1 text-sm font-medium leading-tight">
                          <span className="block truncate">{option.label}</span>
                          {option.count !== undefined && (
                            <span className="mt-0.5 block text-[11px] text-slate-400">
                              {option.count}
                            </span>
                          )}
                        </span>
                        <span
                          className={cn(
                            "flex h-4.5 w-4.5 flex-shrink-0 items-center justify-center rounded-md border",
                            isSelected
                              ? "border-orange-500 bg-orange-500 text-white"
                              : "border-slate-300 bg-white"
                          )}
                        >
                          {isSelected && <Check className="h-3 w-3" />}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                  {categoryEmptyState}
                </div>
              )}
            </div>
          )}

          {activePanel === "age" && (
            <div className="grid grid-cols-2 gap-2.5">
              {MOBILE_AGE_OPTIONS.map(option => {
                const isSelected = selectedAgeGroup === option.id;

                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() =>
                      onAgeGroupChange?.(
                        isSelected ? undefined : (option.id as any)
                      )
                    }
                    className={cn(
                      "flex min-h-[48px] items-center justify-between gap-2 rounded-xl border px-3 py-2 text-left transition-colors",
                      isSelected
                        ? "border-orange-400 bg-orange-50 text-orange-700"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                    )}
                  >
                    <span className="text-sm font-medium">
                      {t(option.labelKey, option.fallback)}
                    </span>
                    <span
                      className={cn(
                        "flex h-4.5 w-4.5 flex-shrink-0 items-center justify-center rounded-md border",
                        isSelected
                          ? "border-orange-500 bg-orange-500 text-white"
                          : "border-slate-300 bg-white"
                      )}
                    >
                      {isSelected && <Check className="h-3 w-3" />}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {activePanel === "price" && (
            <div className="space-y-2.5">
              {pricePresets.map(preset => {
                const isSelected = preset.range
                  ? !noPriceFilter &&
                    isSameRange(priceRange.current, preset.range)
                  : noPriceFilter;

                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      if (preset.range) {
                        onPriceChange(preset.range);
                        onNoPriceFilterChange(false);
                        return;
                      }

                      onNoPriceFilterChange(true);
                      onPriceChange([priceRange.min, priceRange.max]);
                    }}
                    className={cn(
                      "flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-2.5 text-left transition-colors",
                      isSelected
                        ? "border-orange-400 bg-orange-50 text-orange-700"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                    )}
                  >
                    <span className="text-sm font-medium">{preset.label}</span>
                    <span
                      className={cn(
                        "flex h-4.5 w-4.5 flex-shrink-0 items-center justify-center rounded-md border",
                        isSelected
                          ? "border-orange-500 bg-orange-500 text-white"
                          : "border-slate-300 bg-white"
                      )}
                    >
                      {isSelected && <Check className="h-3 w-3" />}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="border-t border-slate-100 bg-white px-4 py-3">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => onClearCurrentPanel(activePanel)}
              className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50"
            >
              {t("clear", "Clear")}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-orange-600"
            >
              {t("apply", "Apply")}
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
