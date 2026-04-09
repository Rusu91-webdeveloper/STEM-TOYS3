"use client";

import { ChevronDown, RotateCcw, Search, X } from "lucide-react";
import React from "react";

import { cn } from "@/lib/utils";

export type MobileFilterPanel = "category" | "age" | "price";

interface MobileFilterBarProps {
  activeFilterCount: number;
  categoryLabel: string;
  ageLabel: string;
  priceLabel: string;
  categoryActive: boolean;
  ageActive: boolean;
  priceActive: boolean;
  onOpenPanel: (panel: MobileFilterPanel) => void;
  onClearFilters: () => void;
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  onClearSearch: () => void;
  showSearch?: boolean;
  t: (key: string, fallback?: string) => string;
}

interface MobileFilterChipProps {
  active: boolean;
  label: string;
  onClick: () => void;
}

function MobileFilterChip({ active, label, onClick }: MobileFilterChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex min-w-0 flex-shrink-0 items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
        active
          ? "border-orange-400 bg-orange-50 text-orange-700"
          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
      )}
    >
      <span className="truncate max-w-[9rem]">{label}</span>
      <ChevronDown className="h-4 w-4 flex-shrink-0" />
    </button>
  );
}

export function MobileFilterBar({
  activeFilterCount,
  categoryLabel,
  ageLabel,
  priceLabel,
  categoryActive,
  ageActive,
  priceActive,
  onOpenPanel,
  onClearFilters,
  searchQuery,
  onSearchQueryChange,
  onClearSearch,
  showSearch = true,
  t,
}: MobileFilterBarProps) {
  return (
    <div className="xl:hidden border-b border-slate-100 bg-white">
      <div className="space-y-3 px-4 py-3">
        <div
          className="flex items-center gap-2 overflow-x-auto"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          <MobileFilterChip
            active={categoryActive}
            label={categoryLabel}
            onClick={() => onOpenPanel("category")}
          />
          <MobileFilterChip
            active={ageActive}
            label={ageLabel}
            onClick={() => onOpenPanel("age")}
          />
          <MobileFilterChip
            active={priceActive}
            label={priceLabel}
            onClick={() => onOpenPanel("price")}
          />
        </div>

        {showSearch && (
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <input
              type="search"
              value={searchQuery}
              onChange={e => onSearchQueryChange(e.currentTarget.value)}
              placeholder={t(
                "productsSearchPlaceholder",
                "Search toys by name..."
              )}
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-10 text-base text-slate-700 transition placeholder:text-sm focus:border-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-100 sm:text-sm"
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
        )}

        {activeFilterCount > 0 && (
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-slate-500">
              {activeFilterCount} {t("activeFilters", "active filters")}
            </p>
            <button
              type="button"
              onClick={onClearFilters}
              className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 transition-colors hover:text-slate-900"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              {t("clearAll", "Clear all")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
