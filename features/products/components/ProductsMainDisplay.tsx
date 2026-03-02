"use client";

import { Search, ShoppingBag, X } from "lucide-react";
import Link from "next/link";
import React, { useState, useEffect } from "react";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ProductGrid } from "@/features/products";
import type { Product } from "@/types/product";

import { OptimizedProductImage } from "./OptimizedProductImage";
import {
  productsGlassCardClass,
  productsGlassPanelClass,
} from "./productsTheme";

interface CategoryInfo {
  id: string;
  label: string;
}

interface CategoryIconInfo {
  icon: React.ComponentType<{ className?: string }>;
  bgColor: string;
  textColor: string;
  letter: string;
}

interface ProductsMainDisplayProps {
  activeCategory: CategoryInfo | null;
  categoryInfo: Record<string, CategoryIconInfo>;
  filteredProducts: any[];
  visibleProductsCount: number;
  displayedProducts: any[];
  viewMode: "grid" | "list";
  sortOption?: string;
  onSortChange?: (value: string) => void;
  searchQuery?: string;
  onSearchQueryChange?: (value: string) => void;
  onClearSearch?: () => void;
  bundleViewMode: "all" | "bundles" | "products";
  onBundleViewModeChange: (mode: "all" | "bundles" | "products") => void;
  getLearningTitle: () => string;
  getLearningDescription: () => string;
  getProductCardContent: (product: any) => {
    title: string;
    description: string;
  };
  t: (key: string, fallback?: string) => string;
}

