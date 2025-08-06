"use client";

import { Loader2, ShoppingCart } from "lucide-react";
import React, { useState, useEffect } from "react";

import { useShoppingCart } from "../hooks/useShoppingCart";

import { MiniCart } from "./MiniCart";

interface CartButtonProps {
  className?: string;
}

export function CartButton({ className = "" }: CartButtonProps) {
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

  return (
    <>
      <button
        onClick={openCart}
        className={`flex items-center justify-center relative p-1.5 md:p-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm transition-all touch-target ${className}`}
        aria-label="Open cart"
      >
        {showLoading ? (
          <div className="relative">
            <ShoppingCart className="h-4 w-4 md:h-5 md:w-5 text-white opacity-70" />
            <Loader2 className="h-4 w-4 md:h-5 md:w-5 animate-spin text-white absolute top-0 left-0" />
          </div>
        ) : (
          <>
            <ShoppingCart className="h-4 w-4 md:h-5 md:w-5 text-white" />
            {itemCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-white text-indigo-700 text-xs font-bold rounded-full w-4 h-4 md:w-5 md:h-5 flex items-center justify-center border border-indigo-100 shadow-sm">
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
