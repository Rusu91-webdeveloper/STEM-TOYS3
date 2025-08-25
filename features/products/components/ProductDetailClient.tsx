"use client";

import React, { useState, useEffect } from "react";
import { useTranslation } from "@/lib/i18n";
import {
  Heart,
  Share2,
  Truck,
  RotateCcw,
  Star,
  ShoppingCart,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/email/base";

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

  // Debug product images
  useEffect(() => {
    console.log('Product detail images:', {
      images: product.images,
      length: product.images?.length,
      firstImage: product.images?.[0],
      productName: product.name
    });
  }, [product.images, product.name]);

  const getCategoryName = () => {
    return product.category?.name || t("generalCategory");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="mb-8">
          <ol className="flex items-center space-x-2 text-sm text-gray-600">
            <li>
              <a href="/" className="hover:text-blue-600 transition-colors">
                {t("home")}
              </a>
            </li>
            <li>/</li>
            <li>
              <a
                href="/products"
                className="hover:text-blue-600 transition-colors"
              >
                {t("products")}
              </a>
            </li>
            <li>/</li>
            <li>
              <a
                href={`/categories/${product.category?.slug}`}
                className="hover:text-blue-600 transition-colors"
              >
                {getCategoryName()}
              </a>
            </li>
            <li>/</li>
            <li className="text-gray-900 font-medium">{product.name}</li>
          </ol>
        </nav>

        {/* Main Product Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="aspect-square bg-gray-200 rounded-lg">
              {product.images && product.images.length > 0 ? (
                <img
                  src={product.images[0]}
                  alt={product.name}
                  className="w-full h-full object-cover rounded-lg"
                  onError={e => {
                    console.error("Image failed to load:", product.images[0]);
                    e.currentTarget.src = "/images/placeholder.jpg";
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500">
                  <span>No image available</span>
                </div>
              )}
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            {/* Product Header */}
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold text-gray-900">
                    {product.name}
                  </h1>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < Math.floor(product.averageRating || 0)
                              ? "text-yellow-400 fill-current"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-600">
                      ({product.reviewCount || 0} {t("reviews")})
                    </span>
                    <Badge variant="secondary">
                      {product.totalSold || 0} {t("sold")}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="icon">
                    <Heart className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon">
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Price Section */}
              <div className="space-y-2">
                <div className="flex items-baseline space-x-2">
                  <span className="text-3xl font-bold text-gray-900">
                    {formatPrice(product.price)}
                  </span>
                  {product.compareAtPrice &&
                    product.compareAtPrice > product.price && (
                      <span className="text-lg text-gray-500 line-through">
                        {formatPrice(product.compareAtPrice)}
                      </span>
                    )}
                </div>
                {product.compareAtPrice &&
                  product.compareAtPrice > product.price && (
                    <Badge variant="destructive" className="w-fit">
                      {Math.round(
                        ((product.compareAtPrice - product.price) /
                          product.compareAtPrice) *
                          100
                      )}
                      % {t("off")}
                    </Badge>
                  )}
              </div>

              {/* Stock Status */}
              <div className="text-sm text-gray-600">
                {(() => {
                  console.log("Product stock data:", {
                    stockQuantity: product.stockQuantity,
                    type: typeof product.stockQuantity,
                    product: product.name,
                  });
                  return product.stockQuantity > 0 ? (
                    <span className="text-green-600">
                      In Stock ({product.stockQuantity} available)
                    </span>
                  ) : (
                    <span className="text-red-600">Out of Stock</span>
                  );
                })()}
              </div>
            </div>

            {/* Product Features */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t">
              <div className="flex flex-col items-center text-center space-y-2">
                <div className="p-2 bg-green-100 rounded-full">
                  <ShoppingCart className="h-5 w-5 text-green-600" />
                </div>
                <div className="text-sm font-medium">Secure Payment</div>
                <div className="text-xs text-muted-foreground">
                  SSL Protected
                </div>
              </div>
              <div className="flex flex-col items-center text-center space-y-2">
                <div className="p-2 bg-blue-100 rounded-full">
                  <Truck className="h-5 w-5 text-blue-600" />
                </div>
                <div className="text-sm font-medium">Free Shipping</div>
                <div className="text-xs text-muted-foreground">
                  {isFreeShippingActive && freeShippingThreshold
                    ? `Over ${formatPrice(freeShippingThreshold)}`
                    : "Not available"}
                </div>
              </div>
              <div className="flex flex-col items-center text-center space-y-2">
                <div className="p-2 bg-orange-100 rounded-full">
                  <RotateCcw className="h-5 w-5 text-orange-600" />
                </div>
                <div className="text-sm font-medium">Easy Returns</div>
                <div className="text-xs text-muted-foreground">
                  30 Day Policy
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Product Description Section */}
        <div className="mt-16 lg:mt-20">
          <div className="bg-white rounded-2xl border shadow-sm p-8 lg:p-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {t("productDescription")}
            </h2>
            <Separator className="mb-8" />

            <div className="prose prose-lg max-w-none">
              <p className="text-base text-gray-700 leading-relaxed mb-6">
                {product.description}
              </p>
              <p className="text-base text-gray-700 leading-relaxed mb-8">
                {t("stemToyDesigned")} {getCategoryName()}.{" "}
                {t("providesHandsOn")}
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-6">
                {t("featuresBenefits")}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-base text-gray-700">
                      {t("developsCriticalThinking")}
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-base text-gray-700">
                      {t("encouragesCreativity")}
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-base text-gray-700">
                      {t("buildsConfidence")}
                    </span>
                  </li>
                </ul>

                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-base text-gray-700">
                      {t("teachesFundamentalConcepts")} {getCategoryName()}{" "}
                      {t("inEngagingWay")}
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-base text-gray-700">
                      {t("safeMaterials")}
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