export function ProductsMainDisplay({
  activeCategory,
  categoryInfo,
  filteredProducts,
  visibleProductsCount,
  displayedProducts,
  viewMode,
  sortOption,
  onSortChange,
  searchQuery = "",
  onSearchQueryChange,
  onClearSearch,
  bundleViewMode,
  onBundleViewModeChange,
  getLearningTitle,
  getLearningDescription,
  getProductCardContent,
  t,
}: ProductsMainDisplayProps) {
  const [loading, setLoading] = useState(false);
  const [displayProducts, setDisplayProducts] = useState(displayedProducts);

  // Track previous products count to detect changes requiring loading animation
  const [prevProductCount, setPrevProductCount] = useState(
    displayedProducts.length
  );

  const IconComponent =
    activeCategory && categoryInfo[activeCategory.id]
      ? categoryInfo[activeCategory.id].icon
      : categoryInfo.science.icon;

  const categoryAccentMap: Record<
    string,
    { surface: string; icon: string; glow: string }
  > = {
    science: {
      surface: "from-sky-100/80 via-white to-sky-50",
      icon: "from-sky-500 to-sky-600",
      glow: "shadow-sky-300/40",
    },
    technology: {
      surface: "from-emerald-100/80 via-white to-emerald-50",
      icon: "from-emerald-500 to-emerald-600",
      glow: "shadow-emerald-300/40",
    },
    engineering: {
      surface: "from-amber-100/80 via-white to-orange-50",
      icon: "from-amber-500 to-orange-500",
      glow: "shadow-amber-300/40",
    },
    mathematics: {
      surface: "from-violet-100/80 via-white to-violet-50",
      icon: "from-violet-500 to-violet-600",
      glow: "shadow-violet-300/40",
    },
    "educational-books": {
      surface: "from-rose-100/80 via-white to-rose-50",
      icon: "from-rose-500 to-rose-600",
      glow: "shadow-rose-300/40",
    },
    default: {
      surface: "from-sky-100/80 via-white to-emerald-50",
      icon: "from-sky-500 to-emerald-500",
      glow: "shadow-sky-300/40",
    },
  };

  const accent =
    categoryAccentMap[activeCategory?.id ?? "default"] ??
    categoryAccentMap.default;
  const bundleCount = filteredProducts.filter(
    product => product?.isBundle === true
  ).length;
  const regularCount = Math.max(0, filteredProducts.length - bundleCount);

  // Update products without loading animation to prevent CLS
  useEffect(() => {
    // Only show loading for significant changes (more than 50% difference in count)
    const countDifference = Math.abs(
      displayedProducts.length - prevProductCount
    );
    const shouldShowLoading =
      countDifference > Math.max(prevProductCount * 0.5, 5);

    if (shouldShowLoading) {
      setLoading(true);
      setPrevProductCount(displayedProducts.length);

      // Minimal loading time to prevent jarring transitions
      const timer = setTimeout(() => {
        setDisplayProducts(displayedProducts);
        setLoading(false);
      }, 200);

      return () => clearTimeout(timer);
    } else {
      // Update products immediately for small changes
      setDisplayProducts(displayedProducts);
      setPrevProductCount(displayedProducts.length);
    }
  }, [displayedProducts, prevProductCount]);

  return (
    <div className="flex-1 text-slate-900">
      {/* Product area header — hidden on mobile (replaced by MobileProductsBar) */}
      <div className="hidden xl:block mb-3 rounded-xl border border-slate-200/80 bg-white px-3 py-2.5 shadow-sm sm:mb-4 sm:px-4 sm:py-3.5">
        <div className="flex flex-col gap-2.5 sm:gap-3">
          <div className="flex flex-col gap-2.5 sm:gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-sky-100 text-sky-700 ring-1 ring-sky-200/60">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-sm sm:text-base font-semibold text-slate-900">
                  {(() => {
                    const countStr = visibleProductsCount.toString();
                    const template = t(
                      "showingProducts",
                      `Showing {count} products`
                    );
                    return template
                      .replace("{count}", countStr)
                      .replace("{0}", countStr)
                      .replace("{1}", countStr);
                  })()}
                </p>
                <p className="hidden sm:block text-xs text-slate-500">
                  {t("searchByToyName", "Search by toy name, kit, or book")}
                </p>
              </div>
            </div>

            <div className="w-full lg:max-w-xl">
              <label htmlFor="products-search" className="sr-only">
                {t("searchProducts", "Search products")}
              </label>
              <div className="relative">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  aria-hidden="true"
                />
                <Input
                  id="products-search"
                  type="search"
                  value={searchQuery}
                  onChange={event =>
                    onSearchQueryChange?.(event.currentTarget.value)
                  }
                  placeholder={t(
                    "productsSearchPlaceholder",
                    "Search toys by name..."
                  )}
                  className="h-10 sm:h-11 rounded-xl border-slate-200/90 bg-white/95 pl-10 pr-11 text-sm shadow-sm transition focus-visible:border-sky-300 focus-visible:ring-2 focus-visible:ring-sky-200"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={onClearSearch}
                    className="absolute right-2 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                    aria-label={t("clearSearch", "Clear search")}
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="inline-flex w-full flex-wrap items-center rounded-lg border border-slate-200 bg-slate-50/90 p-1 sm:w-auto">
              <button
                type="button"
                onClick={() => onBundleViewModeChange("all")}
                className={`rounded-md px-2.5 py-1 text-xs font-semibold transition ${
                  bundleViewMode === "all"
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {t("all", "All")}
              </button>
              <button
                type="button"
                onClick={() => onBundleViewModeChange("bundles")}
                disabled={bundleCount === 0}
                className={`rounded-md px-2.5 py-1 text-xs font-semibold transition ${
                  bundleViewMode === "bundles"
                    ? "bg-cyan-600 text-white"
                    : bundleCount === 0
                      ? "cursor-not-allowed text-slate-400"
                      : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {t("bundles", "Bundles")} ({bundleCount})
              </button>
              <button
                type="button"
                onClick={() => onBundleViewModeChange("products")}
                className={`rounded-md px-2.5 py-1 text-xs font-semibold transition ${
                  bundleViewMode === "products"
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {t("products", "Products")} ({regularCount})
              </button>
            </div>

            <div className="flex min-h-6 flex-wrap items-center gap-2 text-xs sm:text-sm text-slate-500">
              {searchQuery && (
                <span className="inline-flex items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-sky-700">
                  <Search className="h-3.5 w-3.5" />
                  {searchQuery}
                </span>
              )}
              {visibleProductsCount > 0 && (
                <span>
                  {visibleProductsCount} {t("items", "items")}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Educational categories banner — hidden on mobile */}
      {activeCategory && visibleProductsCount > 0 && (
        <div
          className={`hidden xl:block ${productsGlassPanelClass} relative mb-5 overflow-hidden p-4 sm:mb-6 sm:p-5`}
        >
          <div
            className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(251,247,239,0.98),rgba(255,255,255,0.9))]"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.04] bg-[radial-gradient(circle,_rgba(15,23,42,0.6)_1px,_transparent_1px)] bg-[length:12px_12px]"
            aria-hidden
          />
          <div className="relative z-10 flex items-center gap-4">
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${accent.icon} shadow-sm`}
            >
              <IconComponent className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                {t("editorialGuide", "Category Guide")}
              </div>
              <h3 className="mb-1 font-serif text-lg leading-tight text-slate-900">
                {getLearningTitle()}
              </h3>
              <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">
                {getLearningDescription()}
              </p>
            </div>
          </div>
        </div>
      )}


      {/* Products Display */}
      <div className={viewMode === "list" ? "space-y-4" : ""}>
        {viewMode === "grid" ? (
          <div className="relative">
            <ProductGrid
              products={displayProducts.map((product, index) => {
                // If the product name or description contains raw translation keys,
                // replace them with properly translated content
                const modifiedProduct = { ...product };

                // Check if the product has raw translation keys in name or description
                if (
                  product.name?.includes("Learning") ||
                  product.description?.includes("LearningDesc")
                ) {
                  // Get appropriate content for this product based on category
                  const content = getProductCardContent(product);
                  modifiedProduct.name = content.title;
                  modifiedProduct.description = content.description;
                }

                // Add animation delay for staggered appearance
                modifiedProduct.animationDelay = `${Math.min(index * 0.1, 0.5)}s`;

                return modifiedProduct as unknown as Product;
              })}
              sortOption={sortOption}
              onSortChange={onSortChange}
              disableInternalSort
              columns={{ base: 2, sm: 2, md: 3, lg: 3, xl: 4 }}
            />
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-6">
            {displayProducts.map((product, index) => {
              // Get appropriate content for this product if it contains raw translation keys
              let displayName = product.name;
              let displayDescription = product.description;

              // Check if the product has raw translation keys in name or description
              if (
                product.name?.includes("Learning") ||
                product.description?.includes("LearningDesc")
              ) {
                const content = getProductCardContent(product);
                displayName = content.title;
                displayDescription = content.description;
              }

              const discountPct =
                product.compareAtPrice && product.compareAtPrice > product.price
                  ? Math.round(
                      ((product.compareAtPrice - product.price) /
                        product.compareAtPrice) *
                        100
                    )
                  : null;

              return (
                <Link
                  key={product.id}
                  href={`/products/${product.slug}`}
                  className={`${productsGlassCardClass} flex flex-row overflow-hidden transition-all duration-200 hover:shadow-md relative group animate-fadeIn`}
                  style={{ animationDelay: `${Math.min(index * 0.1, 0.5)}s` }}
                >
                  {/* Sale ribbon */}
                  {discountPct && (
                    <div className="absolute top-2 left-2 z-20">
                      <div className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm">
                        -{discountPct}%
                      </div>
                    </div>
                  )}

                  {/* Thumbnail — compact square on mobile, wider on sm+ */}
                  <div className="relative z-10 w-24 h-24 sm:h-48 sm:w-44 lg:w-52 flex-shrink-0 overflow-hidden rounded-l-xl sm:rounded-l-xl border-r border-slate-200 bg-gradient-to-b from-slate-50 to-white">
                    {product.images && product.images.length > 0 ? (
                      <OptimizedProductImage
                        src={product.images[0]}
                        alt={displayName}
                        fill
                        className="object-contain object-center group-hover:scale-105 transition-transform duration-300 relative z-10 p-1.5 sm:p-3"
                        priority={false}
                        sizes="(max-width: 640px) 96px, (max-width: 1024px) 176px, 208px"
                      />
                    ) : (
                      <div className="w-full h-full bg-slate-100 flex items-center justify-center relative z-10">
                        <ShoppingBag className="w-6 h-6 text-slate-300" />
                      </div>
                    )}
                  </div>

                  {/* Info panel */}
                  <div className="relative z-10 flex flex-1 flex-col justify-between p-3 sm:p-5 min-w-0">
                    <div className="min-w-0">
                      {/* Category badge */}
                      {product.category?.name && (
                        <span className="inline-block mb-1 text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-sky-600">
                          {product.category.name}
                        </span>
                      )}

                      <p className="font-semibold text-sm sm:text-base text-slate-900 leading-snug line-clamp-2 sm:line-clamp-2 mb-1 sm:mb-2">
                        {displayName}
                      </p>

                      {/* Description — hidden on mobile, visible sm+ */}
                      <p className="hidden sm:block text-sm text-slate-500 line-clamp-2 leading-relaxed mb-3">
                        {displayDescription}
                      </p>

                      {/* Extra badges — sm+ only */}
                      <div className="hidden sm:flex flex-wrap gap-2 mb-3">
                        {product.isBook && (
                          <Badge
                            variant="secondary"
                            className="text-xs px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md font-medium"
                          >
                            {t("digitalBook", "Digital Book")}
                          </Badge>
                        )}
                        {product.featured && (
                          <Badge
                            variant="secondary"
                            className="text-xs px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-md font-medium"
                          >
                            ⭐ {t("featured", "Featured")}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Price row */}
                    <div className="flex items-center justify-between gap-2 mt-auto">
                      <div className="flex items-baseline gap-1.5 flex-wrap">
                        <span className="text-base sm:text-lg font-bold text-slate-900">
                          {product.price
                            ? `${product.price} RON`
                            : t("freeDownload", "Gratuit")}
                        </span>
                        {product.compareAtPrice &&
                          product.compareAtPrice > product.price && (
                            <span className="text-xs text-slate-400 line-through">
                              {product.compareAtPrice} RON
                            </span>
                          )}
                      </div>

                      {/* CTA — icon on mobile, text on sm+ */}
                      <div className="flex-shrink-0 bg-sky-600 hover:bg-sky-700 text-white rounded-lg transition-colors duration-200 shadow-sm text-xs sm:text-sm font-semibold px-2.5 py-1.5 sm:px-4 sm:py-2 whitespace-nowrap">
                        <span className="hidden sm:inline">
                          {t("viewDetails", "Vezi detalii")}
                        </span>
                        <span className="sm:hidden">→</span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
