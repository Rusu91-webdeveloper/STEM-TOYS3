"use client";

import { Package, ShoppingCart, StarIcon } from "lucide-react";
import Link from "next/link";
import React, { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useShoppingCart } from "@/features/cart/hooks/useShoppingCart";
import { useCurrency } from "@/lib/currency";
import { cn } from "@/lib/utils";
import { Product } from "@/types/product";

import { OptimizedProductImage } from "./OptimizedProductImage";


interface ProductCardProps {
  product: Product;
  className?: string;
  imageHeight?: number;
  layout?: "grid" | "list";
  priority?: boolean; // Add priority prop for above-the-fold images
}

export function ProductCard({
  product,
  className,
  layout = "grid",
  priority = false, // Default to false, set to true for above-the-fold images
}: ProductCardProps) {
  // CRITICAL: All hooks must be called unconditionally at the top level
  const { formatPrice } = useCurrency();
  const { addItem } = useShoppingCart();
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  // Validate product exists - but only after all hooks are called
  if (!product || !product.id) {
    return null;
  }

  // Non-hook code after all hooks
  const isOnSale =
    product.compareAtPrice && product.compareAtPrice > product.price;
  const stockQuantity = Math.max(0, product.stockQuantity ?? 0);
  const isBundle = product.isBundle === true;
  const bundleItemsCount = Array.isArray(product.bundleItems)
    ? product.bundleItems.length
    : 0;
  const savingsAmount =
    isOnSale && product.compareAtPrice
      ? Math.max(0, product.compareAtPrice - product.price)
      : 0;

  // Render star rating - compact for mobile
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
                i < Math.floor(product.rating || 0)
                  ? "fill-current"
                  : "text-slate-200 fill-slate-200"
              )}
            />
          ))}
        </div>
        {product.reviewCount && (
          <span className="text-[10px] font-medium text-slate-400">
            ({product.reviewCount})
          </span>
        )}
      </div>
    );
  };

  // Detect if this is a book by checking for book-specific attributes or explicit flag
  const isBook = Boolean(
    product.isBook ||
    product.attributes?.author ||
    product.tags?.includes("book") ||
    (product.category as any)?.slug === "educational-books" ||
    (product.category as any)?.name === "Educational Books"
  );

  // Handle add to cart on image click
  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isAddingToCart || stockQuantity <= 0) return;

    setIsAddingToCart(true);

    try {
      const item = {
        productId: product.id,
        name: product.name,
        price: product.price,
        image: product.images[0],
        quantity: 1,
        isBook,
        slug: product.slug,
      };

      addItem(item, 1);
      setJustAdded(true);
      setTimeout(() => {
        setJustAdded(false);
        setIsAddingToCart(false);
      }, 1500);
    } catch (error) {
      console.error("Error adding to cart:", error);
      setIsAddingToCart(false);
    }
  };

  // Get category name for display
  const categoryName = product.stemDiscipline
    ? product.stemDiscipline
    : (product.category as any)?.name || (product.category as any)?.slug;

  // Calculate discount percentage
  const discountPercentage = isOnSale && product.compareAtPrice
    ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
    : 0;
  const bundleDiscount =
    typeof product.bundleDiscount === "number" &&
    Number.isFinite(product.bundleDiscount)
      ? Math.max(0, Math.round(product.bundleDiscount))
      : discountPercentage;

  // Use placeholder image if product image is missing
  const imageUrl =
    product.images && product.images.length > 0
      ? product.images[0]
      : "/placeholder-product.png";

  const isOutOfStock = stockQuantity <= 0;
  const isLowStock = stockQuantity > 0 && stockQuantity < 4;

  if (layout === "list") {
    return (
      <div
        className={cn(
          "group relative flex flex-col xs:flex-row overflow-hidden rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300",
          isBundle &&
            "border-cyan-300/70 ring-2 ring-cyan-200/70 bg-gradient-to-br from-cyan-50 via-white to-indigo-50/60",
          className
        )}
      >
        <div className="relative z-10 w-full xs:w-2/5 sm:w-1/3 aspect-[5/4] xs:aspect-auto min-h-[220px] xs:min-h-0 overflow-hidden bg-slate-50">
          <Link href={`/products/${product.slug}`} className="block h-full w-full">
            <OptimizedProductImage
              src={imageUrl}
              alt={product.name}
              fill
              className="object-contain p-3 sm:p-4 transition-transform duration-500 group-hover:scale-110"
              sizes="(max-width: 640px) 100vw, (max-width: 768px) 44vw, 320px"
              priority={priority}
            />
          </Link>

          {/* Badges - Floating over image */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-20">
            {isBundle && (
              <Badge className="bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-700 hover:to-sky-700 text-white border-0 shadow-sm px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                <Package className="h-3 w-3 mr-1" />
                Bundle Deal
              </Badge>
            )}
            {isOnSale && (
              <Badge className="bg-rose-500 hover:bg-rose-600 text-white border-0 shadow-sm px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                -{discountPercentage}%
              </Badge>
            )}
            {isOutOfStock && (
              <Badge className="bg-slate-900 text-white border-0 shadow-sm px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                Sold Out
              </Badge>
            )}
          </div>
          {isBundle && bundleItemsCount > 0 && (
            <div className="absolute top-3 right-3 z-20 rounded-md bg-slate-900/85 px-2 py-1 text-[10px] font-semibold text-white shadow-sm">
              {bundleItemsCount} items
            </div>
          )}
        </div>

        <div className="flex flex-col flex-1 p-4 sm:p-6 justify-between">
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                {categoryName && (
                  <span className="text-[10px] font-bold tracking-wider text-sky-600 uppercase">
                    {categoryName}
                  </span>
                )}
                <Link href={`/products/${product.slug}`} className="block group-hover:text-sky-600 transition-colors">
                  <h3 className="font-bold text-lg text-slate-900 leading-tight line-clamp-2">
                    {product.name}
                  </h3>
                </Link>
              </div>
              {renderRating()}
            </div>

            <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">
              {product.description}
            </p>

            {isBundle && (
              <div className="rounded-lg border border-cyan-200 bg-cyan-50/80 px-3 py-2 flex items-center justify-between gap-2">
                <span className="inline-flex items-center text-xs font-semibold text-cyan-800">
                  <Package className="h-3.5 w-3.5 mr-1.5" />
                  Curated STEM Bundle
                </span>
                {bundleDiscount > 0 && (
                  <span className="text-xs font-bold text-emerald-700">
                    -{bundleDiscount}% OFF
                  </span>
                )}
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {isBundle && bundleItemsCount > 0 && (
                <div className="inline-flex items-center px-2 py-1 rounded-md bg-cyan-50 border border-cyan-100 text-xs font-medium text-cyan-700">
                  {bundleItemsCount} items included
                </div>
              )}
              {product.ageRange && (
                <div className="inline-flex items-center px-2 py-1 rounded-md bg-slate-50 border border-slate-100 text-xs font-medium text-slate-600">
                  Ages {product.ageRange}
                </div>
              )}
              {isLowStock && (
                <div className="inline-flex items-center px-2 py-1 rounded-md bg-amber-50 border border-amber-100 text-xs font-medium text-amber-700">
                  Only {stockQuantity} left
                </div>
              )}
            </div>
          </div>

          <div className="mt-5 flex items-end justify-between gap-4 pt-4 border-t border-slate-50">
            <div className="space-y-0.5">
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold text-slate-900">
                  {formatPrice(product.price)}
                </span>
                {isOnSale && (
                  <span className="text-sm text-slate-400 line-through font-medium">
                    {formatPrice(product.compareAtPrice!)}
                  </span>
                )}
              </div>
              {isBundle && savingsAmount > 0 && (
                <p className="text-xs font-medium text-emerald-600">
                  Save {formatPrice(savingsAmount)}
                </p>
              )}
              {/* Optional: Add unit text if needed, e.g. "per item" */}
            </div>

            <Button
              onClick={handleAddToCart}
              disabled={isAddingToCart || isOutOfStock}
              className={cn(
                "px-6 shadow-sm transition-all duration-300",
                isAddingToCart
                  ? "bg-slate-100 text-slate-400"
                  : justAdded
                    ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                    : isBundle
                      ? "bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-700 hover:to-sky-700 text-white hover:shadow-md"
                      : "bg-slate-900 hover:bg-slate-800 text-white hover:shadow-md"
              )}
              size="sm"
            >
              {isAddingToCart ? (
                <span className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full border-2 border-current border-t-transparent animate-spin" />
                  Adding...
                </span>
              ) : justAdded ? (
                <span className="flex items-center gap-2 font-medium">
                  <ShoppingCart className="h-4 w-4" /> Added
                </span>
              ) : isOutOfStock ? (
                "Out of Stock"
              ) : (
                <span className="flex items-center gap-2 font-medium">
                  {isBundle ? "Add Bundle" : "Add to Cart"}
                </span>
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Modern Grid Layout - "Stunning E-commerce"
  return (
    <div
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_12px_32px_-24px_rgba(15,23,42,0.35)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_38px_-24px_rgba(15,23,42,0.45)]",
        isBundle && "border-cyan-200",
        className
      )}
    >
      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden border-b border-slate-100 bg-white">
        <Link href={`/products/${product.slug}`} className="block w-full h-full">
          <div className="flex h-full w-full items-center justify-center p-4 sm:p-5">
            <OptimizedProductImage
              src={imageUrl}
              alt={product.name}
              fill
              className="object-contain transition-transform duration-500 group-hover:scale-[1.03]"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              priority={priority}
              quality={90}
            />
          </div>
        </Link>

        {/* Floating Badges */}
        <div className="absolute left-2.5 top-2.5 z-20 flex flex-col gap-1.5">
          {isBundle && (
            <Badge className="border border-cyan-200 bg-cyan-50 text-cyan-800 shadow-none px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
              <Package className="h-3 w-3 mr-1" />
              Bundle
            </Badge>
          )}
          {isOnSale && (
            <Badge className="border-0 bg-rose-600 text-white shadow-sm px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
              -{discountPercentage}%
            </Badge>
          )}
          {isOutOfStock && (
            <Badge className="border-0 bg-slate-900 text-white shadow-sm px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
              Sold Out
            </Badge>
          )}
          {!isOutOfStock && isLowStock && (
            <Badge className="border-0 bg-amber-500 text-white shadow-sm px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
              Low Stock
            </Badge>
          )}
        </div>
        {isBundle && bundleItemsCount > 0 && (
          <div className="absolute right-2.5 top-2.5 z-20 rounded-full border border-white/80 bg-white/95 px-2 py-0.5 text-[10px] font-semibold text-slate-700 shadow-sm">
            {bundleItemsCount} items
          </div>
        )}

        {/* Quick Add Overlay Button (Desktop) & Mobile Icon */}
        <div className="absolute bottom-3 right-3 z-20">
          <Button
            onClick={handleAddToCart}
            disabled={isAddingToCart || isOutOfStock}
            size="icon"
            className={cn(
              "hidden h-9 w-9 rounded-full border border-slate-200 bg-white text-slate-900 shadow-sm transition-all duration-300 opacity-0 group-hover:opacity-100 hover:bg-slate-900 hover:text-white sm:flex",
              justAdded
                ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                : isBundle && "hover:border-cyan-600 hover:bg-cyan-600"
            )}
            title={isBundle ? "Quick Add Bundle" : "Quick Add"}
          >
            {isAddingToCart ? (
              <div className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
            ) : justAdded ? (
              <ShoppingCart className="h-4 w-4" />
            ) : (
              <ShoppingCart className="h-4 w-4" />
            )}
          </Button>

          {/* Always visible cart button for Mobile — colored for visibility */}
          <Button
            onClick={handleAddToCart}
            disabled={isAddingToCart || isOutOfStock}
            size="icon"
            className={cn(
              "flex h-9 w-9 rounded-full shadow-md sm:hidden transition-all duration-200",
              justAdded
                ? "bg-emerald-500 text-white border-0"
                : isOutOfStock
                  ? "bg-slate-200 text-slate-400 border-0"
                  : isBundle
                    ? "bg-gradient-to-br from-cyan-600 to-sky-600 text-white border-0"
                    : "bg-slate-900 text-white border-0 hover:bg-sky-700"
            )}
          >
            {isAddingToCart ? (
              <div className="h-3.5 w-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
            ) : justAdded ? (
              <ShoppingCart className="h-4 w-4" />
            ) : (
              <ShoppingCart className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-3 p-3.5 sm:p-4">
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-2">
            {categoryName && (
              <span className="truncate text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                {categoryName}
              </span>
            )}
            {renderRating()}
          </div>

          <Link
            href={`/products/${product.slug}`}
            className="block transition-colors group-hover:text-slate-700"
          >
            <h3 className="line-clamp-2 min-h-[2.5rem] text-sm sm:text-base font-semibold leading-snug text-slate-900">
              {product.name}
            </h3>
          </Link>
          {isBundle && bundleDiscount > 0 && (
            <p className="text-[11px] font-medium text-cyan-700">
              Curated bundle · -{bundleDiscount}% discount
            </p>
          )}
          {isBundle && bundleItemsCount > 0 && (
            <p className="text-[11px] text-slate-500">
              {bundleItemsCount} items included
            </p>
          )}
        </div>

        <div className="mt-auto border-t border-slate-100 pt-2.5 space-y-2">
          <div className="flex items-baseline gap-2">
            <span className="text-base sm:text-lg font-semibold text-slate-900">
              {formatPrice(product.price)}
            </span>
            {isOnSale && (
              <span className="text-[11px] font-medium text-slate-400 line-through">
                {formatPrice(product.compareAtPrice!)}
              </span>
            )}
            {isBundle && savingsAmount > 0 && (
              <span className="text-[11px] font-medium text-emerald-600 ml-auto">
                Save {formatPrice(savingsAmount)}
              </span>
            )}
          </div>

          <Button
            onClick={handleAddToCart}
            disabled={isAddingToCart || isOutOfStock}
            size="sm"
            className={cn(
              "w-full h-9 text-xs font-semibold rounded-xl transition-all duration-200 shadow-sm",
              justAdded
                ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                : isOutOfStock
                  ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                  : isBundle
                    ? "bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-700 hover:to-sky-700 text-white hover:shadow-md"
                    : "bg-slate-900 hover:bg-sky-700 text-white hover:shadow-md"
            )}
          >
            {isAddingToCart ? (
              <span className="flex items-center justify-center gap-1.5">
                <div className="h-3.5 w-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                Adding...
              </span>
            ) : justAdded ? (
              <span className="flex items-center justify-center gap-1.5">
                <ShoppingCart className="h-3.5 w-3.5" /> Added!
              </span>
            ) : isOutOfStock ? (
              "Out of Stock"
            ) : (
              <span className="flex items-center justify-center gap-1.5">
                <ShoppingCart className="h-3.5 w-3.5" />
                {isBundle ? "Add Bundle" : "Add to Cart"}
              </span>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
