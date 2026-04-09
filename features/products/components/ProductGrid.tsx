"use client";

import { Grid2X2, List } from "lucide-react";
import React, { useState, useEffect } from "react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { Product } from "@/types/product";

import { ProductCard } from "./ProductCard";
type GridColumnsConfig = {
  base?: number;
  sm?: number;
  md?: number;
  lg?: number;
  xl?: number;
};

type Breakpoint = keyof GridColumnsConfig;

const breakpointClassMap: Record<Breakpoint, Record<number, string>> = {
  base: {
    1: "grid-cols-1",
    2: "grid-cols-2",
    3: "grid-cols-3",
    4: "grid-cols-4",
    5: "grid-cols-5",
    6: "grid-cols-6",
  },
  sm: {
    1: "sm:grid-cols-1",
    2: "sm:grid-cols-2",
    3: "sm:grid-cols-3",
    4: "sm:grid-cols-4",
    5: "sm:grid-cols-5",
    6: "sm:grid-cols-6",
  },
  md: {
    1: "md:grid-cols-1",
    2: "md:grid-cols-2",
    3: "md:grid-cols-3",
    4: "md:grid-cols-4",
    5: "md:grid-cols-5",
    6: "md:grid-cols-6",
  },
  lg: {
    1: "lg:grid-cols-1",
    2: "lg:grid-cols-2",
    3: "lg:grid-cols-3",
    4: "lg:grid-cols-4",
    5: "lg:grid-cols-5",
    6: "lg:grid-cols-6",
  },
  xl: {
    1: "xl:grid-cols-1",
    2: "xl:grid-cols-2",
    3: "xl:grid-cols-3",
    4: "xl:grid-cols-4",
    5: "xl:grid-cols-5",
    6: "xl:grid-cols-6",
  },
};

const buildGridColsClass = (columns?: GridColumnsConfig) => {
  const classes = new Set<string>();
  const config = columns || {};
  const breakpoints: Breakpoint[] = ["base", "sm", "md", "lg", "xl"];

  breakpoints.forEach(bp => {
    const value = config[bp];
    if (value && breakpointClassMap[bp]?.[value]) {
      classes.add(breakpointClassMap[bp][value]);
    }
  });

  if (!classes.size) {
    classes.add("grid-cols-2");
  } else if (!config.base) {
    // Ensure we always have a base column definition for browsers that don't apply breakpoint classes
    classes.add(breakpointClassMap.base[2]);
  }

  return Array.from(classes).join(" ");
};

interface ProductGridProps {
  products: Product[];
  className?: string;
  defaultLayout?: "grid" | "list";
  defaultSort?: string;
  sortOption?: string;
  onSortChange?: (value: string) => void;
  disableInternalSort?: boolean;
  showLayoutToggle?: boolean;
  showSortOptions?: boolean;
  columns?: GridColumnsConfig;
  priorityItemsCount?: number; // Number of items to mark as priority
}

