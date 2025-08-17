"use client";

import Image from "next/image";
import Link from "next/link";
import React from "react";

import { Badge } from "@/components/ui/badge";
import { ProductGrid } from "@/features/products";
import type { Product } from "@/types/product";

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
  const IconComponent =
    activeCategory && categoryInfo[activeCategory.id]
      ? categoryInfo[activeCategory.id].icon
      : categoryInfo.science.icon;

  return (
    <div className="flex-1">
      {/* Main product area with showing products count */}
      <div className="mb-3 sm:mb-4 px-1 sm:px-2">
        <p className="text-xs sm:text-sm text-muted-foreground">
          {t("showingProducts")
            .replace("{0}", filteredProducts.length.toString())
            .replace("{1}", filteredProducts.length.toString())}
        </p>
      </div>

      {/* Educational categories banner for additional context - only show when filtering */}
      {activeCategory && filteredProducts.length > 0 && (
        <div
          className={`mb-3 sm:mb-4 p-2 sm:p-3 rounded-xl bg-gradient-to-r 
          ${
            activeCategory.id === "science"
              ? "from-blue-50 to-blue-100 border-blue-200"
              : activeCategory.id === "technology"
                ? "from-green-50 to-green-100 border-green-200"
                : activeCategory.id === "engineering"
                  ? "from-orange-50 to-orange-100 border-orange-200"
                  : "from-purple-50 to-purple-100 border-purple-200"
          } border shadow-sm`}
        >
          <div className="flex flex-col xs:flex-row items-start xs:items-center gap-2 sm:gap-3">
            <div
              className={`p-2 sm:p-3 rounded-full ${
                activeCategory && categoryInfo[activeCategory.id]
                  ? categoryInfo[activeCategory.id].bgColor
                  : categoryInfo.science.bgColor
              } flex-shrink-0`}
            >
              <IconComponent className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm sm:text-base font-semibold mb-0.5 sm:mb-1">
                {getLearningTitle()}
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">
                {getLearningDescription()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Products display */}
      <div className={viewMode === "list" ? "space-y-3 sm:space-y-4" : ""}>
        {viewMode === "grid" ? (
          <div className="bg-gray-50/50 rounded-xl p-2 sm:p-4">
            <ProductGrid
              products={displayedProducts.map(product => {
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

                return modifiedProduct as unknown as Product;
              })}
              columns={{ sm: 1, md: 2, lg: 3, xl: 3 }}
            />
          </div>
        ) : (
          <div className="bg-gray-50/50 rounded-xl p-2 sm:p-4 space-y-2 sm:space-y-3">
            {displayedProducts.map(product => {
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
                  className="flex flex-col xs:flex-row gap-3 sm:gap-4 bg-white rounded-xl overflow-hidden border border-gray-100 hover:shadow-md transition-shadow relative group"
                >
                  {/* Fun shape decoration - smaller size */}
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full opacity-80 animate-pulse"></div>

                  {/* Product image */}
                  <div className="relative w-full xs:w-32 sm:w-40 h-32 xs:h-32 sm:h-40 flex-shrink-0 bg-gray-50 rounded-xl xs:rounded-none xs:rounded-l-xl overflow-hidden">
                    {product.images && product.images.length > 0 ? (
                      <Image
                        src={product.images[0]}
                        alt={displayName}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
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
                  <div className="flex-1 p-3 sm:p-4 flex flex-col justify-between">
                    <div className="mb-2 sm:mb-3">
                      <div className="flex items-start justify-between gap-2 mb-1 sm:mb-2">
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
                      <div className="flex flex-wrap gap-1 sm:gap-1.5 mb-2 sm:mb-3">
                        {product.category?.name && (
                          <Badge
                            variant="secondary"
                            className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 border-blue-200"
                          >
                            {product.category.name}
                          </Badge>
                        )}
                        {product.isBook && (
                          <Badge
                            variant="secondary"
                            className="text-xs px-1.5 py-0.5 bg-green-100 text-green-700 border-green-200"
                          >
                            {t("digitalBook")}
                          </Badge>
                        )}
                        {product.featured && (
                          <Badge
                            variant="secondary"
                            className="text-xs px-1.5 py-0.5 bg-yellow-100 text-yellow-700 border-yellow-200"
                          >
                            {t("featured")}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Price and actions */}
                    <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-2 sm:gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-lg sm:text-xl font-bold text-primary">
                          {product.price
                            ? `${product.price} RON`
                            : t("freeDownload")}
                        </span>
                        {product.compareAtPrice && (
                          <span className="text-sm text-gray-500 line-through">
                            {product.compareAtPrice} RON
                          </span>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Link
                          href={`/products/${product.slug}`}
                          className="flex-1 xs:flex-initial bg-primary text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold hover:bg-primary/90 transition-colors text-center"
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
