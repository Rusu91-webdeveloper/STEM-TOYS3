"use client";

import React from "react";

interface ProductBreadcrumbProps {
  categorySlug?: string;
  categoryName: string;
  productName: string;
  t: (key: string, fallback?: string) => string;
}

/**
 * Product page breadcrumb navigation component
 */
export function ProductBreadcrumb({
  categorySlug,
  categoryName,
  productName,
  t,
}: ProductBreadcrumbProps) {
  return (
    <nav className="mb-4 sm:mb-6 lg:mb-8">
      <ol className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm text-gray-600 overflow-x-auto pb-1">
        <li>
          <a
            href="/"
            className="hover:text-blue-600 transition-colors whitespace-nowrap"
          >
            {t("home", "Acasă")}
          </a>
        </li>
        <li className="text-gray-400">/</li>
        <li>
          <a
            href="/products"
            className="hover:text-blue-600 transition-colors whitespace-nowrap"
          >
            {t("products", "Produse")}
          </a>
        </li>
        <li className="text-gray-400">/</li>
        <li>
          <a
            href={`/categories/${categorySlug}`}
            className="hover:text-blue-600 transition-colors whitespace-nowrap"
          >
            {categoryName}
          </a>
        </li>
        <li className="text-gray-400">/</li>
        <li className="text-gray-900 font-medium truncate max-w-[120px] sm:max-w-none">
          {productName}
        </li>
      </ol>
    </nav>
  );
}
