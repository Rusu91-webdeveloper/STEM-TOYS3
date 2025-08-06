"use client";

import { Loader2, ShoppingCart } from "lucide-react";
import React, { useState, useEffect } from "react";

import { useShoppingCart } from "../hooks/useShoppingCart";

import { MiniCart } from "./MiniCart";

interface CartButtonProps {
  className?: string;
  variant?: "default" | "header";
}

export function CartButton({
  className = "",
  variant = "default",
}: CartButtonProps) {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [showLoading, setShowLoading] = useState(false);
  const { isLoading, items } = useShoppingCart();

  // Show loading state immediately but with a subtle animation
  useEffect(() => {
    if (isLoading) {
      // Show loading immediately for better perceived performance
      setShowLoading(true);
      return undefined;
    }
    // Hide loading after a short delay to avoid flashing
    const timeoutId = setTimeout(() => setShowLoading(false), 100);
    return () => clearTimeout(timeoutId);
  }, [isLoading]);

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);

  const itemCount = items.reduce((acc, item) => acc + item.quantity, 0);

  // Default styling based on variant
  const defaultClassName =
    variant === "header"
      ? "flex items-center justify-center relative p-1.5 md:p-2 rounded-md text-gray-700 hover:bg-gray-100 hover:text-indigo-600 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 cursor-pointer transition-colors"
      : "flex items-center justify-center relative p-1.5 md:p-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm transition-all touch-target";

  // Badge styling based on variant
  const badgeClassName =
    variant === "header"
      ? "absolute -top-1 -right-1 bg-indigo-600 text-white text-xs rounded-full w-4 h-4 md:w-5 md:h-5 flex items-center justify-center font-bold"
      : "absolute -top-1 -right-1 bg-white text-indigo-700 text-xs font-bold rounded-full w-4 h-4 md:w-5 md:h-5 flex items-center justify-center border border-indigo-100 shadow-sm";

  // Icon styling based on variant
  const iconClassName =
    variant === "header"
      ? "h-5 w-5 md:h-6 md:w-6 lg:h-6 lg:w-6"
      : "h-4 w-4 md:h-5 md:w-5";

  return (
    <>
      <button
        onClick={openCart}
        className={`${defaultClassName} ${className}`}
        aria-label="Open cart"
      >
        {showLoading ? (
          <div className="relative">
            <ShoppingCart
              className={`${iconClassName} ${variant === "header" ? "text-gray-700" : "text-white opacity-70"}`}
            />
            <Loader2
              className={`${iconClassName} animate-spin ${variant === "header" ? "text-gray-700" : "text-white"} absolute top-0 left-0`}
            />
          </div>
        ) : (
          <>
            <ShoppingCart
              className={`${iconClassName} ${variant === "header" ? "text-gray-700" : "text-white"}`}
            />
            {itemCount > 0 && (
              <span className={badgeClassName}>
                {itemCount > 9 ? "9+" : itemCount}
              </span>
            )}
          </>
        )}
      </button>

      <MiniCart isOpen={isCartOpen} onClose={closeCart} />
    </>
  );
}
