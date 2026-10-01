"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import React, { useState, useEffect, useRef } from "react";

import { LazyProductReviews } from "@/components/lazy/client";
import { trackProductView } from "@/lib/analytics/ga4";
import { useTranslation } from "@/lib/i18n";
import { getProductBuyingGuide } from "@/lib/products/product-buying-guides";
import { productPublicPath } from "@/lib/products/public-slug";
import {
  disciplineBadgeLabel,
  resolveProductAgeChip,
} from "@/lib/products/romanian-catalog";
import { resolveStorefrontCategoryLink } from "@/lib/utils/category-page-links";

import { useProductActions } from "../hooks/useProductActions";

import { BundleContents, type BundleContentItem } from "./BundleContents";
import { ProductBreadcrumb } from "./ProductBreadcrumb";
import { ProductBuyingSummary } from "./ProductBuyingSummary";
import { ProductDescription } from "./ProductDescription";
import ProductEducation from "./ProductEducation";
import ProductFAQ from "./ProductFAQ";
import { ProductFeatures } from "./ProductFeatures";
import { ProductHeader } from "./ProductHeader";
import { ProductImageGallery } from "./ProductImageGallery";
import { ProductPurchaseActions } from "./ProductPurchaseActions";
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
import ProductUpsellPicker, { type ProductUpsell } from "./ProductUpsellPicker";

interface ProductDetailClientProps {
  product: any;
  upsellProducts?: ProductUpsell[];
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
  upsellProducts = [],
}: ProductDetailClientProps) {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const [freeShippingThreshold, setFreeShippingThreshold] = useState<
    number | null
  >(null);
  const [isFreeShippingActive, setIsFreeShippingActive] = useState(false);
  const buyingGuide = getProductBuyingGuide(product.slug);
  const viewedProduct = useRef<string | null>(null);

  useEffect(() => {
    if (viewedProduct.current === product.id) return;
    viewedProduct.current = product.id;
    trackProductView({
      item_id: product.id,
      item_name: product.name,
      category: product.category?.name ?? "",
      price: product.price,
      currency: "RON",
    });
  }, [product.id, product.name, product.price, product.category?.name]);

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

  const disciplineLabel = disciplineBadgeLabel(
    product.stemDiscipline,
    product.category?.name,
    product.category?.slug
  );
  const categoryLink = resolveStorefrontCategoryLink({
    stemDiscipline: product.stemDiscipline,
    categorySlug: product.category?.slug,
    categoryName: product.category?.name,
  });
  const categoryHref = categoryLink?.href ?? null;
  const categoryLabel = categoryLink?.label ?? null;
  const ageChip = resolveProductAgeChip({
    ageGroup: product.ageGroup,
    ageRange: product.ageRange,
    description: product.description,
    attributes: product.attributes,
  });

  const derivedIsBook = Boolean(
    isBook ??
      (product.isBook ||
        product.attributes?.author ||
        product.tags?.includes("book"))
  );

  const resolvedReviewCount = initialReviews.length;

  const resolvedAverageRating =
    initialReviews.length > 0
      ? initialReviews.reduce(
          (total, review) => total + (Number(review.rating) || 0),
          0
        ) / initialReviews.length
      : 0;

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
            productName={product.name}
            categoryLabel={categoryLabel}
            categoryHref={categoryHref}
            t={t}
          />
          {showBackToBundle && (
            <div className="mt-3">
              <Link
                href={productPublicPath(fromBundleSlug)}
                className="inline-flex items-center gap-2 rounded-md border border-cyan-200 bg-cyan-50 px-3 py-1.5 text-xs font-semibold text-cyan-800 transition hover:border-cyan-300 hover:bg-cyan-100"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                {t("backToBundle", "Înapoi la pachet")}
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
                  {ageChip ? (
                    <p
                      data-testid="pdp-age-chip"
                      className="w-fit rounded-full bg-sky-50 px-3 py-1 text-sm font-semibold text-sky-900"
                    >
                      Vârsta recomandată: {ageChip.label}
                    </p>
                  ) : null}
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
                    isBook={derivedIsBook}
                    t={t}
                    size="md"
                  />
                  {buyingGuide && (
                    <p className="text-sm leading-relaxed text-slate-700">
                      {buyingGuide.summary}
                    </p>
                  )}
                  <ProductPurchaseActions
                    productName={product.name}
                    price={product.price}
                    isOutOfStock={
                      !derivedIsBook && (product.stockQuantity || 0) <= 0
                    }
                    isAdding={isAddingToCart}
                    justAdded={justAddedToCart}
                    onAdd={handleQuickAddToCart}
                  />
                  {buyingGuide && <ProductBuyingSummary guide={buyingGuide} />}
                  <p className="text-sm text-slate-600">
                    Plată cu cardul sau ramburs · Livrare 1–4 zile lucrătoare
                  </p>
                  {product.slug ===
                    "kit-stem-manusa-robotica-genius-toy-G_7080" && (
                    <p className="text-sm text-slate-600">
                      De la 8 ani cu ajutor; de la 10 ani pentru lucru
                      individual.
                    </p>
                  )}
                </div>

                <ProductUpsellPicker
                  key={product.id}
                  products={upsellProducts}
                />

                <ProductDescription
                  description={product.description}
                  categoryName={disciplineLabel ?? ""}
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
                activities={buyingGuide?.activities}
                isFreeShippingActive={isFreeShippingActive}
                freeShippingThreshold={freeShippingThreshold}
                categoryName={disciplineLabel ?? ""}
                productSlug={product.slug}
                t={t}
              />

              <ProductFAQ faq={faq} />
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
        <div data-pdp-end="" className="h-px w-full" aria-hidden="true" />
      </div>
    </div>
  );
}
