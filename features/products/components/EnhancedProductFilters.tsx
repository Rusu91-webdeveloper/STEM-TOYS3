"use client";

import { X, SlidersHorizontal } from "lucide-react";
import React, { useState, useEffect } from "react";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useCurrency } from "@/lib/currency";
import { cn } from "@/lib/utils";
import { normalizeCategory } from "@/lib/utils/product-filters-url";
import {
  LEARNING_OUTCOME_DISPLAY_NAMES,
  PRODUCT_TYPE_DISPLAY_NAMES,
  SPECIAL_CATEGORY_DISPLAY_NAMES,
} from "@/lib/utils/product-categorization";

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

export interface EnhancedProductFiltersProps {
  categories?: FilterGroup;
  filters: FilterGroup[];
  priceRange?: {
    min: number;
    max: number;
    current: [number, number];
  };
  selectedCategories?: string[];
  selectedFilters?: Record<string, string[]>;
  noPriceFilter?: boolean;
  // New categorization filter states
  selectedLearningOutcomes?: string[];
  selectedProductType?: string;
  selectedSpecialCategories?: string[];
  selectedAgeGroup?:
    | "TODDLERS_1_3"
    | "PRESCHOOL_3_5"
    | "ELEMENTARY_6_8"
    | "MIDDLE_SCHOOL_9_12"
    | "TEENS_13_PLUS";
  onCategoryChange?: (categoryId: string) => void;
  onFilterChange?: (filterId: string, optionId: string) => void;
  onPriceChange?: (range: [number, number]) => void;
  onNoPriceFilterChange?: (checked: boolean) => void;
  onClearFilters?: () => void;
  onCloseMobile?: () => void;
  // New categorization filter handlers
  onLearningOutcomesChange?: (learningOutcomes: string[]) => void;
  onProductTypeChange?: (productType: string) => void;
  onSpecialCategoriesChange?: (specialCategories: string[]) => void;
  onAgeGroupChange?: (
    ageGroup:
      | "PRESCHOOL_3_5"
      | "ELEMENTARY_6_8"
      | "MIDDLE_SCHOOL_9_12"
      | "TEENS_13_PLUS"
      | undefined
  ) => void;
  className?: string;
  isInsideModal?: boolean; // New prop to indicate if component is inside a modal
  t?: (key: string, fallback?: string) => string; // Translation function
}

