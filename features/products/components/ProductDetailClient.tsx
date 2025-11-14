"use client";

import React, { useState, useEffect } from "react";
import { useTranslation } from "@/lib/i18n";

import { LazyProductReviews } from "@/components/lazy/client";
import { ProductImageGallery } from "./ProductImageGallery";
import { ProductBreadcrumb } from "./ProductBreadcrumb";
import { ProductHeader } from "./ProductHeader";
import { ProductDescription } from "./ProductDescription";
import { ProductFeatures } from "./ProductFeatures";
import ProductSpecs from "./ProductSpecs";
import ProductEducation from "./ProductEducation";
import ProductFAQ from "./ProductFAQ";
import { useProductActions } from "../hooks/useProductActions";
import type { Review } from "./ProductReviews";
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
}

export default function ProductDetailClient({
  product,
  relatedProducts = [],
  initialReviews = [],
  userLoggedIn = false,
  isBook,
}: ProductDetailClientProps) {
  const { t } = useTranslation();
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

  const getCategoryName = () => {
    return product.category?.name || t("generalCategory");
  };

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
                faq={(product?.metadata?.seo?.faq as any) || undefined}
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
