"use client";

import { StarIcon } from "lucide-react";
import Link from "next/link";
import React from "react";

import { Badge } from "@/components/ui/badge";
import { useCurrency } from "@/lib/currency";
import { cn } from "@/lib/utils";
import { Product } from "@/types/product";

import { OptimizedProductImage } from "./OptimizedProductImage";
import { productsGlassCardClass } from "./productsTheme";

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
          `${productsGlassCardClass} relative flex flex-col xs:flex-row overflow-hidden border-white/12 shadow-indigo-900/30 transition-all duration-300`,
          className
        )}
      >
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-indigo-900/90 via-slate-900/80 to-purple-900/70 opacity-95 sm:opacity-80 md:opacity-40 lg:opacity-20 transition-opacity duration-500"
          aria-hidden
        />
        <div className="relative z-10 w-full xs:w-1/3 h-48 xs:h-48 sm:h-56 xs:max-w-[240px] overflow-hidden bg-slate-900/70 border-r border-white/10">
          <Link
            href={`/products/${product.slug}`}
            className="group block h-full relative"
          >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle,_rgba(129,140,248,0.14)_1px,_transparent_1px)] bg-[length:18px_18px] opacity-80" />
            <div className="relative z-10 flex h-full w-full items-center justify-center">
              <div className="relative h-full w-full p-3 sm:p-0">
                <OptimizedProductImage
                  src={imageUrl}
                  alt={product.name}
                  fill
                  className="object-contain sm:object-cover object-center transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 240px"
                  priority={priority}
                  quality={85}
                  placeholder="blur"
                />
              </div>
            </div>
            {isOnSale && (
              <div className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-md bg-rose-500/25 text-rose-100 border border-rose-400/40 px-2 py-0.5 text-xs font-semibold shadow-md shadow-rose-500/30 backdrop-blur">
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
                className="absolute top-3 right-3 capitalize text-xs px-2.5 py-1.5 bg-white/10 text-slate-100 border border-white/20 shadow-md rounded-full font-medium backdrop-blur"
                variant="outline"
              >
                {product.stemDiscipline}
              </Badge>
            )}
          </Link>
        </div>
        <div className="relative z-10 flex flex-col flex-1 p-4 sm:p-5 justify-between">
          <div className="space-y-2.5">
            <Link href={`/products/${product.slug}`} className="block">
              <h3 className="font-bold text-base sm:text-lg line-clamp-2 text-slate-100 transition-colors leading-tight tracking-tight hover:text-indigo-200">
                {product.name}
              </h3>
            </Link>

            <div className="flex flex-wrap items-center gap-1.5">
              {product.ageRange && (
                <div className="bg-sky-500/20 text-sky-100 text-xs px-2 py-0.5 rounded-full font-medium border border-sky-400/30 shadow-sm backdrop-blur">
                  Ages: {product.ageRange}
                </div>
              )}

              {product.stockQuantity !== undefined &&
                product.stockQuantity === 0 && (
                  <div className="bg-rose-500/20 text-rose-100 text-xs px-2 py-0.5 rounded-full font-bold border border-rose-400/30 shadow-sm flex items-center gap-1 backdrop-blur">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-300 animate-pulse"></span>
                    Out of stock
                  </div>
                )}

              {product.stockQuantity !== undefined &&
                product.stockQuantity > 0 &&
                product.stockQuantity <= 10 && (
                  <div className="bg-amber-500/20 text-amber-100 text-xs px-2 py-0.5 rounded-full font-medium border border-amber-300/30 shadow-sm backdrop-blur">
                    Only {product.stockQuantity} left
                  </div>
                )}

              {renderRating()}
            </div>

            <p className="text-sm line-clamp-2 text-slate-300 leading-relaxed">
              {product.description}
            </p>
          </div>
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-baseline space-x-2">
                <div className="text-xl font-bold text-slate-100">
                  {formatPrice(product.price)}
                </div>
                {isOnSale && product.compareAtPrice && (
                  <div className="text-sm text-slate-400 line-through">
                    {formatPrice(product.compareAtPrice)}
                  </div>
                )}
              </div>
              {product.stockQuantity !== undefined &&
                product.stockQuantity > 0 &&
                product.stockQuantity < 10 && (
                  <div className="text-xs text-amber-100 bg-amber-500/20 border border-amber-300/30 px-2 py-0.5 rounded-md font-medium backdrop-blur">
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
        `${productsGlassCardClass} relative group overflow-hidden h-full flex flex-col border-white/12 shadow-indigo-900/30 transition-all duration-300`,
        className
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-indigo-900/90 via-slate-900/75 to-purple-900/70 opacity-95 sm:opacity-90 md:opacity-50 lg:opacity-25 transition-opacity duration-500"
        aria-hidden
      />
      <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-br from-white/6 via-transparent to-indigo-500/15 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      {/* Compact image container for mobile: 3/2 aspect ratio instead of 4/3 */}
      <div className="relative z-10 overflow-hidden aspect-[3/2] sm:aspect-square bg-slate-900/70 border-b border-white/10">
        <Link
          href={`/products/${product.slug}`}
          className="group block h-full relative"
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle,_rgba(129,140,248,0.12)_1px,_transparent_1px)] bg-[length:18px_18px] opacity-70" />
          <div className="relative z-10 flex h-full w-full items-center justify-center">
            <div className="relative h-full w-full p-3 sm:p-0">
              <OptimizedProductImage
                src={imageUrl}
                alt={product.name}
                fill
                className="object-contain sm:object-cover object-center transition-transform duration-700 group-hover:scale-105"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                priority={priority}
                quality={90}
                placeholder="blur"
              />
            </div>
          </div>
          {isOnSale && (
            <div className="absolute top-2 left-2 sm:top-3 sm:left-3 inline-flex items-center gap-1 sm:gap-1.5 rounded-md bg-rose-500/25 text-rose-100 border border-rose-400/40 px-1.5 py-0.5 sm:px-2 sm:py-0.5 text-[10px] sm:text-xs font-semibold shadow-md shadow-rose-500/30 backdrop-blur">
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
              className="absolute bottom-2 left-2 sm:bottom-3 sm:left-3 capitalize text-[10px] sm:text-xs px-2 py-0.5 sm:px-2.5 sm:py-1 bg-white/10 text-slate-100 border border-white/20 shadow-md rounded-full font-medium backdrop-blur"
              variant="outline"
            >
              {product.stemDiscipline}
            </Badge>
          )}
          {/* Overlay for readability on hover */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/20 via-black/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </Link>
      </div>

      {/* Compact content padding for mobile */}
      <div className="relative z-10 flex flex-col flex-1 p-2.5 sm:p-5 space-y-1.5 sm:space-y-4">
        {/* Compact low stock banner for mobile */}
        {product.stockQuantity !== undefined &&
          product.stockQuantity > 0 &&
          product.stockQuantity <= 10 && (
            <div className="rounded-md border border-amber-300/30 bg-amber-500/20 px-2 py-1 sm:px-3 sm:py-2 text-amber-100 text-[10px] sm:text-xs font-medium shadow-sm shadow-amber-500/30 backdrop-blur">
              Only{" "}
              <span className="font-semibold">{product.stockQuantity}</span>{" "}
              {product.stockQuantity === 1 ? "item" : "items"} left
            </div>
          )}

        <div className="space-y-1 sm:space-y-2">
          <Link href={`/products/${product.slug}`} className="block">
            {/* Compact title with tighter line height for mobile */}
            <h3 className="font-bold text-[13px] leading-[1.3] sm:text-base sm:leading-tight line-clamp-2 text-slate-100 transition-colors tracking-tight group-hover:text-indigo-200">
              {product.name}
            </h3>
          </Link>

          {/* Compact badges section for mobile */}
          <div className="flex flex-wrap items-center gap-1 sm:gap-1.5">
            {renderRating()}

            {product.ageRange && (
              <div className="flex items-center">
                <div className="bg-sky-500/20 text-sky-100 text-[9px] sm:text-[10px] px-1.5 py-0.5 sm:px-2 rounded-full font-medium border border-sky-400/30 shadow-sm backdrop-blur">
                  Ages: {product.ageRange}
                </div>
              </div>
            )}

            {/* Out of stock indicator inline with other tags */}
            {product.stockQuantity !== undefined &&
              product.stockQuantity === 0 && (
                <div className="bg-rose-500/20 text-rose-100 text-[9px] sm:text-[10px] px-1.5 py-0.5 sm:px-2 rounded-full font-bold border border-rose-400/30 shadow-sm flex items-center gap-0.5 sm:gap-1 backdrop-blur">
                  <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-rose-300 animate-pulse"></span>
                  Out of stock
                </div>
              )}
          </div>
        </div>

        {/* Compact price section for mobile */}
        <div className="flex flex-col mt-auto pt-1 sm:pt-2">
          <div className="flex items-baseline justify-between">
            <div className="flex items-center gap-1 sm:gap-1.5">
              <div className="text-[15px] sm:text-xl font-extrabold text-slate-100 tracking-tight">
                {formatPrice(product.price)}
              </div>
              {isOnSale && product.compareAtPrice && (
                <div className="text-[11px] sm:text-sm text-slate-400 line-through font-medium">
                  {formatPrice(product.compareAtPrice)}
                </div>
              )}
              {isOnSale && (
                <div className="text-[9px] sm:text-xs text-rose-200 font-semibold bg-rose-500/20 px-1 py-0.5 sm:px-1.5 rounded border border-rose-400/30 backdrop-blur">
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
                <div className="text-[9px] sm:text-xs text-amber-100 bg-amber-500/20 border border-amber-300/30 px-1.5 py-0.5 sm:px-2 rounded-md font-medium backdrop-blur">
                  {product.stockQuantity} left
                </div>
              )}
          </div>
          <div className="text-[9px] sm:text-xs text-slate-400 font-medium mt-0.5">
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
