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
  const [visibleColumns, setVisibleColumns] = useState(1);
  const [aboveFoldItems, setAboveFoldItems] = useState(priorityItemsCount);

  // Calculate visible columns on the client side only
  useEffect(() => {
    // Calculate the visible columns in the current layout
    let cols = 1;
    const width = window.innerWidth;
    if (width >= 1280 && columns.xl) cols = columns.xl;
    else if (width >= 1024 && columns.lg) cols = columns.lg;
    else if (width >= 768 && columns.md) cols = columns.md;
    else if (width >= 640 && columns.sm) cols = columns.sm;

    setVisibleColumns(cols);

    // Determine the number of above-the-fold items based on visible columns
    setAboveFoldItems(
      Math.min(
        priorityItemsCount,
        cols * 2 // Prioritize first two rows
      )
    );

    // Add event listener for resize
    const handleResize = () => {
      let cols = 1;
      const width = window.innerWidth;
      if (width >= 1280 && columns.xl) cols = columns.xl;
      else if (width >= 1024 && columns.lg) cols = columns.lg;
      else if (width >= 768 && columns.md) cols = columns.md;
      else if (width >= 640 && columns.sm) cols = columns.sm;

      setVisibleColumns(cols);
      setAboveFoldItems(
        Math.min(
          priorityItemsCount,
          cols * 2 // Prioritize first two rows
        )
      );
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [columns, priorityItemsCount]);

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

  // Generate grid template columns classes based on breakpoints
  const gridColsClass = cn(
    `grid-cols-1`,
    columns.sm && `sm:grid-cols-${columns.sm}`,
    columns.md && `md:grid-cols-${columns.md}`,
    columns.lg && `lg:grid-cols-${columns.lg}`,
    columns.xl && `xl:grid-cols-${columns.xl}`
  );

  return (
    <div className={cn("space-y-4 sm:space-y-6", className)}>
      {(showLayoutToggle || showSortOptions) && (
        <div className="flex flex-col gap-3 sm:gap-4 sm:flex-row sm:justify-between sm:items-center">
          {showSortOptions && (
            <div className="w-full sm:w-48">
              <Select
                value={sortOption}
                onValueChange={setSortOption}>
                <SelectTrigger className="h-8 sm:h-10 text-xs sm:text-sm">
                  <SelectValue placeholder={t("sortBy")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    value="featured"
                    className="text-xs sm:text-sm hover:bg-gray-100">
                    {t("featured")}
                  </SelectItem>
                  <SelectItem
                    value="price-low"
                    className="text-xs sm:text-sm hover:bg-gray-100">
                    {t("priceLowToHigh")}
                  </SelectItem>
                  <SelectItem
                    value="price-high"
                    className="text-xs sm:text-sm hover:bg-gray-100">
                    {t("priceHighToLow")}
                  </SelectItem>
                  <SelectItem
                    value="newest"
                    className="text-xs sm:text-sm hover:bg-gray-100">
                    {t("newest")}
                  </SelectItem>
                  <SelectItem
                    value="rating"
                    className="text-xs sm:text-sm hover:bg-gray-100">
                    {t("topRated")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {showLayoutToggle && (
            <div className="flex items-center space-x-2">
              <span className="text-xs sm:text-sm text-muted-foreground mr-1 sm:mr-2">
                {t("view")}:
              </span>
              <Button
                variant={layout === "grid" ? "default" : "outline"}
                size="sm"
                className="px-1.5 sm:px-2 h-7 sm:h-8 shadow-md hover:shadow-lg transition-shadow duration-300"
                onClick={() => setLayout("grid")}
                aria-label={t("gridView")}>
                <Grid2X2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Button>
              <Button
                variant={layout === "list" ? "default" : "outline"}
                size="sm"
                className="px-1.5 sm:px-2 h-7 sm:h-8 shadow-md hover:shadow-lg transition-shadow duration-300"
                onClick={() => setLayout("list")}
                aria-label={t("listView")}>
                <List className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Button>
            </div>
          )}
        </div>
      )}

      {sortedProducts.length === 0 ? (
        <div className="text-center py-8 sm:py-12 text-muted-foreground text-xs sm:text-sm">
          {t("noProductsFound")}
        </div>
      ) : layout === "grid" ? (
        <div className={`grid ${gridColsClass} gap-4 sm:gap-6`}>
          {sortedProducts.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              className="hover:shadow-lg transition-shadow duration-300"
              imageHeight={index < aboveFoldItems ? 64 : 48}
              layout="grid"
              priority={index < aboveFoldItems}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col space-y-3 sm:space-y-6">
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
