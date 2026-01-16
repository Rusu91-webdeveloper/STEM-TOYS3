"use client";

import { ShoppingCart, StarIcon } from "lucide-react";
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
  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isAddingToCart || product.stockQuantity === 0) return;

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

  // Use placeholder image if product image is missing
  const imageUrl =
    product.images && product.images.length > 0
      ? product.images[0]
      : "/placeholder-product.png";

  const isOutOfStock = product.stockQuantity === 0;
  const isLowStock = product.stockQuantity !== undefined && product.stockQuantity > 0 && product.stockQuantity < 4;

  if (layout === "list") {
    return (
      <div
        className={cn(
          "group relative flex flex-col xs:flex-row overflow-hidden rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300",
          className
        )}
      >
        <div className="relative z-10 w-full xs:w-2/5 sm:w-1/3 aspect-[4/3] xs:aspect-auto xs:h-auto overflow-hidden bg-slate-50">
          <Link href={`/products/${product.slug}`} className="block h-full w-full">
            <OptimizedProductImage
              src={imageUrl}
              alt={product.name}
              fill
              className="object-contain p-4 transition-transform duration-500 group-hover:scale-110"
              sizes="(max-width: 640px) 100vw, 300px"
              priority={priority}
            />
          </Link>

          {/* Badges - Floating over image */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-20">
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

            <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed">
              {product.description}
            </p>

            <div className="flex flex-wrap gap-2">
              {product.ageRange && (
                <div className="inline-flex items-center px-2 py-1 rounded-md bg-slate-50 border border-slate-100 text-xs font-medium text-slate-600">
                  Ages {product.ageRange}
                </div>
              )}
              {isLowStock && (
                <div className="inline-flex items-center px-2 py-1 rounded-md bg-amber-50 border border-amber-100 text-xs font-medium text-amber-700">
                  Only {product.stockQuantity} left
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
                  Add to Cart
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
        "group relative flex flex-col h-full bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden",
        className
      )}
    >
      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden bg-slate-50">
        <Link href={`/products/${product.slug}`} className="block w-full h-full">
          <div className="w-full h-full p-6 flex items-center justify-center">
            <OptimizedProductImage
              src={imageUrl}
              alt={product.name}
              fill
              className="object-contain transition-transform duration-500 group-hover:scale-110"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              priority={priority}
              quality={90}
            />
          </div>
        </Link>

        {/* Floating Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-20">
          {isOnSale && (
            <Badge className="bg-rose-500 text-white border-0 shadow-sm px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider backdrop-blur-md bg-opacity-95">
              -{discountPercentage}%
            </Badge>
          )}
          {isOutOfStock && (
            <Badge className="bg-slate-900 text-white border-0 shadow-sm px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider">
              Sold Out
            </Badge>
          )}
          {!isOutOfStock && isLowStock && (
            <Badge className="bg-amber-500 text-white border-0 shadow-sm px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider">
              Low Stock
            </Badge>
          )}
        </div>

        {/* Quick Add Overlay Button (Desktop) & Mobile Icon */}
        <div className="absolute bottom-3 right-3 z-20">
          <Button
            onClick={handleAddToCart}
            disabled={isAddingToCart || isOutOfStock}
            size="icon"
            className={cn(
              "h-10 w-10 rounded-full shadow-md transition-all duration-300 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 sm:flex hidden",
              justAdded ? "bg-emerald-500 hover:bg-emerald-600 text-white" : "bg-white hover:bg-slate-50 text-slate-900 hover:text-sky-600"
            )}
            title="Quick Add"
          >
            {isAddingToCart ? (
              <div className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
            ) : justAdded ? (
              <ShoppingCart className="h-4 w-4" />
            ) : (
              <ShoppingCart className="h-4 w-4" />
            )}
          </Button>

          {/* Always visible safe cart button for Mobile */}
          <Button
            onClick={handleAddToCart}
            disabled={isAddingToCart || isOutOfStock}
            size="icon"
            className={cn(
              "h-9 w-9 rounded-full shadow-sm sm:hidden flex",
              justAdded ? "bg-emerald-500 text-white" : "bg-white/90 backdrop-blur-sm text-slate-900 border border-slate-100"
            )}
          >
            {isAddingToCart ? (
              <div className="h-3.5 w-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
            ) : (
              <ShoppingCart className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-4 pt-5 gap-3">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            {categoryName && (
              <span className="text-[10px] font-bold tracking-wider text-sky-600 uppercase truncate">
                {categoryName}
              </span>
            )}
            {renderRating()}
          </div>

          <Link href={`/products/${product.slug}`} className="block group-hover:text-sky-600 transition-colors">
            <h3 className="font-bold text-base text-slate-900 leading-snug line-clamp-2 h-10">
              {product.name}
            </h3>
          </Link>
        </div>

        <div className="mt-auto flex items-center justify-between pt-2">
          <div className="flex flex-col">
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold text-slate-900">
                {formatPrice(product.price)}
              </span>
              {isOnSale && (
                <span className="text-xs text-slate-400 line-through font-medium">
                  {formatPrice(product.compareAtPrice!)}
                </span>
              )}
            </div>
          </div>

          {/* Add to Cart Text Button (Visible on hover desktop, always elsewhere if desired, but we have the icon) 
              Let's make this a subtle "View Details" or just keep it clean? 
              Actually, let's add a nice "Add" button that expands on hover or just a clean text button.
          */}
          {/* <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 px-2 text-xs font-medium text-slate-500 hover:text-sky-600 hover:bg-sky-50 -mr-2"
            onClick={handleAddToCart}
          >
            Add to Bag
          </Button> */}
        </div>
      </div>
    </div>
  );
}
