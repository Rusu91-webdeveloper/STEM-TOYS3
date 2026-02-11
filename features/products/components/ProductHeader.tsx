"use client";

import React from "react";
import { Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/email/base";
import { ProductActionButtons } from "./ProductActionButtons";

interface ProductHeaderProps {
  name: string;
  price: number;
  compareAtPrice?: number;
  averageRating: number;
  reviewCount: number;
  totalSold: number;
  stockQuantity: number;
  isFavorited: boolean;
  isFavoriteLoading: boolean;
  isAddingToCart?: boolean;
  justAddedToCart?: boolean;
  onFavoriteClick: () => void;
  onShareClick: () => void;
  onQuickAddToCart?: () => void;
  isBook?: boolean;
  t: (key: string, fallback?: string) => string;
  size?: "sm" | "md";
}

/**
 * Product header component showing title, price, rating, stock status and action buttons
 */
export function ProductHeader({
  name,
  price,
  compareAtPrice,
  averageRating,
  reviewCount,
  totalSold,
  stockQuantity,
  isFavorited,
  isFavoriteLoading,
  isAddingToCart,
  justAddedToCart,
  onFavoriteClick,
  onShareClick,
  onQuickAddToCart,
  isBook = false,
  t,
  size = "sm",
}: ProductHeaderProps) {
  const hasDiscount = compareAtPrice && compareAtPrice > price;
  const discountPercentage = hasDiscount
    ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
    : 0;
  const displayRating = Number.isFinite(averageRating)
    ? averageRating.toFixed(1)
    : "0.0";

  return (
    <div className="space-y-4 text-slate-900">
      {/* Title and Action Buttons */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1 min-w-0">
          <h1
            className={
              size === "sm"
                ? "text-2xl font-bold leading-tight text-slate-900 sm:text-3xl"
                : "text-3xl font-bold leading-tight text-slate-900 xl:text-4xl"
            }
          >
            {name}
          </h1>
        </div>
        <ProductActionButtons
          isFavorited={isFavorited}
          isFavoriteLoading={isFavoriteLoading}
          onFavoriteClick={onFavoriteClick}
          onShareClick={onShareClick}
          onQuickAddToCart={onQuickAddToCart}
          isAddingToCart={isAddingToCart}
          justAddedToCart={justAddedToCart}
          isBook={isBook}
          favoriteTitle={
            isFavorited
              ? t("inWishlist", "În lista de dorințe")
              : t("addToWishlist", "Adaugă la dorințe")
          }
          shareTitle={t("share", "Partajează")}
          addToCartTitle={
            justAddedToCart
              ? t("addedToCart", "Adăugat în coș")
              : t("addToCart", "Adaugă în coș")
          }
          size={size}
        />
      </div>

      {/* Price and Rating Row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-baseline gap-2">
          <span
            className={
              size === "sm"
                ? "text-3xl font-bold text-slate-900 sm:text-4xl"
                : "text-4xl font-bold text-slate-900 xl:text-5xl"
            }
          >
            {formatPrice(price)}
          </span>
          {hasDiscount && (
            <span
              className={
                size === "sm"
                  ? "text-sm sm:text-base text-slate-500 line-through font-medium"
                  : "text-base xl:text-lg text-slate-500 line-through font-medium"
              }
            >
              {formatPrice(compareAtPrice)}
            </span>
          )}
        </div>
        <RatingBadge
          averageRating={averageRating}
          displayRating={displayRating}
          reviewCount={reviewCount}
          size={size}
        />
      </div>

      {/* Discount Badge and Stock Status Row */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {hasDiscount && (
            <Badge
              className="border-none bg-rose-500 hover:bg-rose-600 text-white shadow-sm px-3 py-1 font-bold tracking-wide"
            >
              {discountPercentage}% {t("off", "reducere")}
            </Badge>
          )}
          {totalSold > 0 && (
            <Badge
              variant="secondary"
              className="bg-slate-100 text-slate-700 border border-slate-200 shadow-sm"
            >
              {totalSold} {t("sold", "vândute")}
            </Badge>
          )}
        </div>
        <div
          className={`${size === "sm" ? "text-xs" : "text-sm"} font-medium`}
        >
          {stockQuantity > 0 ? (
            <span className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              {t("inStock", "În stoc")}
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-100">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
              {t("outOfStock", "Stoc epuizat")}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function RatingBadge({
  averageRating,
  displayRating,
  reviewCount,
  size,
}: {
  averageRating: number;
  displayRating: string;
  reviewCount: number;
  size: "sm" | "md";
}) {
  return (
    <div
      className={`flex w-full flex-wrap items-center justify-between gap-1.5 rounded-full border border-slate-100 bg-white px-3 py-1.5 text-slate-900 shadow-sm transition sm:w-auto sm:flex-nowrap sm:justify-start`}
    >
      <div className="flex items-center gap-0.5">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`${size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"} ${i < Math.round(averageRating)
                ? "text-amber-400 fill-current"
                : "text-slate-200 fill-slate-200"
              }`}
          />
        ))}
      </div>
      <div className="flex items-baseline gap-1.5 ml-1">
        <span
          className={`font-bold ${size === "sm" ? "text-sm" : "text-base"
            } text-slate-900`}
        >
          {displayRating}
        </span>
        <span
          className={`${size === "sm" ? "text-xs" : "text-sm"} text-slate-500 font-medium`}
        >
          ({reviewCount})
        </span>
      </div>
    </div>
  );
}
