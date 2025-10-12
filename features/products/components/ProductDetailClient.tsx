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
  Check,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { formatPrice } from "@/lib/email/base";
import { ProductImageGallery } from "./ProductImageGallery";
import ProductSpecs from "./ProductSpecs";
import ProductEducation from "./ProductEducation";
import ProductFAQ from "./ProductFAQ";
import { useShoppingCart } from "@/features/cart/hooks/useShoppingCart";
import type { CartItem } from "@/features/cart/context/CartContext";

interface ProductDetailClientProps {
  product: any;
  relatedProducts?: any[];
}

export default function ProductDetailClient({
  product,
  relatedProducts = [],
}: ProductDetailClientProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { addItem } = useShoppingCart();
  const [freeShippingThreshold, setFreeShippingThreshold] = useState<
    number | null
  >(null);
  const [isFreeShippingActive, setIsFreeShippingActive] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [isFavoriteLoading, setIsFavoriteLoading] = useState(false);
  const [wishlistItemId, setWishlistItemId] = useState<string | null>(null);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [justAddedToCart, setJustAddedToCart] = useState(false);

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

  // Debug product images - removed as no longer needed

  const getCategoryName = () => {
    return product.category?.name || t("generalCategory");
  };

  const handleShare = async () => {
    try {
      const url =
        typeof window !== "undefined"
          ? `${window.location.origin}/products/${product.slug}`
          : "";
      const title = product.name;
      const text = t("shareProductText", "Vezi acest produs pe STEM Toys");

      if (typeof navigator !== "undefined" && (navigator as any).share) {
        try {
          await (navigator as any).share({ title, text, url });
          return;
        } catch {
          // fall through to clipboard copy
        }
      }

      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        toast({
          title: t("linkCopied", "Link copiat"),
          description: t(
            "linkCopiedDesc",
            "Link-ul produsului a fost copiat în clipboard."
          ),
        });
        return;
      }

      // Fallback for very old browsers
      const textArea = document.createElement("textarea");
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      toast({
        title: t("linkCopied", "Link copiat"),
        description: t(
          "linkCopiedDesc",
          "Link-ul produsului a fost copiat în clipboard."
        ),
      });
    } catch (error) {
      console.error("Share failed:", error);
      toast({
        title: t("error", "Eroare"),
        description: t(
          "sharingNotSupported",
          "Partajarea nu este disponibilă în acest moment."
        ),
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    let cancelled = false;
    async function checkWishlist() {
      try {
        const res = await fetch("/api/account/wishlist", { cache: "no-store" });
        if (!res.ok) return;
        const items = await res.json();
        if (cancelled) return;
        if (Array.isArray(items)) {
          const match = items.find((it: any) => it.productId === product.id);
          setIsFavorited(Boolean(match));
          setWishlistItemId(match ? match.id : null);
        }
      } catch {}
    }
    checkWishlist();
    return () => {
      cancelled = true;
    };
  }, [product.id]);

  const handleFavorite = async () => {
    if (isFavoriteLoading) return;
    setIsFavoriteLoading(true);
    try {
      if (!isFavorited) {
        // Add to wishlist
        const res = await fetch("/api/account/wishlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId: product.id }),
        });

        if (res.status === 401) {
          toast({
            title: t("loginRequired", "Autentificare necesară"),
            description: t(
              "loginToSaveWishlist",
              "Autentifică-te pentru a salva în lista de dorințe."
            ),
            variant: "destructive",
          });
          return;
        }

        if (!res.ok) throw new Error("Failed to save to wishlist");

        // Refresh to capture the new wishlist item id
        try {
          const refresh = await fetch("/api/account/wishlist", {
            cache: "no-store",
          });
          if (refresh.ok) {
            const items = await refresh.json();
            const match = Array.isArray(items)
              ? items.find((it: any) => it.productId === product.id)
              : null;
            setWishlistItemId(match ? match.id : null);
          }
        } catch {}

        setIsFavorited(true);
        toast({
          title: t("addedToWishlist", "Adăugat în lista de dorințe"),
          description: t(
            "wishlistSaved",
            "Produsul a fost salvat în lista ta de dorințe."
          ),
        });
      } else {
        // Remove from wishlist
        let idToDelete = wishlistItemId;
        if (!idToDelete) {
          try {
            const res = await fetch("/api/account/wishlist", {
              cache: "no-store",
            });
            if (res.ok) {
              const items = await res.json();
              const match = Array.isArray(items)
                ? items.find((it: any) => it.productId === product.id)
                : null;
              idToDelete = match ? match.id : null;
            }
          } catch {}
        }

        if (!idToDelete) throw new Error("Missing wishlist item id");

        const del = await fetch(`/api/account/wishlist?id=${idToDelete}`, {
          method: "DELETE",
        });
        if (!del.ok) throw new Error("Failed to remove from wishlist");

        setIsFavorited(false);
        setWishlistItemId(null);
        toast({
          title: t("removedFromWishlist", "Eliminat din lista de dorințe"),
          description: t(
            "wishlistRemoved",
            "Produsul a fost eliminat din lista ta de dorințe."
          ),
        });
      }
    } catch (error) {
      console.error(error);
      toast({
        title: t("error", "Eroare"),
        description: t(
          "wishlistToggleError",
          "Nu s-a putut actualiza lista de dorințe."
        ),
        variant: "destructive",
      });
    } finally {
      setIsFavoriteLoading(false);
    }
  };

  // Quick add to cart handler for mobile button
  const handleQuickAddToCart = async () => {
    if (isAddingToCart || justAddedToCart) return;

    // Check if product is out of stock (books are always available)
    const isBook = Boolean(
      product.isBook ||
        product.attributes?.author ||
        product.tags?.includes("book")
    );
    const isOutOfStock = !isBook && (product.stockQuantity ?? 0) <= 0;

    if (isOutOfStock) {
      toast({
        title: t("outOfStock", "Stoc epuizat"),
        description: t(
          "productOutOfStock",
          "Acest produs nu este momentan în stoc."
        ),
        variant: "destructive",
      });
      return;
    }

    setIsAddingToCart(true);

    try {
      const item: Omit<CartItem, "id"> = {
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
        image: product.images?.[0],
        isBook,
        slug: product.slug,
      };

      addItem(item, 1);

      // Show success state
      setJustAddedToCart(true);
      toast({
        title: t("addedToCart", "Adăugat în coș"),
        description: t(
          "productAddedToCart",
          "Produsul a fost adăugat în coșul tău."
        ),
      });

      // Reset success state after 2 seconds
      setTimeout(() => {
        setJustAddedToCart(false);
      }, 2000);
    } catch (error) {
      console.error("Error adding to cart:", error);
      toast({
        title: t("error", "Eroare"),
        description: t(
          "addToCartError",
          "Nu s-a putut adăuga produsul în coș."
        ),
        variant: "destructive",
      });
    } finally {
      setIsAddingToCart(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 lg:py-8">
        {/* Breadcrumb */}
        <nav className="mb-4 sm:mb-6 lg:mb-8">
          <ol className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm text-gray-600 overflow-x-auto pb-1">
            <li>
              <a
                href="/"
                className="hover:text-blue-600 transition-colors whitespace-nowrap"
              >
                {t("home")}
              </a>
            </li>
            <li className="text-gray-400">/</li>
            <li>
              <a
                href="/products"
                className="hover:text-blue-600 transition-colors whitespace-nowrap"
              >
                {t("products")}
              </a>
            </li>
            <li className="text-gray-400">/</li>
            <li>
              <a
                href={`/categories/${product.category?.slug}`}
                className="hover:text-blue-600 transition-colors whitespace-nowrap"
              >
                {getCategoryName()}
              </a>
            </li>
            <li className="text-gray-400">/</li>
            <li className="text-gray-900 font-medium truncate max-w-[120px] sm:max-w-none">
              {product.name}
            </li>
          </ol>
        </nav>

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
              {/* Product Header - Title and Price in Same Row */}
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h1 className="text-lg sm:text-xl font-bold text-gray-900 leading-tight">
                      {product.name}
                    </h1>
                  </div>
                  <div className="flex items-center space-x-1 flex-shrink-0">
                    <Button
                      variant={isFavorited ? "default" : "outline"}
                      size="icon"
                      className="h-7 w-7 sm:h-8 sm:w-8"
                      onClick={handleFavorite}
                      disabled={isFavoriteLoading}
                      title={
                        isFavorited
                          ? t("inWishlist", "În lista de dorințe")
                          : t("addToWishlist", "Adaugă la dorințe")
                      }
                    >
                      <Heart
                        className={
                          "sm:h-4 sm:w-4 h-3 w-3 " +
                          (isFavorited ? "text-red-500 fill-current" : "")
                        }
                      />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7 sm:h-8 sm:w-8"
                      onClick={handleShare}
                      title={t("share", "Partajează")}
                    >
                      <Share2 className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                    <Button
                      variant={justAddedToCart ? "default" : "outline"}
                      size="icon"
                      className={`h-7 w-7 sm:h-8 sm:w-8 transition-all ${
                        justAddedToCart
                          ? "bg-green-600 hover:bg-green-700 border-green-600"
                          : ""
                      }`}
                      onClick={handleQuickAddToCart}
                      disabled={isAddingToCart || justAddedToCart}
                      title={
                        justAddedToCart
                          ? t("addedToCart", "Adăugat în coș")
                          : t("addToCart", "Adaugă în coș")
                      }
                    >
                      {justAddedToCart ? (
                        <Check className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                      ) : (
                        <ShoppingCart className="h-3 w-3 sm:h-4 sm:w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Price and Rating Row */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-baseline space-x-2">
                    <span className="text-xl sm:text-2xl font-bold text-gray-900">
                      {formatPrice(product.price)}
                    </span>
                    {product.compareAtPrice &&
                      product.compareAtPrice > product.price && (
                        <span className="text-sm sm:text-base text-gray-500 line-through">
                          {formatPrice(product.compareAtPrice)}
                        </span>
                      )}
                  </div>
                  <div className="flex items-center space-x-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-3 w-3 ${
                          i < Math.floor(product.averageRating || 0)
                            ? "text-yellow-400 fill-current"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                    <span className="text-xs text-gray-600 ml-1">
                      ({product.reviewCount || 0})
                    </span>
                  </div>
                </div>

                {/* Discount Badge and Stock Status Row */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {product.compareAtPrice &&
                      product.compareAtPrice > product.price && (
                        <Badge variant="destructive" className="text-xs">
                          {Math.round(
                            ((product.compareAtPrice - product.price) /
                              product.compareAtPrice) *
                              100
                          )}
                          % {t("off")}
                        </Badge>
                      )}
                    <Badge variant="secondary" className="text-xs">
                      {product.totalSold || 0} {t("sold")}
                    </Badge>
                  </div>
                  <div className="text-xs text-gray-600">
                    {product.stockQuantity > 0 ? (
                      <span className="text-green-600">
                        In Stock ({product.stockQuantity})
                      </span>
                    ) : (
                      <span className="text-red-600">Out of Stock</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Product Description - Key Info in Viewport */}
              <div className="bg-white rounded-lg border p-3 sm:p-4">
                <h2 className="text-sm font-semibold text-gray-900 mb-2">
                  {t("productDescription")}
                </h2>
                <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
                  {product.description}
                </p>
                <p className="text-xs sm:text-sm text-gray-700 leading-relaxed mt-2">
                  {t("stemToyDesigned")} {getCategoryName()}.{" "}
                  {t("providesHandsOn")}
                </p>
              </div>
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
              {/* Product Header - Title and Price in Same Row */}
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h1 className="text-xl xl:text-2xl font-bold text-gray-900 leading-tight">
                      {product.name}
                    </h1>
                  </div>
                  <div className="flex items-center space-x-2 flex-shrink-0">
                    <Button
                      variant={isFavorited ? "default" : "outline"}
                      size="icon"
                      className="h-8 w-8"
                      onClick={handleFavorite}
                      disabled={isFavoriteLoading}
                      title={
                        isFavorited
                          ? t("inWishlist", "În lista de dorințe")
                          : t("addToWishlist", "Adaugă la dorințe")
                      }
                    >
                      <Heart
                        className={
                          "h-4 w-4 " +
                          (isFavorited ? "text-red-500 fill-current" : "")
                        }
                      />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={handleShare}
                      title={t("share", "Partajează")}
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Price and Rating Row */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-baseline space-x-2">
                    <span className="text-2xl xl:text-3xl font-bold text-gray-900">
                      {formatPrice(product.price)}
                    </span>
                    {product.compareAtPrice &&
                      product.compareAtPrice > product.price && (
                        <span className="text-base xl:text-lg text-gray-500 line-through">
                          {formatPrice(product.compareAtPrice)}
                        </span>
                      )}
                  </div>
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
                    <span className="text-sm text-gray-600 ml-1">
                      ({product.reviewCount || 0})
                    </span>
                  </div>
                </div>

                {/* Discount Badge and Stock Status Row */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {product.compareAtPrice &&
                      product.compareAtPrice > product.price && (
                        <Badge variant="destructive" className="text-xs">
                          {Math.round(
                            ((product.compareAtPrice - product.price) /
                              product.compareAtPrice) *
                              100
                          )}
                          % {t("off")}
                        </Badge>
                      )}
                    <Badge variant="secondary" className="text-xs">
                      {product.totalSold || 0} {t("sold")}
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-600">
                    {product.stockQuantity > 0 ? (
                      <span className="text-green-600">
                        In Stock ({product.stockQuantity})
                      </span>
                    ) : (
                      <span className="text-red-600">Out of Stock</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Product Description - Key Info in Viewport */}
              <div className="bg-white rounded-lg border p-4">
                <h2 className="text-sm font-semibold text-gray-900 mb-3">
                  {t("productDescription")}
                </h2>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {product.description}
                </p>
                <p className="text-sm text-gray-700 leading-relaxed mt-2">
                  {t("stemToyDesigned")} {getCategoryName()}.{" "}
                  {t("providesHandsOn")}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Secondary Information - Below the Fold */}
        <div className="space-y-8 sm:space-y-12">
          {/* Specifications / Taxonomy / Brand / Tags */}
          <ProductSpecs product={product} />

          {/* Education (RO fields) */}
          <ProductEducation product={product} />

          {/* Product Features - Single Row */}
          <div className="bg-white rounded-lg border p-3 sm:p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Product Features
            </h3>
            <div className="grid grid-cols-3 gap-2 sm:gap-4">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-green-100 rounded-full">
                  <ShoppingCart className="h-4 w-4 text-green-600" />
                </div>
                <div className="text-xs">
                  <div className="font-medium">Secure Payment</div>
                  <div className="text-muted-foreground">SSL Protected</div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-blue-100 rounded-full">
                  <Truck className="h-4 w-4 text-blue-600" />
                </div>
                <div className="text-xs">
                  <div className="font-medium">Free Shipping</div>
                  <div className="text-muted-foreground">
                    {isFreeShippingActive && freeShippingThreshold
                      ? `Over ${formatPrice(freeShippingThreshold)}`
                      : "Not available"}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-orange-100 rounded-full">
                  <RotateCcw className="h-4 w-4 text-orange-600" />
                </div>
                <div className="text-xs">
                  <div className="font-medium">Easy Returns</div>
                  <div className="text-muted-foreground">30 Day Policy</div>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Features & Benefits */}
          <div className="bg-white rounded-lg border p-3 sm:p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              {t("featuresBenefits")}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <ul className="space-y-1.5 sm:space-y-2">
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1 flex-shrink-0"></div>
                  <span className="text-xs sm:text-sm text-gray-700">
                    {t("developsCriticalThinking")}
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-1 flex-shrink-0"></div>
                  <span className="text-xs sm:text-sm text-gray-700">
                    {t("encouragesCreativity")}
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-1 flex-shrink-0"></div>
                  <span className="text-xs sm:text-sm text-gray-700">
                    {t("buildsConfidence")}
                  </span>
                </li>
              </ul>

              <ul className="space-y-1.5 sm:space-y-2">
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-1 flex-shrink-0"></div>
                  <span className="text-xs sm:text-sm text-gray-700">
                    {t("teachesFundamentalConcepts")} {getCategoryName()}{" "}
                    {t("inEngagingWay")}
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-red-500 rounded-full mt-1 flex-shrink-0"></div>
                  <span className="text-xs sm:text-sm text-gray-700">
                    {t("safeMaterials")}
                  </span>
                </li>
              </ul>
            </div>
          </div>

          {/* Learn More Resources */}
          <div className="bg-white rounded-lg border p-3 sm:p-4">
            <h3 className="text-sm font-semibold mb-2">Află mai multe</h3>
            <p className="text-xs text-muted-foreground mb-2">
              Ghiduri utile pentru a alege și folosi jucăriile STEM:
            </p>
            <div className="flex flex-wrap gap-2 text-xs">
              <a
                className="underline hover:text-primary transition-colors"
                href="/ghid-jucarii-stem-2025"
                data-conversion="cta"
                data-conversion-type="click"
                data-conversion-category="product"
                data-conversion-action="learn_more_click"
                data-conversion-element={`prod_${product.slug}_ghid_2025`}
              >
                Ghid 2025
              </a>
              <span className="text-muted-foreground">·</span>
              <a
                className="underline hover:text-primary transition-colors"
                href="/jucarii-stem-dupa-varsta"
                data-conversion="cta"
                data-conversion-type="click"
                data-conversion-category="product"
                data-conversion-action="learn_more_click"
                data-conversion-element={`prod_${product.slug}_dupa_varsta`}
              >
                După vârstă
              </a>
              <span className="text-muted-foreground">·</span>
              <a
                className="underline hover:text-primary transition-colors"
                href="/beneficiile-jucariilor-stem"
                data-conversion="cta"
                data-conversion-type="click"
                data-conversion-category="product"
                data-conversion-action="learn_more_click"
                data-conversion-element={`prod_${product.slug}_beneficii`}
              >
                Beneficii STEM
              </a>
              <span className="text-muted-foreground">·</span>
              <a
                className="underline hover:text-primary transition-colors"
                href="/faq"
                data-conversion="cta"
                data-conversion-type="click"
                data-conversion-category="product"
                data-conversion-action="learn_more_click"
                data-conversion-element={`prod_${product.slug}_faq`}
              >
                FAQ
              </a>
            </div>
          </div>

          {/* FAQ */}
          <ProductFAQ faq={(product?.metadata?.seo?.faq as any) || undefined} />
        </div>
      </div>
    </div>
  );
}
