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

  // Render star rating
  const renderRating = () => {
    if (!product.rating) return null;

    return (
      <div className="flex items-center space-x-1">
        <div className="flex">
          {[...Array(5)].map((_, i) => (
            <StarIcon
              key={i}
              className={cn(
                "h-4 w-4",
                i < Math.floor(product.rating || 0)
                  ? "text-yellow-400 fill-yellow-400"
                  : "text-gray-300"
              )}
            />
          ))}
        </div>
        {product.reviewCount && (
          <span className="text-xs text-muted-foreground">
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
          "flex flex-col xs:flex-row border border-gray-200/60 rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow-xl hover:shadow-primary/5 transition-all duration-500 hover:-translate-y-0.5",
          className
        )}
      >
        <div className="relative w-full xs:w-1/3 h-48 xs:h-auto xs:max-w-[240px] bg-gradient-to-br from-gray-50 to-gray-100">
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
                loading="eager"
                quality={85}
                placeholder="blur"
                blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
              />
            </div>
            {isOnSale && (
              <>
                <div className="absolute top-0 left-0 w-16 h-16 overflow-hidden z-10">
                  <div className="absolute transform rotate-45 bg-gradient-to-r from-red-600 to-red-500 text-white text-xs font-extrabold py-1 left-[-35px] top-[15px] w-[130px] text-center shadow-lg">
                    SALE
                  </div>
                </div>

                {/* Discount percentage indicator */}
                <div className="absolute bottom-3 right-3 bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-md shadow-md">
                  -
                  {Math.round(
                    ((product.compareAtPrice - product.price) /
                      product.compareAtPrice) *
                      100
                  )}
                  %
                </div>
              </>
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
          {/* Elegant professional low stock banner in list view */}
          {product.stockQuantity !== undefined &&
            product.stockQuantity > 0 &&
            product.stockQuantity <= 5 && (
              <div className="relative mb-3 overflow-hidden rounded-md">
                {/* Elegant gradient background */}
                <div className="absolute inset-0 bg-gradient-to-r from-amber-50 via-amber-100 to-amber-50"></div>

                {/* Subtle animated pattern */}
                <div className="absolute inset-0 opacity-5">
                  <div className="absolute inset-0 bg-[radial-gradient(#DCA14E_1px,transparent_1px)] [background-size:8px_8px]"></div>
                </div>

                {/* Main content with refined typography */}
                <div className="relative px-3 py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-1 h-8 bg-amber-400 rounded-full"></div>
                    <div>
                      <div className="text-xs text-amber-800 uppercase tracking-wider font-medium">
                        Limited Availability
                      </div>
                      <div className="text-amber-900 font-medium">
                        Only{" "}
                        <span className="font-bold">
                          {product.stockQuantity}
                        </span>{" "}
                        {product.stockQuantity === 1 ? "item" : "items"}{" "}
                        remaining
                      </div>
                    </div>
                  </div>
                  <div className="text-2xs sm:text-xs text-amber-800 bg-amber-200/60 px-2 py-1 rounded-full border border-amber-300/30">
                    Low Stock
                  </div>
                </div>

                {/* Elegant bottom border */}
                <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-amber-300/70 to-transparent"></div>
              </div>
            )}

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

              {renderRating()}
            </div>

            <p className="text-sm line-clamp-2 text-gray-600 leading-relaxed">
              {product.description}
            </p>
          </div>
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-baseline space-x-2">
                <div className="text-xl font-bold text-primary">
                  {formatPrice(product.price)}
                </div>
                {isOnSale && product.compareAtPrice && (
                  <div className="text-sm text-muted-foreground line-through">
                    {formatPrice(product.compareAtPrice)}
                  </div>
                )}
              </div>
            </div>
            <div className="relative">
              <ProductAddToCartButton
                product={productData}
                showQuantity={false}
                isBook={isBook}
                size="sm"
                className="w-full bg-primary hover:bg-primary/95 text-white font-medium text-xs sm:text-sm py-2 sm:py-2.5 rounded-lg shadow-sm hover:shadow transition-all duration-200 border border-primary/5"
              />

              {/* Subtle elegant accent line */}
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1/4 h-0.5 bg-white/10 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default grid layout
  return (
    <div
      className={cn(
        "group border border-gray-100/80 rounded-2xl overflow-hidden h-full flex flex-col bg-white shadow-sm hover:shadow-xl hover:shadow-primary/10 transition-all duration-500 hover:-translate-y-1",
        // Enhanced mobile styling
        "backdrop-blur-sm bg-white/95 sm:bg-white",
        className
      )}
    >
      <div className="relative overflow-hidden aspect-[4/3] sm:aspect-square bg-gradient-to-br from-gray-50 to-gray-100">
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
            <>
              {/* Enhanced sale badge - corner ribbon style */}
              <div className="absolute top-0 left-0 w-20 h-20 overflow-hidden z-10">
                <div className="absolute transform rotate-45 bg-gradient-to-r from-red-600 to-red-500 text-white text-xs font-extrabold py-1.5 left-[-38px] top-[20px] w-[140px] text-center shadow-lg">
                  SALE
                </div>
              </div>

              {/* Enhanced mobile optimized sale indicator with prominent banner design */}
              <div className="absolute top-0 right-0 xs:hidden">
                <div className="bg-gradient-to-r from-red-600 to-red-500 text-white text-sm font-extrabold px-3 py-2 rounded-bl-xl shadow-lg flex items-center gap-1.5 border-b-2 border-l-2 border-red-700">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>
                    -
                    {Math.round(
                      ((product.compareAtPrice - product.price) /
                        product.compareAtPrice) *
                        100
                    )}
                    %
                  </span>
                </div>
              </div>
            </>
          )}
          {product.stemDiscipline && (
            <Badge
              className="absolute bottom-3 left-3 capitalize text-xs px-2.5 py-1 bg-white/95 text-gray-700 border-0 shadow-md rounded-full font-medium backdrop-blur-sm"
              variant="outline"
            >
              {product.stemDiscipline}
            </Badge>
          )}
          {/* Enhanced overlay gradient for better text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </Link>
      </div>

      <div className="flex flex-col flex-1 p-3 sm:p-5 space-y-2 sm:space-y-4">
        {/* Elegant professional low stock banner */}
        {product.stockQuantity !== undefined &&
          product.stockQuantity > 0 &&
          product.stockQuantity <= 5 && (
            <div className="relative mb-3 overflow-hidden rounded-md">
              {/* Elegant gradient background */}
              <div className="absolute inset-0 bg-gradient-to-r from-amber-50 via-amber-100 to-amber-50"></div>

              {/* Subtle animated pattern */}
              <div className="absolute inset-0 opacity-5">
                <div className="absolute inset-0 bg-[radial-gradient(#DCA14E_1px,transparent_1px)] [background-size:8px_8px]"></div>
              </div>

              {/* Main content with refined typography */}
              <div className="relative px-3 py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-1 h-8 bg-amber-400 rounded-full"></div>
                  <div>
                    <div className="text-xs text-amber-800 uppercase tracking-wider font-medium">
                      Limited Availability
                    </div>
                    <div className="text-amber-900 font-medium">
                      Only{" "}
                      <span className="font-bold">{product.stockQuantity}</span>{" "}
                      {product.stockQuantity === 1 ? "item" : "items"} remaining
                    </div>
                  </div>
                </div>
                <div className="text-2xs sm:text-xs text-amber-800 bg-amber-200/60 px-2 py-1 rounded-full border border-amber-300/30">
                  Low Stock
                </div>
              </div>

              {/* Elegant bottom border */}
              <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-amber-300/70 to-transparent"></div>
            </div>
          )}

        <div className="space-y-1 sm:space-y-2.5">
          <Link href={`/products/${product.slug}`} className="block">
            <h3 className="font-bold text-sm sm:text-base line-clamp-2 group-hover:text-primary transition-colors leading-tight tracking-tight text-gray-900">
              {product.name}
            </h3>
          </Link>

          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-1">
            {renderRating()}

            {product.ageRange && (
              <div className="flex items-center">
                <div className="bg-blue-50 text-blue-700 text-[10px] sm:text-xs px-2 py-0.5 rounded-full font-medium border border-blue-100/50 shadow-sm">
                  Ages: {product.ageRange}
                </div>
              </div>
            )}

            {/* Out of stock indicator inline with other tags */}
            {product.stockQuantity !== undefined &&
              product.stockQuantity === 0 && (
                <div className="bg-red-50 text-red-700 text-[10px] sm:text-xs px-2 py-0.5 rounded-full font-bold border border-red-200 shadow-sm flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                  Out of stock
                </div>
              )}
          </div>
        </div>

        <div className="flex flex-col mt-auto pt-2 sm:pt-3">
          <div className="flex items-baseline justify-between">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="text-base sm:text-xl font-extrabold text-primary tracking-tight">
                {formatPrice(product.price)}
              </div>
              {isOnSale && product.compareAtPrice && (
                <div className="text-xs sm:text-sm text-gray-500 line-through font-medium">
                  {formatPrice(product.compareAtPrice)}
                </div>
              )}
              {isOnSale && (
                <div className="text-xs text-red-500 font-bold bg-red-50 px-1.5 py-0.5 rounded-md border border-red-100">
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
          </div>
          <div className="text-[10px] sm:text-xs text-gray-500 font-medium mt-0.5">
            inclusiv TVA
          </div>
        </div>

        <div className="mt-auto pt-2 sm:pt-3">
          {/* Refined professional Add button */}
          <div className="relative">
            <ProductAddToCartButton
              product={productData}
              showQuantity={false}
              isBook={isBook}
              size="sm"
              className="w-full bg-primary hover:bg-primary/95 text-white font-medium text-xs sm:text-sm py-2 sm:py-2.5 rounded-lg shadow-sm hover:shadow transition-all duration-200 border border-primary/5"
            />

            {/* Subtle elegant accent line */}
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1/4 h-0.5 bg-white/10 rounded-full"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
