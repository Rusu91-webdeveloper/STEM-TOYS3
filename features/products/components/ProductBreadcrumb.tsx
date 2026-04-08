"use client";

import Link from "next/link";
import React from "react";

import { getCategoryPageHref } from "@/lib/utils/category-page-links";

import { productMutedTextClass, productTitleClass } from "./productTheme";

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
  const categoryHref = getCategoryPageHref(categorySlug);
  const hasCategoryBreadcrumb = categoryName.trim().length > 0;

  return (
    <nav className="mb-4 sm:mb-6 lg:mb-8" aria-label="Breadcrumb">
      <ol className="flex items-center gap-1 sm:gap-2 overflow-x-auto pb-1 text-xs sm:text-sm">
        <li>
          <Link
            href="/"
            className="whitespace-nowrap rounded-full bg-slate-100 px-2 py-0.5 text-[0.7rem] font-medium text-slate-700 transition hover:bg-slate-200 sm:px-3 sm:text-xs"
          >
            {t("home", "Acasă")}
          </Link>
        </li>
        <li className={`${productMutedTextClass} px-0.5`}>/</li>
        <li>
          <Link
            href="/products"
            className="whitespace-nowrap rounded-full bg-slate-100 px-2 py-0.5 text-[0.7rem] font-medium text-slate-700 transition hover:bg-slate-200 sm:px-3 sm:text-xs"
          >
            {t("products", "Produse")}
          </Link>
        </li>
        {categoryHref && hasCategoryBreadcrumb && (
          <>
            <li className={`${productMutedTextClass} px-0.5`}>/</li>
            <li>
              <Link
                href={categoryHref}
                className="whitespace-nowrap rounded-full bg-slate-100 px-2 py-0.5 text-[0.7rem] font-medium text-slate-700 transition hover:bg-slate-200 sm:px-3 sm:text-xs"
              >
                {categoryName}
              </Link>
            </li>
          </>
        )}
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
