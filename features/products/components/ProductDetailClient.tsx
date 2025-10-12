"use client";

import React, { useState, useEffect } from "react";
import { useTranslation } from "@/lib/i18n";

import { ProductImageGallery } from "./ProductImageGallery";
import { ProductBreadcrumb } from "./ProductBreadcrumb";
import { ProductHeader } from "./ProductHeader";
import { ProductDescription } from "./ProductDescription";
import { ProductFeatures } from "./ProductFeatures";
import ProductSpecs from "./ProductSpecs";
import ProductEducation from "./ProductEducation";
import ProductFAQ from "./ProductFAQ";
import { useProductActions } from "../hooks/useProductActions";

interface ProductDetailClientProps {
  product: any;
  relatedProducts?: any[];
}

export default function ProductDetailClient({
  product,
  relatedProducts = [],
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 lg:py-8">
        {/* Breadcrumb */}
        <ProductBreadcrumb
          categorySlug={product.category?.slug}
          categoryName={getCategoryName()}
          productName={product.name}
          t={t}
        />

        {/* Hero Section - Picture, Name, Price, Description in Viewport */}
        <div className="mb-8 sm:mb-12 lg:mb-16">
          {/* Mobile Layout - Stacked */}
          <div className="lg:hidden space-y-4 sm:space-y-6">
            {/* Product Image */}
            <div className="w-full">
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
            <div className="space-y-3">
              <ProductHeader
                name={product.name}
                price={product.price}
                compareAtPrice={product.compareAtPrice}
                averageRating={product.averageRating || 0}
                reviewCount={product.reviewCount || 0}
                totalSold={product.totalSold || 0}
                stockQuantity={product.stockQuantity || 0}
                isFavorited={isFavorited}
                isFavoriteLoading={isFavoriteLoading}
                isAddingToCart={isAddingToCart}
                justAddedToCart={justAddedToCart}
                onFavoriteClick={handleFavorite}
                onShareClick={handleShare}
                onQuickAddToCart={handleQuickAddToCart}
                isBook={Boolean(
                  product.isBook ||
                    product.attributes?.author ||
                    product.tags?.includes("book")
                )}
                t={t}
                size="sm"
              />

              <ProductDescription
                description={product.description}
                categoryName={getCategoryName()}
                t={t}
              />
            </div>
          </div>

          {/* Desktop Layout - Side by Side */}
          <div className="hidden lg:grid lg:grid-cols-2 gap-8 xl:gap-12">
            {/* Product Images */}
            <div className="space-y-4">
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
            <div className="space-y-4">
              <ProductHeader
                name={product.name}
                price={product.price}
                compareAtPrice={product.compareAtPrice}
                averageRating={product.averageRating || 0}
                reviewCount={product.reviewCount || 0}
                totalSold={product.totalSold || 0}
                stockQuantity={product.stockQuantity || 0}
                isFavorited={isFavorited}
                isFavoriteLoading={isFavoriteLoading}
                onFavoriteClick={handleFavorite}
                onShareClick={handleShare}
                isBook={Boolean(
                  product.isBook ||
                    product.attributes?.author ||
                    product.tags?.includes("book")
                )}
                t={t}
                size="md"
              />

              <ProductDescription
                description={product.description}
                categoryName={getCategoryName()}
                t={t}
              />
            </div>
          </div>
        </div>

        {/* Secondary Information - Below the Fold */}
        <div className="space-y-8 sm:space-y-12">
          {/* Specifications / Taxonomy / Brand / Tags */}
          <ProductSpecs product={product} />

          {/* Education (RO fields) */}
          <ProductEducation product={product} />

          {/* Product Features, Benefits, and Learn More */}
          <ProductFeatures
            isFreeShippingActive={isFreeShippingActive}
            freeShippingThreshold={freeShippingThreshold}
            categoryName={getCategoryName()}
            productSlug={product.slug}
            t={t}
          />

          {/* FAQ */}
          <ProductFAQ faq={(product?.metadata?.seo?.faq as any) || undefined} />
        </div>
      </div>
    </div>
  );
}
