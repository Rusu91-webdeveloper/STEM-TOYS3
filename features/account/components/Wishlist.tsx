"use client";

import {
  Trash,
  Heart,
  ShoppingCart,
  Share2,
  AlertCircle,
  Eye,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React, { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/use-toast";
import { useShoppingCart } from "@/features/cart";
import { useCurrency } from "@/lib/currency";
import { useTranslation } from "@/lib/i18n";

// Define wishlist item interface
interface WishlistItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  image: string;
  slug: string;
  inStock: boolean;
  dateAdded: string;
}

interface WishlistProps {
  initialItems: WishlistItem[];
}

// Loading skeleton component
function WishlistSkeleton() {
  return (
    <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {Array.from({ length: 12 }).map((_, index) => (
        <Card
          key={index}
          className="overflow-hidden border-0 shadow-sm bg-white"
        >
          <div className="relative aspect-square bg-gray-100">
            <Skeleton className="absolute inset-0" />
          </div>
          <CardContent className="p-3 space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-3 w-2/3" />
            <Skeleton className="h-6 w-1/2" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function Wishlist({ initialItems }: WishlistProps) {
  const { t } = useTranslation();
  const [wishlistItems, setWishlistItems] =
    useState<WishlistItem[]>(initialItems);
  const [isLoading, setIsLoading] = useState(false);
  const { addToCart } = useShoppingCart();
  const { formatPrice } = useCurrency();

  const handleRemoveFromWishlist = async (id: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/account/wishlist?id=${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      // Update local state
      setWishlistItems(wishlistItems.filter(item => item.id !== id));

      toast({
        title: t(
          "itemRemovedFromWishlist",
          "Articol eliminat din lista de dorințe"
        ),
        description: t(
          "itemRemovedDesc",
          "Articolul a fost eliminat din lista ta de dorințe."
        ),
      });
    } catch (_error) {
      toast({
        title: t("error", "Eroare"),
        description: t(
          "removeWishlistError",
          "Nu s-a putut elimina articolul din lista de dorințe."
        ),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToCart = (item: WishlistItem) => {
    try {
      // Use the shopping cart hook to add the item directly to cart
      addToCart({
        productId: item.productId,
        name: item.name,
        price: item.price,
        quantity: 1,
        image: item.image,
      });

      toast({
        title: "Adăugat în coș",
        description: "Produsul a fost adăugat în coșul tău",
        variant: "success",
      });
    } catch (_error) {
      toast({
        title: t("error", "Eroare"),
        description: t(
          "addToCartError",
          "Nu s-a putut adăuga articolul în coș."
        ),
        variant: "destructive",
      });
    }
  };

  const handleShare = (item: WishlistItem) => {
    // In a real app, this would open a share dialog or copy link to clipboard
    const shareUrl = `${window.location.origin}/products/${item.slug}`;

    if (navigator.clipboard) {
      navigator.clipboard
        .writeText(shareUrl)
        .then(() => {
          toast({
            title: t("linkCopied", "Link copiat"),
            description: t(
              "linkCopiedDesc",
              "Link-ul produsului a fost copiat în clipboard."
            ),
          });
        })
        .catch(() => {
          toast({
            title: t("error", "Eroare"),
            description: t("copyLinkError", "Nu s-a putut copia link-ul."),
            variant: "destructive",
          });
        });
    } else {
      // Fallback for browsers that don't support clipboard API
      toast({
        title: t("sharingNotSupported", "Partajarea nu este suportată"),
        description: t(
          "browserNotSupport",
          "Browserul tău nu suportă partajarea."
        ),
        variant: "destructive",
      });
    }
  };

  // Show loading skeleton
  if (isLoading) {
    return <WishlistSkeleton />;
  }

  // Empty state
  if (wishlistItems.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg bg-white">
        <Heart className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium mb-2">
          {t("emptyWishlist", "Lista ta de dorințe este goală")}
        </h3>
        <p className="text-gray-500 mb-6">
          {t(
            "noProductsWishlist",
            "Nu ai adăugat încă produse în lista de dorințe."
          )}
        </p>
        <Button asChild>
          <Link href="/products">
            {t("startShopping", "Începe Cumpărăturile")}
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {wishlistItems.map(item => (
        <Card
          key={item.id}
          className="group relative overflow-hidden border-0 shadow-sm hover:shadow-md transition-all duration-300 bg-white wishlist-card-hover"
        >
          {/* Product Image */}
          <div className="relative aspect-square bg-gray-50 overflow-hidden">
            <Link href={`/products/${item.slug}`} className="block">
              <Image
                src={item.image}
                alt={item.name}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, (max-width: 1280px) 20vw, 16vw"
                className="object-cover product-image-hover"
              />
            </Link>

            {/* Remove from wishlist button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 h-7 w-7 bg-white/90 hover:bg-white text-red-500 shadow-sm opacity-0 group-hover:opacity-100 opacity-transition"
              onClick={() => handleRemoveFromWishlist(item.id)}
              title={t("removeFromWishlist", "Elimină din Lista de Dorințe")}
            >
              <Trash className="h-3 w-3" />
            </Button>

            {/* Out of stock overlay */}
            {!item.inStock && (
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                <div className="bg-red-500 text-white text-xs px-2 py-1 rounded font-medium">
                  {t("outOfStock", "Stoc epuizat")}
                </div>
              </div>
            )}

            {/* Quick actions overlay */}
            <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 opacity-transition">
              <div className="flex gap-1">
                <Button
                  size="sm"
                  className="flex-1 h-8 text-xs bg-white/90 hover:bg-white text-gray-700 shadow-sm"
                  onClick={() => handleAddToCart(item)}
                  disabled={!item.inStock}
                >
                  <ShoppingCart className="h-3 w-3 mr-1" />
                  {t("addToCart", "Add to Cart")}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 bg-white/90 hover:bg-white text-gray-700 shadow-sm"
                  onClick={() => handleShare(item)}
                  title={t("share", "Partajează")}
                >
                  <Share2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>

          {/* Product Info */}
          <CardContent className="p-3">
            <Link
              href={`/products/${item.slug}`}
              className="block group-hover:text-blue-600 transition-colors"
            >
              <h3 className="text-sm font-medium line-clamp-2 mb-1 text-gray-900 group-hover:text-blue-600">
                {item.name}
              </h3>
            </Link>

            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-gray-900">
                {formatPrice(item.price)}
              </p>

              {/* Stock status */}
              {!item.inStock && (
                <div className="flex items-center gap-1">
                  <AlertCircle className="h-3 w-3 text-red-500" />
                  <span className="text-xs text-red-500 font-medium">
                    {t("outOfStock", "Stoc epuizat")}
                  </span>
                </div>
              )}
            </div>

            {/* View details button - always visible */}
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="w-full mt-2 h-7 text-xs text-gray-600 hover:text-blue-600 hover:bg-blue-50"
            >
              <Link href={`/products/${item.slug}`}>
                <Eye className="h-3 w-3 mr-1" />
                {t("viewDetails", "View Details")}
              </Link>
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
