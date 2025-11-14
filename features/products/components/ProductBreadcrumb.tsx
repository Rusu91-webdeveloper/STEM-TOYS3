"use client";

import React from "react";

import {
  productMutedTextClass,
  productTitleClass,
} from "./productTheme";

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
    <nav className="mb-4 sm:mb-6 lg:mb-8" aria-label="Breadcrumb">
      <ol className="flex items-center gap-1 sm:gap-2 overflow-x-auto pb-1 text-xs sm:text-sm">
        <li>
          <a
            href="/"
            className="whitespace-nowrap rounded-full bg-white/5 px-2 py-0.5 text-[0.7rem] font-medium text-slate-200 transition hover:bg-white/10 sm:px-3 sm:text-xs"
          >
            {t("home", "Acasă")}
          </a>
        </li>
        <li className={`${productMutedTextClass} px-0.5`}>/</li>
        <li>
          <a
            href="/products"
            className="whitespace-nowrap rounded-full bg-white/5 px-2 py-0.5 text-[0.7rem] font-medium text-slate-200 transition hover:bg-white/10 sm:px-3 sm:text-xs"
          >
            {t("products", "Produse")}
          </a>
        </li>
        <li className={`${productMutedTextClass} px-0.5`}>/</li>
        <li>
          <a
            href={`/categories/${categorySlug}`}
            className="whitespace-nowrap rounded-full bg-white/5 px-2 py-0.5 text-[0.7rem] font-medium text-slate-200 transition hover:bg-white/10 sm:px-3 sm:text-xs"
          >
            {categoryName}
          </a>
        </li>
        <li className={`${productMutedTextClass} px-0.5`}>/</li>
        <li
          className={`${productTitleClass} truncate max-w-[140px] sm:max-w-none`}
          title={productName}
        >
          {productName}
        </li>
      </ol>
    </nav>
  );
}
