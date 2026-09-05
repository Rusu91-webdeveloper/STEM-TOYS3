"use client";

import { Heart, Share2, ShoppingCart, Check } from "lucide-react";
import React, { Component, ReactNode } from "react";

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
  disableQuickAddToCart?: boolean;
  quickAddDisabledTitle?: string;
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
  disableQuickAddToCart = false,
  quickAddDisabledTitle = "Out of stock",
  size = "sm",
  isBook: _isBook = false,
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

  const buttonSize = size === "sm" ? "h-8 w-8 sm:h-9 sm:w-9" : "h-10 w-10";
  const iconSize = size === "sm" ? "h-3 w-3 sm:h-4 sm:w-4" : "h-4 w-4";

  return (
    <ProductActionButtonsErrorBoundary onError={handleError}>
      <div className="flex flex-shrink-0 items-center gap-2">
        {/* Favorite Button - Red theme */}
        <Button
          variant={isFavorited ? "default" : "outline"}
          size="icon"
          className={`${buttonSize} transition ${
            isFavorited
              ? "bg-rose-600 hover:bg-rose-700 text-white border-rose-600 shadow-md shadow-rose-200"
              : "border-slate-200 bg-white text-slate-500 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
          }`}
          onClick={onFavoriteClick}
          disabled={isFavoriteLoading}
          title={favoriteTitle}
        >
          <Heart
            className={`${iconSize} ${isFavorited ? "fill-current" : ""}`}
          />
        </Button>

        {/* Share Button - Blue theme */}
        <Button
          variant="outline"
          size="icon"
          className={`${buttonSize} border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600`}
          onClick={onShareClick}
          title={shareTitle}
        >
          <Share2 className={iconSize} />
        </Button>

        {/* Quick Add to Cart Button - Black theme */}
        {onQuickAddToCart && (
          <Button
            variant={justAddedToCart ? "default" : "outline"}
            size="icon"
            className={`${buttonSize} transition-all ${
              justAddedToCart
                ? "bg-green-600 hover:bg-green-700 border-green-600 text-white"
                : "border-[#0b1220] bg-[#0b1220] text-white shadow-[0_10px_20px_-12px_rgba(15,23,42,0.9)] hover:border-blue-600 hover:bg-blue-600 hover:text-white"
            }`}
            onClick={onQuickAddToCart}
            disabled={
              disableQuickAddToCart || isAddingToCart || justAddedToCart
            }
            title={
              disableQuickAddToCart ? quickAddDisabledTitle : addToCartTitle
            }
          >
            {justAddedToCart ? (
              <Check className={`${iconSize}`} />
            ) : (
              <ShoppingCart className={iconSize} />
            )}
          </Button>
        )}
      </div>
    </ProductActionButtonsErrorBoundary>
  );
}