export function ProductGrid({
  products,
  className,
  defaultLayout = "grid",
  defaultSort = "featured",
  sortOption: controlledSortOption,
  onSortChange,
  disableInternalSort = false,
  showLayoutToggle = true,
  showSortOptions = true,
  columns = {
    sm: 2,
    md: 3,
    lg: 3,
    xl: 4,
  },
  priorityItemsCount = 4, // Default to first 4 items being priority
}: ProductGridProps) {
  const [layout, setLayout] = useState<"grid" | "list">(defaultLayout);
  const [internalSortOption, setInternalSortOption] =
    useState<string>(defaultSort);
  const { t } = useTranslation();

  const sortOption = controlledSortOption ?? internalSortOption;

  const handleSortChange = (value: string) => {
    if (onSortChange) {
      onSortChange(value);
    }
    if (controlledSortOption === undefined) {
      setInternalSortOption(value);
    }
  };

  // Use static calculation to prevent CLS - assume medium screen initially
  const [visibleColumns, setVisibleColumns] = useState(columns.md || 3);
  const [aboveFoldItems, setAboveFoldItems] = useState(
    Math.min(priorityItemsCount, (columns.md || 3) * 2)
  );

  // Calculate visible columns with debouncing to prevent CLS
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const fallbackCols = columns.base ?? 1;
        let cols = fallbackCols;
        const width = window.innerWidth;
        if (width >= 1280 && columns.xl) cols = columns.xl;
        else if (width >= 1024 && columns.lg) cols = columns.lg;
        else if (width >= 768 && columns.md) cols = columns.md;
        else if (width >= 640 && columns.sm) cols = columns.sm;

        // Only update if significantly different to prevent micro-adjustments
        if (Math.abs(cols - visibleColumns) > 0) {
          setVisibleColumns(cols);
          setAboveFoldItems(Math.min(priorityItemsCount, cols * 2));
        }
      }, 150); // Debounce to prevent rapid updates
    };

    // Initial calculation
    handleResize();

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(timeoutId);
    };
  }, [columns, priorityItemsCount, visibleColumns]);

  const sortProducts = (products: Product[], option: string) => {
    const sortedProducts = [...products];

    switch (option) {
      case "price-low":
        return sortedProducts.sort((a, b) => a.price - b.price);
      case "price-high":
        return sortedProducts.sort((a, b) => b.price - a.price);
      case "newest":
        return sortedProducts.sort(
          (a, b) =>
            new Date(b.createdAt || "").getTime() -
            new Date(a.createdAt || "").getTime()
        );
      case "rating":
        return sortedProducts.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      case "featured":
      default:
        // Sort featured items first if they have a 'featured' flag
        return sortedProducts.sort((a, b) => {
          if (a.featured && !b.featured) return -1;
          if (!a.featured && b.featured) return 1;
          return 0;
        });
    }
  };

  const sortedProducts = disableInternalSort
    ? products
    : sortProducts(products, sortOption);

  // 1. Ensure grid is 2 columns on mobile (grid-cols-2) with deterministic Tailwind classes
  const gridColsClass = buildGridColsClass({ base: 2, ...columns });

  // If the effective visible columns is 1, prefer list layout for a more compact look
  const isEffectivelySingleColumn = visibleColumns === 1;

  return (
    <div className={cn("space-y-2 sm:space-y-3", className)}>
      {(showLayoutToggle || showSortOptions) && (
        <div className="hidden xl:flex mb-3 flex-col gap-2 rounded-xl border border-slate-200 bg-white px-2.5 py-2 shadow-sm sm:mb-4 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:px-3 sm:py-2.5">
          {showSortOptions && (
            <div className="w-full sm:w-56">
              <Select value={sortOption} onValueChange={handleSortChange}>
                <SelectTrigger className="h-10 text-sm bg-white border-slate-200 text-slate-700 shadow-none rounded-lg hover:border-slate-300 focus:ring-2 focus:ring-sky-100">
                  <SelectValue placeholder={t("sortBy")} />
                </SelectTrigger>
                <SelectContent className="border-slate-200 bg-white text-slate-700 shadow-lg">
                  <SelectItem
                    value="featured"
                    className="text-sm hover:bg-slate-50 focus:bg-slate-50"
                  >
                    {t("featured")}
                  </SelectItem>
                  <SelectItem
                    value="price-low"
                    className="text-sm hover:bg-slate-50 focus:bg-slate-50"
                  >
                    {t("priceLowToHigh")}
                  </SelectItem>
                  <SelectItem
                    value="price-high"
                    className="text-sm hover:bg-slate-50 focus:bg-slate-50"
                  >
                    {t("priceHighToLow")}
                  </SelectItem>
                  <SelectItem
                    value="newest"
                    className="text-sm hover:bg-slate-50 focus:bg-slate-50"
                  >
                    {t("newest")}
                  </SelectItem>
                  <SelectItem
                    value="rating"
                    className="text-sm hover:bg-slate-50 focus:bg-slate-50"
                  >
                    {t("topRated")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {showLayoutToggle && (
            <div className="flex items-center justify-between sm:justify-end">
              <span className="text-xs sm:text-sm text-slate-500 mr-2">
                {t("view")}:
              </span>
              <div className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-50 p-1">
                <Button
                  variant={layout === "grid" ? "default" : "outline"}
                  size="sm"
                  className={cn(
                    "px-3 h-8 border-0 shadow-none transition-all duration-200",
                    layout === "grid"
                      ? "bg-slate-900 text-white hover:bg-slate-800"
                      : "bg-transparent text-slate-600 hover:bg-white hover:text-slate-900"
                  )}
                  onClick={() => setLayout("grid")}
                  aria-label={t("gridView")}
                >
                  <Grid2X2 className="h-4 w-4" />
                </Button>
                <Button
                  variant={layout === "list" ? "default" : "outline"}
                  size="sm"
                  className={cn(
                    "px-3 h-8 border-0 shadow-none transition-all duration-200",
                    layout === "list"
                      ? "bg-slate-900 text-white hover:bg-slate-800"
                      : "bg-transparent text-slate-600 hover:bg-white hover:text-slate-900"
                  )}
                  onClick={() => setLayout("list")}
                  aria-label={t("listView")}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {sortedProducts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white py-12 text-center text-sm text-slate-500">
          {t("noProductsFound")}
        </div>
      ) : layout === "grid" && !isEffectivelySingleColumn ? (
        <div className={`grid ${gridColsClass} gap-2 sm:gap-3 lg:gap-3.5`}>
          {sortedProducts.map((product, index) => (
            <div
              key={product.id}
              className="animate-fadeIn"
              style={{ animationDelay: `${Math.min(index * 0.1, 0.5)}s` }}
            >
              <ProductCard
                product={product}
                className="transition-shadow duration-300"
                layout="grid"
                priority={index < aboveFoldItems}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col space-y-2 sm:space-y-3 lg:space-y-4">
          {sortedProducts.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              layout="list"
              priority={index < aboveFoldItems}
            />
          ))}
        </div>
      )}
    </div>
  );
}
