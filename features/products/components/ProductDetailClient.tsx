"use client";

import {
  Truck,
  ShieldCheck,
  RotateCcw,
  Heart,
  Star,
  Eye,
  Share2,
  Package,
  Award,
  Zap,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import React, { useState, useEffect } from "react";

import ProductImageZoom from "@/components/products/ProductImageZoom";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/use-toast";
import {
  ProductVariantProvider,
  ProductAddToCartButton,
} from "@/features/products";
import { useCurrency } from "@/lib/currency";
import { useTranslation } from "@/lib/i18n";
import type { Product } from "@/types/product";

import { type Review } from "./ProductReviews";

type ProductDetailClientProps = {
  product: Product;
  isBook?: boolean;
  initialReviews?: Review[];
};

export default function ProductDetailClient({
  product,
  isBook = false,
  initialReviews = [],
}: ProductDetailClientProps) {
  const { t } = useTranslation();
  const { formatPrice } = useCurrency();
  const { data: _session } = useSession();

  const [selectedImage, setSelectedImage] = useState<string>(
    product.images && product.images.length > 0 ? product.images[0] : ""
  );
  const [isAddingToWishlist, setIsAddingToWishlist] = useState(false);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [_loadingReviews, setLoadingReviews] = useState(false);

  // Check if the product is in the user's wishlist
  useEffect(() => {
    checkWishlistStatus(product.id);
  }, [product.id]);

  const checkWishlistStatus = async (productId: string) => {
    try {
      const response = await fetch("/api/account/wishlist");

      if (!response.ok) {
        // If it's a 401, the user is not logged in, which is fine
        if (response.status !== 401) {
          console.error("Error checking wishlist status:", response.statusText);
        }
        return;
      }

      const wishlistItems = await response.json();
      const isInList = wishlistItems.some(
        (item: any) => item.productId === productId
      );
      setIsInWishlist(isInList);
    } catch (error) {
      console.error("Error checking wishlist status:", error);
    }
  };

  // Handle add to wishlist
  const handleToggleWishlist = async () => {
    setIsAddingToWishlist(true);

    try {
      if (isInWishlist) {
        // Find the wishlist item ID
        const response = await fetch("/api/account/wishlist");
        if (!response.ok) {
          if (response.status === 401) {
            // User is not authenticated
            toast({
              title: t("authRequiredTitle", "Authentication Required"),
              description: t(
                "authRequiredWishlist",
                "You need to be logged in to use the wishlist feature"
              ),
              variant: "destructive",
            });
            setIsAddingToWishlist(false);
            return;
          }
          throw new Error("Failed to fetch wishlist");
        }

        const wishlistItems = await response.json();
        const wishlistItem = wishlistItems.find(
          (item: any) => item.productId === product.id
        );

        if (wishlistItem) {
          // Remove from wishlist
          const deleteResponse = await fetch(
            `/api/account/wishlist?id=${wishlistItem.id}`,
            {
              method: "DELETE",
            }
          );

          if (!deleteResponse.ok) {
            throw new Error("Failed to remove from wishlist");
          }

          setIsInWishlist(false);
          toast({
            title: t("removedFromWishlist", "Removed from wishlist"),
            description: t(
              "productRemovedFromWishlist",
              "Product has been removed from your wishlist."
            ),
          });
        }
      } else {
        // Add to wishlist
        const addResponse = await fetch("/api/account/wishlist", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ productId: product.id }),
        });

        if (!addResponse.ok) {
          if (addResponse.status === 401) {
            // User is not authenticated
            toast({
              title: t("authRequiredTitle", "Authentication Required"),
              description: t(
                "authRequiredWishlist",
                "You need to be logged in to use the wishlist feature"
              ),
              variant: "destructive",
            });
            setIsAddingToWishlist(false);
            return;
          }
          throw new Error("Failed to add to wishlist");
        }

        setIsInWishlist(true);
        toast({
          title: t("addedToWishlist", "Added to wishlist"),
          description: t(
            "productAddedToWishlist",
            "Product has been added to your wishlist."
          ),
        });
      }
    } catch (error) {
      console.error("Error updating wishlist:", error);
      toast({
        title: t("error", "Error"),
        description: t(
          "wishlistUpdateError",
          "Failed to update wishlist. Please try again."
        ),
        variant: "destructive",
      });
    } finally {
      setIsAddingToWishlist(false);
    }
  };

  // Determine if product is on sale
  const isOnSale =
    product.compareAtPrice && product.compareAtPrice > product.price;

  // Calculate discount percentage for sale items
  const discountPercentage = isOnSale
    ? Math.round(
        ((product.compareAtPrice! - product.price) / product.compareAtPrice!) *
          100
      )
    : 0;

  // Get safe category name for display and links
  const getCategoryName = (): string => {
    if (product.stemDiscipline) {
      return product.stemDiscipline;
    }

    if (typeof product.category === "object" && product.category) {
      // If category is an object, we need to handle it differently
      // This likely happens when the category is loaded with additional properties
      const categoryObj = product.category as any;
      return categoryObj.name || "";
    }

    if (typeof product.category === "string") {
      return product.category;
    }

    return product.attributes?.type || "";
  };

  // 🚀 PERFORMANCE: Reviews are now passed from server component, no need to fetch on client
  // Only fetch if no initial reviews were provided (fallback)
  useEffect(() => {
    if (initialReviews.length === 0) {
      const fetchReviews = async () => {
        try {
          setLoadingReviews(true);
          const response = await fetch(`/api/reviews?productId=${product.id}`);

          if (response.ok) {
            const reviewData = await response.json();
            setReviews(reviewData);
          } else {
            console.error("Failed to fetch reviews:", response.statusText);
          }
        } catch (error) {
          console.error("Error fetching reviews:", error);
        } finally {
          setLoadingReviews(false);
        }
      };

      fetchReviews();
    }
  }, [product.id, initialReviews.length]);

  // Compute review count and average rating from fetched reviews
  const reviewCount = reviews.length;
  const averageRating =
    reviewCount > 0
      ? reviews.reduce((acc, review) => acc + review.rating, 0) / reviewCount
      : 0;

  return (
    <ProductVariantProvider>
      <div className="bg-premium min-h-screen">
        <div className="container-premium py-8 lg:py-12">
          {/* Premium Breadcrumb */}
          <div className="mb-8 animate-fade-in-up">
            <Breadcrumb
              items={[
                { label: t("products"), href: "/products" },
                {
                  label: getCategoryName() || "Category",
                  href: `/products?category=${getCategoryName() || ""}`,
                },
                { label: product.name, current: true },
              ]}
              className="mb-6"
            />
          </div>

          {/* Premium Product Details Grid */}
          <div className="grid-premium lg:grid-cols-2">
            {/* Premium Product Gallery */}
            <div className="space-y-6 animate-fade-in-left">
              <div className="relative aspect-square overflow-hidden rounded-2xl border-premium shadow-premium group bg-white">
                {selectedImage && (
                  <ProductImageZoom
                    src={selectedImage}
                    alt={product.name}
                    width={800}
                    height={800}
                    priority
                    className="w-full h-full product-image-zoom"
                    enableHoverZoom={true}
                    enableClickZoom={true}
                    showZoomControls={true}
                  />
                )}

                {/* Premium Sale Badge */}
                {isOnSale && (
                  <div className="absolute top-4 left-4 bg-gradient-to-r from-red-500 to-red-600 text-white px-3 py-1 rounded-full text-sm font-semibold shadow-lg">
                    {discountPercentage}% OFF
                  </div>
                )}

                {/* Premium Wishlist Button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-4 right-4 h-10 w-10 bg-white/90 hover:bg-white text-red-500 shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300"
                  onClick={handleToggleWishlist}
                  disabled={isAddingToWishlist}
                >
                  <Heart
                    className={`h-5 w-5 ${isInWishlist ? "fill-current" : ""}`}
                  />
                </Button>
              </div>

              {/* Premium Thumbnail Gallery */}
              {product.images && product.images.length > 1 && (
                <div className="product-gallery-grid">
                  {product.images.map((image, index) => (
                    <button
                      key={index}
                      className={`relative aspect-square overflow-hidden rounded-xl border-premium transition-all duration-300 hover:shadow-premium ${
                        selectedImage === image
                          ? "ring-2 ring-blue-500 shadow-premium"
                          : "hover:ring-1 hover:ring-blue-300"
                      }`}
                      onClick={() => setSelectedImage(image)}
                    >
                      <Image
                        src={image}
                        alt={`${product.name} - view ${index + 1}`}
                        fill
                        sizes="(max-width: 768px) 20vw, 15vw"
                        className="object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Premium Product Info */}
            <div className="space-premium animate-fade-in-up">
              {/* Premium Product Header */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-premium-sm font-medium">
                    {getCategoryName()}
                  </span>
                  {isOnSale && (
                    <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-premium-sm font-medium">
                      Sale
                    </span>
                  )}
                </div>

                <h1 className="font-display text-premium-4xl lg:text-premium-4xl text-premium-secondary leading-tight">
                  {product.name}
                </h1>

                {/* Premium Rating */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-5 w-5 ${
                          i < Math.round(averageRating)
                            ? "text-yellow-400 fill-current"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-premium-muted text-premium-sm">
                    {averageRating.toFixed(1)} ({reviewCount} {t("reviews")})
                  </span>
                </div>
              </div>

              {/* Premium Pricing */}
              <div className="space-y-2">
                <div className="flex items-baseline gap-3">
                  <span className="font-display text-premium-3xl font-bold text-premium-secondary">
                    {formatPrice(product.price)}
                  </span>
                  {isOnSale && (
                    <span className="text-premium-lg text-premium-muted line-through">
                      {formatPrice(product.compareAtPrice!)}
                    </span>
                  )}
                </div>
                <p className="text-premium-muted text-premium-sm">
                  inclusiv TVA
                </p>
              </div>

              {/* Premium Product Description */}
              <div className="space-y-4">
                <p className="text-premium-base text-premium-muted leading-relaxed">
                  {t(
                    product.translationKey || "defaultProductDescription",
                    product.description
                  )}
                </p>

                {/* Premium Product Specs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-6 bg-white rounded-xl border-premium shadow-sm">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-blue-500" />
                      <span className="text-premium-sm font-medium">
                        Age Range:
                      </span>
                      <span className="text-premium-sm text-premium-muted">
                        {product.ageRange ||
                          (product.attributes?.age
                            ? product.attributes.age
                            : "8-12")}{" "}
                        years
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Award className="h-4 w-4 text-green-500" />
                      <span className="text-premium-sm font-medium">
                        Category:
                      </span>
                      <Link
                        href={`/products?category=${getCategoryName()}`}
                        className="text-premium-sm text-premium-primary hover:underline capitalize"
                      >
                        {getCategoryName()}
                      </Link>
                    </div>
                  </div>
                  {product.attributes?.difficulty && (
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-orange-500" />
                      <span className="text-premium-sm font-medium">
                        Difficulty:
                      </span>
                      <span className="text-premium-sm text-premium-muted">
                        {product.attributes.difficulty}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Premium Action Buttons */}
              <div className="space-y-4">
                <ProductAddToCartButton product={product} isBook={isBook} />

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className={`flex-1 btn-premium ${
                      isInWishlist ? "text-red-500 border-red-200" : ""
                    }`}
                    onClick={handleToggleWishlist}
                    disabled={isAddingToWishlist}
                  >
                    <Heart
                      className={`h-4 w-4 mr-2 ${isInWishlist ? "fill-current" : ""}`}
                    />
                    {isInWishlist
                      ? t("removeFromWishlist", "Remove from Wishlist")
                      : t("addToWishlist", "Add to Wishlist")}
                  </Button>

                  <Button
                    variant="outline"
                    size="icon"
                    className="btn-premium"
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({
                          title: product.name,
                          url: window.location.href,
                        });
                      } else {
                        navigator.clipboard.writeText(window.location.href);
                        toast({
                          title: "Link copied",
                          description: "Product link copied to clipboard",
                        });
                      }
                    }}
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Premium Trust Indicators */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-6 bg-white rounded-xl border-premium shadow-sm">
                <div className="flex flex-col items-center text-center space-y-2">
                  <div className="p-2 bg-green-100 rounded-full">
                    <ShieldCheck className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="text-premium-sm font-medium">
                    Secure Payment
                  </div>
                  <div className="text-premium-xs text-premium-muted">
                    SSL Protected
                  </div>
                </div>
                <div className="flex flex-col items-center text-center space-y-2">
                  <div className="p-2 bg-blue-100 rounded-full">
                    <Truck className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="text-premium-sm font-medium">
                    Free Shipping
                  </div>
                  <div className="text-premium-xs text-premium-muted">
                    Over {formatPrice(250)}
                  </div>
                </div>
                <div className="flex flex-col items-center text-center space-y-2">
                  <div className="p-2 bg-orange-100 rounded-full">
                    <RotateCcw className="h-5 w-5 text-orange-600" />
                  </div>
                  <div className="text-premium-sm font-medium">
                    Easy Returns
                  </div>
                  <div className="text-premium-xs text-premium-muted">
                    30 Day Policy
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Premium Description Section */}
          <div className="mt-16 lg:mt-20 animate-fade-in-up">
            <div className="bg-white rounded-2xl border-premium shadow-premium p-8 lg:p-12">
              <h2 className="font-display text-premium-3xl font-bold text-premium-secondary mb-6">
                {t("productDescription")}
              </h2>
              <Separator className="mb-8" />

              <div className="prose prose-lg max-w-none">
                <p className="text-premium-base text-premium-muted leading-relaxed mb-6">
                  {product.description}
                </p>
                <p className="text-premium-base text-premium-muted leading-relaxed mb-8">
                  {t("stemToyDesigned")} {getCategoryName()}.{" "}
                  {t("providesHandsOn")}
                </p>

                <h3 className="font-display text-premium-2xl font-semibold text-premium-secondary mb-6">
                  {t("featuresBenefits")}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-premium-base text-premium-muted">
                        {t("developsCriticalThinking")}
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-premium-base text-premium-muted">
                        {t("encouragesCreativity")}
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-premium-base text-premium-muted">
                        {t("buildsConfidence")}
                      </span>
                    </li>
                  </ul>

                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-premium-base text-premium-muted">
                        {t("teachesFundamentalConcepts")} {getCategoryName()}{" "}
                        {t("inEngagingWay")}
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-premium-base text-premium-muted">
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
    </ProductVariantProvider>
  );
}
