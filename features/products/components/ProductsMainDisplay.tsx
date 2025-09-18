"use client";

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

  // Show loading animation when filters change
  useEffect(() => {
    if (displayedProducts.length !== prevProductCount) {
      // Show loading state
      setLoading(true);

      // Store current products to compare in next render
      setPrevProductCount(displayedProducts.length);

      // Show loading state for a reasonable time (min 600ms, max 1200ms)
      const loadTime = Math.max(
        600,
        Math.min(displayedProducts.length * 50, 1200)
      );

      // After delay, update the displayed products
      const timer = setTimeout(() => {
        setDisplayProducts(displayedProducts);
        setLoading(false);
      }, loadTime);

      return () => clearTimeout(timer);
    } else if (
      JSON.stringify(displayedProducts) !== JSON.stringify(displayProducts)
    ) {
      // Products have changed but count hasn't - update without animation
      setDisplayProducts(displayedProducts);
    }
  }, [displayedProducts]);

  return (
    <div className="flex-1">
      {/* Main product area with showing products count */}
      <div className="mb-2 sm:mb-4 px-1 sm:px-2 flex justify-between items-center">
        <p className="text-xs sm:text-sm text-gray-600 font-medium">
          {t("showingProducts")
            .replace("{0}", filteredProducts.length.toString())
            .replace("{1}", filteredProducts.length.toString())}
        </p>
        <div className="text-xs sm:text-sm font-semibold text-primary">
          {filteredProducts.length > 0 && (
            <span className="bg-primary/10 px-2 py-1 rounded-full">
              {filteredProducts.length} {t("items")}
            </span>
          )}
        </div>
      </div>

      {/* Enhanced educational categories banner for additional context - only show when filtering */}
      {activeCategory && filteredProducts.length > 0 && (
        <div
          className={`mb-3 sm:mb-5 p-3 sm:p-4 rounded-xl bg-gradient-to-r 
          ${
            activeCategory.id === "science"
              ? "from-blue-50 to-blue-100 border-blue-100"
              : activeCategory.id === "technology"
                ? "from-green-50 to-green-100 border-green-100"
                : activeCategory.id === "engineering"
                  ? "from-orange-50 to-orange-100 border-orange-100"
                  : "from-purple-50 to-purple-100 border-purple-100"
          } border shadow-sm`}
        >
          <div className="flex items-center gap-3 sm:gap-4">
            <div
              className={`p-2 sm:p-3 rounded-full ${
                activeCategory && categoryInfo[activeCategory.id]
                  ? categoryInfo[activeCategory.id].bgColor
                  : categoryInfo.science.bgColor
              } flex-shrink-0 shadow-sm`}
            >
              <IconComponent className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm sm:text-base font-bold mb-1">
                {getLearningTitle()}
              </h3>
              <p className="text-xs sm:text-sm text-gray-700 line-clamp-2">
                {getLearningDescription()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Loading overlay */}
      <div
        className={`fixed inset-0 bg-white/80 backdrop-blur-sm z-50 transition-all duration-300 flex items-center justify-center ${
          loading ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="relative flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-500 rounded-full animate-spin"></div>
          <p className="mt-4 text-sm font-medium text-gray-700">
            {t("filtering", "Filtering products...")}
          </p>
          <div className="mt-2 bg-indigo-100 text-indigo-800 text-xs font-medium px-2.5 py-1 rounded-full">
            {filteredProducts.length} {t("results", "results")}
          </div>
        </div>
      </div>

      {/* Products display - Enhanced for mobile */}
      <div className={viewMode === "list" ? "space-y-2 sm:space-y-4" : ""}>
        {viewMode === "grid" ? (
          <div className="rounded-xl">
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
              columns={{ sm: 2, md: 2, lg: 3, xl: 3 }}
            />
          </div>
        ) : (
          <div className="space-y-2.5 sm:space-y-4">
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
                  className="flex flex-col xs:flex-row gap-2 sm:gap-4 bg-white rounded-xl overflow-hidden border border-gray-100/80 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 relative group animate-fadeIn"
                  style={{ animationDelay: `${Math.min(index * 0.1, 0.5)}s` }}
                >
                  {/* Ribbon for sale items */}
                  {product.compareAtPrice &&
                    product.compareAtPrice > product.price && (
                      <div className="absolute top-0 left-0 w-14 h-14 overflow-hidden">
                        <div className="absolute transform rotate-45 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-bold py-1 left-[-35px] top-[15px] w-[130px] text-center shadow-md">
                          SALE
                        </div>
                      </div>
                    )}

                  {/* Product image */}
                  <div className="relative w-full xs:w-32 sm:w-44 h-32 xs:h-32 sm:h-44 flex-shrink-0 bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
                    {product.images && product.images.length > 0 ? (
                      <OptimizedProductImage
                        src={product.images[0]}
                        alt={displayName}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        priority={false}
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                        <span className="text-gray-400 text-xs sm:text-sm font-medium">
                          {t("noImage")}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Product details */}
                  <div className="flex-1 p-2.5 sm:p-4 flex flex-col justify-between relative">
                    <div>
                      <div className="flex items-start justify-between gap-1.5 sm:gap-2 mb-1 sm:mb-2">
                        <Link
                          href={`/products/${product.slug}`}
                          className="font-bold text-sm sm:text-base text-gray-900 hover:text-primary transition-colors line-clamp-2 group-hover:underline"
                        >
                          {displayName}
                        </Link>
                      </div>

                      <p className="text-xs sm:text-sm text-gray-600 line-clamp-2 mb-2 sm:mb-3">
                        {displayDescription}
                      </p>

                      {/* Product tags/badges */}
                      <div className="flex flex-wrap gap-1 sm:gap-2 mb-2 sm:mb-3">
                        {product.category?.name && (
                          <Badge
                            variant="secondary"
                            className="text-[10px] sm:text-xs px-1.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 shadow-sm rounded-full"
                          >
                            {product.category.name}
                          </Badge>
                        )}
                        {product.isBook && (
                          <Badge
                            variant="secondary"
                            className="text-[10px] sm:text-xs px-1.5 py-0.5 bg-green-50 text-green-700 border border-green-100 shadow-sm rounded-full"
                          >
                            {t("digitalBook")}
                          </Badge>
                        )}
                        {product.featured && (
                          <Badge
                            variant="secondary"
                            className="text-[10px] sm:text-xs px-1.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-100 shadow-sm rounded-full"
                          >
                            {t("featured")}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Price and actions - Enhanced mobile layout */}
                    <div className="flex flex-col gap-3 mt-auto">
                      {/* Price Section - Prominent on mobile */}
                      <div className="flex flex-col gap-1">
                        <div className="flex items-baseline gap-2">
                          <span className="text-lg sm:text-xl font-bold text-primary">
                            {product.price
                              ? `${product.price} RON`
                              : t("freeDownload")}
                          </span>
                          {product.compareAtPrice &&
                            product.compareAtPrice > product.price && (
                              <span className="text-sm text-red-500 font-bold bg-red-50 px-2 py-0.5 rounded-full">
                                -
                                {Math.round(
                                  ((product.compareAtPrice - product.price) /
                                    product.compareAtPrice) *
                                    100
                                )}
                                %
                              </span>
                            )}
                        </div>
                        {product.compareAtPrice && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500 line-through">
                              {product.compareAtPrice} RON
                            </span>
                            <span className="text-xs text-gray-400">
                              {t("was", "era")}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Action Button */}
                      <div className="flex gap-2">
                        <Link
                          href={`/products/${product.slug}`}
                          className="flex-1 bg-gradient-to-br from-primary to-primary/80 text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:from-primary/80 hover:to-primary transition-all duration-300 shadow-sm hover:shadow-md text-center"
                        >
                          {t("viewDetails")}
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
