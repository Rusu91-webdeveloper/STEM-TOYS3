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
import { productsGlassCardClass } from "./productsTheme";

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
  // imageHeight = 280,
  layout = "grid",
  priority = false, // Default to false, set to true for above-the-fold images
}: ProductCardProps) {
  // CRITICAL: All hooks must be called unconditionally at the top level
  // Do not add any early returns or conditional logic before all hooks are called
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
  // For proper SSR hydration when getting window dimensions
  // const [screenWidth, setScreenWidth] = useState(0);

  // useEffect(() => {
  //   // Set dimensions after mount to prevent hydration mismatch
  //   setScreenWidth(window.innerWidth);

  //   const handleResize = () => {
  //     setScreenWidth(window.innerWidth);
  //   };

  //   window.addEventListener("resize", handleResize);
  //   return () => window.removeEventListener("resize", handleResize);
  // }, []);

  // Calculate appropriate image height based on screen size
  // const calculatedHeight = screenWidth
  //   ? Math.min(imageHeight, screenWidth < 640 ? 200 : imageHeight)
  //   : imageHeight;

  // Render star rating - compact for mobile
  const renderRating = () => {
    if (!product.rating) return null;

    return (
      <div className="flex items-center space-x-0.5 sm:space-x-1">
        <div className="flex">
          {[...Array(5)].map((_, i) => (
            <StarIcon
              key={i}
              className={cn(
                "h-3 w-3 sm:h-4 sm:w-4",
                i < Math.floor(product.rating || 0)
                  ? "text-yellow-400 fill-yellow-400"
                  : "text-gray-300"
              )}
            />
          ))}
        </div>
        {product.reviewCount && (
          <span className="text-[9px] sm:text-xs text-slate-500">
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
  const handleImageAddToCart = async (e: React.MouseEvent) => {
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

  if (layout === "list") {
    return (
      <div
        className={cn(
          `${productsGlassCardClass} relative flex flex-col xs:flex-row overflow-hidden transition-all duration-200 group`,
          className
        )}
      >
        <div className="relative z-10 w-full xs:w-1/3 h-48 xs:h-48 sm:h-56 xs:max-w-[240px] overflow-hidden bg-slate-50/80 border-r border-slate-100">
          <button
            onClick={handleImageAddToCart}
            disabled={isAddingToCart || product.stockQuantity === 0}
            className="group/image block h-full w-full relative cursor-pointer disabled:cursor-not-allowed"
          >
            <div className="relative z-10 flex h-full w-full items-center justify-center p-4">
              <OptimizedProductImage
                src={imageUrl}
                alt={product.name}
                fill
                className="object-contain object-center transition-transform duration-300 group-hover/image:scale-105"
                sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 240px"
                priority={priority}
                quality={85}
                placeholder="blur"
              />
            </div>
            
            {/* Hover overlay */}
            <div className="absolute inset-0 bg-slate-900/35 opacity-0 group-hover/image:opacity-100 transition-opacity duration-200 flex items-center justify-center z-20">
              {isAddingToCart ? (
                <div className="bg-white rounded-lg px-3 py-1.5 text-xs font-medium text-slate-900">
                  Adding...
                </div>
              ) : justAdded ? (
                <div className="bg-green-500 rounded-lg px-3 py-1.5 text-xs font-medium text-white">
                  Added!
                </div>
              ) : product.stockQuantity === 0 ? (
                <div className="bg-slate-500 rounded-lg px-3 py-1.5 text-xs font-medium text-white">
                  Out of Stock
                </div>
              ) : (
                <div className="bg-white rounded-lg px-3 py-1.5 text-xs font-medium text-slate-900 flex items-center gap-1.5">
                  <ShoppingCart className="h-3.5 w-3.5" />
                  Add to Cart
                </div>
              )}
            </div>
          </button>
        </div>
        <div className="relative z-10 flex flex-col flex-1 p-4 sm:p-5 justify-between">
          <div className="space-y-2.5">
            <Link href={`/products/${product.slug}`} className="block">
                <h3 className="font-semibold text-base sm:text-lg line-clamp-2 text-slate-900 transition-colors leading-tight hover:text-sky-700">
                {product.name}
              </h3>
            </Link>

            {/* Category badge under title */}
            {categoryName && (
              <Badge
                  className="w-fit capitalize text-xs px-2 py-0.5 bg-sky-50 text-sky-700 border border-sky-100 rounded-md font-medium"
                variant="outline"
              >
                {categoryName}
              </Badge>
            )}

            <div className="flex flex-wrap items-center gap-1.5">
              {product.ageRange && (
                <div className="bg-emerald-50 text-emerald-700 text-xs px-2 py-0.5 rounded-md font-medium border border-emerald-200">
                  Ages: {product.ageRange}
                </div>
              )}

              {product.stockQuantity !== undefined &&
                product.stockQuantity === 0 && (
                  <div className="bg-red-50 text-red-700 text-xs px-2 py-0.5 rounded-md font-medium border border-red-200 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                    Out of stock
                  </div>
                )}

              {product.stockQuantity !== undefined &&
                product.stockQuantity > 0 &&
                product.stockQuantity < 4 && (
                  <div className="bg-amber-50 text-amber-700 text-xs px-2 py-0.5 rounded-md font-medium border border-amber-200">
                    Only {product.stockQuantity} left
                  </div>
                )}

              {renderRating()}
            </div>

            <p className="text-sm line-clamp-2 text-slate-600 leading-relaxed">
              {product.description}
            </p>
          </div>
          <div className="mt-4 space-y-3">
            <div className="flex items-baseline gap-2 flex-wrap">
              <div className="text-xl font-bold text-slate-900">
                {formatPrice(product.price)}
              </div>
              {isOnSale && product.compareAtPrice && (
                <>
                  <div className="text-sm text-slate-500 line-through">
                    {formatPrice(product.compareAtPrice)}
                  </div>
                  <Badge className="bg-red-500 text-white text-xs px-2 py-0.5">
                    -{discountPercentage}%
                  </Badge>
                </>
              )}
            </div>
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <Button
                onClick={handleImageAddToCart}
                disabled={isAddingToCart || product.stockQuantity === 0}
                className="w-full bg-sky-600 hover:bg-sky-700 text-white shadow-sm"
                size="sm"
              >
                {isAddingToCart ? (
                  "Adding..."
                ) : justAdded ? (
                  "Added!"
                ) : product.stockQuantity === 0 ? (
                  "Out of Stock"
                ) : (
                  <>
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Add to Cart
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default grid layout - Modern e-commerce design
  return (
    <div
      className={cn(
        `${productsGlassCardClass} relative group overflow-hidden h-full flex flex-col transition-all duration-200 hover:shadow-lg`,
        className
      )}
    >
      {/* Image container - clickable to add to cart */}
      <div className="relative z-10 overflow-hidden aspect-[3/2] sm:aspect-square bg-slate-50/80 border-b border-slate-100">
        <button
          onClick={handleImageAddToCart}
          disabled={isAddingToCart || product.stockQuantity === 0}
          className="group/image block h-full w-full relative cursor-pointer disabled:cursor-not-allowed"
        >
          <div className="relative z-10 flex h-full w-full items-center justify-center p-4 sm:p-6">
            <OptimizedProductImage
              src={imageUrl}
              alt={product.name}
              fill
              className="object-contain object-center transition-transform duration-300 group-hover/image:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              priority={priority}
              quality={90}
              placeholder="blur"
            />
          </div>
          
          {/* Hover overlay with add to cart button */}
          <div className="absolute inset-0 bg-slate-900/35 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center z-20">
            {isAddingToCart ? (
              <div className="bg-white rounded-lg px-4 py-2 text-sm font-medium text-slate-900">
                Adding...
              </div>
            ) : justAdded ? (
              <div className="bg-green-500 rounded-lg px-4 py-2 text-sm font-medium text-white">
                Added!
              </div>
            ) : product.stockQuantity === 0 ? (
              <div className="bg-slate-500 rounded-lg px-4 py-2 text-sm font-medium text-white">
                Out of Stock
              </div>
            ) : (
              <div className="bg-white rounded-lg px-4 py-2 text-sm font-medium text-slate-900 flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" />
                Add to Cart
              </div>
            )}
          </div>
        </button>
      </div>

      {/* Content section with clean spacing */}
      <div className="relative z-10 flex flex-col flex-1 p-4 space-y-2">
        {/* Title as link */}
        <Link href={`/products/${product.slug}`} className="block">
          <h3 className="font-semibold text-sm leading-tight line-clamp-2 text-slate-900 transition-colors hover:text-sky-700">
            {product.name}
          </h3>
        </Link>

        {/* Category badge under title */}
        {categoryName && (
          <Badge
            className="w-fit capitalize text-xs px-2 py-0.5 bg-sky-50 text-sky-700 border border-sky-100 rounded-md font-medium"
            variant="outline"
          >
            {categoryName}
          </Badge>
        )}

        {/* Low stock banner - only show if quantity < 4 */}
        {product.stockQuantity !== undefined &&
          product.stockQuantity > 0 &&
          product.stockQuantity < 4 && (
            <div className="rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1 text-amber-700 text-xs font-medium">
              Only{" "}
              <span className="font-semibold">{product.stockQuantity}</span>{" "}
              {product.stockQuantity === 1 ? "item" : "items"} left
            </div>
          )}

        {/* Badges section */}
        <div className="flex flex-wrap items-center gap-1.5">
          {renderRating()}

          {product.ageRange && (
            <div className="bg-emerald-50 text-emerald-700 text-xs px-2 py-0.5 rounded-md font-medium border border-emerald-200">
              Ages: {product.ageRange}
            </div>
          )}

          {product.stockQuantity !== undefined &&
            product.stockQuantity === 0 && (
              <div className="bg-red-50 text-red-700 text-xs px-2 py-0.5 rounded-md font-medium border border-red-200 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                Out of stock
              </div>
            )}
        </div>

        {/* Price section with discount badge */}
        <div className="flex flex-col mt-auto pt-2">
          <div className="flex items-baseline gap-2 flex-wrap">
            <div className="text-lg font-bold text-slate-900">
              {formatPrice(product.price)}
            </div>
            {isOnSale && product.compareAtPrice && (
              <>
                <div className="text-sm text-slate-500 line-through">
                  {formatPrice(product.compareAtPrice)}
                </div>
                <Badge className="bg-red-500 text-white text-xs px-2 py-0.5">
                  -{discountPercentage}%
                </Badge>
              </>
            )}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            inclusiv TVA
          </div>
        </div>

        {/* Add button - only visible on hover */}
        <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <Button
            onClick={handleImageAddToCart}
            disabled={isAddingToCart || product.stockQuantity === 0}
            className="w-full bg-sky-600 hover:bg-sky-700 text-white shadow-sm"
            size="sm"
          >
            {isAddingToCart ? (
              "Adding..."
            ) : justAdded ? (
              "Added!"
            ) : product.stockQuantity === 0 ? (
              "Out of Stock"
            ) : (
              <>
                <ShoppingCart className="h-4 w-4 mr-2" />
                Add to Cart
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