export function EnhancedProductFilters({
  categories,
  filters,
  priceRange,
  selectedCategories = [],
  selectedFilters = {},
  noPriceFilter = false,
  selectedLearningOutcomes = [],
  selectedProductType,
  selectedSpecialCategories = [],
  selectedAgeGroup,
  onCategoryChange,
  onFilterChange,
  onPriceChange,
  onNoPriceFilterChange,
  onClearFilters,
  onCloseMobile,
  onLearningOutcomesChange,
  onProductTypeChange,
  onSpecialCategoriesChange,
  onAgeGroupChange,
  className,
  isInsideModal = false,
  t,
}: EnhancedProductFiltersProps) {
  const [localPriceRange, setLocalPriceRange] = useState<PriceRange>(() => {
    // Safe initialization with NaN checks
    const currentMin = priceRange?.current?.[0];
    const currentMax = priceRange?.current?.[1];
    const fallbackMin = priceRange?.min ?? 0;
    const fallbackMax = priceRange?.max ?? 1000;

    return {
      min: isNaN(currentMin)
        ? isNaN(fallbackMin)
          ? 0
          : fallbackMin
        : currentMin,
      max: isNaN(currentMax)
        ? isNaN(fallbackMax)
          ? 1000
          : fallbackMax
        : currentMax,
    };
  });

  // Sync localPriceRange with priceRange.current when it changes
  useEffect(() => {
    if (priceRange?.current) {
      const currentMin = priceRange.current[0];
      const currentMax = priceRange.current[1];

      if (!isNaN(currentMin) && !isNaN(currentMax)) {
        setLocalPriceRange({
          min: currentMin,
          max: currentMax,
        });
      }
    }
  }, [priceRange?.current]);

  // Count total active filters
  const activeFilterCount =
    selectedCategories.length +
    Object.values(selectedFilters).reduce(
      (count, options) => count + (Array.isArray(options) ? options.length : 0),
      0
    ) +
    (!noPriceFilter &&
    (priceRange?.current?.[0] !== priceRange?.min ||
      priceRange?.current?.[1] !== priceRange?.max)
      ? 1
      : 0) +
    selectedLearningOutcomes.length +
    (selectedProductType && selectedProductType !== "all" ? 1 : 0) +
    selectedSpecialCategories.length +
    (selectedAgeGroup ? 1 : 0);

  // Handle price slider change
  const handlePriceChange = (value: number[]) => {
    const newRange = { min: value[0], max: value[1] };
    setLocalPriceRange(newRange);
  };

  // Apply price range filter when done changing
  const handlePriceChangeComplete = () => {
    if (onPriceChange) {
      onPriceChange([localPriceRange.min, localPriceRange.max]);
    }
  };

  // Get the currency formatter
  const { formatPrice } = useCurrency();

  const filterContent = (
    <div
      className={cn(
        "space-y-4 sm:space-y-6",
        isInsideModal && "space-y-2 sm:space-y-3"
      )}
    >
      {/* Clear filters button (if there are active filters) */}
      {activeFilterCount > 0 && (
        <div className="flex items-center justify-between">
          <h3
            className={cn(
              "text-xs sm:text-sm font-medium text-slate-700",
              isInsideModal && "text-xs"
            )}
          >
            Active Filters: {activeFilterCount}
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className={cn(
              "h-6 sm:h-8 text-xs py-0",
              isInsideModal && "h-5 sm:h-6 text-xs"
            )}
          >
            Clear All
          </Button>
        </div>
      )}

      {/* Categories filter - always visible in modal, on sidebar show from md up */}
      {categories?.options && categories.options.length > 0 && (
        <div
          className={cn(
            "space-y-3 sm:space-y-4",
            !isInsideModal && "hidden md:block",
            isInsideModal && "space-y-2 sm:space-y-3"
          )}
        >
        <h3
          className={cn(
            "text-xs sm:text-sm font-medium text-slate-800",
            isInsideModal && "text-xs"
          )}
        >
          {categories.name}
        </h3>
          <div
            className={cn(
              "space-y-2 sm:space-y-3",
              isInsideModal && "space-y-2.5 sm:space-y-3"
            )}
          >
            {categories.options.map(category => (
              <div
                key={category.id}
                className={cn(
                  "flex items-center space-x-3 py-1",
                  isInsideModal && "py-2"
                )}
              >
                <Checkbox
                  id={`category-${category.id}`}
                  checked={selectedCategories.some(
                    selectedCat =>
                      normalizeCategory(selectedCat) ===
                      normalizeCategory(category.id)
                  )}
                  onCheckedChange={() => onCategoryChange?.(category.id)}
                  className={cn(
                    "h-4 w-4 sm:h-5 sm:w-5 border-slate-300 data-[state=checked]:border-sky-600 data-[state=checked]:bg-sky-600 data-[state=checked]:text-white",
                    isInsideModal && "h-4 w-4 sm:h-4.5 sm:w-4.5"
                  )}
                />
                <Label
                  htmlFor={`category-${category.id}`}
                  className={cn(
                    "flex-grow text-xs sm:text-sm text-slate-700",
                    isInsideModal && "text-xs"
                  )}
                >
                  {category.label}
                </Label>
                {category.count !== undefined && (
                  <span
                    className={cn(
                      "text-[10px] sm:text-xs text-muted-foreground",
                      isInsideModal && "text-[9px] sm:text-xs"
                    )}
                  >
                    ({category.count})
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Age Group Filter */}
      <div
        className={cn(
          "space-y-3 sm:space-y-4",
          isInsideModal && "space-y-2 sm:space-y-3"
        )}
      >
        <h3
          className={cn(
            "text-xs sm:text-sm font-medium text-slate-800",
            isInsideModal && "text-xs"
          )}
        >
          {t ? t("ageGroup", "Age Group") : "Age Group"}
        </h3>
        <div
          className={cn(
            "space-y-1.5 sm:space-y-2",
            isInsideModal && "space-y-1 sm:space-y-1.5"
          )}
        >
          {[
            {
              id: "PRESCHOOL_3_5",
              labelKey: "age3to5H2",
              short: "3–5",
              icon: "🐣",
            },
            {
              id: "ELEMENTARY_6_8",
              labelKey: "age6to8H2",
              short: "6–8",
              icon: "🎒",
            },
            {
              id: "MIDDLE_SCHOOL_9_12",
              labelKey: "age9to12H2",
              short: "9–12",
              icon: "🧠",
            },
            {
              id: "TEENS_13_PLUS",
              labelKey: "age13plusH2",
              short: "13+",
              icon: "🚀",
            },
          ].map(opt => {
            const isActive = selectedAgeGroup === opt.id;
            return (
              <div
                key={opt.id}
                className={cn(
                  "flex items-center space-x-3 py-1",
                  isInsideModal && "py-2"
                )}
              >
                <Checkbox
                  id={`age-group-${opt.id}`}
                  checked={isActive}
                  onCheckedChange={checked => {
                    if (onAgeGroupChange) {
                      onAgeGroupChange(
                        checked ? (opt.id as any) : undefined
                      );
                    }
                  }}
                  className={cn(
                    "h-4 w-4 sm:h-5 sm:w-5 border-slate-300 data-[state=checked]:border-sky-600 data-[state=checked]:bg-sky-600 data-[state=checked]:text-white",
                    isInsideModal && "h-4 w-4 sm:h-4.5 sm:w-4.5"
                  )}
                />
                <Label
                  htmlFor={`age-group-${opt.id}`}
                  className={cn(
                    "flex-grow text-xs sm:text-sm cursor-pointer text-slate-700",
                    isInsideModal && "text-xs"
                  )}
                >
                  <span className="mr-2">{opt.icon}</span>
                  {t
                    ? t(opt.labelKey, opt.short)
                    : `${opt.short} ${t ? t("years", "yrs") : "yrs"}`}
                </Label>
              </div>
            );
          })}
        </div>
      </div>

      {/* Learning Outcomes Filter */}
      <div
        className={cn(
          "space-y-3 sm:space-y-4",
          isInsideModal && "space-y-2 sm:space-y-3"
        )}
      >
        <h3
          className={cn(
            "text-xs sm:text-sm font-medium text-slate-800",
            isInsideModal && "text-xs"
          )}
        >
          {t ? t("learningOutcomes", "Learning Outcomes") : "Learning Outcomes"}
        </h3>
        <div
          className={cn(
            "space-y-1.5 sm:space-y-2",
            isInsideModal && "space-y-1 sm:space-y-1.5"
          )}
        >
          {Object.keys(LEARNING_OUTCOME_DISPLAY_NAMES).map(key => (
            <div
              key={key}
              className={cn(
                "flex items-center space-x-3 py-1",
                isInsideModal && "py-2"
              )}
            >
              <Checkbox
                id={`learning-outcome-${key}`}
                checked={selectedLearningOutcomes.includes(key)}
                onCheckedChange={checked => {
                  if (onLearningOutcomesChange) {
                    if (checked) {
                      onLearningOutcomesChange([
                        ...selectedLearningOutcomes,
                        key,
                      ]);
                    } else {
                      onLearningOutcomesChange(
                        selectedLearningOutcomes.filter(lo => lo !== key)
                      );
                    }
                  }
                }}
                className={cn(
                  "h-4 w-4 sm:h-5 sm:w-5 border-slate-300 data-[state=checked]:border-sky-600 data-[state=checked]:bg-sky-600 data-[state=checked]:text-white",
                  isInsideModal && "h-4 w-4 sm:h-4.5 sm:w-4.5"
                )}
              />
              <Label
                htmlFor={`learning-outcome-${key}`}
                className={cn(
                  "flex-grow text-xs sm:text-sm text-slate-700",
                  isInsideModal && "text-xs"
                )}
              >
                {t
                  ? t(
                      `learningOutcome.${key}`,
                      LEARNING_OUTCOME_DISPLAY_NAMES[
                        key as keyof typeof LEARNING_OUTCOME_DISPLAY_NAMES
                      ]
                    )
                  : LEARNING_OUTCOME_DISPLAY_NAMES[
                      key as keyof typeof LEARNING_OUTCOME_DISPLAY_NAMES
                    ]}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Product Type Filter */}
      <div
        className={cn(
          "space-y-3 sm:space-y-4",
          isInsideModal && "space-y-2 sm:space-y-3"
        )}
      >
        <h3
          className={cn(
            "text-xs sm:text-sm font-medium text-slate-800",
            isInsideModal && "text-xs"
          )}
        >
          {t ? t("productType", "Product Type") : "Product Type"}
        </h3>
        <Select
          value={selectedProductType ?? "all"}
          onValueChange={onProductTypeChange}
        >
          <SelectTrigger
            className={cn(
              "h-10 sm:h-11 text-sm sm:text-base border-slate-200 bg-white/80 text-slate-700 focus:border-sky-400 focus:ring-1 focus:ring-sky-200",
              selectedProductType === "all" ? "text-slate-700" : undefined,
              isInsideModal && "h-11 sm:h-12 text-sm"
            )}
          >
            <SelectValue placeholder="Select product type" />
          </SelectTrigger>
          <SelectContent className="border-slate-200 bg-white text-slate-700 shadow-xl">
            <SelectItem value="all" className="text-slate-700">
              {t ? t("allTypes", "All Types") : "All Types"}
            </SelectItem>
            {Object.keys(PRODUCT_TYPE_DISPLAY_NAMES).map(key => (
              <SelectItem key={key} value={key}>
                {t
                  ? t(
                      `productType.${key}`,
                      PRODUCT_TYPE_DISPLAY_NAMES[
                        key as keyof typeof PRODUCT_TYPE_DISPLAY_NAMES
                      ]
                    )
                  : PRODUCT_TYPE_DISPLAY_NAMES[
                      key as keyof typeof PRODUCT_TYPE_DISPLAY_NAMES
                    ]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Special Categories Filter */}
      <div
        className={cn(
          "space-y-3 sm:space-y-4",
          isInsideModal && "space-y-2 sm:space-y-3"
        )}
      >
        <h3
          className={cn(
            "text-xs sm:text-sm font-medium text-slate-800",
            isInsideModal && "text-xs"
          )}
        >
          {t
            ? t("specialCategories", "Special Categories")
            : "Special Categories"}
        </h3>
        <div
          className={cn(
            "space-y-1.5 sm:space-y-2",
            isInsideModal && "space-y-1 sm:space-y-1.5"
          )}
        >
          {Object.keys(SPECIAL_CATEGORY_DISPLAY_NAMES).filter(key => key !== "BEST_SELLERS").map(key => (
            <div
              key={key}
              className={cn(
                "flex items-center space-x-3 py-1",
                isInsideModal && "py-2"
              )}
            >
              <Checkbox
                id={`special-category-${key}`}
                checked={selectedSpecialCategories.includes(key)}
                onCheckedChange={checked => {
                  if (onSpecialCategoriesChange) {
                    if (checked) {
                      onSpecialCategoriesChange([
                        ...selectedSpecialCategories,
                        key,
                      ]);
                    } else {
                      onSpecialCategoriesChange(
                        selectedSpecialCategories.filter(sc => sc !== key)
                      );
                    }
                  }
                }}
                className={cn(
                  "h-4 w-4 sm:h-5 sm:w-5 border-slate-300 data-[state=checked]:border-sky-600 data-[state=checked]:bg-sky-600 data-[state=checked]:text-white",
                  isInsideModal && "h-4 w-4 sm:h-4.5 sm:w-4.5"
                )}
              />
              <Label
                htmlFor={`special-category-${key}`}
                className={cn(
                  "flex-grow text-xs sm:text-sm text-slate-700",
                  isInsideModal && "text-xs"
                )}
              >
                {t
                  ? t(
                      `specialCategory.${key}`,
                      SPECIAL_CATEGORY_DISPLAY_NAMES[
                        key as keyof typeof SPECIAL_CATEGORY_DISPLAY_NAMES
                      ]
                    )
                  : SPECIAL_CATEGORY_DISPLAY_NAMES[
                      key as keyof typeof SPECIAL_CATEGORY_DISPLAY_NAMES
                    ]}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Price range filter */}
      {priceRange && (
        <div
          className={cn(
            "space-y-3 sm:space-y-4",
            isInsideModal && "space-y-2 sm:space-y-3"
          )}
        >
        <h3
          className={cn(
            "text-xs sm:text-sm font-medium text-slate-800",
            isInsideModal && "text-xs"
          )}
        >
          Price Range
        </h3>

          {/* Price filter toggle checkbox */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="price-filter-enabled"
              checked={!noPriceFilter}
              onCheckedChange={checked => onNoPriceFilterChange(!checked)}
              className={cn(
                "h-3.5 w-3.5 sm:h-4 sm:w-4 border-slate-300 data-[state=checked]:border-sky-600 data-[state=checked]:bg-sky-600 data-[state=checked]:text-white",
                isInsideModal && "h-3 w-3 sm:h-3.5 sm:w-3.5"
              )}
            />
            <Label
              htmlFor="price-filter-enabled"
              className={cn(
                "text-xs sm:text-sm font-medium text-slate-700",
                isInsideModal && "text-xs"
              )}
            >
              Enable price filter
            </Label>
          </div>

          {/* Price range controls - only show when price filter is enabled */}
          {!noPriceFilter && (
            <div className="space-y-4 sm:space-y-5 px-1 sm:px-2">
              {/* Direct input fields for price range */}
              <div className="flex items-center justify-between gap-1 sm:gap-2 mb-1">
                <div className="relative flex items-center w-full">
                  <span className="absolute left-2 text-xs text-muted-foreground">
                    MIN
                  </span>
                  <input
                    type="number"
                    value={localPriceRange.min}
                    min={priceRange?.min || 0}
                    max={
                      isNaN(localPriceRange.max)
                        ? undefined
                        : localPriceRange.max - 1
                    }
                    onChange={e => {
                      const value = Number(e.target.value);
                      if (
                        !isNaN(value) &&
                        value >= (priceRange?.min || 0) &&
                        value <
                          (isNaN(localPriceRange.max)
                            ? 1000
                            : localPriceRange.max)
                      ) {
                        handlePriceChange([value, localPriceRange.max]);
                        handlePriceChangeComplete();
                      }
                    }}
                    className={cn(
                      "w-full pl-9 pr-6 py-2 text-sm border border-slate-200 bg-white/80 text-slate-700 rounded-lg flex-shrink-0 focus:border-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-200",
                      isInsideModal ? "h-10" : "h-8"
                    )}
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
                    min={
                      isNaN(localPriceRange.min) ? 0 : localPriceRange.min + 1
                    }
                    max={priceRange?.max || 1000}
                    onChange={e => {
                      const value = Number(e.target.value);
                      if (
                        !isNaN(value) &&
                        value <= (priceRange?.max || 1000) &&
                        value >
                          (isNaN(localPriceRange.min) ? 0 : localPriceRange.min)
                      ) {
                        handlePriceChange([localPriceRange.min, value]);
                        handlePriceChangeComplete();
                      }
                    }}
                    className={cn(
                      "w-full pl-9 pr-6 py-2 text-sm border border-slate-200 bg-white/80 text-slate-700 rounded-lg flex-shrink-0 focus:border-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-200",
                      isInsideModal ? "h-10" : "h-8"
                    )}
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
          defaultValue={filters.map(f => f.id)}
        >
          {filters.map(filter => (
            <AccordionItem key={filter.id} value={filter.id}>
              <AccordionTrigger className="text-xs sm:text-sm font-medium py-2 sm:py-3">
                {filter.name}
              </AccordionTrigger>
              <AccordionContent className="pt-1 sm:pt-2 pb-3 sm:pb-4">
                <div className="space-y-1.5 sm:space-y-2">
                  {filter.options.map(option => (
                <div
                  key={option.id}
                  className={cn(
                    "flex items-center space-x-3 py-1",
                    isInsideModal && "py-2"
                  )}
                >
                  <Checkbox
                    id={`${filter.id}-${option.id}`}
                    checked={
                      selectedFilters[filter.id]?.includes(option.id) ||
                      false
                    }
                    onCheckedChange={() =>
                      onFilterChange?.(filter.id, option.id)
                    }
                    className="h-3.5 w-3.5 sm:h-4 sm:w-4 border-slate-300 data-[state=checked]:border-sky-600 data-[state=checked]:bg-sky-600 data-[state=checked]:text-white"
                  />
                  <Label
                    htmlFor={`${filter.id}-${option.id}`}
                    className="flex-grow text-xs sm:text-sm text-slate-700"
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
          const category = categories?.options?.find(c => c.id === categoryId);
          if (!category) return null;

          return (
            <Badge
              key={`category-${categoryId}-${index}`}
              variant="outline"
              className="flex items-center gap-1 text-[10px] sm:text-xs py-0 h-5 sm:h-6"
            >
              {category.label}
              <X
                className="h-2.5 w-2.5 sm:h-3 sm:w-3 cursor-pointer"
                onClick={() => onCategoryChange?.(categoryId)}
              />
            </Badge>
          );
        })}

        {selectedLearningOutcomes.map((outcome, index) => (
          <Badge
            key={`learning-outcome-${outcome}-${index}`}
            variant="outline"
            className="flex items-center gap-1 text-[10px] sm:text-xs py-0 h-5 sm:h-6"
          >
            {t
              ? t(
                  `learningOutcome.${outcome}`,
                  LEARNING_OUTCOME_DISPLAY_NAMES[
                    outcome as keyof typeof LEARNING_OUTCOME_DISPLAY_NAMES
                  ] || outcome
                )
              : LEARNING_OUTCOME_DISPLAY_NAMES[
                  outcome as keyof typeof LEARNING_OUTCOME_DISPLAY_NAMES
                ] || outcome}
            <X
              className="h-2.5 w-2.5 sm:h-3 sm:w-3 cursor-pointer"
              onClick={() =>
                onLearningOutcomesChange?.(
                  selectedLearningOutcomes.filter(lo => lo !== outcome)
                )
              }
            />
          </Badge>
        ))}

        {selectedProductType && selectedProductType !== "all" && (
          <Badge
            variant="outline"
            className="flex items-center gap-1 text-[10px] sm:text-xs py-0 h-5 sm:h-6"
          >
            {t
              ? t(
                  `productType.${selectedProductType}`,
                  PRODUCT_TYPE_DISPLAY_NAMES[
                    selectedProductType as keyof typeof PRODUCT_TYPE_DISPLAY_NAMES
                  ] || selectedProductType
                )
              : PRODUCT_TYPE_DISPLAY_NAMES[
                  selectedProductType as keyof typeof PRODUCT_TYPE_DISPLAY_NAMES
                ] || selectedProductType}
            <X
              className="h-2.5 w-2.5 sm:h-3 sm:w-3 cursor-pointer"
              onClick={() => onProductTypeChange?.("all")}
            />
          </Badge>
        )}

        {selectedSpecialCategories.map((category, index) => (
          <Badge
            key={`special-category-${category}-${index}`}
            variant="outline"
            className="flex items-center gap-1 text-[10px] sm:text-xs py-0 h-5 sm:h-6"
          >
            {t
              ? t(
                  `specialCategory.${category}`,
                  SPECIAL_CATEGORY_DISPLAY_NAMES[
                    category as keyof typeof SPECIAL_CATEGORY_DISPLAY_NAMES
                  ] || category
                )
              : SPECIAL_CATEGORY_DISPLAY_NAMES[
                  category as keyof typeof SPECIAL_CATEGORY_DISPLAY_NAMES
                ] || category}
            <X
              className="h-2.5 w-2.5 sm:h-3 sm:w-3 cursor-pointer"
              onClick={() =>
                onSpecialCategoriesChange?.(
                  selectedSpecialCategories.filter(sc => sc !== category)
                )
              }
            />
          </Badge>
        ))}

        {selectedAgeGroup && (
          <Badge
            variant="outline"
            className="flex items-center gap-1 text-[10px] sm:text-xs py-0 h-5 sm:h-6"
          >
            {(() => {
              const ageOptions: Record<string, { labelKey: string; short: string }> = {
                PRESCHOOL_3_5: { labelKey: "age3to5H2", short: "3–5" },
                ELEMENTARY_6_8: { labelKey: "age6to8H2", short: "6–8" },
                MIDDLE_SCHOOL_9_12: { labelKey: "age9to12H2", short: "9–12" },
                TEENS_13_PLUS: { labelKey: "age13plusH2", short: "13+" },
              };
              const ageOpt = ageOptions[selectedAgeGroup];
              return ageOpt
                ? t
                    ? t(ageOpt.labelKey, ageOpt.short)
                    : `${ageOpt.short} ${t ? t("years", "yrs") : "yrs"}`
                : selectedAgeGroup;
            })()}
            <X
              className="h-2.5 w-2.5 sm:h-3 sm:w-3 cursor-pointer"
              onClick={() => onAgeGroupChange?.(undefined)}
            />
          </Badge>
        )}

        {Object.entries(selectedFilters).map(([filterId, optionIds]) =>
          Array.isArray(optionIds)
            ? optionIds.map((optionId, index) => {
                const filterGroup = filters.find(f => f.id === filterId);
                const option = filterGroup?.options.find(
                  o => o.id === optionId
                );
                if (!filterGroup || !option) return null;

                return (
                  <Badge
                    key={`${filterId}-${optionId}-${index}`}
                    variant="outline"
                    className="flex items-center gap-1 text-[10px] sm:text-xs py-0 h-5 sm:h-6"
                  >
                    {option.label}
                    <X
                      className="h-2.5 w-2.5 sm:h-3 sm:w-3 cursor-pointer"
                      onClick={() => onFilterChange?.(filterId, optionId)}
                    />
                  </Badge>
                );
              })
            : null
        )}

        {!noPriceFilter &&
          (priceRange?.current?.[0] !== priceRange?.min ||
            priceRange?.current?.[1] !== priceRange?.max) && (
            <Badge
              variant="outline"
              className="flex items-center gap-1 text-[10px] sm:text-xs py-0 h-5 sm:h-6"
            >
              {formatPrice(priceRange!.current[0])} -{" "}
              {formatPrice(priceRange!.current[1])}
              <X
                className="h-2.5 w-2.5 sm:h-3 sm:w-3 cursor-pointer"
                onClick={() =>
                  onPriceChange?.([priceRange!.min, priceRange!.max])
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

      {/* Mobile filters - only render when not inside a modal */}
      {!isInsideModal && (
        <div className="md:hidden">
          {/* Mobile filter overlay */}
          {onCloseMobile && (
            <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/30">
              <div className="w-full max-w-2xl bg-white rounded-t-2xl shadow-lg pt-6 pb-24 px-3 sm:px-6 lg:px-8 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                  <h2 className="text-base sm:text-lg font-semibold">
                    Filters
                  </h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-12 w-12 p-0 flex items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-primary"
                    onClick={() => {
                      if (onCloseMobile) onCloseMobile();
                    }}
                    aria-label="Close filters"
                    tabIndex={0}
                  >
                    <X className="h-6 w-6 sm:h-7 sm:w-7" />
                  </Button>
                </div>

                {/* Filter content for mobile */}
                {filterContent}

                {/* Sticky footer for Apply/Cancel on mobile/tablet */}
                <div className="md:hidden fixed left-0 right-0 bottom-0 z-50 bg-white border-t border-gray-200 flex gap-3 p-4 shadow-lg">
                  <Button
                    variant="outline"
                    className="flex-1 text-base h-12"
                    onClick={() => {
                      if (onCloseMobile) onCloseMobile();
                    }}
                    aria-label="Cancel filters"
                  >
                    Cancel
                  </Button>
                  <Button
                    className="flex-1 text-base h-12"
                    onClick={() => {
                      if (onCloseMobile) onCloseMobile();
                    }}
                    aria-label="Apply filters"
                  >
                    Apply Filters
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Selected filter badges for mobile view */}
          <div className="md:hidden">
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-1.5 sm:gap-2 h-12 sm:h-14 text-base sm:text-lg py-0"
                onClick={() => onCloseMobile?.()}
                aria-label="Open filters"
              >
                <SlidersHorizontal className="h-4 w-4 sm:h-5 sm:w-5" />
                Filters
                {activeFilterCount > 0 && (
                  <Badge
                    variant="secondary"
                    className="ml-1 h-5 sm:h-6 w-5 sm:w-6 p-0 flex items-center justify-center text-[10px] sm:text-xs"
                  >
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>

              {activeFilterCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClearFilters}
                  className="text-base sm:text-lg h-12 sm:h-14 py-0"
                  aria-label="Clear all filters"
                >
                  Clear All
                </Button>
              )}
            </div>

            {renderSelectedFilters()}
          </div>
        </div>
      )}
    </>
  );
}
