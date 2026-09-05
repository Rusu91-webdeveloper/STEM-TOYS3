"use client";

import { Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React from "react";

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

  const rating =
    typeof product.averageRating === "number" ? product.averageRating : 4;
  const reviewCount =
    typeof product.reviewCount === "number" ? product.reviewCount : 0;

  return (
    <div className="group flex flex-col overflow-hidden rounded-[1.5rem] border border-slate-200/80 bg-white shadow-[0_18px_48px_-38px_rgba(15,23,42,0.35)] transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_28px_58px_-38px_rgba(37,99,235,0.28)]">
      {/* Image */}
      <Link
        href={`/products/${product.slug}`}
        className="relative block w-full overflow-hidden bg-[linear-gradient(145deg,#f8fafc,#eef2f7)]"
        style={{ aspectRatio: "1/1" }}
        tabIndex={0}
        aria-label={product.name}
      >
        <Image
          src={getProductImage(product)}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className="object-contain p-4 transition-transform duration-500 group-hover:scale-[1.04] sm:p-6"
        />

        {/* Badge */}
        {isTopRated && (
          <span className="absolute left-3 top-3 z-10 rounded-full bg-[#0b1220] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm">
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
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        {/* Stars */}
        <div className="mb-2.5">
          <StarRating rating={rating} count={reviewCount} />
        </div>

        {/* Name */}
        <Link href={`/products/${product.slug}`} className="mb-2 block">
          <h3 className="line-clamp-2 text-[1rem] font-bold leading-snug tracking-[-0.015em] text-slate-900 transition-colors duration-200 group-hover:text-blue-600 sm:text-[1.05rem]">
            {product.name}
          </h3>
        </Link>

        {/* Price */}
        <div className="mt-auto flex items-baseline gap-2 mb-4">
          <span className="text-[1.1rem] font-bold text-slate-950">
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
          className="w-full rounded-xl bg-[#0b1220] px-4 py-3 text-[13px] font-semibold text-white shadow-[0_12px_24px_-16px_rgba(15,23,42,0.9)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-blue-600 active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
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
      <section className="border-y border-slate-200/70 bg-white py-16 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-9 flex flex-col justify-between gap-4 sm:mb-12 sm:flex-row sm:items-end">
            <div>
              <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.24em] text-blue-600">
                Selecția TechTots
              </p>
              <h2 className="mb-2 text-3xl font-bold tracking-[-0.04em] text-slate-950 sm:text-4xl lg:text-5xl">
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
              className="self-start whitespace-nowrap rounded-full border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-700 transition-all hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 sm:self-auto"
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
