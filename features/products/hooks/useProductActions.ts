"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { useShoppingCart } from "@/features/cart/hooks/useShoppingCart";
import type { CartItem } from "@/features/cart/context/CartContext";

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  images?: string[];
  stockQuantity?: number;
  isBook?: boolean;
  attributes?: { author?: string };
  tags?: string[];
}

/**
 * Custom hook for product actions (favorite, share, add to cart)
 * Extracts complex logic from the ProductDetailClient component
 */
export function useProductActions(
  product: Product,
  t: (key: string, fallback?: string) => string
) {
  const { toast } = useToast();
  const { addItem } = useShoppingCart();

  const [isFavorited, setIsFavorited] = useState(false);
  const [isFavoriteLoading, setIsFavoriteLoading] = useState(false);
  const [wishlistItemId, setWishlistItemId] = useState<string | null>(null);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [justAddedToCart, setJustAddedToCart] = useState(false);

  // Check wishlist status on mount
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
      } catch {
        // Silently fail - user might not be logged in
      }
    }
    checkWishlist();
    return () => {
      cancelled = true;
    };
  }, [product.id]);

  const handleShare = async () => {
    try {
      // Guard check: ensure we're running on client
      if (typeof window === "undefined" || typeof document === "undefined") {
        console.warn("Share function called on server side");
        return;
      }

      const url = `${window.location.origin}/products/${product.slug}`;
      const title = product.name;
      const text = t("shareProductText", "Vezi acest produs pe STEM Toys");

      // Try native share API first
      if (typeof navigator !== "undefined" && navigator.share) {
        try {
          await navigator.share({ title, text, url });
          return;
        } catch (shareError: any) {
          // User cancelled or error - fall through to clipboard
          if (shareError.name !== "AbortError") {
            console.warn("Native share failed:", shareError);
          }
        }
      }

      // Try clipboard API
      if (
        typeof navigator !== "undefined" &&
        navigator.clipboard &&
        navigator.clipboard.writeText
      ) {
        try {
          await navigator.clipboard.writeText(url);
          toast({
            title: t("linkCopied", "Link copiat"),
            description: t(
              "linkCopiedDesc",
              "Link-ul produsului a fost copiat în clipboard."
            ),
          });
          return;
        } catch (clipboardError) {
          console.warn("Clipboard API failed:", clipboardError);
          // Fall through to textarea fallback
        }
      }

      // Fallback for older browsers
      try {
        const textArea = document.createElement("textarea");
        textArea.value = url;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        const successful = document.execCommand("copy");
        document.body.removeChild(textArea);

        if (successful) {
          toast({
            title: t("linkCopied", "Link copiat"),
            description: t(
              "linkCopiedDesc",
              "Link-ul produsului a fost copiat în clipboard."
            ),
          });
        } else {
          throw new Error("execCommand failed");
        }
      } catch (fallbackError) {
        console.error("All share methods failed:", fallbackError);
        toast({
          title: "Eroare",
          description: t(
            "sharingNotSupported",
            "Partajarea nu este disponibilă în acest moment."
          ),
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Share failed:", error);
      toast({
        title: "Eroare",
        description: t(
            "sharingNotSupported",
            "Partajarea nu este disponibilă în acest moment."
        ),
        variant: "destructive",
      });
    }
  };

  const handleFavorite = async () => {
    if (isFavoriteLoading) return;

    // Guard check: ensure we're running on client
    if (typeof window === "undefined") {
      console.warn("Favorite function called on server side");
      return;
    }

    // Check if this is a book
    const isBook = Boolean(
      product.isBook ||
        product.attributes?.author ||
        product.tags?.includes("book")
    );

    setIsFavoriteLoading(true);

    try {
      if (!isFavorited) {
        // Add to wishlist (works for both products and books now)
        let res;
        try {
          res = await fetch("/api/account/wishlist", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...(isBook ? { bookId: product.id } : { productId: product.id }),
              isBook,
            }),
          });
        } catch (fetchError) {
          console.error("Network error while adding to wishlist:", fetchError);
          throw new Error("Network error");
        }

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

        if (!res.ok) {
          const errorText = await res.text().catch(() => "Unknown error");
          console.error("Failed to save to wishlist:", errorText);
          throw new Error("Failed to save to wishlist");
        }

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
        } catch (refreshError) {
          console.warn("Failed to refresh wishlist items:", refreshError);
          // Non-critical error, continue
        }

        setIsFavorited(true);
        toast({
          title: t("addedToWishlist", "Adăugat în lista de dorințe"),
          description: isBook
            ? t(
                "bookWishlistSaved",
                "Cartea a fost salvată în lista ta de dorințe."
              )
            : t(
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
          } catch (fetchIdError) {
            console.error("Failed to fetch wishlist item id:", fetchIdError);
          }
        }

        if (!idToDelete) {
          console.error("Missing wishlist item id");
          throw new Error("Missing wishlist item id");
        }

        let del;
        try {
          del = await fetch(`/api/account/wishlist?id=${idToDelete}`, {
            method: "DELETE",
          });
        } catch (deleteError) {
          console.error(
            "Network error while removing from wishlist:",
            deleteError
          );
          throw new Error("Network error");
        }

        if (!del.ok) {
          const errorText = await del.text().catch(() => "Unknown error");
          console.error("Failed to remove from wishlist:", errorText);
          throw new Error("Failed to remove from wishlist");
        }

        setIsFavorited(false);
        setWishlistItemId(null);

        // Check if it's a book for the removal message
        const isBookForRemoval = Boolean(
          product.isBook ||
            product.attributes?.author ||
            product.tags?.includes("book")
        );

        toast({
          title: t("removedFromWishlist", "Eliminat din lista de dorințe"),
          description: isBookForRemoval
            ? t(
                "bookWishlistRemoved",
                "Cartea a fost eliminată din lista ta de dorințe."
              )
            : t(
                "wishlistRemoved",
                "Produsul a fost eliminat din lista ta de dorințe."
              ),
        });
      }
    } catch (error: any) {
      console.error("Wishlist operation error:", error);

      // Determine the error message based on error type
      let errorDescription = t(
        "wishlistToggleError",
        "Nu s-a putut actualiza lista de dorințe."
      );

      if (error.message === "Network error") {
        errorDescription = t(
          "networkError",
          "Eroare de conexiune. Verifică conexiunea la internet."
        );
      } else if (error.message?.includes("Foreign key")) {
        errorDescription = t(
          "productNotAvailable",
          "Acest produs nu poate fi adăugat la lista de dorințe momentan."
        );
      }

      toast({
        title: "Eroare",
        description: errorDescription,
        variant: "destructive",
      });
    } finally {
      setIsFavoriteLoading(false);
    }
  };

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
        title: "Eroare",
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

  return {
    isFavorited,
    isFavoriteLoading,
    isAddingToCart,
    justAddedToCart,
    handleShare,
    handleFavorite,
    handleQuickAddToCart,
  };
}
