"use client";

import { Trash, Heart, ShoppingCart, Share2, AlertCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React, { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
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

export function Wishlist({ initialItems }: WishlistProps) {
  const { t } = useTranslation();
  const [wishlistItems, setWishlistItems] =
    useState<WishlistItem[]>(initialItems);
  const { addToCart } = useShoppingCart();
  const { formatPrice } = useCurrency();

  const handleRemoveFromWishlist = async (id: string) => {
    try {
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

  // Empty state
  if (wishlistItems.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg">
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
    <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {wishlistItems.map(item => (
        <Card key={item.id} className="overflow-hidden group">
          <div className="relative pt-[100%] bg-gray-100">
            <Link href={`/products/${item.slug}`}>
              <Image
                src={item.image}
                alt={item.name}
                fill
                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                className="object-cover transition-all duration-300 group-hover:scale-105"
              />
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 h-8 w-8 bg-white/70 hover:bg-white/90 text-red-500"
              onClick={() => handleRemoveFromWishlist(item.id)}
              title={t("removeFromWishlist", "Elimină din Lista de Dorințe")}
            >
              <Trash className="h-4 w-4" />
            </Button>
          </div>
          <CardContent className="p-4">
            <Link
              href={`/products/${item.slug}`}
              className="text-sm font-medium line-clamp-2 hover:underline mb-2"
            >
              {item.name}
            </Link>
            <p className="text-lg font-bold">{formatPrice(item.price)}</p>
            {!item.inStock && (
              <div className="flex items-center gap-1 text-amber-600 text-sm mt-2">
                <AlertCircle className="h-4 w-4" />
                <span className="text-xs font-medium text-red-500">
                  {t("outOfStock", "Stoc epuizat")}
                </span>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between p-4 pt-0">
            <Button
              variant="outline"
              size="sm"
              className="text-gray-600"
              onClick={() => handleShare(item)}
              title={t("share", "Partajează")}
            >
              <Share2 className="h-4 w-4 mr-1" />
              {t("share", "Partajează")}
            </Button>
            <Button
              size="sm"
              onClick={() => handleAddToCart(item)}
              disabled={!item.inStock}
            >
              <ShoppingCart className="h-4 w-4 mr-1" />
              {item.inStock
                ? t("addToCart", "Add to Cart")
                : t("unavailable", "Unavailable")}
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
