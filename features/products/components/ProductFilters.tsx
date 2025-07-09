"use client";

import { X, SlidersHorizontal } from "lucide-react";
import React, { useState } from "react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useCurrency } from "@/lib/currency";
import { cn } from "@/lib/utils";

export interface FilterOption {
  id: string;
  label: string;
  count?: number;
}

export interface FilterGroup {
  id: string;
  name: string;
  options: FilterOption[];
}

export interface PriceRange {
  min: number;
  max: number;
}

export interface ProductFiltersProps {
  categories?: FilterGroup;
  filters: FilterGroup[];
  priceRange?: {
    min: number;
    max: number;
    current: PriceRange;
  };
  selectedCategories?: string[];
  selectedFilters?: Record<string, string[]>;
  noPriceFilter?: boolean;
  onCategoryChange?: (categoryId: string) => void;
  onFilterChange?: (filterId: string, optionId: string) => void;
  onPriceChange?: (range: PriceRange) => void;
  onNoPriceFilterChange?: (checked: boolean) => void;
  onClearFilters?: () => void;
  className?: string;
}

export function ProductFilters({
  categories,
  filters,
  priceRange,
  selectedCategories = [],
  selectedFilters = {},
  noPriceFilter = true,
  onCategoryChange,
  onFilterChange,
  onPriceChange,
  onNoPriceFilterChange,
  onClearFilters,
  className,
}: ProductFiltersProps) {
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [localPriceRange, setLocalPriceRange] = useState<PriceRange>(
    priceRange?.current || {
      min: priceRange?.min || 0,
      max: priceRange?.max || 100,
    }
  );

  // Count total active filters
  const activeFilterCount =
    selectedCategories.length +
    Object.values(selectedFilters).reduce(
      (count, options) => count + options.length,
      0
    ) +
    (!noPriceFilter &&
    (priceRange?.current.min !== priceRange?.min ||
      priceRange?.current.max !== priceRange?.max)
      ? 1
      : 0);

  // Handle price slider change
  const handlePriceChange = (value: number[]) => {
    const newRange = { min: value[0], max: value[1] };
    setLocalPriceRange(newRange);
  };

  // Apply price range filter when done changing
  const handlePriceChangeComplete = () => {
    if (onPriceChange) {
      onPriceChange(localPriceRange);
    }
  };

  // Get the currency formatter
  const { formatPrice } = useCurrency();

  const filterContent = (
    <div className="space-y-4 sm:space-y-6">
      {/* Clear filters button (if there are active filters) */}
      {activeFilterCount > 0 && (
        <div className="flex items-center justify-between">
          <h3 className="text-xs sm:text-sm font-medium">
            Active Filters: {activeFilterCount}
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="h-6 sm:h-8 text-xs py-0">
            Clear All
          </Button>
        </div>
      )}

      {/* Categories filter */}
      {categories && categories.options.length > 0 && (
        <div className="space-y-3 sm:space-y-4">
          <h3 className="text-xs sm:text-sm font-medium">{categories.name}</h3>
          <div className="space-y-1.5 sm:space-y-2">
            {categories.options.map((category) => (
              <div
                key={category.id}
                className="flex items-center space-x-2">
                <Checkbox
                  id={`category-${category.id}`}
                  checked={selectedCategories.includes(category.id)}
                  onCheckedChange={() => onCategoryChange?.(category.id)}
                  className="h-3.5 w-3.5 sm:h-4 sm:w-4"
                />
                <Label
                  htmlFor={`category-${category.id}`}
                  className="flex-grow text-xs sm:text-sm">
                  {category.label}
                </Label>
                {category.count !== undefined && (
                  <span className="text-[10px] sm:text-xs text-muted-foreground">
                    ({category.count})
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Price range filter */}
      {priceRange && (
        <div className="space-y-3 sm:space-y-4">
          <h3 className="text-xs sm:text-sm font-medium">Price Range</h3>

          {/* No price filter checkbox */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="no-price-filter"
              checked={noPriceFilter}
              onCheckedChange={onNoPriceFilterChange}
              className="h-3.5 w-3.5 sm:h-4 sm:w-4"
            />
            <Label
              htmlFor="no-price-filter"
              className="text-xs sm:text-sm font-medium">
              No price filter
            </Label>
          </div>

          {/* Price range controls - only show when price filter is enabled */}
          {!noPriceFilter && (
            <div className="space-y-4 sm:space-y-5 px-1 sm:px-2">
              {/* Direct input fields for price range */}
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="relative flex items-center w-full">
                  <span className="absolute left-2 text-xs text-muted-foreground">
                    MIN
                  </span>
                  <input
                    type="number"
                    value={localPriceRange.min}
                    min={priceRange.min}
                    max={localPriceRange.max - 1}
                    onChange={(e) => {
                      const value = Number(e.target.value);
                      if (
                        !isNaN(value) &&
                        value >= priceRange.min &&
                        value < localPriceRange.max
                      ) {
                        handlePriceChange([value, localPriceRange.max]);
                        handlePriceChangeComplete();
                      }
                    }}
                    className="w-full pl-9 pr-1 py-1 text-xs border rounded-md h-7"
                  />
                  <span className="absolute right-2 text-xs">lei</span>
                </div>
                <span className="text-xs text-muted-foreground">-</span>
                <div className="relative flex items-center w-full">
                  <span className="absolute left-2 text-xs text-muted-foreground">
                    MAX
                  </span>
                  <input
                    type="number"
                    value={localPriceRange.max}
                    min={localPriceRange.min + 1}
                    max={priceRange.max}
                    onChange={(e) => {
                      const value = Number(e.target.value);
                      if (
                        !isNaN(value) &&
                        value <= priceRange.max &&
                        value > localPriceRange.min
                      ) {
                        handlePriceChange([localPriceRange.min, value]);
                        handlePriceChangeComplete();
                      }
                    }}
                    className="w-full pl-9 pr-1 py-1 text-xs border rounded-md h-7"
                  />
                  <span className="absolute right-2 text-xs">lei</span>
                </div>
              </div>

              {/* Slider for visual price adjustment */}
              <Slider
                defaultValue={[localPriceRange.min, localPriceRange.max]}
                min={priceRange.min}
                max={priceRange.max}
                step={priceRange.max > 1000 ? 10 : 1} // Use larger steps for high price ranges
                value={[localPriceRange.min, localPriceRange.max]}
                onValueChange={handlePriceChange}
                onValueCommit={handlePriceChangeComplete}
                className="mt-4 sm:mt-5"
              />

              {/* Price labels */}
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div>{formatPrice(priceRange.min)}</div>
                <div>{formatPrice(priceRange.max)}</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Attribute filters */}
      {filters.length > 0 && (
        <Accordion
          type="multiple"
          className="space-y-1 sm:space-y-2 w-full"
          defaultValue={filters.map((f) => f.id)}>
          {filters.map((filter) => (
            <AccordionItem
              key={filter.id}
              value={filter.id}>
              <AccordionTrigger className="text-xs sm:text-sm font-medium py-2 sm:py-3">
                {filter.name}
              </AccordionTrigger>
              <AccordionContent className="pt-1 sm:pt-2 pb-3 sm:pb-4">
                <div className="space-y-1.5 sm:space-y-2">
                  {filter.options.map((option) => (
                    <div
                      key={option.id}
                      className="flex items-center space-x-2">
                      <Checkbox
                        id={`${filter.id}-${option.id}`}
                        checked={
                          selectedFilters[filter.id]?.includes(option.id) ||
                          false
                        }
                        onCheckedChange={() =>
                          onFilterChange?.(filter.id, option.id)
                        }
                        className="h-3.5 w-3.5 sm:h-4 sm:w-4"
                      />
                      <Label
                        htmlFor={`${filter.id}-${option.id}`}
                        className="flex-grow text-xs sm:text-sm">
                        {option.label}
                      </Label>
                      {option.count !== undefined && (
                        <span className="text-[10px] sm:text-xs text-muted-foreground">
                          ({option.count})
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  );

  // Selected filter badges for mobile view
  const renderSelectedFilters = () => {
    if (activeFilterCount === 0) return null;

    return (
      <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-2">
        {selectedCategories.map((categoryId, index) => {
          const category = categories?.options.find((c) => c.id === categoryId);
          if (!category) return null;

          return (
            <Badge
              key={`category-${categoryId}-${index}`}
              variant="outline"
              className="flex items-center gap-1 text-[10px] sm:text-xs py-0 h-5 sm:h-6">
              {category.label}
              <X
                className="h-2.5 w-2.5 sm:h-3 sm:w-3 cursor-pointer"
                onClick={() => onCategoryChange?.(categoryId)}
              />
            </Badge>
          );
        })}

        {Object.entries(selectedFilters).map(([filterId, optionIds]) =>
          optionIds.map((optionId, index) => {
            const filterGroup = filters.find((f) => f.id === filterId);
            const option = filterGroup?.options.find((o) => o.id === optionId);
            if (!filterGroup || !option) return null;

            return (
              <Badge
                key={`${filterId}-${optionId}-${index}`}
                variant="outline"
                className="flex items-center gap-1 text-[10px] sm:text-xs py-0 h-5 sm:h-6">
                {option.label}
                <X
                  className="h-2.5 w-2.5 sm:h-3 sm:w-3 cursor-pointer"
                  onClick={() => onFilterChange?.(filterId, optionId)}
                />
              </Badge>
            );
          })
        )}

        {!noPriceFilter &&
          (priceRange?.current.min !== priceRange?.min ||
            priceRange?.current.max !== priceRange?.max) && (
            <Badge
              variant="outline"
              className="flex items-center gap-1 text-[10px] sm:text-xs py-0 h-5 sm:h-6">
              {formatPrice(priceRange!.current.min)} -{" "}
              {formatPrice(priceRange!.current.max)}
              <X
                className="h-2.5 w-2.5 sm:h-3 sm:w-3 cursor-pointer"
                onClick={() =>
                  onPriceChange?.({
                    min: priceRange!.min,
                    max: priceRange!.max,
                  })
                }
              />
            </Badge>
          )}
      </div>
    );
  };

  return (
    <>
      {/* Desktop filters */}
      <div className={cn("hidden md:block", className)}>{filterContent}</div>

      {/* Mobile filters */}
      <div className="md:hidden">
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-1.5 sm:gap-2 h-7 sm:h-8 text-xs sm:text-sm py-0"
            onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}>
            <SlidersHorizontal className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            Filters
            {activeFilterCount > 0 && (
              <Badge
                variant="secondary"
                className="ml-1 h-4 sm:h-5 w-4 sm:w-5 p-0 flex items-center justify-center text-[10px] sm:text-xs">
                {activeFilterCount}
              </Badge>
            )}
          </Button>

          {activeFilterCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="text-xs h-7 py-0">
              Clear All
            </Button>
          )}
        </div>

        {renderSelectedFilters()}

        {mobileFiltersOpen && (
          <div className="fixed inset-0 z-50 bg-background/95 pt-14 sm:pt-16 pb-16 sm:pb-20 px-3 sm:px-6 lg:px-8 overflow-y-auto">
            <div className="max-w-2xl mx-auto">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h2 className="text-base sm:text-lg font-semibold">Filters</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => setMobileFiltersOpen(false)}>
                  <X className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </div>

              {filterContent}

              <div className="mt-6 sm:mt-8 flex gap-3 sm:gap-4">
                <Button
                  variant="outline"
                  className="flex-1 text-xs sm:text-sm h-9 sm:h-10"
                  onClick={() => setMobileFiltersOpen(false)}>
                  Cancel
                </Button>
                <Button
                  className="flex-1 text-xs sm:text-sm h-9 sm:h-10"
                  onClick={() => setMobileFiltersOpen(false)}>
                  Apply Filters
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
