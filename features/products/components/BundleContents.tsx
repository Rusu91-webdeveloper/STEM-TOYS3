"use client";

import { Package, ArrowRight, CircleCheck, CircleAlert } from "lucide-react";
import Link from "next/link";
import React from "react";

import { OptimizedProductImage } from "./OptimizedProductImage";
import {
  productBodyTextClass,
  productSubSectionCardClass,
  productTitleClass,
} from "./productTheme";

export interface BundleContentItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  images: string[];
  price: number;
  stockQuantity: number;
  isActive: boolean;
}

interface BundleContentsProps {
  items: BundleContentItem[];
  bundleSlug?: string;
  t: (key: string, fallback?: string) => string;
}

const formatPrice = (price: number) =>
  new Intl.NumberFormat("ro-RO", {
    style: "currency",
    currency: "RON",
    maximumFractionDigits: 2,
  }).format(price);

export function BundleContents({ items, bundleSlug, t }: BundleContentsProps) {
  if (items.length === 0) return null;

  const buildProductHref = (itemSlug: string) => {
    if (!bundleSlug) return `/products/${itemSlug}`;
    return `/products/${itemSlug}?fromBundle=${encodeURIComponent(bundleSlug)}`;
  };

  return (
    <div className={`${productSubSectionCardClass} space-y-4`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-100 text-cyan-700 ring-1 ring-cyan-200">
            <Package className="h-4 w-4" />
          </div>
          <div>
            <h2 className={productTitleClass}>
              {t("bundleIncludesTitle", "What Is Included")}
            </h2>
            <p className={productBodyTextClass}>
              {t(
                "bundleIncludesSubtitle",
                "Each product included in this bundle:"
              )}
            </p>
          </div>
        </div>
        <span className="inline-flex w-fit items-center rounded-full bg-cyan-50 px-2.5 py-1 text-[11px] font-semibold text-cyan-700 ring-1 ring-cyan-200">
          {items.length} {t("products", "Products")}
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {items.map((item, index) => {
          const imageUrl =
            Array.isArray(item.images) && item.images.length > 0
              ? item.images[0]
              : "/placeholder-product.png";

          return (
            <Link
              key={item.id}
              href={buildProductHref(item.slug)}
              className="group block rounded-2xl border border-slate-200 bg-white p-4 transition hover:-translate-y-0.5 hover:border-cyan-300 hover:shadow-md"
            >
              <div className="flex gap-4">
                <div
                  className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-xl border border-slate-100 bg-slate-50"
                  aria-hidden="true"
                >
                  <OptimizedProductImage
                    src={imageUrl}
                    alt={item.name}
                    fill
                    className="object-contain p-2 transition-transform duration-300 group-hover:scale-105"
                    sizes="96px"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex items-start justify-between gap-3">
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                      #{index + 1}
                    </span>
                    <span className="text-sm font-bold text-slate-800">
                      {formatPrice(item.price)}
                    </span>
                  </div>

                  <h3 className="line-clamp-2 text-base font-semibold leading-snug text-slate-900 transition-colors group-hover:text-cyan-700">
                    {item.name}
                  </h3>

                  <p className="mt-2 line-clamp-2 text-sm text-slate-600">
                    {item.description}
                  </p>

                  <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
                    <span
                      className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                        item.isActive && item.stockQuantity > 0
                          ? "text-emerald-700"
                          : "text-rose-700"
                      }`}
                    >
                      {item.isActive && item.stockQuantity > 0 ? (
                        <CircleCheck className="h-3.5 w-3.5" />
                      ) : (
                        <CircleAlert className="h-3.5 w-3.5" />
                      )}
                      {item.isActive && item.stockQuantity > 0
                        ? t("inStock", "In stock")
                        : t("currentlyUnavailable", "Currently unavailable")}
                    </span>

                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-cyan-700 transition-colors group-hover:text-cyan-800">
                      {t("viewProduct", "View product")}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
