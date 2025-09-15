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
              <Badge className="absolute top-3 left-3 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs px-2.5 py-1.5 shadow-lg font-semibold rounded-full border-0">
                Sale
              </Badge>
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
          <div className="space-y-3">
            <Link href={`/products/${product.slug}`} className="block">
              <h3 className="font-semibold text-base sm:text-lg line-clamp-2 hover:text-primary transition-colors leading-tight">
                {product.name}
              </h3>
            </Link>
            {product.ageRange && (
              <div className="flex items-center">
                <div className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-full font-medium">
                  Ages: {product.ageRange}
                </div>
              </div>
            )}
            {renderRating()}
            <p className="text-sm line-clamp-2 text-muted-foreground leading-relaxed">
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
            <ProductAddToCartButton
              product={productData}
              showQuantity={false}
              isBook={isBook}
              size="sm"
              className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-white font-semibold py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all duration-300"
            />
          </div>
        </div>
      </div>
    );
  }

  // Default grid layout
  return (
    <div
      className={cn(
        "group border border-gray-200/60 rounded-2xl overflow-hidden h-full flex flex-col bg-white shadow-sm hover:shadow-xl hover:shadow-primary/5 transition-all duration-500 hover:-translate-y-1",
        className
      )}
    >
      <div className="relative overflow-hidden aspect-square bg-gradient-to-br from-gray-50 to-gray-100">
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
            <Badge className="absolute top-3 left-3 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs px-2.5 py-1.5 shadow-lg font-semibold rounded-full border-0">
              Sale
            </Badge>
          )}
          {product.stemDiscipline && (
            <Badge
              className="absolute top-3 right-3 capitalize text-xs px-2.5 py-1.5 bg-white/95 text-gray-700 border-0 shadow-md rounded-full font-medium"
              variant="outline"
            >
              {product.stemDiscipline}
            </Badge>
          )}
          {/* Overlay gradient for better text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </Link>
      </div>

      <div className="flex flex-col flex-1 p-4 sm:p-5 space-y-3 sm:space-y-4">
        <div className="space-y-2 sm:space-y-2.5">
          <Link href={`/products/${product.slug}`} className="block">
            <h3 className="font-semibold text-sm sm:text-base line-clamp-2 group-hover:text-primary transition-colors leading-tight">
              {product.name}
            </h3>
          </Link>

          {product.ageRange && (
            <div className="flex items-center">
              <div className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-full font-medium">
                Ages: {product.ageRange}
              </div>
            </div>
          )}

          {renderRating()}
        </div>

        <div className="flex flex-col space-y-2 mt-auto pt-2 sm:pt-3">
          <div className="flex items-baseline space-x-2">
            <div className="text-lg sm:text-xl font-bold text-primary">
              {formatPrice(product.price)}
            </div>
            {isOnSale && product.compareAtPrice && (
              <div className="text-sm text-muted-foreground line-through">
                {formatPrice(product.compareAtPrice)}
              </div>
            )}
          </div>
          <div className="text-xs text-muted-foreground font-medium">
            inclusiv TVA
          </div>
        </div>

        <div className="mt-auto pt-2">
          <ProductAddToCartButton
            product={productData}
            showQuantity={false}
            isBook={isBook}
            size="sm"
            className="w-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-white font-semibold py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all duration-300"
          />
        </div>
      </div>
    </div>
  );
}
