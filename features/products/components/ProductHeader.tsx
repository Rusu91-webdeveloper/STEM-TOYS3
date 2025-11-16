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
    <div className="space-y-4 text-slate-100">
      {/* Title and Action Buttons */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1 min-w-0">
          <h1
            className={
              size === "sm"
                ? "text-2xl font-bold leading-tight text-slate-100 sm:text-3xl"
                : "text-3xl font-bold leading-tight text-slate-100 xl:text-4xl"
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
                ? "text-3xl font-semibold text-emerald-300 sm:text-4xl"
                : "text-4xl font-semibold text-emerald-300 xl:text-5xl"
            }
          >
            {formatPrice(price)}
          </span>
          {hasDiscount && (
            <span
              className={
                size === "sm"
                  ? "text-sm sm:text-base text-slate-300/80 line-through"
                  : "text-base xl:text-lg text-slate-300/80 line-through"
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
              variant="destructive"
              className="border-none text-xs shadow-lg shadow-red-500/30"
            >
              {discountPercentage}% {t("off", "reducere")}
            </Badge>
          )}
          <Badge
            variant="secondary"
            className="border-white/20 bg-white/10 text-xs text-slate-100 shadow-lg shadow-indigo-500/20 hover:bg-white/20"
          >
            {totalSold} {t("sold", "vândute")}
          </Badge>
        </div>
        <div
          className={`${size === "sm" ? "text-xs" : "text-sm"} text-slate-300`}
        >
          {stockQuantity > 0 ? (
            <span className="text-emerald-300">
              {t("inStock", "În stoc")} ({stockQuantity})
            </span>
          ) : (
            <span className="text-rose-300">
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
      className={`flex w-full flex-wrap items-center justify-between gap-2 rounded-2xl border border-white/10 bg-slate-900/40 px-3 py-2 text-slate-50 backdrop-blur-sm shadow-inner shadow-black/30 transition sm:w-auto sm:flex-nowrap sm:justify-start`}
    >
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`${size === "sm" ? "h-3 w-3" : "h-4 w-4"} ${
              i < Math.round(averageRating)
                ? "text-yellow-400 fill-current drop-shadow"
                : "text-gray-400"
            }`}
          />
        ))}
      </div>
      <div className="flex items-baseline gap-2">
        <span
          className={`font-semibold ${
            size === "sm" ? "text-sm" : "text-base"
          } text-white`}
        >
          {displayRating}
        </span>
        <span
          className={`${size === "sm" ? "text-xs" : "text-sm"} text-slate-200`}
        >
          ({reviewCount})
        </span>
      </div>
    </div>
  );
}
