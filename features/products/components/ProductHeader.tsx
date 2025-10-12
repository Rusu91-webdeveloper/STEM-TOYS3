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

  return (
    <div className="space-y-3">
      {/* Title and Action Buttons */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h1
            className={
              size === "sm"
                ? "text-lg sm:text-xl font-bold text-gray-900 leading-tight"
                : "text-xl xl:text-2xl font-bold text-gray-900 leading-tight"
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
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-baseline space-x-2">
          <span
            className={
              size === "sm"
                ? "text-xl sm:text-2xl font-bold text-gray-900"
                : "text-2xl xl:text-3xl font-bold text-gray-900"
            }
          >
            {formatPrice(price)}
          </span>
          {hasDiscount && (
            <span
              className={
                size === "sm"
                  ? "text-sm sm:text-base text-gray-500 line-through"
                  : "text-base xl:text-lg text-gray-500 line-through"
              }
            >
              {formatPrice(compareAtPrice)}
            </span>
          )}
        </div>
        <div className="flex items-center space-x-1">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`${size === "sm" ? "h-3 w-3" : "h-4 w-4"} ${
                i < Math.floor(averageRating)
                  ? "text-yellow-400 fill-current"
                  : "text-gray-300"
              }`}
            />
          ))}
          <span
            className={`${
              size === "sm" ? "text-xs" : "text-sm"
            } text-gray-600 ml-1`}
          >
            ({reviewCount})
          </span>
        </div>
      </div>

      {/* Discount Badge and Stock Status Row */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {hasDiscount && (
            <Badge variant="destructive" className="text-xs">
              {discountPercentage}% {t("off", "reducere")}
            </Badge>
          )}
          <Badge variant="secondary" className="text-xs">
            {totalSold} {t("sold", "vândute")}
          </Badge>
        </div>
        <div
          className={`${size === "sm" ? "text-xs" : "text-sm"} text-gray-600`}
        >
          {stockQuantity > 0 ? (
            <span className="text-green-600">
              {t("inStock", "În stoc")} ({stockQuantity})
            </span>
          ) : (
            <span className="text-red-600">
              {t("outOfStock", "Stoc epuizat")}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
