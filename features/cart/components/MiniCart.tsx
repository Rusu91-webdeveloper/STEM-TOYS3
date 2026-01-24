"use client";

import { X, ShoppingBag, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useCart } from "@/features/cart/context/CartContext";
import { useOptimizedSession } from "@/lib/auth/SessionContext";
import { useCurrency } from "@/lib/currency";
import { useTranslation } from "@/lib/i18n";
import {
  glassCardClass,
  glassPanelClass,
  gradientButtonClass,
} from "@/features/home/components/homeTheme";
import { cn } from "@/lib/utils";

import { fetchShippingSettings } from "@/features/checkout/lib/checkoutApi";

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
    getCartTotal,
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
  const [isClient, setIsClient] = useState(false);

  // Dynamic shipping: delivery price and free threshold from admin settings
  const [deliveryPrice, setDeliveryPrice] = useState<number>(0);
  const [freeThreshold, setFreeThreshold] = useState<number | null>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    let isActive = true;

    async function loadShippingSettings() {
      try {
        const settings = await fetchShippingSettings();
        if (!isActive) return;
        const delivery = settings?.deliveryPrice;
        const free = settings?.freeThreshold;
        setDeliveryPrice(
          delivery?.active && delivery?.price
            ? parseFloat(String(delivery.price)) || 0
            : 0
        );
        setFreeThreshold(
          free?.active && free?.price
            ? parseFloat(String(free.price)) || null
            : null
        );
      } catch (e) {
        if (isActive) {
          setDeliveryPrice(0);
          setFreeThreshold(null);
        }
      }
    }

    loadShippingSettings();
    return () => {
      isActive = false;
    };
  }, [isOpen]);

  // Prevent body scroll when mini cart is open
  useEffect(() => {
    if (isOpen) {
      try {
        const previous = document.body.style.overflow;
        document.body.setAttribute("data-prev-overflow", previous || "");
        document.body.style.overflow = "hidden";
      } catch {}
    } else {
      try {
        const previous = document.body.getAttribute("data-prev-overflow") || "";
        document.body.style.overflow = previous;
        document.body.removeAttribute("data-prev-overflow");
      } catch {}
    }

    return () => {
      try {
        const previous = document.body.getAttribute("data-prev-overflow") || "";
        document.body.style.overflow = previous;
        document.body.removeAttribute("data-prev-overflow");
      } catch {}
    };
  }, [isOpen]);

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
  return isClient && isOpen
    ? createPortal(
        <div className="fixed inset-0 z-[10000] overflow-hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-[10000] bg-slate-950/75 backdrop-blur-sm transition-opacity"
            onClick={onClose}
          />

          {/* Cart Panel - Enhanced Layout */}
          <div
            className="pointer-events-auto fixed right-0 top-0 z-[10001] flex h-full w-full max-w-lg flex-col border-l border-white/10 bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-slate-100 shadow-[0_0_40px_rgba(76,29,149,0.45)] backdrop-blur-xl transition-transform"
          >
            {/* Header - Fixed at top */}
            <div
              className={`${glassPanelClass} flex flex-shrink-0 items-center justify-between border-white/10 px-5 py-4 text-slate-100`}
            >
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-slate-100 shadow-inner shadow-white/10">
                  <ShoppingBag className="h-5 w-5" />
                </span>
                <h2 className="text-lg font-semibold tracking-tight">
                  {t("cart")} ({items.length})
                </h2>

                {/* Cart age indicator */}
                {/* Removed as per edit hint */}
                {/* Settings gear icon */}
                {/* Removed as per edit hint */}
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="p-1 text-slate-300 hover:bg-white/10 hover:text-slate-100"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Main Content Area - Flexible with proper scrolling */}
            <div className="flex-1 flex flex-col min-h-0">
              {isLoading ? (
                <div className="flex flex-1 items-center justify-center p-8">
                  <div className="text-center">
                    <div className="mx-auto mb-2 h-8 w-8 animate-spin rounded-full border-2 border-sky-400 border-t-transparent" />
                    <p className="text-sm text-slate-300">
                      {t("loading")}
                    </p>
                  </div>
                </div>
              ) : isEmpty ? (
                <div className="flex flex-1 items-center justify-center p-8">
                  <div className="text-center">
                    <ShoppingBag className="mx-auto mb-4 h-12 w-12 text-slate-500" />
                    <p className="text-lg font-medium text-slate-100">
                      {t("emptyCart")}
                    </p>
                    <p className="mt-1 text-sm text-slate-400">
                      Start adding items to your cart
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Bulk Operations - Fixed at top of content */}
                  <div className="flex-shrink-0 border-b border-white/10 bg-white/5 px-4 pb-2 pt-4 backdrop-blur">
                    <BulkCartOperations />
                  </div>

                  {/* Items Container - Scrollable with proper height calculation */}
                  <div className="relative min-h-0 flex-1 overflow-y-auto">
                    {/* Scroll indicator */}
                    {showScrollIndicator && (
                      <div className="absolute left-1/2 top-2 z-10 flex -translate-x-1/2 items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-xs text-slate-100 shadow">
                        <ChevronDown className="h-3 w-3" />
                        Scroll for more
                      </div>
                    )}

                    <div className="space-y-4 p-4" ref={itemsContainerRef}>
                      {items.map(item => (
                        <div
                          key={`${item.id}-${item.variantId ?? ""}-${
                            item.selectedLanguage ?? ""
                          }`}
                          className="group -m-2 flex gap-3 rounded-2xl border border-transparent p-2 pb-4 transition-colors hover:border-white/10 hover:bg-white/5"
                        >
                          {/* Selection Checkbox */}
                          <div className="flex items-start pt-2">
                            <Checkbox
                              checked={selectedItems.has(item.id)}
                              onCheckedChange={() =>
                                toggleItemSelection(item.id)
                              }
                              className="mt-1 border-white/40 text-sky-300 data-[state=checked]:bg-sky-500 data-[state=checked]:text-white"
                            />
                          </div>

                          {/* Item image */}
                          <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl border border-white/10 bg-white/5">
                            {item.image ? (
                              <img
                                src={item.image}
                                alt={item.name}
                                className="h-full w-full object-cover object-center"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-slate-400">
                                <ShoppingBag className="h-6 w-6" />
                              </div>
                            )}
                          </div>

                          {/* Item details */}
                          <div className="flex flex-1 flex-col">
                            <div className="flex justify-between">
                              <div className="min-w-0 flex-1">
                                <h4 className="truncate text-sm font-semibold text-slate-100">
                                  {item.name}
                                </h4>
                                {item.selectedLanguage && (
                                  <p className="text-xs text-slate-400">
                                    Language:{" "}
                                    {item.selectedLanguage.toUpperCase()}
                                  </p>
                                )}
                                {item.isBook && (
                                  <span className="mt-1 inline-block rounded-full border border-sky-400/40 bg-sky-500/15 px-2 py-1 text-xs text-sky-100">
                                    Digital Book
                                  </span>
                                )}
                              </div>
                              <p className="ml-2 flex-shrink-0 text-sm font-semibold text-slate-100">
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
                                      item.productId,
                                      item.quantity - 1,
                                      item.variantId,
                                      item.selectedLanguage
                                    )
                                  }
                                  disabled={item.quantity <= 1}
                                  className="h-6 w-6 border-white/20 bg-white/5 p-0 text-slate-100 hover:bg-white/10"
                                >
                                  -
                                </Button>
                                <span className="min-w-[20px] text-center text-sm font-medium text-slate-100">
                                  {item.quantity}
                                </span>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    updateItemQuantity(
                                      item.productId,
                                      item.quantity + 1,
                                      item.variantId,
                                      item.selectedLanguage
                                    )
                                  }
                                  className="h-6 w-6 border-white/20 bg-white/5 p-0 text-slate-100 hover:bg-white/10"
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
                                    item.productId,
                                    item.variantId,
                                    item.selectedLanguage
                                  )
                                }
                                className="opacity-0 p-1 text-rose-400 transition-colors hover:bg-rose-500/15 hover:text-rose-200 group-hover:opacity-100"
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
                  <div
                    className={`${glassPanelClass} flex-shrink-0 space-y-4 border-white/10 p-4 text-slate-100 shadow-lg`}
                  >
                    {/* Shipping breakdown – delivery & threshold from admin settings */}
                    {(() => {
                      const cartSubtotal = getCartTotal();
                      const hasPhysicalItems = items.some(item => !item.isBook);
                      const threshold = freeThreshold ?? 0;
                      const shipping = hasPhysicalItems
                        ? threshold > 0 && cartSubtotal >= threshold
                          ? 0
                          : deliveryPrice
                        : 0;
                      const total = cartSubtotal + shipping;
                      const freeShippingRemaining =
                        hasPhysicalItems &&
                        threshold > 0 &&
                        cartSubtotal < threshold
                          ? Math.max(0, threshold - cartSubtotal)
                          : 0;
                      const showFreeShippingMessage =
                        hasPhysicalItems && threshold > 0;

                      return (
                        <>
                          {/* Subtotal */}
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-300">
                              {t("subtotal", "Subtotal")}
                            </span>
                            <span className="font-semibold text-slate-200">
                              {formatPrice(cartSubtotal)}
                            </span>
                          </div>

                          {/* Shipping */}
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-300">
                              {t("shipping", "Livrare")}
                            </span>
                            <span className="font-semibold text-slate-200">
                              {shipping === 0 ? (
                                <span className="text-emerald-300">Gratuit</span>
                              ) : (
                                formatPrice(shipping)
                              )}
                            </span>
                          </div>

                          {/* Free shipping progress message – only when threshold from admin */}
                          {showFreeShippingMessage && (
                            <div className="rounded-md bg-sky-500/10 p-2 text-xs text-sky-200">
                              {freeShippingRemaining > 0 ? (
                                <span>
                                  Adaugă {formatPrice(freeShippingRemaining)}{" "}
                                  {t("moreForFreeShipping", "pentru transport gratuit")}
                                </span>
                              ) : (
                                <span className="text-emerald-300">
                                  🎉 Ai accesat transportul gratuit!
                                </span>
                              )}
                            </div>
                          )}

                          {/* Total */}
                          <div className="flex items-center justify-between border-t border-white/10 pt-2">
                            <span className="text-lg font-semibold text-slate-200">
                              {t("total", "Total")}
                            </span>
                            <span className="text-xl font-bold text-slate-100">
                              {formatPrice(total)}
                            </span>
                          </div>
                        </>
                      );
                    })()}

                    {/* Action buttons with improved spacing */}
                    <div className="space-y-3">
                      <Button
                        onClick={handleCheckout}
                        disabled={isCheckoutLoading}
                        className={cn(
                          "h-12 w-full text-base font-semibold transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]",
                          gradientButtonClass
                        )}
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
                        className="h-10 w-full border-white/20 bg-white/5 text-slate-100 transition-colors hover:border-white/30 hover:bg-white/10"
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
        </div>,
        document.body
      )
    : null;
}
