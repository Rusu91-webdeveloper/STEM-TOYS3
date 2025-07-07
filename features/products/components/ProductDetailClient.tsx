"use client";

import { Truck, ShieldCheck, RotateCcw, Heart } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import React, { useState, useEffect } from "react";

import { LazyProductReviews } from "@/components/lazy/server";
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
};

export default function ProductDetailClient({
  product,
  isBook = false,
}: ProductDetailClientProps) {
  const { t } = useTranslation();
  const { formatPrice } = useCurrency();
  const { data: session } = useSession();

  const [selectedImage, setSelectedImage] = useState<string>(
    product.images && product.images.length > 0 ? product.images[0] : ""
  );
  const [isAddingToWishlist, setIsAddingToWishlist] = useState(false);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);

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
    if (product.stemCategory) {
      return product.stemCategory;
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

  // Fetch product reviews
  useEffect(() => {
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
  }, [product.id]);

  // Compute review count and average rating from fetched reviews
  const reviewCount = reviews.length;
  const averageRating =
    reviewCount > 0
      ? reviews.reduce((acc, review) => acc + review.rating, 0) / reviewCount
      : 0;

  return (
    <ProductVariantProvider>
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Breadcrumb
            items={[
              { label: t("products"), href: "/products" },
              {
                label: getCategoryName() || "Category",
                href: `/products?category=${getCategoryName() || ""}`,
              },
              { label: product.name, current: true },
            ]}
            className="mb-4"
          />
        </div>

        {/* Product Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Product Gallery */}
          <div className="space-y-4">
            <div className="relative aspect-square overflow-hidden rounded-lg border group">
              {selectedImage && (
                <ProductImageZoom
                  src={selectedImage}
                  alt={product.name}
                  width={600}
                  height={600}
                  priority
                  className="w-full h-full"
                  enableHoverZoom={true}
                  enableClickZoom={true}
                  showZoomControls={true}
                />
              )}
            </div>
            {product.images && product.images.length > 1 && (
              <div className="grid grid-cols-5 gap-2">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    className={`relative aspect-square overflow-hidden rounded border transition-all duration-200 ${
                      selectedImage === image
                        ? "ring-2 ring-primary"
                        : "hover:ring-1 hover:ring-primary/50"
                    }`}
                    onClick={() => setSelectedImage(image)}
                  >
                    <Image
                      src={image}
                      alt={`${product.name} - view ${index + 1}`}
                      fill
                      sizes="20vw"
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold">{product.name}</h1>
              <div className="flex items-center mt-2">
                <div className="flex items-center">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span
                      key={i}
                      className={`inline-block ${
                        i < Math.round(averageRating)
                          ? "text-yellow-400"
                          : "text-gray-300"
                      }`}
                    >
                      ★
                    </span>
                  ))}
                </div>
                <span className="ml-2 text-sm text-muted-foreground">
                  ({reviewCount} {t("reviews")})
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-4 mt-4">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-green-500" />
                <span className="text-sm text-gray-600">Secure Payments</span>
              </div>
              <div className="flex items-center space-x-2">
                <Truck className="w-5 h-5 text-blue-500" />
                <span className="text-sm text-gray-600">Fast Shipping</span>
              </div>
              <div className="flex items-center space-x-2">
                <RotateCcw className="w-5 h-5 text-orange-500" />
                <span className="text-sm text-gray-600">Quality Guarantee</span>
              </div>
            </div>

            <div className="mt-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {formatPrice(product.price)}
              </h2>
              {isOnSale && (
                <span className="text-sm text-red-500 ml-2">
                  {discountPercentage}% off
                </span>
              )}
            </div>

            <p className="text-muted-foreground">
              {t(
                product.translationKey || "defaultProductDescription",
                product.description
              )}
            </p>

            <div className="space-y-4">
              <div>
                <span className="font-medium">
                  {t("ageRange", "Age Range")}:
                </span>{" "}
                {product.ageRange ||
                  (product.attributes?.age
                    ? product.attributes.age
                    : "8-12")}{" "}
                years
              </div>
              <div>
                <span className="font-medium">
                  {t("category", "Category")}:
                </span>{" "}
                <Link
                  href={`/products?category=${getCategoryName()}`}
                  className="capitalize hover:underline text-primary"
                >
                  {getCategoryName()}
                </Link>
              </div>
              {product.attributes?.difficulty && (
                <div>
                  <span className="font-medium">Difficulty:</span>{" "}
                  <span>{product.attributes.difficulty}</span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="pt-4 flex flex-col gap-3">
              <ProductAddToCartButton product={product} isBook={isBook} />
              <Button
                variant="outline"
                className={`flex items-center gap-2 ${isInWishlist ? "text-red-500" : ""}`}
                onClick={handleToggleWishlist}
                disabled={isAddingToWishlist}
              >
                <Heart
                  className={`h-4 w-4 ${isInWishlist ? "fill-current" : ""}`}
                />
                {isInWishlist
                  ? t("removeFromWishlist", "Remove from Wishlist")
                  : t("addToWishlist", "Add to Wishlist")}
              </Button>
            </div>

            {/* Shipping Info */}
            <div className="space-y-4 pt-6">
              <Separator />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                <div className="flex flex-col items-center text-center p-4">
                  <Truck className="h-5 w-5 mb-2" />
                  <div className="text-sm font-medium">{t("freeShipping")}</div>
                  <div className="text-xs text-muted-foreground">
                    {t("onOrdersOver")} {formatPrice(50)}
                  </div>
                </div>
                <div className="flex flex-col items-center text-center p-4">
                  <RotateCcw className="h-5 w-5 mb-2" />
                  <div className="text-sm font-medium">{t("returnPeriod")}</div>
                  <div className="text-xs text-muted-foreground">
                    {t("moneyBackGuarantee")}
                  </div>
                </div>
                <div className="flex flex-col items-center text-center p-4">
                  <ShieldCheck className="h-5 w-5 mb-2" />
                  <div className="text-sm font-medium">
                    {t("secureCheckout")}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {t("protectedBySSL")}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Description Section */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold mb-4">{t("productDescription")}</h2>
          <Separator className="mb-6" />
          <div className="prose max-w-none">
            <p>{product.description}</p>
            <p>
              {t("stemToyDesigned")} {getCategoryName()}. {t("providesHandsOn")}
            </p>
            <h3 className="text-xl font-semibold mt-6">
              {t("featuresBenefits")}
            </h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>{t("developsCriticalThinking")}</li>
              <li>{t("encouragesCreativity")}</li>
              <li>{t("buildsConfidence")}</li>
              <li>
                {t("teachesFundamentalConcepts")} {getCategoryName()}{" "}
                {t("inEngagingWay")}
              </li>
              <li>{t("safeMaterials")}</li>
            </ul>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold mb-4">
            {t("reviews", "Customer Reviews")}
          </h2>
          <Separator className="mb-6" />
          {loadingReviews ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                {t("loading", "Loading reviews...")}
              </p>
            </div>
          ) : (
            <LazyProductReviews
              productId={product.id}
              reviews={reviews}
              userLoggedIn={!!session}
              onSubmitReview={(
                _reviewData: Omit<Review, "id" | "userId" | "date">
              ) => {
                toast({
                  title: t("error", "Review Submission Notice"),
                  description: t(
                    "purchaseRequired",
                    "You need to purchase this product before leaving a review. Reviews can be submitted after delivery from your order details page."
                  ),
                });
              }}
            />
          )}
        </div>
      </div>
    </ProductVariantProvider>
  );
}
