"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/use-toast";
import { Trash, Heart, ShoppingCart, Share2, AlertCircle } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { useShoppingCart } from "@/features/cart";
import { useCurrency } from "@/lib/currency";

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

export function Wishlist() {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(true);
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { addItem } = useShoppingCart();
  const { formatPrice } = useCurrency();

  useEffect(() => {
    // Fetch wishlist items from API
    const fetchWishlist = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/account/wishlist");

        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }

        const data = await response.json();
        setWishlistItems(data);
        setError(null);
      } catch (error) {
        console.error("Error fetching wishlist:", error);
        setError("Failed to load your wishlist");
      } finally {
        setIsLoading(false);
      }
    };

    fetchWishlist();
  }, []);

  const handleRemoveFromWishlist = async (id: string) => {
    try {
      const response = await fetch(`/api/account/wishlist?id=${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      // Update local state
      setWishlistItems(wishlistItems.filter((item) => item.id !== id));

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
    } catch (error) {
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

  const handleAddToCart = async (item: WishlistItem) => {
    try {
      // Use the shopping cart hook to add the item directly to cart
      addItem({
        productId: item.productId,
        name: item.name,
        price: item.price,
        quantity: 1,
        image: item.image,
      });

      toast({
        title: t("addedToCart", "Adăugat în coș"),
        description: t(
          "productAddedToCart",
          "Produsul a fost adăugat în coșul tău"
        ),
        variant: "cart",
      });
    } catch (error) {
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

  // Error state
  if (error) {
    return (
      <div className="text-center py-12 border rounded-lg">
        <AlertCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium mb-2">{error}</h3>
        <p className="text-gray-500 mb-6">
          {t(
            "wishlistErrorDesc",
            "Nu am putut încărca lista ta de dorințe. Te rugăm să încerci din nou mai târziu."
          )}
        </p>
        <Button onClick={() => window.location.reload()}>
          {t("tryAgain", "Încearcă din nou")}
        </Button>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <div className="relative pt-[100%]">
              <Skeleton className="absolute inset-0 rounded-t-lg" />
            </div>
            <CardContent className="p-4">
              <div className="space-y-2">
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-6 w-1/3" />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between p-4 pt-0">
              <Skeleton className="h-9 w-24" />
              <Skeleton className="h-9 w-24" />
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }

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
      {wishlistItems.map((item) => (
        <Card
          key={item.id}
          className="overflow-hidden group">
          <div className="relative pt-[100%] bg-gray-100">
            <Link href={`/products/${item.slug}`}>
              <img
                src={item.image}
                alt={item.name}
                className="absolute inset-0 w-full h-full object-cover transition-all duration-300 group-hover:scale-105"
              />
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 h-8 w-8 bg-white/70 hover:bg-white/90 text-red-500"
              onClick={() => handleRemoveFromWishlist(item.id)}
              title={t("removeFromWishlist", "Elimină din Lista de Dorințe")}>
              <Trash className="h-4 w-4" />
            </Button>
          </div>
          <CardContent className="p-4">
            <Link
              href={`/products/${item.slug}`}
              className="text-sm font-medium line-clamp-2 hover:underline mb-2">
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
              title={t("share", "Partajează")}>
              <Share2 className="h-4 w-4 mr-1" />
              {t("share", "Partajează")}
            </Button>
            <Button
              size="sm"
              onClick={() => handleAddToCart(item)}
              disabled={!item.inStock}>
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
