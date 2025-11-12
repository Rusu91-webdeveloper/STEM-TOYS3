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
import {
  glassCardClass,
  glassPanelClass,
  gradientButtonClass,
} from "@/features/home/components/homeTheme";
import { useCurrency } from "@/lib/currency";
import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";

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
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {Array.from({ length: 12 }).map((_, index) => (
        <Card
          key={index}
          className={cn(
            glassCardClass,
            "overflow-hidden border-white/10 bg-slate-900/60 p-0 shadow-lg shadow-black/25"
          )}
        >
          <div className="relative aspect-square bg-white/5">
            <Skeleton className="absolute inset-0 h-full w-full bg-white/10" />
          </div>
          <CardContent className="space-y-2 p-3">
            <Skeleton className="h-4 w-full rounded bg-white/10" />
            <Skeleton className="h-3 w-2/3 rounded bg-white/10" />
            <Skeleton className="h-6 w-1/2 rounded bg-white/10" />
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
        title: "Eroare",
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
        title: "Eroare",
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
            title: "Eroare",
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
      <div
        className={cn(
          glassPanelClass,
          "space-y-4 rounded-3xl border-white/10 bg-slate-900/70 p-10 text-slate-100 shadow-xl shadow-black/30"
        )}
      >
        <Heart className="mx-auto h-12 w-12 text-slate-400" />
        <h3 className="text-lg font-semibold">
          {t("emptyWishlist", "Lista ta de dorințe este goală")}
        </h3>
        <p className="text-slate-300">
          {t(
            "noProductsWishlist",
            "Nu ai adăugat încă produse în lista de dorințe."
          )}
        </p>
        <Button
          asChild
          className={cn(
            "mx-auto inline-flex min-w-[220px] justify-center text-sm font-semibold transition-transform hover:scale-[1.02]",
            gradientButtonClass
          )}
        >
          <Link href="/products">
            {t("startShopping", "Începe Cumpărăturile")}
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {wishlistItems.map(item => (
        <Card
          key={item.id}
          className={cn(
            glassCardClass,
            "group relative overflow-hidden border-white/10 bg-slate-900/60 shadow-lg shadow-black/30 transition-all duration-300 hover:-translate-y-1 hover:border-white/20 hover:shadow-[0_25px_50px_-12px_rgba(8,47,73,0.65)]"
          )}
        >
          {/* Product Image */}
          <div className="relative aspect-square overflow-hidden bg-white/5">
            <Link href={`/products/${item.slug}`} className="block">
              <Image
                src={item.image}
                alt={item.name}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, (max-width: 1280px) 20vw, 16vw"
                className="transition-transform duration-300 ease-out group-hover:scale-105"
              />
            </Link>

            {/* Remove from wishlist button */}
            <Button
              variant="ghost"
              size="icon"
              className="opacity-transition absolute right-2 top-2 h-7 w-7 bg-slate-900/60 text-rose-300 shadow-lg shadow-rose-500/20 backdrop-blur transition-colors hover:bg-rose-500/20 hover:text-rose-200 group-hover:opacity-100"
              onClick={() => handleRemoveFromWishlist(item.id)}
              title={t("removeFromWishlist", "Elimină din Lista de Dorințe")}
            >
              <Trash className="h-3 w-3" />
            </Button>

            {/* Out of stock overlay */}
            {!item.inStock && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-900/60 backdrop-blur">
                <div className="rounded bg-rose-500 px-2 py-1 text-xs font-medium text-white shadow">
                  {t("outOfStock", "Stoc epuizat")}
                </div>
              </div>
            )}

            {/* Quick actions overlay */}
            <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 opacity-transition">
              <div className="flex gap-1">
                <Button
                  size="sm"
                  className={cn(
                    "flex-1 h-8 text-xs font-medium text-slate-900 hover:scale-[1.01]",
                    gradientButtonClass
                  )}
                  onClick={() => handleAddToCart(item)}
                  disabled={!item.inStock}
                >
                  <ShoppingCart className="mr-1 h-3 w-3" />
                  {t("addToCart", "Add to Cart")}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 rounded-lg border border-white/20 bg-white/10 p-0 text-slate-100 shadow-sm hover:bg-white/20"
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
              className="block transition-colors hover:text-sky-300"
            >
              <h3 className="mb-1 line-clamp-2 text-sm font-semibold text-slate-100">
                {item.name}
              </h3>
            </Link>

            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-slate-100">
                {formatPrice(item.price)}
              </p>

              {/* Stock status */}
              {!item.inStock && (
                <div className="flex items-center gap-1">
                  <AlertCircle className="h-3 w-3 text-rose-300" />
                  <span className="text-xs font-medium text-rose-200">
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
              className="mt-2 h-7 w-full rounded-lg border border-white/10 text-xs text-slate-200 transition-colors hover:border-white/20 hover:bg-white/10 hover:text-slate-50"
            >
              <Link href={`/products/${item.slug}`}>
                <Eye className="mr-1 h-3 w-3" />
                {t("viewDetails", "View Details")}
              </Link>
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
