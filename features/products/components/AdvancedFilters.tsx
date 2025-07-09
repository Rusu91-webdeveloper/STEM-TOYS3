"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { X, SlidersHorizontal, Star, Search } from "lucide-react";
import { useCurrency } from "@/lib/currency";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

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

export interface AdvancedFiltersProps {
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
  onRatingFilterChange?: (rating: number | null) => void;
  onAvailabilityChange?: (inStockOnly: boolean) => void;
  onSortChange?: (sortOption: string) => void;
  onSearchChange?: (searchTerm: string) => void;
  className?: string;
  selectedRating?: number | null;
  inStockOnly?: boolean;
  sortOption?: string;
  searchTerm?: string;
}

export default function AdvancedFilters({
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
  onRatingFilterChange,
  onAvailabilityChange,
  onSortChange,
  onSearchChange,
  className,
  selectedRating = null,
  inStockOnly = false,
  sortOption = "relevance",
  searchTerm = "",
}: AdvancedFiltersProps) {
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [localPriceRange, setLocalPriceRange] = useState<PriceRange>(
    priceRange?.current || {
      min: priceRange?.min || 0,
      max: priceRange?.max || 100,
    }
  );
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);
  const [expandedAccordions, setExpandedAccordions] = useState<string[]>([]);

  // Update local search term when prop changes
  useEffect(() => {
    setLocalSearchTerm(searchTerm);
  }, [searchTerm]);

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
      : 0) +
    (selectedRating !== null ? 1 : 0) +
    (inStockOnly ? 1 : 0);

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

  // Handle search input
  const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalSearchTerm(e.target.value);
  };

  // Apply search filter when Enter is pressed or on blur
  const handleSearchSubmit = () => {
    if (onSearchChange) {
      onSearchChange(localSearchTerm);
    }
  };

  // Handle accordion toggle
  const handleAccordionToggle = (value: string[]) => {
    setExpandedAccordions(value);
  };

  // Get the currency formatter
  const { formatPrice } = useCurrency();

  // Rating options
  const ratingOptions = [
    { value: 5, label: "5 Stars & Up" },
    { value: 4, label: "4 Stars & Up" },
    { value: 3, label: "3 Stars & Up" },
    { value: 2, label: "2 Stars & Up" },
    { value: 1, label: "1 Star & Up" },
  ];

  // Sort options
  const sortOptions = [
    { value: "relevance", label: "Relevance" },
    { value: "price_asc", label: "Price: Low to High" },
    { value: "price_desc", label: "Price: High to Low" },
    { value: "newest", label: "Newest First" },
    { value: "rating", label: "Highest Rated" },
    { value: "bestselling", label: "Bestselling" },
  ];

  const filterContent = (
    <div className="space-y-4 sm:space-y-6">
      {/* Search input */}
      <div className="relative">
        <Input
          type="text"
          placeholder="Search within results..."
          value={localSearchTerm}
          onChange={handleSearchInput}
          onKeyDown={e => e.key === "Enter" && handleSearchSubmit()}
          onBlur={handleSearchSubmit}
          className="pl-9"
        />
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
      </div>

      {/* Sort by dropdown */}
      <div className="space-y-2">
        <h3 className="text-xs sm:text-sm font-medium">Sort By</h3>
        <Select value={sortOption} onValueChange={onSortChange}>
          <SelectTrigger className="w-full h-9 text-xs">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

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
            className="h-6 sm:h-8 text-xs py-0"
          >
            Clear All
          </Button>
        </div>
      )}

      {/* Availability filter */}
      <div className="flex items-center justify-between">
        <Label
          htmlFor="in-stock-only"
          className="text-xs sm:text-sm font-medium"
        >
          In Stock Only
        </Label>
        <Switch
          id="in-stock-only"
          checked={inStockOnly}
          onCheckedChange={onAvailabilityChange}
        />
      </div>

      {/* Rating filter */}
      <div className="space-y-2">
        <h3 className="text-xs sm:text-sm font-medium">Rating</h3>
        <RadioGroup
          value={selectedRating?.toString() || ""}
          onValueChange={value => {
            onRatingFilterChange?.(value ? Number(value) : null);
          }}
        >
          {ratingOptions.map(option => (
            <div key={option.value} className="flex items-center space-x-2">
              <RadioGroupItem
                value={option.value.toString()}
                id={`rating-${option.value}`}
              />
              <Label
                htmlFor={`rating-${option.value}`}
                className="flex items-center"
              >
                {[...Array(option.value)].map((_, i) => (
                  <Star
                    key={i}
                    className="h-3 w-3 fill-yellow-400 text-yellow-400"
                  />
                ))}
                {[...Array(5 - option.value)].map((_, i) => (
                  <Star key={i} className="h-3 w-3 text-gray-300" />
                ))}
                <span className="ml-1 text-xs">{option.label}</span>
              </Label>
            </div>
          ))}
          {selectedRating !== null && (
            <div className="flex items-center mt-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRatingFilterChange?.(null)}
                className="h-6 text-xs py-0 pl-0"
              >
                Clear Rating Filter
              </Button>
            </div>
          )}
        </RadioGroup>
      </div>

      {/* Categories filter */}
      {categories && categories.options.length > 0 && (
        <Accordion
          type="multiple"
          value={expandedAccordions}
          onValueChange={handleAccordionToggle}
          className="space-y-2"
        >
          <AccordionItem value="categories" className="border-b-0">
            <AccordionTrigger className="py-2 text-xs sm:text-sm font-medium">
              {categories.name}
            </AccordionTrigger>
            <AccordionContent className="pt-1 pb-3">
              <div className="space-y-1.5 sm:space-y-2">
                {categories.options.map(category => (
                  <div
                    key={category.id}
                    className="flex items-center space-x-2"
                  >
                    <Checkbox
                      id={`category-${category.id}`}
                      checked={selectedCategories.includes(category.id)}
                      onCheckedChange={() => onCategoryChange?.(category.id)}
                      className="h-3.5 w-3.5 sm:h-4 sm:w-4"
                    />
                    <Label
                      htmlFor={`category-${category.id}`}
                      className="flex-grow text-xs sm:text-sm"
                    >
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
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}

      {/* Price range filter */}
      {priceRange && (
        <Accordion
          type="multiple"
          value={expandedAccordions}
          onValueChange={handleAccordionToggle}
          className="space-y-2"
        >
          <AccordionItem value="price" className="border-b-0">
            <AccordionTrigger className="py-2 text-xs sm:text-sm font-medium">
              Price Range
            </AccordionTrigger>
            <AccordionContent className="pt-1 pb-3">
              {/* No price filter checkbox */}
              <div className="flex items-center space-x-2 mb-3">
                <Checkbox
                  id="no-price-filter"
                  checked={noPriceFilter}
                  onCheckedChange={onNoPriceFilterChange}
                  className="h-3.5 w-3.5 sm:h-4 sm:w-4"
                />
                <Label
                  htmlFor="no-price-filter"
                  className="text-xs sm:text-sm font-medium"
                >
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
                        onChange={e => {
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
                    </div>
                    <span className="text-xs">-</span>
                    <div className="relative flex items-center w-full">
                      <span className="absolute left-2 text-xs text-muted-foreground">
                        MAX
                      </span>
                      <input
                        type="number"
                        value={localPriceRange.max}
                        min={localPriceRange.min + 1}
                        max={priceRange.max}
                        onChange={e => {
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
                    </div>
                  </div>

                  {/* Price slider */}
                  <div className="px-1">
                    <Slider
                      defaultValue={[localPriceRange.min, localPriceRange.max]}
                      value={[localPriceRange.min, localPriceRange.max]}
                      min={priceRange.min}
                      max={priceRange.max}
                      step={1}
                      onValueChange={handlePriceChange}
                      onValueCommit={handlePriceChangeComplete}
                      className="w-full"
                    />
                  </div>

                  {/* Price range labels */}
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{formatPrice(localPriceRange.min)}</span>
                    <span>{formatPrice(localPriceRange.max)}</span>
                  </div>
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}

      {/* Other filter groups */}
      {filters.map(filter => (
        <Accordion
          key={filter.id}
          type="multiple"
          value={expandedAccordions}
          onValueChange={handleAccordionToggle}
          className="space-y-2"
        >
          <AccordionItem value={filter.id} className="border-b-0">
            <AccordionTrigger className="py-2 text-xs sm:text-sm font-medium">
              {filter.name}
            </AccordionTrigger>
            <AccordionContent className="pt-1 pb-3">
              <div className="space-y-1.5 sm:space-y-2">
                {filter.options.map(option => (
                  <div key={option.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`${filter.id}-${option.id}`}
                      checked={
                        selectedFilters[filter.id]?.includes(option.id) || false
                      }
                      onCheckedChange={() =>
                        onFilterChange?.(filter.id, option.id)
                      }
                      className="h-3.5 w-3.5 sm:h-4 sm:w-4"
                    />
                    <Label
                      htmlFor={`${filter.id}-${option.id}`}
                      className="flex-grow text-xs sm:text-sm"
                    >
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
        </Accordion>
      ))}
    </div>
  );

  // Render selected filters as badges for mobile view
  const renderSelectedFilters = () => {
    if (activeFilterCount === 0) return null;

    return (
      <div className="flex flex-wrap gap-1.5 mt-2">
        {/* Category badges */}
        {selectedCategories.map(categoryId => {
          const category = categories?.options.find(c => c.id === categoryId);
          if (!category) return null;
          return (
            <Badge
              key={`cat-${categoryId}`}
              variant="secondary"
              className="flex items-center gap-1 text-xs py-0.5 h-6"
            >
              {category.label}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => onCategoryChange?.(categoryId)}
              />
            </Badge>
          );
        })}

        {/* Filter option badges */}
        {Object.entries(selectedFilters).map(([filterId, optionIds]) => {
          const filterGroup = filters.find(f => f.id === filterId);
          if (!filterGroup) return null;

          return optionIds.map(optionId => {
            const option = filterGroup.options.find(o => o.id === optionId);
            if (!option) return null;
            return (
              <Badge
                key={`${filterId}-${optionId}`}
                variant="secondary"
                className="flex items-center gap-1 text-xs py-0.5 h-6"
              >
                {option.label}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => onFilterChange?.(filterId, optionId)}
                />
              </Badge>
            );
          });
        })}

        {/* Price range badge */}
        {!noPriceFilter &&
          priceRange &&
          (priceRange.current.min !== priceRange.min ||
            priceRange.current.max !== priceRange.max) && (
            <Badge
              variant="secondary"
              className="flex items-center gap-1 text-xs py-0.5 h-6"
            >
              {`${formatPrice(priceRange.current.min)} - ${formatPrice(
                priceRange.current.max
              )}`}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => onNoPriceFilterChange?.(true)}
              />
            </Badge>
          )}

        {/* Rating badge */}
        {selectedRating !== null && (
          <Badge
            variant="secondary"
            className="flex items-center gap-1 text-xs py-0.5 h-6"
          >
            {`${selectedRating}+ Stars`}
            <X
              className="h-3 w-3 cursor-pointer"
              onClick={() => onRatingFilterChange?.(null)}
            />
          </Badge>
        )}

        {/* In Stock badge */}
        {inStockOnly && (
          <Badge
            variant="secondary"
            className="flex items-center gap-1 text-xs py-0.5 h-6"
          >
            In Stock Only
            <X
              className="h-3 w-3 cursor-pointer"
              onClick={() => onAvailabilityChange?.(false)}
            />
          </Badge>
        )}
      </div>
    );
  };

  return (
    <div className={cn("relative", className)}>
      {/* Desktop filters */}
      <div className="hidden md:block">{filterContent}</div>

      {/* Mobile filters */}
      <div className="md:hidden">
        <div className="flex items-center justify-between">
          <Popover open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-1.5 text-xs"
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                Filters
                {activeFilterCount > 0 && (
                  <Badge className="h-4 w-4 p-0 flex items-center justify-center text-[10px]">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-screen max-w-xs p-0 border-0 rounded-t-none"
              align="start"
              side="bottom"
              sideOffset={-1}
            >
              <div className="p-4 max-h-[80vh] overflow-y-auto">
                {filterContent}
              </div>
              <div className="p-3 border-t flex justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setMobileFiltersOpen(false)}
                >
                  Cancel
                </Button>
                <Button size="sm" onClick={() => setMobileFiltersOpen(false)}>
                  Apply Filters
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          {/* Sort dropdown for mobile */}
          <Select value={sortOption} onValueChange={onSortChange}>
            <SelectTrigger className="w-[130px] h-8 text-xs">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Show selected filters as badges on mobile */}
        {renderSelectedFilters()}
      </div>
    </div>
  );
}
