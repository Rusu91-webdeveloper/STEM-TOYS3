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
import { productsGlassCardClass } from "./productsTheme";

interface ProductGridProps {
  products: Product[];
  className?: string;
  defaultLayout?: "grid" | "list";
  defaultSort?: string;
  showLayoutToggle?: boolean;
  showSortOptions?: boolean;
  columns?: {
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  priorityItemsCount?: number; // Number of items to mark as priority
}

export function ProductGrid({
  products,
  className,
  defaultLayout = "grid",
  defaultSort = "featured",
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
  const [sortOption, setSortOption] = useState<string>(defaultSort);
  const { t } = useTranslation();

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
        let cols = 1;
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

  const sortedProducts = sortProducts(products, sortOption);

  // 1. Ensure grid is 2 columns on mobile (grid-cols-2)
  const gridColsClass = cn(
    `grid-cols-2`,
    columns.sm && `sm:grid-cols-${columns.sm}`,
    columns.md && `md:grid-cols-${columns.md}`,
    columns.lg && `lg:grid-cols-${columns.lg}`,
    columns.xl && `xl:grid-cols-${columns.xl}`
  );

  // If the effective visible columns is 1, prefer list layout for a more compact look
  const isEffectivelySingleColumn = visibleColumns === 1;

  return (
    <div className={cn("space-y-2 sm:space-y-6", className)}>
      {(showLayoutToggle || showSortOptions) && (
        <div
          className={`${productsGlassCardClass} flex flex-col gap-2 sm:gap-4 sm:flex-row sm:justify-between sm:items-center p-2 sm:p-3 border-white/12 shadow-indigo-900/30 mb-2 sm:mb-4`}
        >
          {showSortOptions && (
            <div className="w-full sm:w-48">
              <Select value={sortOption} onValueChange={setSortOption}>
                <SelectTrigger className="h-8 sm:h-10 text-xs sm:text-sm bg-white/5 border-white/15 text-slate-100 shadow-none rounded-lg backdrop-blur">
                  <SelectValue placeholder={t("sortBy")} />
                </SelectTrigger>
                <SelectContent className="border-white/15 bg-slate-900/90 text-slate-100 shadow-xl shadow-black/30">
                  <SelectItem
                    value="featured"
                    className="text-xs sm:text-sm hover:bg-indigo-500/20 focus:bg-indigo-500/20 focus:text-slate-100"
                  >
                    {t("featured")}
                  </SelectItem>
                  <SelectItem
                    value="price-low"
                    className="text-xs sm:text-sm hover:bg-indigo-500/20 focus:bg-indigo-500/20 focus:text-slate-100"
                  >
                    {t("priceLowToHigh")}
                  </SelectItem>
                  <SelectItem
                    value="price-high"
                    className="text-xs sm:text-sm hover:bg-indigo-500/20 focus:bg-indigo-500/20 focus:text-slate-100"
                  >
                    {t("priceHighToLow")}
                  </SelectItem>
                  <SelectItem
                    value="newest"
                    className="text-xs sm:text-sm hover:bg-indigo-500/20 focus:bg-indigo-500/20 focus:text-slate-100"
                  >
                    {t("newest")}
                  </SelectItem>
                  <SelectItem
                    value="rating"
                    className="text-xs sm:text-sm hover:bg-indigo-500/20 focus:bg-indigo-500/20 focus:text-slate-100"
                  >
                    {t("topRated")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {showLayoutToggle && (
            <div className="flex items-center space-x-1.5 sm:space-x-2">
              <span className="text-xs sm:text-sm text-slate-300 mr-1 sm:mr-2">
                {t("view")}:
              </span>
              <Button
                variant={layout === "grid" ? "default" : "outline"}
                size="sm"
                className={cn(
                  "px-2 sm:px-3 h-8 sm:h-10 transition-all duration-300",
                  layout === "grid"
                    ? "bg-gradient-to-r from-indigo-600 to-sky-600 text-white shadow-indigo-900/40 hover:shadow-indigo-500/40"
                    : "bg-white/10 border-white/15 text-slate-200 hover:bg-white/15"
                )}
                onClick={() => setLayout("grid")}
                aria-label={t("gridView")}
              >
                <Grid2X2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Button>
              <Button
                variant={layout === "list" ? "default" : "outline"}
                size="sm"
                className={cn(
                  "px-2 sm:px-3 h-8 sm:h-10 transition-all duration-300",
                  layout === "list"
                    ? "bg-gradient-to-r from-indigo-600 to-sky-600 text-white shadow-indigo-900/40 hover:shadow-indigo-500/40"
                    : "bg-white/10 border-white/15 text-slate-200 hover:bg-white/15"
                )}
                onClick={() => setLayout("list")}
                aria-label={t("listView")}
              >
                <List className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Button>
            </div>
          )}
        </div>
      )}

      {sortedProducts.length === 0 ? (
        <div
          className={`${productsGlassCardClass} text-center py-6 sm:py-12 text-slate-200 text-xs sm:text-sm border-white/12 shadow-indigo-900/30`}
        >
          {t("noProductsFound")}
        </div>
      ) : layout === "grid" && !isEffectivelySingleColumn ? (
        <div className={`grid ${gridColsClass} gap-2 sm:gap-4 lg:gap-6`}>
          {sortedProducts.map((product, index) => (
            <div
              key={product.id}
              className="animate-fadeIn"
              style={{ animationDelay: `${Math.min(index * 0.1, 0.5)}s` }}
            >
              <ProductCard
                product={product}
                className="hover:shadow-lg transition-shadow duration-300"
                layout="grid"
                priority={index < aboveFoldItems}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col space-y-2 sm:space-y-4 lg:space-y-6">
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
