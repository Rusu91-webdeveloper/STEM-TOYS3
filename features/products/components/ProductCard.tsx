"use client";

import { Heart, Package, ShoppingCart, StarIcon } from "lucide-react";
import Link from "next/link";
import React, { useState } from "react";

import { Button } from "@/components/ui/button";
import { useShoppingCart } from "@/features/cart/hooks/useShoppingCart";
import { useCurrency } from "@/lib/currency";
import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Product } from "@/types/product";

import { OptimizedProductImage } from "./OptimizedProductImage";

interface ProductCardProps {
  product: Product;
  className?: string;
  imageHeight?: number;
  layout?: "grid" | "list";
  priority?: boolean;
}

export function ProductCard({
  product,
  className,
  layout = "grid",
  priority = false,
}: ProductCardProps) {
  const { formatPrice } = useCurrency();
  const { t } = useTranslation();
  const { addItem } = useShoppingCart();
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  if (!product || !product.id) return null;

  const isOnSale = product.compareAtPrice && product.compareAtPrice > product.price;
  const stockQuantity = Math.max(0, product.stockQuantity ?? 0);
  const isBundle = product.isBundle === true;
  const bundleItemsCount = Array.isArray(product.bundleItems) ? product.bundleItems.length : 0;
  const savingsAmount =
    isOnSale && product.compareAtPrice
      ? Math.max(0, product.compareAtPrice - product.price)
      : 0;
  const discountPercentage =
    isOnSale && product.compareAtPrice
      ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
      : 0;
  const bundleDiscount =
    typeof product.bundleDiscount === "number" && Number.isFinite(product.bundleDiscount)
      ? Math.max(0, Math.round(product.bundleDiscount))
      : discountPercentage;

  const isOutOfStock = stockQuantity <= 0;
  const isLowStock = stockQuantity > 0 && stockQuantity < 4;

  const imageUrl =
    product.images && product.images.length > 0
      ? product.images[0]
      : "/placeholder-product.png";

  const isBook = Boolean(
    product.isBook ||
      product.attributes?.author ||
      product.tags?.includes("book") ||
      (product.category as any)?.slug === "educational-books" ||
      (product.category as any)?.name === "Educational Books"
  );

  const categoryName = product.stemDiscipline
    ? product.stemDiscipline
    : (product.category as any)?.name || (product.category as any)?.slug;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isAddingToCart || stockQuantity <= 0) return;

    setIsAddingToCart(true);
    try {
      addItem(
        {
          productId: product.id,
          name: product.name,
          price: product.price,
          image: product.images[0],
          quantity: 1,
          stockQuantity,
          isBook,
          slug: product.slug,
        },
        1
      );
      setJustAdded(true);
      setTimeout(() => {
        setJustAdded(false);
        setIsAddingToCart(false);
      }, 1500);
    } catch {
      setIsAddingToCart(false);
    }
  };

  const renderRating = () => {
    if (!product.rating) return null;
    return (
      <div className="flex items-center gap-1">
        <div className="flex text-amber-400">
          {[...Array(5)].map((_, i) => (
            <StarIcon
              key={i}
              className={cn(
                "h-3 w-3",
                i < Math.floor(product.rating || 0) ? "fill-current" : "text-slate-200 fill-slate-200"
              )}
            />
          ))}
        </div>
        {product.reviewCount && (
          <span className="text-[10px] text-slate-400">({product.reviewCount})</span>
        )}
      </div>
    );
  };

  if (layout === "list") {
    return (
      <div
        className={cn(
          "group relative flex flex-col xs:flex-row overflow-hidden rounded-xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300",
          isBundle && "border-cyan-200",
          className
        )}
      >
        <div className="relative w-full xs:w-2/5 sm:w-1/3 aspect-[5/4] xs:aspect-auto min-h-[200px] xs:min-h-0 overflow-hidden bg-slate-50">
          <Link href={`/products/${product.slug}`} className="block h-full w-full">
            <OptimizedProductImage
              src={imageUrl}
              alt={product.name}
              fill
              className="object-contain p-3 sm:p-4 transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 768px) 44vw, 320px"
              priority={priority}
            />
          </Link>
          <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 z-20">
            {isOnSale && (
              <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                -{discountPercentage}%
              </span>
            )}
            {isOutOfStock && (
              <span className="bg-slate-900 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                {t("outOfStock", "Out of Stock")}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col flex-1 p-4 sm:p-5 justify-between">
          <div className="space-y-2">
            {categoryName && (
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                {categoryName}
              </span>
            )}
            <Link href={`/products/${product.slug}`} className="block hover:text-slate-700 transition-colors">
              <h3 className="font-semibold text-base text-slate-900 leading-tight line-clamp-2">
                {product.name}
              </h3>
            </Link>
            {renderRating()}
            <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed">
              {product.description}
            </p>
          </div>

          <div className="mt-4 flex items-end justify-between gap-4 pt-3 border-t border-slate-50">
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-bold text-[#2563EB]">
                  {formatPrice(product.price)}
                </span>
                {isOnSale && (
                  <span className="text-sm text-slate-400 line-through">
                    {formatPrice(product.compareAtPrice!)}
                  </span>
                )}
              </div>
              {isBundle && savingsAmount > 0 && (
                <p className="text-xs font-medium text-emerald-600">
                  Economisești {formatPrice(savingsAmount)}
                </p>
              )}
            </div>

            <Button
              onClick={handleAddToCart}
              disabled={isAddingToCart || isOutOfStock}
              size="sm"
              className={cn(
                "px-5 transition-all duration-300",
                justAdded
                  ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                  : isOutOfStock
                    ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                    : isBundle
                      ? "bg-[#2563EB] hover:bg-blue-700 text-white"
                      : "bg-slate-900 hover:bg-[#2563EB] text-white"
              )}
            >
              {isAddingToCart ? (
                <div className="h-3 w-3 rounded-full border-2 border-current border-t-transparent animate-spin" />
              ) : justAdded ? (
                <span className="flex items-center gap-1.5">
                  <ShoppingCart className="h-3.5 w-3.5" />
                  Adăugat!
                </span>
              ) : isOutOfStock ? (
                t("outOfStock", "Stoc epuizat")
              ) : (
                <span className="flex items-center gap-1.5">
                  <ShoppingCart className="h-3.5 w-3.5" />
                  {isBundle ? t("addBundleToCart", "Add Bundle") : t("addToCart", "Adaugă în Coș")}
                </span>
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Grid Layout — clean card matching screenshot
  return (
    <div
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm hover:shadow-md transition-all duration-300",
        isBundle && "border-cyan-200",
        className
      )}
    >
      {/* Image area */}
      <div className="relative aspect-square overflow-hidden bg-white">
        <Link href={`/products/${product.slug}`} className="block w-full h-full">
          <OptimizedProductImage
            src={imageUrl}
            alt={product.name}
            fill
            className="object-contain p-3 sm:p-4 transition-transform duration-500 group-hover:scale-[1.04]"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            priority={priority}
            quality={88}
          />
        </Link>

        {/* Badge overlays — top left */}
        <div className="absolute left-2.5 top-2.5 z-20 flex flex-col gap-1.5">
          {isBundle && (
            <span className="inline-flex items-center gap-1 bg-cyan-50 border border-cyan-200 text-cyan-800 text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-md">
              <Package className="h-2.5 w-2.5" />
              Bundle
            </span>
          )}
          {isOnSale && (
            <span className="bg-rose-500 text-white text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-md">
              SALE -{discountPercentage}%
            </span>
          )}
          {!isOnSale && !isBundle && product.featured && (
            <span className="bg-slate-900 text-white text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-md">
              NOU
            </span>
          )}
          {isLowStock && !isOutOfStock && (
            <span className="bg-amber-400 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md">
              Stoc limitat
            </span>
          )}
          {isOutOfStock && (
            <span className="bg-slate-900 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md">
              {t("outOfStock", "Stoc epuizat")}
            </span>
          )}
        </div>

        {/* Wishlist / heart button — top right */}
        <button
          type="button"
          aria-label="Adaugă la favorite"
          className="absolute right-2.5 top-2.5 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 border border-slate-100 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:text-rose-500 hover:border-rose-100 shadow-sm"
        >
          <Heart className="h-4 w-4" />
        </button>

        {/* Add to cart overlay — appears on hover at bottom of image */}
        {!isOutOfStock && (
          <div className="absolute inset-x-0 bottom-0 z-20 translate-y-full group-hover:translate-y-0 transition-transform duration-200">
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={isAddingToCart}
              className={cn(
                "flex w-full items-center justify-center gap-2 py-2.5 text-sm font-semibold transition-colors",
                justAdded
                  ? "bg-emerald-500 text-white"
                  : isBundle
                    ? "bg-[#2563EB] text-white hover:bg-blue-700"
                    : "bg-slate-900 text-white hover:bg-[#2563EB]"
              )}
            >
              {isAddingToCart ? (
                <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              ) : justAdded ? (
                <>
                  <ShoppingCart className="h-4 w-4" />
                  Adăugat!
                </>
              ) : (
                <>
                  <ShoppingCart className="h-4 w-4" />
                  {isBundle ? t("addBundleToCart", "Add Bundle") : t("addToCart", "Adaugă în Coș")}
                </>
              )}
            </button>
          </div>
        )}

        {/* Mobile: always-visible cart button */}
        {!isOutOfStock && (
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={isAddingToCart}
            aria-label={t("addToCart", "Adaugă în Coș")}
            className={cn(
              "sm:hidden absolute bottom-2 right-2 z-20 flex h-8 w-8 items-center justify-center rounded-full shadow-md transition-all duration-200",
              justAdded
                ? "bg-emerald-500 text-white"
                : isBundle
                  ? "bg-[#2563EB] text-white"
                  : "bg-slate-900 text-white"
            )}
          >
            {isAddingToCart ? (
              <div className="h-3.5 w-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
            ) : (
              <ShoppingCart className="h-3.5 w-3.5" />
            )}
          </button>
        )}
      </div>

      {/* Product info */}
      <div className="flex flex-1 flex-col gap-1.5 p-3 sm:p-3.5">
        {/* Rating */}
        {product.rating ? (
          <div className="flex items-center gap-1 mt-0.5">
            {renderRating()}
          </div>
        ) : null}

        {/* Name */}
        <Link
          href={`/products/${product.slug}`}
          className="block transition-colors hover:text-slate-700"
        >
          <h3 className="line-clamp-2 text-xs sm:text-sm font-semibold leading-snug text-slate-900">
            {product.name}
          </h3>
        </Link>

        {/* Description */}
        <p className="line-clamp-2 text-[11px] sm:text-xs text-slate-500 leading-relaxed">
          {product.description}
        </p>

        {/* Price */}
        <div className="mt-auto pt-1.5 flex items-baseline gap-1.5">
          <span className="text-sm sm:text-base font-bold text-[#2563EB]">
            {formatPrice(product.price)}
          </span>
          {isOnSale && (
            <span className="text-[11px] text-slate-400 line-through">
              {formatPrice(product.compareAtPrice!)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
