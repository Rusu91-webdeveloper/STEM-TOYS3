"use client";

import { ShoppingBag } from "lucide-react";
import Link from "next/link";
import React, { useState, useEffect } from "react";

import { Badge } from "@/components/ui/badge";
import { ProductGrid } from "@/features/products";
import type { Product } from "@/types/product";

import { OptimizedProductImage } from "./OptimizedProductImage";

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
    <div className="flex-1">
      {/* Premium product area header with enhanced mobile design */}
      <div className="mb-4 sm:mb-6 px-2 sm:px-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl shadow-lg">
            <ShoppingBag className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm sm:text-base text-gray-700 font-bold">
              {(() => {
                const countStr = filteredProducts.length.toString();
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
            <p className="text-xs text-gray-500 mt-0.5">
              {t(
                "findYourPerfectMatch",
                "Find your perfect STEM learning companion"
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {filteredProducts.length > 0 && (
            <div className="flex items-center gap-2 bg-gradient-to-r from-indigo-50 to-purple-50 px-4 py-2 rounded-2xl border border-indigo-200/50 shadow-lg">
              <div className="w-2 h-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-black text-gray-800">
                {filteredProducts.length} {t("items")}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Premium educational categories banner with enhanced mobile design */}
      {activeCategory && filteredProducts.length > 0 && (
        <div
          className={`mb-6 sm:mb-8 p-4 sm:p-6 rounded-3xl bg-gradient-to-br shadow-2xl border backdrop-blur-sm relative overflow-hidden
          ${
            activeCategory.id === "science"
              ? "from-blue-50/90 via-blue-100/60 to-cyan-50/40 border-blue-200/50"
              : activeCategory.id === "technology"
                ? "from-green-50/90 via-green-100/60 to-emerald-50/40 border-green-200/50"
                : activeCategory.id === "engineering"
                  ? "from-orange-50/90 via-orange-100/60 to-red-50/40 border-orange-200/50"
                  : "from-purple-50/90 via-purple-100/60 to-pink-50/40 border-purple-200/50"
          }`}
        >
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-white/20 to-transparent rounded-full blur-2xl"></div>
          <div className="absolute bottom-0 left-0 w-20 h-20 bg-gradient-to-tr from-white/30 to-transparent rounded-full blur-xl"></div>

          <div className="relative z-10 flex items-center gap-4 sm:gap-6">
            <div
              className={`p-3 sm:p-4 rounded-2xl ${
                activeCategory && categoryInfo[activeCategory.id]
                  ? categoryInfo[activeCategory.id].bgColor
                  : categoryInfo.science.bgColor
              } flex-shrink-0 shadow-xl border border-white/20`}
            >
              <IconComponent className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg sm:text-xl font-black mb-2 text-gray-900 leading-tight">
                {getLearningTitle()}
              </h3>
              <p className="text-sm sm:text-base text-gray-700 line-clamp-2 leading-relaxed">
                {getLearningDescription()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Premium loading overlay - positioned relative to prevent CLS */}
      {loading && (
        <div className="relative bg-gradient-to-br from-white/95 via-indigo-50/80 to-purple-50/60 backdrop-blur-2xl rounded-2xl p-8 mb-6 transition-all duration-300 flex items-center justify-center border border-indigo-200/50">
          <div className="flex flex-col items-center">
            {/* Premium loading spinner */}
            <div className="relative mb-4">
              <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin shadow-lg"></div>
            </div>
            <p className="text-sm font-semibold text-gray-700">
              {t("filtering", "Filtering Products...")}
            </p>
          </div>
        </div>
      )}

      {/* Premium Products Display - Optimized for Mobile */}
      <div className={viewMode === "list" ? "space-y-3 sm:space-y-4" : ""}>
        {viewMode === "grid" ? (
          <div className="grid-container rounded-2xl bg-gradient-to-b from-gray-50/30 to-white p-2 sm:p-4">
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
              columns={{ sm: 1, md: 2, lg: 3, xl: 4 }}
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
                  className="flex flex-col sm:flex-row gap-3 sm:gap-4 bg-gradient-to-br from-white via-gray-50/30 to-white rounded-3xl overflow-hidden border border-gray-200/50 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 hover:scale-[1.02] relative group animate-fadeIn backdrop-blur-sm"
                  style={{ animationDelay: `${Math.min(index * 0.1, 0.5)}s` }}
                >
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
                  <div className="relative w-full sm:w-48 h-48 sm:h-56 flex-shrink-0 bg-gradient-to-br from-gray-50 via-white to-gray-100 overflow-hidden rounded-2xl border border-gray-200/50 shadow-inner">
                    {/* Decorative background pattern */}
                    <div className="absolute inset-0 bg-[radial-gradient(circle,_rgba(99,102,241,0.05)_1px,_transparent_1px)] bg-[length:16px_16px]"></div>

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
                      <div className="w-full h-full bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300 flex items-center justify-center relative z-10">
                        <div className="text-center">
                          <div className="w-12 h-12 bg-gradient-to-r from-gray-400 to-gray-500 rounded-2xl flex items-center justify-center mb-2 mx-auto">
                            <ShoppingBag className="w-6 h-6 text-white" />
                          </div>
                          <span className="text-gray-500 text-sm font-medium">
                            {t("noImage", "No Image")}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Image overlay gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>

                  {/* Premium product details with enhanced mobile design */}
                  <div className="flex-1 p-4 sm:p-6 flex flex-col justify-between relative">
                    <div>
                      <div className="flex items-start justify-between gap-2 sm:gap-3 mb-3 sm:mb-4">
                        <Link
                          href={`/products/${product.slug}`}
                          className="font-black text-base sm:text-lg text-gray-900 hover:text-indigo-600 transition-all duration-300 line-clamp-2 group-hover:underline leading-tight"
                        >
                          {displayName}
                        </Link>
                      </div>

                      <p className="text-sm sm:text-base text-gray-600 line-clamp-3 mb-4 sm:mb-5 leading-relaxed">
                        {displayDescription}
                      </p>

                      {/* Premium product tags/badges */}
                      <div className="flex flex-wrap gap-2 sm:gap-3 mb-4 sm:mb-5">
                        {product.category?.name && (
                          <Badge
                            variant="secondary"
                            className="text-xs sm:text-sm px-3 py-1.5 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border border-blue-200/50 shadow-lg rounded-2xl font-bold hover:scale-105 transition-transform duration-300"
                          >
                            {product.category.name}
                          </Badge>
                        )}
                        {product.isBook && (
                          <Badge
                            variant="secondary"
                            className="text-xs sm:text-sm px-3 py-1.5 bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border border-green-200/50 shadow-lg rounded-2xl font-bold hover:scale-105 transition-transform duration-300"
                          >
                            {t("digitalBook", "Digital Book")}
                          </Badge>
                        )}
                        {product.featured && (
                          <Badge
                            variant="secondary"
                            className="text-xs sm:text-sm px-3 py-1.5 bg-gradient-to-r from-amber-50 to-yellow-50 text-amber-700 border border-amber-200/50 shadow-lg rounded-2xl font-bold hover:scale-105 transition-transform duration-300"
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
                          <span className="text-xl sm:text-2xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 text-transparent bg-clip-text">
                            {product.price
                              ? `${product.price} RON`
                              : t("freeDownload", "Free Download")}
                          </span>
                          {product.compareAtPrice &&
                            product.compareAtPrice > product.price && (
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-red-600 font-black bg-gradient-to-r from-red-100 to-red-200 px-3 py-1 rounded-2xl shadow-lg border border-red-300/50">
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
                            <span className="text-base text-gray-500 line-through font-medium">
                              {product.compareAtPrice} RON
                            </span>
                            <span className="text-sm text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                              {t("was", "Previous price")}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Premium Action Button */}
                      <div className="flex gap-3">
                        <Link
                          href={`/products/${product.slug}`}
                          className="group flex-1 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-700 hover:via-purple-700 hover:to-indigo-800 text-white px-6 py-3 rounded-2xl text-base font-black transition-all duration-500 shadow-xl hover:shadow-2xl text-center hover:scale-105 active:scale-95 relative overflow-hidden"
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                          <span className="relative z-10 flex items-center justify-center gap-2">
                            {t("viewDetails", "View Details")}
                            <div className="w-2 h-2 bg-white rounded-full group-hover:animate-ping"></div>
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
