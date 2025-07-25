"use client";

import { StarIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { useCurrency } from "@/lib/currency";
import { cn } from "@/lib/utils";
import { Product } from "@/types/product";

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
  imageHeight = 280,
  layout = "grid",
  priority = false, // Default to false, set to true for above-the-fold images
}: ProductCardProps) {
  const { formatPrice } = useCurrency();
  const isOnSale =
    product.compareAtPrice && product.compareAtPrice > product.price;
  // For proper SSR hydration when getting window dimensions
  const [screenWidth, setScreenWidth] = useState(0);

  useEffect(() => {
    // Set dimensions after mount to prevent hydration mismatch
    setScreenWidth(window.innerWidth);

    const handleResize = () => {
      setScreenWidth(window.innerWidth);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Calculate appropriate image height based on screen size
  const calculatedHeight = screenWidth
    ? Math.min(imageHeight, screenWidth < 640 ? 200 : imageHeight)
    : imageHeight;

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
          "flex flex-col xs:flex-row border rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow duration-300",
          className
        )}
      >
        <div className="relative w-full xs:w-1/3 h-48 xs:h-auto xs:max-w-[240px]">
          <Link href={`/products/${product.slug}`}>
            <div
              className="relative h-full w-full group"
              style={{ position: "relative" }}
            >
              <Image
                src={imageUrl}
                alt={product.name}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 240px"
                priority={priority}
                loading="eager"
                quality={80}
                placeholder="blur"
                blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
              />
            </div>
            {isOnSale && (
              <Badge className="absolute top-3 left-3 bg-red-500 text-xs px-2 py-1">
                Sale
              </Badge>
            )}
            {product.stemCategory && (
              <Badge
                className="absolute top-3 right-3 capitalize text-xs px-2 py-1"
                variant="outline"
              >
                {product.stemCategory}
              </Badge>
            )}
          </Link>
        </div>
        <div className="flex flex-col flex-1 p-4 justify-between">
          <div className="space-y-2">
            <Link href={`/products/${product.slug}`} className="block">
              <h3 className="font-semibold text-base line-clamp-2 hover:text-primary transition-colors">
                {product.name}
              </h3>
            </Link>
            {product.ageRange && (
              <p className="text-sm text-muted-foreground">
                Ages: {product.ageRange}
              </p>
            )}
            {renderRating()}
            <p className="text-sm line-clamp-2 text-muted-foreground">
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
        "group border rounded-xl overflow-hidden h-full flex flex-col bg-white shadow-sm hover:shadow-lg transition-all duration-300",
        className
      )}
    >
      <div className="relative overflow-hidden aspect-square">
        <Link href={`/products/${product.slug}`}>
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            priority={priority}
            loading="eager"
            quality={80}
            placeholder="blur"
            blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
          />
          {isOnSale && (
            <Badge className="absolute top-3 left-3 bg-red-500 text-xs px-2 py-1 shadow-md">
              Sale
            </Badge>
          )}
          {product.stemCategory && (
            <Badge
              className="absolute top-3 right-3 capitalize text-xs px-2 py-1 bg-white/90 text-gray-700 border-0"
              variant="outline"
            >
              {product.stemCategory}
            </Badge>
          )}
        </Link>
      </div>

      <div className="flex flex-col flex-1 p-4 space-y-3">
        <div className="space-y-2">
          <Link href={`/products/${product.slug}`} className="block">
            <h3 className="font-semibold text-base line-clamp-2 group-hover:text-primary transition-colors">
              {product.name}
            </h3>
          </Link>

          {product.ageRange && (
            <p className="text-sm text-muted-foreground">
              Ages: {product.ageRange}
            </p>
          )}

          {renderRating()}
        </div>

        <div className="flex items-center space-x-2 mt-auto pt-2">
          <div className="text-xl font-bold text-primary">
            {formatPrice(product.price)}
          </div>
          {isOnSale && product.compareAtPrice && (
            <div className="text-sm text-muted-foreground line-through">
              {formatPrice(product.compareAtPrice)}
            </div>
          )}
        </div>

        <div className="mt-auto">
          <ProductAddToCartButton
            product={productData}
            showQuantity={false}
            isBook={isBook}
            size="sm"
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
}
