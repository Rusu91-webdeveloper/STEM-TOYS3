"use client";

import { ShoppingBag } from "lucide-react";
import Link from "next/link";
import React, { useState, useEffect } from "react";

import { Badge } from "@/components/ui/badge";
import { ProductGrid } from "@/features/products";
import type { Product } from "@/types/product";

import { OptimizedProductImage } from "./OptimizedProductImage";
import {
  productsAccentPillClass,
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
      {/* Product area header */}
      <div
        className={`${productsGlassCardClass} mb-4 flex items-center justify-between gap-2 px-4 py-3`}
      >
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-100 text-sky-700 ring-1 ring-sky-200/60">
            <ShoppingBag className="w-4 h-4" />
          </div>
          <p className="text-sm sm:text-base font-medium text-slate-900">
            {(() => {
              const countStr = visibleProductsCount.toString();
              const template = t("showingProducts", `Showing {count} products`);
              return template
                .replace("{count}", countStr)
                .replace("{0}", countStr)
                .replace("{1}", countStr);
            })()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {bundleCount > 0 && (
            <div className="inline-flex items-center rounded-lg border border-slate-200 bg-white/90 p-1">
              <button
                type="button"
                onClick={() => onBundleViewModeChange("all")}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
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
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
                  bundleViewMode === "bundles"
                    ? "bg-cyan-600 text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {t("bundles", "Bundles")} ({bundleCount})
              </button>
              <button
                type="button"
                onClick={() => onBundleViewModeChange("products")}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
                  bundleViewMode === "products"
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {t("products", "Products")} ({regularCount})
              </button>
            </div>
          )}
          {visibleProductsCount > 0 && (
            <span className="text-xs sm:text-sm text-slate-500">
              {visibleProductsCount} {t("items")}
            </span>
          )}
        </div>
      </div>

      {/* Educational categories banner */}
      {activeCategory && visibleProductsCount > 0 && (
        <div
          className={`${productsGlassPanelClass} relative mb-6 overflow-hidden p-4 sm:p-5`}
        >
          <div
            className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${accent.surface}`}
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full bg-white/60 blur-2xl"
            aria-hidden
          />
          <div className="relative z-10 flex items-center gap-4">
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${accent.icon} ${accent.glow} shadow-md`}
            >
              <IconComponent className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-1 text-slate-900 leading-tight">
                {getLearningTitle()}
              </h3>
              <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">
                {getLearningDescription()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Loading overlay */}
      {loading && (
        <div
          className={`${productsGlassCardClass} relative mb-6 flex items-center justify-center p-8 transition-all duration-300`}
        >
          <div className="flex flex-col items-center">
            <div className="relative mb-4">
              <div className="w-12 h-12 border-4 border-sky-200 border-t-sky-600 rounded-full animate-spin"></div>
            </div>
            <p className="text-sm font-medium text-slate-600">
              {t("filtering", "Filtering Products...")}
            </p>
          </div>
        </div>
      )}

      {/* Products Display */}
      <div className={viewMode === "list" ? "space-y-4" : ""}>
        {viewMode === "grid" ? (
          <div
            className={`${productsGlassPanelClass} relative overflow-hidden p-2 sm:p-4 before:pointer-events-none before:absolute before:inset-0 before:bg-[radial-gradient(circle,_rgba(14,116,144,0.08)_1px,_transparent_1px)] before:bg-[length:22px_22px] before:opacity-40`}
          >
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

              return (
                <div
                  key={product.id}
                  className={`${productsGlassCardClass} flex flex-col sm:flex-row gap-3 sm:gap-4 overflow-hidden transition-all duration-200 hover:shadow-md relative group animate-fadeIn`}
                  style={{ animationDelay: `${Math.min(index * 0.1, 0.5)}s` }}
                >
                  {/* Sale ribbon */}
                  {product.compareAtPrice &&
                    product.compareAtPrice > product.price && (
                      <div className="absolute top-3 left-3 z-10">
                        <div className="bg-red-500 text-white text-xs font-semibold px-3 py-1.5 rounded-md shadow-sm">
                          SALE
                        </div>
                      </div>
                    )}

                  {/* Product image */}
                  <div className="relative z-10 w-full h-72 sm:h-56 sm:w-52 lg:w-56 flex-shrink-0 overflow-hidden rounded-t-xl sm:rounded-xl border-b border-slate-200 bg-gradient-to-b from-slate-50 to-white sm:border">
                    {product.images && product.images.length > 0 ? (
                      <OptimizedProductImage
                        src={product.images[0]}
                        alt={displayName}
                        fill
                        className="object-cover sm:object-contain object-center group-hover:scale-105 transition-transform duration-300 relative z-10 p-0 sm:p-3"
                        priority={false}
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 208px, 224px"
                      />
                    ) : (
                      <div className="w-full h-full bg-slate-100 flex items-center justify-center relative z-10">
                        <div className="text-center">
                          <div className="w-12 h-12 bg-slate-200 rounded-lg flex items-center justify-center mb-2 mx-auto">
                            <ShoppingBag className="w-6 h-6 text-slate-400" />
                          </div>
                          <span className="text-slate-500 text-sm font-medium">
                            {t("noImage", "No Image")}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Product details */}
                  <div className="relative z-10 flex flex-1 flex-col justify-between p-4 sm:p-5">
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <Link
                          href={`/products/${product.slug}`}
                          className="font-semibold text-base sm:text-lg text-slate-900 transition-colors line-clamp-2 leading-tight hover:text-sky-700"
                        >
                          {displayName}
                        </Link>
                      </div>

                      <p className="text-sm text-slate-600 line-clamp-3 mb-4 leading-relaxed">
                        {displayDescription}
                      </p>

                      {/* Product tags/badges */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {product.category?.name && (
                          <Badge
                            variant="secondary"
                            className="text-xs px-2.5 py-1 bg-sky-50 text-sky-700 border border-sky-100 rounded-md font-medium"
                          >
                            {product.category.name}
                          </Badge>
                        )}
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

                    {/* Price and actions section */}
                    <div className="flex flex-col gap-3 mt-auto">
                      {/* Price Section */}
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-baseline gap-2">
                          <span className="text-xl font-bold text-slate-900">
                            {product.price
                              ? `${product.price} RON`
                              : t("freeDownload", "Free Download")}
                          </span>
                          {product.compareAtPrice &&
                            product.compareAtPrice > product.price && (
                              <span className="text-sm text-red-600 font-semibold">
                                -
                                {Math.round(
                                  ((product.compareAtPrice - product.price) /
                                    product.compareAtPrice) *
                                    100
                                )}
                                % OFF
                              </span>
                            )}
                        </div>
                        {product.compareAtPrice && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-slate-500 line-through">
                              {product.compareAtPrice} RON
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Action Button */}
                      <div className="flex gap-3">
                        <Link
                          href={`/products/${product.slug}`}
                          className="flex-1 bg-sky-600 hover:bg-sky-700 text-white px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors duration-200 text-center shadow-sm"
                        >
                          {t("viewDetails", "View Details")}
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
