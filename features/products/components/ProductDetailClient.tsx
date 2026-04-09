"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import React, { useState, useEffect } from "react";

import { LazyProductReviews } from "@/components/lazy/client";
import { useTranslation } from "@/lib/i18n";

import { useProductActions } from "../hooks/useProductActions";

import { BundleContents, type BundleContentItem } from "./BundleContents";
import { ProductBreadcrumb } from "./ProductBreadcrumb";
import { ProductDescription } from "./ProductDescription";
import ProductEducation from "./ProductEducation";
import ProductFAQ from "./ProductFAQ";
import { ProductFeatures } from "./ProductFeatures";
import { ProductHeader } from "./ProductHeader";
import { ProductImageGallery } from "./ProductImageGallery";
import type { Review } from "./ProductReviews";
import ProductSpecs from "./ProductSpecs";
import {
  productBackgroundClass,
  productContentWrapperClass,
  productHeroGridClass,
  productOverlayBottomClass,
  productOverlayTopClass,
  productPrimaryPanelClass,
  productSecondaryPanelClass,
  productSubSectionCardClass,
} from "./productTheme";

interface ProductDetailClientProps {
  product: any;
  relatedProducts?: any[];
  initialReviews?: Review[];
  userLoggedIn?: boolean;
  isBook?: boolean;
  bundleContents?: BundleContentItem[];
  faq?: Array<{ question: string; answer: string }>;
}

export default function ProductDetailClient({
  product,
  relatedProducts: _relatedProducts = [],
  initialReviews = [],
  userLoggedIn = false,
  isBook,
  bundleContents = [],
  faq = [],
}: ProductDetailClientProps) {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const [freeShippingThreshold, setFreeShippingThreshold] = useState<
    number | null
  >(null);
  const [isFreeShippingActive, setIsFreeShippingActive] = useState(false);

  // Use the custom hook for product actions
  const {
    isFavorited,
    isFavoriteLoading,
    isAddingToCart,
    justAddedToCart,
    handleShare,
    handleFavorite,
    handleQuickAddToCart,
  } = useProductActions(product, t);

  // Fetch free shipping settings on component mount
  useEffect(() => {
    async function fetchFreeShippingSettings() {
      try {
        const response = await fetch("/api/checkout/shipping-settings");
        if (response.ok) {
          const shippingSettings = await response.json();
          if (shippingSettings.freeThreshold?.active) {
            setFreeShippingThreshold(
              parseFloat(shippingSettings.freeThreshold.price)
            );
            setIsFreeShippingActive(true);
          }
        }
      } catch (error) {
        console.error("Error fetching free shipping settings:", error);
      }
    }

    fetchFreeShippingSettings();
  }, []);

  const getCategoryName = () =>
    product.category?.name?.trim() || t("allProducts", "All products");

  const derivedIsBook = Boolean(
    isBook ??
      (product.isBook ||
        product.attributes?.author ||
        product.tags?.includes("book"))
  );

  const resolvedReviewCount =
    initialReviews.length > 0
      ? initialReviews.length
      : product.reviewCount || 0;

  const resolvedAverageRating =
    initialReviews.length > 0
      ? initialReviews.reduce(
          (total, review) => total + (Number(review.rating) || 0),
          0
        ) / initialReviews.length
      : product.averageRating || 0;

  const rawFromBundleSlug = searchParams.get("fromBundle");
  const fromBundleSlug =
    rawFromBundleSlug && /^[a-z0-9-]+$/i.test(rawFromBundleSlug)
      ? rawFromBundleSlug
      : null;
  const showBackToBundle =
    Boolean(fromBundleSlug) && fromBundleSlug !== product.slug;

  return (
    <div className={productBackgroundClass}>
      <div className={productOverlayTopClass} aria-hidden />
      <div className={productOverlayBottomClass} aria-hidden />

      <div className={productContentWrapperClass}>
        <div className={productPrimaryPanelClass}>
          {/* Breadcrumb */}
          <ProductBreadcrumb
            categorySlug={product.category?.slug}
            categoryName={getCategoryName()}
            productName={product.name}
            t={t}
          />
          {showBackToBundle && (
            <div className="mt-3">
              <Link
                href={`/products/${fromBundleSlug}`}
                className="inline-flex items-center gap-2 rounded-md border border-cyan-200 bg-cyan-50 px-3 py-1.5 text-xs font-semibold text-cyan-800 transition hover:border-cyan-300 hover:bg-cyan-100"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                {t("backToBundle", "Back to bundle")}
              </Link>
            </div>
          )}

          {/* Hero Section - Picture, Name, Price, Description */}
          <div className="mt-6 space-y-6 lg:space-y-8">
            <div className={productHeroGridClass}>
              {/* Product Image */}
              <div className={productSubSectionCardClass}>
                <ProductImageGallery
                  images={product.images || []}
                  alt={product.name}
                  className="w-full"
                  metadata={product.imageMetadata?.map((m: any) => ({
                    alt: m?.alt,
                    tags: m?.tags,
                  }))}
                />
              </div>

              {/* Product Info */}
              <div className="flex flex-col gap-4">
                <div className={`${productSubSectionCardClass} space-y-4`}>
                  <ProductHeader
                    name={product.name}
                    price={product.price}
                    compareAtPrice={product.compareAtPrice}
                    averageRating={resolvedAverageRating}
                    reviewCount={resolvedReviewCount}
                    totalSold={product.totalSold || 0}
                    stockQuantity={product.stockQuantity || 0}
                    isFavorited={isFavorited}
                    isFavoriteLoading={isFavoriteLoading}
                    isAddingToCart={isAddingToCart}
                    justAddedToCart={justAddedToCart}
                    onFavoriteClick={handleFavorite}
                    onShareClick={handleShare}
                    onQuickAddToCart={handleQuickAddToCart}
                    isBook={derivedIsBook}
                    t={t}
                    size="md"
                  />
                </div>

                <ProductDescription
                  description={product.description}
                  categoryName={getCategoryName()}
                  t={t}
                />

                {bundleContents.length > 0 && (
                  <BundleContents
                    items={bundleContents}
                    bundleSlug={product.slug}
                    t={t}
                  />
                )}
              </div>
            </div>

            {/* Secondary Information - Below the Fold */}
            <div className="space-y-6 lg:space-y-8">
              <ProductSpecs product={product} />

              <ProductEducation product={product} />

              <ProductFeatures
                isFreeShippingActive={isFreeShippingActive}
                freeShippingThreshold={freeShippingThreshold}
                categoryName={getCategoryName()}
                productSlug={product.slug}
                t={t}
              />

              <ProductFAQ
                faq={faq}
              />
            </div>
          </div>
        </div>

        <div className={productSecondaryPanelClass}>
          <LazyProductReviews
            productId={product.id}
            reviews={initialReviews}
            userLoggedIn={userLoggedIn}
            className="space-y-6"
          />
        </div>
      </div>
    </div>
  );
}
