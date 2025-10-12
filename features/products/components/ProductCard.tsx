"use client";

import { StarIcon } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import React from "react";

import { Badge } from "@/components/ui/badge";
import { useCurrency } from "@/lib/currency";
import { cn } from "@/lib/utils";
import { Product } from "@/types/product";

import { OptimizedProductImage } from "./OptimizedProductImage";

import { ProductAddToCartButton } from "./ProductAddToCartButton";

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
  const { formatPrice } = useCurrency();
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
          <span className="text-[9px] sm:text-xs text-muted-foreground">
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

  // Prepare product data for ProductAddToCartButton
  const productData = {
    id: product.id,
    name: product.name,
    price: product.price,
    image: product.images[0],
    variants: product.variants,
    slug: product.slug,
    stockQuantity: product.stockQuantity,
  };

  // Use placeholder image if product image is missing
  const imageUrl =
    product.images && product.images.length > 0
      ? product.images[0]
      : "/placeholder-product.png";

  if (layout === "list") {
    return (
      <div
        className={cn(
          "flex flex-col xs:flex-row border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-all duration-300",
          className
        )}
      >
        <div className="relative w-full xs:w-1/3 h-48 xs:h-48 sm:h-56 xs:max-w-[240px] bg-gradient-to-br from-gray-50 to-gray-100">
          <Link href={`/products/${product.slug}`}>
            <div
              className="relative h-full w-full group"
              style={{ position: "relative" }}
            >
              <Image
                src={imageUrl}
                alt={product.name}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-110"
                sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 240px"
                priority={priority}
                loading={priority ? "eager" : "lazy"}
                quality={85}
                placeholder="blur"
                blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
              />
            </div>
            {isOnSale && (
              <div className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-md bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 text-xs font-semibold">
                <span>Sale</span>
                <span className="font-bold">
                  -
                  {Math.round(
                    ((product.compareAtPrice - product.price) /
                      product.compareAtPrice) *
                      100
                  )}
                  %
                </span>
              </div>
            )}
            {product.stemDiscipline && (
              <Badge
                className="absolute top-3 right-3 capitalize text-xs px-2.5 py-1.5 bg-white/95 text-gray-700 border-0 shadow-md rounded-full font-medium"
                variant="outline"
              >
                {product.stemDiscipline}
              </Badge>
            )}
          </Link>
        </div>
        <div className="flex flex-col flex-1 p-4 sm:p-5 justify-between">
          <div className="space-y-2.5">
            <Link href={`/products/${product.slug}`} className="block">
              <h3 className="font-bold text-base sm:text-lg line-clamp-2 hover:text-primary transition-colors leading-tight tracking-tight">
                {product.name}
              </h3>
            </Link>

            <div className="flex flex-wrap items-center gap-1.5">
              {product.ageRange && (
                <div className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full font-medium border border-blue-100/50 shadow-sm">
                  Ages: {product.ageRange}
                </div>
              )}

              {product.stockQuantity !== undefined &&
                product.stockQuantity === 0 && (
                  <div className="bg-red-50 text-red-700 text-xs px-2 py-0.5 rounded-full font-bold border border-red-200 shadow-sm flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                    Out of stock
                  </div>
                )}

              {product.stockQuantity !== undefined &&
                product.stockQuantity > 0 &&
                product.stockQuantity <= 10 && (
                  <div className="bg-amber-50 text-amber-800 text-xs px-2 py-0.5 rounded-full font-medium border border-amber-200 shadow-sm">
                    Only {product.stockQuantity} left
                  </div>
                )}

              {renderRating()}
            </div>

            <p className="text-sm line-clamp-2 text-gray-600 leading-relaxed">
              {product.description}
            </p>
          </div>
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-baseline space-x-2">
                <div className="text-xl font-bold text-gray-900">
                  {formatPrice(product.price)}
                </div>
                {isOnSale && product.compareAtPrice && (
                  <div className="text-sm text-gray-500 line-through">
                    {formatPrice(product.compareAtPrice)}
                  </div>
                )}
              </div>
              {product.stockQuantity !== undefined &&
                product.stockQuantity > 0 &&
                product.stockQuantity < 10 && (
                  <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md font-medium">
                    Only {product.stockQuantity} left
                  </div>
                )}
            </div>
            <div className="relative">
              <ProductAddToCartButton
                product={productData}
                showQuantity={false}
                isBook={isBook}
                size="sm"
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default grid layout - Optimized for mobile compactness
  return (
    <div
      className={cn(
        "group border border-gray-200 rounded-xl overflow-hidden h-full flex flex-col bg-white shadow-sm hover:shadow-md transition-all duration-300",
        className
      )}
    >
      {/* Compact image container for mobile: 3/2 aspect ratio instead of 4/3 */}
      <div className="relative overflow-hidden aspect-[3/2] sm:aspect-square bg-gradient-to-br from-gray-50 to-gray-100">
        <Link href={`/products/${product.slug}`}>
          <OptimizedProductImage
            src={imageUrl}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-110"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            priority={priority}
            quality={90}
            placeholder="blur"
          />
          {isOnSale && (
            <div className="absolute top-2 left-2 sm:top-3 sm:left-3 inline-flex items-center gap-1 sm:gap-1.5 rounded-md bg-red-50 text-red-700 border border-red-200 px-1.5 py-0.5 sm:px-2 sm:py-0.5 text-[10px] sm:text-xs font-semibold">
              <span>Sale</span>
              <span className="font-bold">
                -
                {Math.round(
                  ((product.compareAtPrice - product.price) /
                    product.compareAtPrice) *
                    100
                )}
                %
              </span>
            </div>
          )}
          {product.stemDiscipline && (
            <Badge
              className="absolute bottom-2 left-2 sm:bottom-3 sm:left-3 capitalize text-[10px] sm:text-xs px-2 py-0.5 sm:px-2.5 sm:py-1 bg-white/95 text-gray-700 border-0 shadow-md rounded-full font-medium backdrop-blur-sm"
              variant="outline"
            >
              {product.stemDiscipline}
            </Badge>
          )}
          {/* Overlay for readability on hover */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/10 via-black/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </Link>
      </div>

      {/* Compact content padding for mobile */}
      <div className="flex flex-col flex-1 p-2.5 sm:p-5 space-y-1.5 sm:space-y-4">
        {/* Compact low stock banner for mobile */}
        {product.stockQuantity !== undefined &&
          product.stockQuantity > 0 &&
          product.stockQuantity <= 10 && (
            <div className="rounded-md border border-amber-200 bg-amber-50 px-2 py-1 sm:px-3 sm:py-2 text-amber-900 text-[10px] sm:text-xs font-medium">
              Only{" "}
              <span className="font-semibold">{product.stockQuantity}</span>{" "}
              {product.stockQuantity === 1 ? "item" : "items"} left
            </div>
          )}

        <div className="space-y-1 sm:space-y-2">
          <Link href={`/products/${product.slug}`} className="block">
            {/* Compact title with tighter line height for mobile */}
            <h3 className="font-bold text-[13px] leading-[1.3] sm:text-base sm:leading-tight line-clamp-2 group-hover:text-primary transition-colors tracking-tight text-gray-900">
              {product.name}
            </h3>
          </Link>

          {/* Compact badges section for mobile */}
          <div className="flex flex-wrap items-center gap-1 sm:gap-1.5">
            {renderRating()}

            {product.ageRange && (
              <div className="flex items-center">
                <div className="bg-blue-50 text-blue-700 text-[9px] sm:text-[10px] px-1.5 py-0.5 sm:px-2 rounded-full font-medium border border-blue-100/50 shadow-sm">
                  Ages: {product.ageRange}
                </div>
              </div>
            )}

            {/* Out of stock indicator inline with other tags */}
            {product.stockQuantity !== undefined &&
              product.stockQuantity === 0 && (
                <div className="bg-red-50 text-red-700 text-[9px] sm:text-[10px] px-1.5 py-0.5 sm:px-2 rounded-full font-bold border border-red-200 shadow-sm flex items-center gap-0.5 sm:gap-1">
                  <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                  Out of stock
                </div>
              )}
          </div>
        </div>

        {/* Compact price section for mobile */}
        <div className="flex flex-col mt-auto pt-1 sm:pt-2">
          <div className="flex items-baseline justify-between">
            <div className="flex items-center gap-1 sm:gap-1.5">
              <div className="text-[15px] sm:text-xl font-extrabold text-gray-900 tracking-tight">
                {formatPrice(product.price)}
              </div>
              {isOnSale && product.compareAtPrice && (
                <div className="text-[11px] sm:text-sm text-gray-500 line-through font-medium">
                  {formatPrice(product.compareAtPrice)}
                </div>
              )}
              {isOnSale && (
                <div className="text-[9px] sm:text-xs text-red-600 font-semibold bg-red-50 px-1 py-0.5 sm:px-1.5 rounded border border-red-100">
                  -
                  {Math.round(
                    ((product.compareAtPrice - product.price) /
                      product.compareAtPrice) *
                      100
                  )}
                  %
                </div>
              )}
            </div>
            {product.stockQuantity !== undefined &&
              product.stockQuantity > 5 &&
              product.stockQuantity <= 10 && (
                <div className="text-[9px] sm:text-xs text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 sm:px-2 rounded-md font-medium">
                  {product.stockQuantity} left
                </div>
              )}
          </div>
          <div className="text-[9px] sm:text-xs text-gray-500 font-medium mt-0.5">
            inclusiv TVA
          </div>
        </div>

        {/* Compact button section for mobile */}
        <div className="mt-auto pt-1.5 sm:pt-3">
          <div className="relative">
            <ProductAddToCartButton
              product={productData}
              showQuantity={false}
              isBook={isBook}
              size="sm"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
