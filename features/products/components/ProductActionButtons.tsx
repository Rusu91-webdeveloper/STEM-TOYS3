"use client";

import React, { Component, ReactNode } from "react";
import { Heart, Share2, ShoppingCart, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

// Error Boundary for Product Action Buttons
class ProductActionButtonsErrorBoundary extends Component<
  { children: ReactNode; onError?: () => void },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode; onError?: () => void }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ProductActionButtons error:", error, errorInfo);
    this.props.onError?.();
  }

  render() {
    if (this.state.hasError) {
      // Render fallback UI - simple action buttons without functionality
      return (
        <div className="flex items-center space-x-1 flex-shrink-0">
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7 sm:h-8 sm:w-8"
            disabled
            title="Unavailable"
          >
            <Heart className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7 sm:h-8 sm:w-8"
            disabled
            title="Unavailable"
          >
            <Share2 className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7 sm:h-8 sm:w-8"
            disabled
            title="Unavailable"
          >
            <ShoppingCart className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

interface ProductActionButtonsProps {
  isFavorited: boolean;
  isFavoriteLoading: boolean;
  onFavoriteClick: () => void;
  onShareClick: () => void;
  onQuickAddToCart?: () => void;
  isAddingToCart?: boolean;
  justAddedToCart?: boolean;
  favoriteTitle: string;
  shareTitle: string;
  addToCartTitle?: string;
  size?: "sm" | "md";
  isBook?: boolean; // Flag to indicate if this is a book (wishlist not supported for books)
}

/**
 * Isolated component for product action buttons (favorite, share, add to cart)
 * with built-in error handling to prevent page breaks
 */
export function ProductActionButtons({
  isFavorited,
  isFavoriteLoading,
  onFavoriteClick,
  onShareClick,
  onQuickAddToCart,
  isAddingToCart = false,
  justAddedToCart = false,
  favoriteTitle,
  shareTitle,
  addToCartTitle = "Add to cart",
  size = "sm",
  isBook = false,
}: ProductActionButtonsProps) {
  const { toast } = useToast();

  const handleError = () => {
    toast({
      title: "Eroare",
      description:
        "O eroare a apărut la acțiunile produsului. Te rugăm să reîncarci pagina.",
      variant: "destructive",
    });
  };

  const buttonSize = size === "sm" ? "h-7 w-7 sm:h-8 sm:w-8" : "h-8 w-8";
  const iconSize = size === "sm" ? "h-3 w-3 sm:h-4 sm:w-4" : "h-4 w-4";

  return (
    <ProductActionButtonsErrorBoundary onError={handleError}>
      <div className="flex items-center space-x-1 flex-shrink-0">
        {/* Favorite Button - Now works for both products and books */}
        <Button
          variant={isFavorited ? "default" : "outline"}
          size="icon"
          className={buttonSize}
          onClick={onFavoriteClick}
          disabled={isFavoriteLoading}
          title={favoriteTitle}
        >
          <Heart
            className={`${iconSize} ${
              isFavorited ? "text-red-500 fill-current" : ""
            }`}
          />
        </Button>

        {/* Share Button */}
        <Button
          variant="outline"
          size="icon"
          className={buttonSize}
          onClick={onShareClick}
          title={shareTitle}
        >
          <Share2 className={iconSize} />
        </Button>

        {/* Quick Add to Cart Button (optional) */}
        {onQuickAddToCart && (
          <Button
            variant={justAddedToCart ? "default" : "outline"}
            size="icon"
            className={`${buttonSize} transition-all ${
              justAddedToCart
                ? "bg-green-600 hover:bg-green-700 border-green-600"
                : ""
            }`}
            onClick={onQuickAddToCart}
            disabled={isAddingToCart || justAddedToCart}
            title={addToCartTitle}
          >
            {justAddedToCart ? (
              <Check className={`${iconSize} text-white`} />
            ) : (
              <ShoppingCart className={iconSize} />
            )}
          </Button>
        )}
      </div>
    </ProductActionButtonsErrorBoundary>
  );
}
