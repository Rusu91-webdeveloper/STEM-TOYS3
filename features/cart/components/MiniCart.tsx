"use client";

import { X, ShoppingBag, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useState, useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useCart } from "@/features/cart/context/CartContext";
import { useOptimizedSession } from "@/lib/auth/SessionContext";
import { useCurrency } from "@/lib/currency";
import { useTranslation } from "@/lib/i18n";

import { BulkCartOperations } from "./BulkCartOperations";

interface MiniCartProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MiniCart({ isOpen, onClose }: MiniCartProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const { formatPrice } = useCurrency();
  const { status } = useOptimizedSession();
  const {
    items,
    isLoading,
    isEmpty,
    getTotal,
    removeItem,
    updateItemQuantity,
    clearCart,
    selectedItems,
    toggleItemSelection,
  } = useCart();

  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
  const [stockMap, setStockMap] = useState<Record<string, number>>({});
  const [showScrollIndicator, setShowScrollIndicator] = useState(false);
  const itemsContainerRef = useRef<HTMLDivElement>(null);

  // Load cart age info when cart opens
  useEffect(() => {
    if (isOpen && typeof window !== "undefined") {
      import("../lib/cartStorage")
        .then(({ getCartAgeInfo }) => {
          // setCartAge(ageInfo); // Removed as per edit hint
        })
        .catch(console.error);
    }
  }, [isOpen]);

  // Fetch stock information for items
  useEffect(() => {
    if (isOpen && items.length > 0) {
      async function fetchStocks() {
        try {
          const response = await fetch("/api/products/stock", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              items: items.map(item => ({
                productId: item.productId,
                isBook: item.isBook,
              })),
            }),
          });

          if (response.ok) {
            const stockData = await response.json();
            setStockMap(stockData);
          }
        } catch (error) {
          console.error("Failed to fetch stock information:", error);
        }
      }

      fetchStocks();
    }
  }, [isOpen, items]);

  // Handle scroll indicator
  useEffect(() => {
    const container = itemsContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const hasMoreContent = scrollHeight > clientHeight;
      const isNotAtBottom = scrollTop + clientHeight < scrollHeight - 10;
      setShowScrollIndicator(hasMoreContent && isNotAtBottom);
    };

    container.addEventListener("scroll", handleScroll);
    handleScroll(); // Check initial state

    return () => container.removeEventListener("scroll", handleScroll);
  }, [items]);

  if (!isOpen) {
    return null;
  }

  const handleCheckout = () => {
    // Close the cart immediately before starting the transition
    onClose();

    // Then initiate checkout
    setIsCheckoutLoading(true);
    // setCheckoutStatus("processing"); // Removed as per edit hint

    // Sync cart with server first
    // syncWithServer(); // Removed as per edit hint

    // First wait to ensure session is fully loaded
    // if (status === "loading") { // Removed as per edit hint
    //   console.log("Session status is loading, waiting...");
    //   const checkInterval = setInterval(() => {
    //     if (status !== "loading") {
    //       clearInterval(checkInterval);
    //       // Now we have the final authentication status
    //       proceedWithCheckout();
    //     }
    //   }, 100);
    // } else {
    // Session is already loaded, proceed directly
    proceedWithCheckout();
    // }
  };

  const proceedWithCheckout = () => {
    // Navigate based on authentication status
    if (status === "authenticated") {
      router.push("/checkout");
    } else {
      router.push("/auth/login?redirect=/checkout");
    }

    // Clean up loading state
    setTimeout(() => {
      setIsCheckoutLoading(false);
    }, 1000);
  };

  const handleClearCart = () => {
    clearCart();
    // setCartAge(null); // Removed as per edit hint
  };

  // Rest of the component remains the same...
  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Cart Panel - Enhanced Layout */}
      <div className="fixed right-0 top-0 h-full w-full max-w-lg bg-white shadow-xl transition-transform flex flex-col">
        {/* Header - Fixed at top */}
        <div className="flex items-center justify-between border-b p-4 bg-white z-10 flex-shrink-0">
          <div className="flex items-center gap-3">
            <ShoppingBag className="h-5 w-5" />
            <h2 className="text-lg font-semibold">
              {t("cart")} ({items.length})
            </h2>

            {/* Cart age indicator */}
            {/* Removed as per edit hint */}
            {/* Settings gear icon */}
            {/* Removed as per edit hint */}
          </div>

          <Button variant="ghost" size="sm" onClick={onClose} className="p-1">
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Main Content Area - Flexible with proper scrolling */}
        <div className="flex-1 flex flex-col min-h-0">
          {isLoading ? (
            <div className="flex flex-1 items-center justify-center p-8">
              <div className="text-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">{t("loading")}</p>
              </div>
            </div>
          ) : isEmpty ? (
            <div className="flex flex-1 items-center justify-center p-8">
              <div className="text-center">
                <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium">{t("emptyCart")}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Start adding items to your cart
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Bulk Operations - Fixed at top of content */}
              <div className="px-4 pt-4 pb-2 bg-white border-b flex-shrink-0">
                <BulkCartOperations />
              </div>

              {/* Items Container - Scrollable with proper height calculation */}
              <div className="flex-1 overflow-y-auto min-h-0 relative">
                {/* Scroll indicator */}
                {showScrollIndicator && (
                  <div className="absolute top-2 left-1/2 transform -translate-x-1/2 z-10 bg-gray-800 text-white px-3 py-1 rounded-full text-xs flex items-center gap-1 animate-pulse">
                    <ChevronDown className="h-3 w-3" />
                    Scroll for more
                  </div>
                )}

                <div className="p-4 space-y-4" ref={itemsContainerRef}>
                  {items.map(item => (
                    <div
                      key={`${item.id}-${item.variantId ?? ""}-${
                        item.selectedLanguage ?? ""
                      }`}
                      className="flex gap-3 pb-4 border-b last:border-b-0 group hover:bg-gray-50 rounded-lg p-2 -m-2 transition-colors"
                    >
                      {/* Selection Checkbox */}
                      <div className="flex items-start pt-2">
                        <Checkbox
                          checked={selectedItems.has(item.id)}
                          onCheckedChange={() => toggleItemSelection(item.id)}
                          className="mt-1"
                        />
                      </div>

                      {/* Item image */}
                      <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="h-full w-full object-cover object-center"
                          />
                        ) : (
                          <div className="h-full w-full bg-gray-100 flex items-center justify-center">
                            <ShoppingBag className="h-6 w-6 text-gray-400" />
                          </div>
                        )}
                      </div>

                      {/* Item details */}
                      <div className="flex flex-1 flex-col">
                        <div className="flex justify-between">
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium text-gray-900 truncate">
                              {item.name}
                            </h4>
                            {item.selectedLanguage && (
                              <p className="text-xs text-gray-500">
                                Language: {item.selectedLanguage.toUpperCase()}
                              </p>
                            )}
                            {item.isBook && (
                              <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mt-1">
                                Digital Book
                              </span>
                            )}
                          </div>
                          <p className="text-sm font-medium text-gray-900 ml-2 flex-shrink-0">
                            {formatPrice(item.price)}
                          </p>
                        </div>

                        {/* Quantity and remove */}
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                updateItemQuantity(
                                  item.id,
                                  item.quantity - 1,
                                  item.variantId,
                                  item.selectedLanguage
                                )
                              }
                              disabled={item.quantity <= 1}
                              className="h-6 w-6 p-0 hover:bg-gray-100 transition-colors"
                            >
                              -
                            </Button>
                            <span className="text-sm font-medium min-w-[20px] text-center">
                              {item.quantity}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                updateItemQuantity(
                                  item.id,
                                  item.quantity + 1,
                                  item.variantId,
                                  item.selectedLanguage
                                )
                              }
                              className="h-6 w-6 p-0 hover:bg-gray-100 transition-colors"
                              disabled={
                                stockMap[item.id] !== undefined &&
                                item.quantity >= stockMap[item.id]
                              }
                            >
                              +
                            </Button>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              removeItem(
                                item.id,
                                item.variantId,
                                item.selectedLanguage
                              )
                            }
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 p-1 transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer - Fixed at bottom with enhanced styling */}
              <div className="border-t bg-white p-4 space-y-4 flex-shrink-0 shadow-lg">
                {/* Total with enhanced styling */}
                <div className="flex justify-between items-center py-2">
                  <span className="text-lg font-semibold text-gray-900">
                    {t("total")}
                  </span>
                  <span className="text-xl font-bold text-gray-900">
                    {formatPrice(getTotal())}
                  </span>
                </div>

                {/* Action buttons with improved spacing */}
                <div className="space-y-3">
                  <Button
                    onClick={handleCheckout}
                    disabled={isCheckoutLoading}
                    className="w-full h-12 text-base font-semibold bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
                  >
                    {isCheckoutLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        {t("processing")}
                      </div>
                    ) : (
                      t("checkout")
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    onClick={handleClearCart}
                    className="w-full h-10 border-gray-300 hover:bg-gray-50 transition-colors"
                  >
                    {t("clearCart")}
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Cart Settings Modal */}
      {/* Removed as per edit hint */}
    </div>
  );
}
