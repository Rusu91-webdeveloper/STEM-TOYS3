"use client";

import Image from "next/image";
import Link from "next/link";
import React from "react";
import { Star } from "lucide-react";

import { useShoppingCart } from "@/features/cart/hooks/useShoppingCart";
import { useCurrency } from "@/lib/currency";
import type { Product } from "@/types/product";

interface FeaturedProductsGridProps {
  products: Product[];
  t: (key: string, defaultValue?: string) => string;
  isLoading?: boolean;
}

function getProductImage(product: Product): string {
  return product.images && product.images.length > 0
    ? product.images[0]
    : "/placeholder-product.png";
}

/** Renders 5 stars, filled/half/empty based on a 0-5 rating */
function StarRating({ rating, count }: { rating: number; count: number }) {
  const clampedRating = Math.min(5, Math.max(0, rating ?? 0));

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map(star => {
          const filled = clampedRating >= star;
          const half = !filled && clampedRating >= star - 0.5;
          return (
            <span key={star} className="relative inline-flex h-3.5 w-3.5">
              {/* Empty star base */}
              <Star className="absolute inset-0 h-3.5 w-3.5 text-slate-200 fill-slate-200" />
              {/* Filled overlay */}
              {(filled || half) && (
                <span
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: filled ? "100%" : "50%" }}
                >
                  <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                </span>
              )}
            </span>
          );
        })}
      </div>
      {count > 0 && (
        <span className="text-[11px] text-slate-400 font-medium">
          ({count} {count === 1 ? "review" : "reviews"})
        </span>
      )}
    </div>
  );
}

const ProductCard = ({
  product,
  t,
  index,
}: {
  product: Product;
  t: (k: string, d?: string) => string;
  index: number;
}) => {
  const { formatPrice } = useCurrency();
  const { addItem } = useShoppingCart();

  const compareAtPrice =
    typeof product.compareAtPrice === "number" &&
    product.compareAtPrice > product.price
      ? product.compareAtPrice
      : null;

  const isTopRated = index === 0;
  const isOnSale = !!compareAtPrice;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const variantId =
      product.variants && product.variants.length === 1
        ? product.variants[0].id
        : undefined;
    addItem(
      {
        productId: product.id,
        variantId,
        name: product.name,
        price: product.price,
        quantity: 1,
        image: getProductImage(product),
        stockQuantity: Math.max(0, product.stockQuantity ?? 0),
      },
      1
    );
  };

  const rating = typeof product.averageRating === "number" ? product.averageRating : 4;
  const reviewCount = typeof product.reviewCount === "number" ? product.reviewCount : 0;

  return (
    <div className="group flex flex-col bg-white rounded-2xl border border-slate-100 shadow-[0_2px_16px_rgba(0,0,0,0.07)] overflow-hidden transition-shadow duration-300 hover:shadow-[0_8px_32px_rgba(0,0,0,0.12)]">
      {/* Image */}
      <Link
        href={`/products/${product.slug}`}
        className="relative block w-full overflow-hidden bg-slate-50"
        style={{ aspectRatio: "4/3" }}
        tabIndex={0}
        aria-label={product.name}
      >
        <Image
          src={getProductImage(product)}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Badge */}
        {isTopRated && (
          <span className="absolute top-3 left-3 z-10 rounded-full bg-[#2563EB] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm">
            Top Rated
          </span>
        )}
        {!isTopRated && isOnSale && (
          <span className="absolute top-3 left-3 z-10 rounded-full bg-rose-600 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm">
            Sale
          </span>
        )}
      </Link>

      {/* Content */}
      <div className="flex flex-col flex-1 p-4 sm:p-5">
        {/* Stars */}
        <div className="mb-2.5">
          <StarRating rating={rating} count={reviewCount} />
        </div>

        {/* Name */}
        <Link href={`/products/${product.slug}`} className="mb-2 block">
          <h3 className="text-[1rem] sm:text-[1.05rem] font-bold leading-snug text-slate-800 line-clamp-2 group-hover:text-[#2563EB] transition-colors duration-200">
            {product.name}
          </h3>
        </Link>

        {/* Price */}
        <div className="mt-auto flex items-baseline gap-2 mb-4">
          <span className="text-[1.1rem] font-extrabold text-[#2563EB]">
            {formatPrice(product.price)}
          </span>
          {compareAtPrice && (
            <span className="text-[13px] font-medium text-slate-400 line-through">
              {formatPrice(compareAtPrice)}
            </span>
          )}
        </div>

        {/* Add to cart */}
        <button
          onClick={handleAddToCart}
          className="w-full rounded-xl bg-slate-100 py-2.5 px-4 text-[13px] font-semibold text-slate-700 transition-colors duration-200 hover:bg-slate-200 active:bg-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
        >
          {t("addToCartText", "Adaugă în Coș")}
        </button>
      </div>
    </div>
  );
};

export const FeaturedProductsGrid = React.memo(
  ({ products, t, isLoading = false }: FeaturedProductsGridProps) => {
    const showcaseProducts = products.slice(0, 4);

    if (isLoading || showcaseProducts.length === 0) {
      return null;
    }

    return (
      <section className="py-10 sm:py-14 lg:py-16 bg-[#F8FAFC]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 sm:mb-10 gap-3">
            <div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900 mb-1.5">
                {t("featuredProductsTitle", "Jucării Care Funcționează")}
              </h2>
              <p className="text-sm sm:text-base text-slate-500">
                {t(
                  "featuredProductsSubtitle",
                  "Cele mai apreciate seturi STEM din colecția noastră."
                )}
              </p>
            </div>
            <Link
              href="/products"
              className="self-start sm:self-auto text-sm font-semibold text-[#2563EB] hover:text-[#1D4ED8] transition-colors whitespace-nowrap pb-0.5 border-b border-[#2563EB]/30 hover:border-[#2563EB]"
            >
              {t("viewAllProductsText", "Vezi Toate Produsele")}
            </Link>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
            {showcaseProducts.map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                t={t}
                index={index}
              />
            ))}
          </div>
        </div>
      </section>
    );
  }
);

FeaturedProductsGrid.displayName = "FeaturedProductsGrid";
