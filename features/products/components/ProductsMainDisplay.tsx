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
  displayedProducts: any[];
  viewMode: "grid" | "list";
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
  displayedProducts,
  viewMode,
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
      surface: "from-sky-500/25 via-sky-400/10 to-sky-500/5",
      icon: "from-sky-400 to-sky-600",
      glow: "shadow-sky-500/40",
    },
    technology: {
      surface: "from-emerald-500/25 via-emerald-400/10 to-emerald-500/5",
      icon: "from-emerald-400 to-emerald-600",
      glow: "shadow-emerald-500/40",
    },
    engineering: {
      surface: "from-amber-500/25 via-orange-400/10 to-amber-500/5",
      icon: "from-amber-400 to-orange-600",
      glow: "shadow-amber-500/40",
    },
    mathematics: {
      surface: "from-violet-500/25 via-violet-400/10 to-violet-500/5",
      icon: "from-violet-400 to-violet-600",
      glow: "shadow-violet-500/40",
    },
    "educational-books": {
      surface: "from-rose-500/25 via-rose-400/10 to-rose-500/5",
      icon: "from-rose-400 to-rose-600",
      glow: "shadow-rose-500/40",
    },
    default: {
      surface: "from-indigo-500/25 via-purple-400/10 to-indigo-500/5",
      icon: "from-indigo-400 to-purple-600",
      glow: "shadow-indigo-500/40",
    },
  };

  const accent =
    categoryAccentMap[activeCategory?.id ?? "default"] ??
    categoryAccentMap.default;

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
    <div className="flex-1 text-slate-100">
      {/* Premium product area header with enhanced mobile design */}
      <div
        className={`${productsGlassCardClass} mb-3 sm:mb-4 flex items-center justify-between gap-2 px-3 sm:px-4 py-2.5 sm:py-3 border-white/10 shadow-indigo-900/30`}
      >
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500/30 via-indigo-500/30 to-purple-500/30 border border-white/15 shadow-md shadow-indigo-500/30">
            <ShoppingBag className="w-4 h-4 text-white" />
          </div>
          <p className="text-sm sm:text-base font-semibold text-slate-100">
            {(() => {
              const countStr = filteredProducts.length.toString();
              const template = t("showingProducts", `Showing {count} products`);
              return template
                .replace("{count}", countStr)
                .replace("{0}", countStr)
                .replace("{1}", countStr);
            })()}
          </p>
        </div>
        {filteredProducts.length > 0 && (
          <span className="text-xs sm:text-sm text-slate-300">
            {filteredProducts.length} {t("items")}
          </span>
        )}
      </div>

      {/* Premium educational categories banner with enhanced mobile design */}
      {activeCategory && filteredProducts.length > 0 && (
        <div
          className={`${productsGlassPanelClass} relative mb-6 sm:mb-8 overflow-hidden border-white/15 p-4 sm:p-6`}
        >
          <div
            className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${accent.surface}`}
            aria-hidden
          />
          <div className="relative z-10 flex items-center gap-4 sm:gap-6">
            <div
              className={`p-3 sm:p-4 rounded-2xl bg-gradient-to-br ${accent.icon} flex-shrink-0 border border-white/25 shadow-xl ${accent.glow}`}
            >
              <IconComponent className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg sm:text-xl font-black mb-2 text-slate-100 leading-tight">
                {getLearningTitle()}
              </h3>
              <p className="text-sm sm:text-base text-slate-300 line-clamp-2 leading-relaxed">
                {getLearningDescription()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Premium loading overlay - positioned relative to prevent CLS */}
      {loading && (
        <div
          className={`${productsGlassCardClass} relative mb-6 flex items-center justify-center p-8 transition-all duration-300 border-white/12 shadow-indigo-900/40`}
        >
          <div className="flex flex-col items-center">
            {/* Premium loading spinner */}
            <div className="relative mb-4">
              <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-300 rounded-full animate-spin shadow-lg shadow-indigo-500/40"></div>
            </div>
            <p className="text-sm font-semibold text-slate-200">
              {t("filtering", "Filtering Products...")}
            </p>
          </div>
        </div>
      )}

      {/* Premium Products Display - Optimized for Mobile */}
      <div className={viewMode === "list" ? "space-y-3 sm:space-y-4" : ""}>
        {viewMode === "grid" ? (
          <div
            className={`${productsGlassPanelClass} p-2 sm:p-4 border-white/12`}
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
                  className={`${productsGlassCardClass} flex flex-col sm:flex-row gap-3 sm:gap-4 overflow-hidden border-white/12 shadow-indigo-900/40 transition-all duration-500 hover:-translate-y-1 hover:scale-[1.02] relative group animate-fadeIn`}
                  style={{ animationDelay: `${Math.min(index * 0.1, 0.5)}s` }}
                >
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-indigo-500/15 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  {/* Premium ribbon for sale items */}
                  {product.compareAtPrice &&
                    product.compareAtPrice > product.price && (
                      <div className="absolute top-3 left-3 z-10">
                        <div className="bg-gradient-to-r from-red-500 via-red-600 to-red-700 text-white text-xs font-black px-3 py-1.5 rounded-2xl shadow-xl border border-white/20 animate-pulse">
                          SALE
                        </div>
                      </div>
                    )}

                  {/* Premium product image with enhanced design */}
                  <div className="relative z-10 w-full sm:w-48 h-48 sm:h-56 flex-shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-slate-900/70 shadow-inner shadow-black/30">
                    {/* Decorative background pattern */}
                    <div className="absolute inset-0 bg-[radial-gradient(circle,_rgba(129,140,248,0.12)_1px,_transparent_1px)] bg-[length:18px_18px] opacity-80"></div>

                    {product.images && product.images.length > 0 ? (
                      <OptimizedProductImage
                        src={product.images[0]}
                        alt={displayName}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-700 relative z-10"
                        priority={false}
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-slate-800/80 via-slate-900/70 to-slate-900 flex items-center justify-center relative z-10">
                        <div className="text-center">
                          <div className="w-12 h-12 bg-gradient-to-r from-slate-600 to-indigo-600 rounded-2xl flex items-center justify-center mb-2 mx-auto shadow-lg shadow-indigo-500/30">
                            <ShoppingBag className="w-6 h-6 text-white" />
                          </div>
                          <span className="text-slate-300 text-sm font-medium">
                            {t("noImage", "No Image")}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Image overlay gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>

                  {/* Premium product details with enhanced mobile design */}
                  <div className="relative z-10 flex flex-1 flex-col justify-between p-4 sm:p-6">
                    <div>
                      <div className="flex items-start justify-between gap-2 sm:gap-3 mb-3 sm:mb-4">
                        <Link
                          href={`/products/${product.slug}`}
                          className="font-black text-base sm:text-lg text-slate-100 transition-all duration-300 line-clamp-2 leading-tight group-hover:text-indigo-200 group-hover:underline"
                        >
                          {displayName}
                        </Link>
                      </div>

                      <p className="text-sm sm:text-base text-slate-300 line-clamp-3 mb-4 sm:mb-5 leading-relaxed">
                        {displayDescription}
                      </p>

                      {/* Premium product tags/badges */}
                      <div className="flex flex-wrap gap-2 sm:gap-3 mb-4 sm:mb-5">
                        {product.category?.name && (
                          <Badge
                            variant="secondary"
                            className="text-[11px] sm:text-xs px-3 py-1.5 bg-white/10 text-slate-100 border border-white/15 shadow-md shadow-indigo-500/25 rounded-2xl font-bold hover:scale-105 transition-transform duration-300 backdrop-blur"
                          >
                            {product.category.name}
                          </Badge>
                        )}
                        {product.isBook && (
                          <Badge
                            variant="secondary"
                            className="text-[11px] sm:text-xs px-3 py-1.5 bg-emerald-500/20 text-emerald-100 border border-emerald-300/30 shadow-md shadow-emerald-500/25 rounded-2xl font-bold hover:scale-105 transition-transform duration-300 backdrop-blur"
                          >
                            {t("digitalBook", "Digital Book")}
                          </Badge>
                        )}
                        {product.featured && (
                          <Badge
                            variant="secondary"
                            className="text-[11px] sm:text-xs px-3 py-1.5 bg-amber-500/20 text-amber-100 border border-amber-300/30 shadow-md shadow-amber-500/25 rounded-2xl font-bold hover:scale-105 transition-transform duration-300 backdrop-blur"
                          >
                            ⭐ {t("featured", "Featured")}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Premium price and actions section */}
                    <div className="flex flex-col gap-4 mt-auto">
                      {/* Premium Price Section */}
                      <div className="flex flex-col gap-2">
                        <div className="flex items-baseline gap-3">
                          <span className="text-xl sm:text-2xl font-black bg-gradient-to-r from-cyan-300 via-sky-200 to-indigo-300 text-transparent bg-clip-text">
                            {product.price
                              ? `${product.price} RON`
                              : t("freeDownload", "Free Download")}
                          </span>
                          {product.compareAtPrice &&
                            product.compareAtPrice > product.price && (
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-rose-200 font-black bg-gradient-to-r from-rose-500/20 to-red-500/20 px-3 py-1 rounded-2xl shadow-md shadow-rose-500/30 border border-rose-400/30 backdrop-blur">
                                  -
                                  {Math.round(
                                    ((product.compareAtPrice - product.price) /
                                      product.compareAtPrice) *
                                      100
                                  )}
                                  % OFF
                                </span>
                              </div>
                            )}
                        </div>
                        {product.compareAtPrice && (
                          <div className="flex items-center gap-3">
                            <span className="text-base text-slate-400 line-through font-medium">
                              {product.compareAtPrice} RON
                            </span>
                            <span className="text-sm text-slate-200 bg-white/10 px-2 py-0.5 rounded-full border border-white/15">
                              {t("was", "Previous price")}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Premium Action Button */}
                      <div className="flex gap-3">
                        <Link
                          href={`/products/${product.slug}`}
                          className="group flex-1 bg-gradient-to-r from-indigo-600 via-purple-600 to-sky-600 hover:from-indigo-500 hover:via-purple-500 hover:to-sky-500 text-white px-6 py-3 rounded-2xl text-base font-black transition-all duration-500 shadow-indigo-900/40 hover:shadow-indigo-500/40 text-center hover:scale-105 active:scale-95 relative overflow-hidden border border-white/15"
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                          <span className="relative z-10 flex items-center justify-center gap-2">
                            {t("viewDetails", "View Details")}
                            <div className="w-2 h-2 bg-white/80 rounded-full group-hover:animate-ping"></div>
                          </span>
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
