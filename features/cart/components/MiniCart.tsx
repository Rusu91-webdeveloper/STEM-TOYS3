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
            className="fixed inset-0 z-[10000] bg-slate-900/40 backdrop-blur-sm transition-opacity"
            onClick={onClose}
          />

          {/* Cart Panel - Professional Light Theme */}
          <div
            className="pointer-events-auto fixed right-0 top-0 z-[10001] flex h-full w-full sm:w-[400px] md:w-[450px] max-w-full flex-col border-l border-slate-200 bg-white text-slate-900 shadow-2xl transition-transform"
          >
            {/* Header - Fixed at top */}
            <div
              className="flex flex-shrink-0 items-center justify-between border-b border-slate-100 bg-white/80 px-5 py-4 backdrop-blur-md"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-50 text-sky-600">
                  <ShoppingBag className="h-5 w-5" />
                </span>
                <h2 className="text-lg font-bold tracking-tight text-slate-900">
                  {t("cart")} <span className="text-slate-500 font-medium">({items.length})</span>
                </h2>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 rounded-full p-0 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Main Content Area - Flexible with proper scrolling */}
            <div className="flex-1 flex flex-col min-h-0 bg-slate-50/50">
              {isLoading ? (
                <div className="flex flex-1 items-center justify-center p-8">
                  <div className="text-center">
                    <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
                    <p className="text-sm font-medium text-slate-500">
                      {t("loading")}
                    </p>
                  </div>
                </div>
              ) : isEmpty ? (
                <div className="flex flex-1 items-center justify-center p-8">
                  <div className="text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                      <ShoppingBag className="h-8 w-8 text-slate-400" />
                    </div>
                    <p className="text-lg font-semibold text-slate-900">
                      {t("emptyCart")}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Start adding items to your cart
                    </p>
                    <Button 
                      onClick={onClose}
                      className="mt-6 rounded-full bg-slate-900 px-6 text-white hover:bg-slate-800"
                    >
                      Continue Shopping
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Bulk Operations - Fixed at top of content */}
                  <div className="flex-shrink-0 border-b border-slate-200 bg-white px-4 py-3">
                    <BulkCartOperations />
                  </div>

                  {/* Items Container - Scrollable with proper height calculation */}
                  <div className="relative min-h-0 flex-1 overflow-y-auto">
                    {/* Scroll indicator */}
                    {showScrollIndicator && (
                      <div className="absolute left-1/2 top-2 z-10 flex -translate-x-1/2 items-center gap-1 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-slate-600 shadow-sm border border-slate-200 backdrop-blur-sm">
                        <ChevronDown className="h-3 w-3" />
                        Scroll for more
                      </div>
                    )}

                    <div className="space-y-3 p-4" ref={itemsContainerRef}>
                      {items.map(item => (
                        <div
                          key={`${item.id}-${item.variantId ?? ""}-${
                            item.selectedLanguage ?? ""
                          }`}
                          className="group flex gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition-all hover:border-sky-200 hover:shadow-md"
                        >
                          {/* Selection Checkbox */}
                          <div className="flex items-start pt-1">
                            <Checkbox
                              checked={selectedItems.has(item.id)}
                              onCheckedChange={() =>
                                toggleItemSelection(item.id)
                              }
                              className="mt-1 border-slate-300 text-sky-600 data-[state=checked]:bg-sky-500 data-[state=checked]:border-sky-500"
                            />
                          </div>

                          {/* Item image */}
                          <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl border border-slate-100 bg-slate-50">
                            {item.image ? (
                              <img
                                src={item.image}
                                alt={item.name}
                                className="h-full w-full object-cover object-center"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-slate-300">
                                <ShoppingBag className="h-6 w-6" />
                              </div>
                            )}
                          </div>

                          {/* Item details */}
                          <div className="flex flex-1 flex-col justify-between">
                            <div>
                              <div className="flex justify-between gap-2">
                                <h4 className="line-clamp-2 text-sm font-semibold text-slate-900 leading-tight">
                                  {item.name}
                                </h4>
                                <p className="flex-shrink-0 text-sm font-bold text-slate-900">
                                  {formatPrice(item.price)}
                                </p>
                              </div>
                              
                              <div className="mt-1 flex flex-wrap gap-1">
                                {item.selectedLanguage && (
                                  <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                                    {item.selectedLanguage.toUpperCase()}
                                  </span>
                                )}
                                {item.isBook && (
                                  <span className="inline-flex items-center rounded-md bg-sky-50 px-2 py-0.5 text-[10px] font-medium text-sky-700 border border-sky-100">
                                    Digital Book
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Quantity and remove */}
                            <div className="flex items-center justify-between mt-3">
                              <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5">
                                <button
                                  onClick={() =>
                                    updateItemQuantity(
                                      item.productId,
                                      item.quantity - 1,
                                      item.variantId,
                                      item.selectedLanguage
                                    )
                                  }
                                  disabled={item.quantity <= 1}
                                  className="flex h-6 w-6 items-center justify-center rounded-md bg-white text-slate-600 shadow-sm transition-colors hover:bg-slate-100 disabled:opacity-50"
                                >
                                  -
                                </button>
                                <span className="min-w-[24px] text-center text-xs font-semibold text-slate-900">
                                  {item.quantity}
                                </span>
                                <button
                                  onClick={() =>
                                    updateItemQuantity(
                                      item.productId,
                                      item.quantity + 1,
                                      item.variantId,
                                      item.selectedLanguage
                                    )
                                  }
                                  disabled={
                                    stockMap[item.id] !== undefined &&
                                    item.quantity >= stockMap[item.id]
                                  }
                                  className="flex h-6 w-6 items-center justify-center rounded-md bg-white text-slate-600 shadow-sm transition-colors hover:bg-slate-100 disabled:opacity-50"
                                >
                                  +
                                </button>
                              </div>
                              <button
                                onClick={() =>
                                  removeItem(
                                    item.productId,
                                    item.variantId,
                                    item.selectedLanguage
                                  )
                                }
                                className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-500"
                                aria-label="Remove item"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Footer - Fixed at bottom with professional styling */}
                  <div
                    className="flex-shrink-0 border-t border-slate-200 bg-white p-5 shadow-[0_-10px_30px_rgba(0,0,0,0.03)]"
                  >
                    {/* Shipping breakdown */}
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
                        <div className="mb-5 space-y-2.5">
                          {/* Subtotal */}
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-500">
                              {t("subtotal", "Subtotal")}
                            </span>
                            <span className="font-semibold text-slate-900">
                              {formatPrice(cartSubtotal)}
                            </span>
                          </div>

                          {/* Shipping */}
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-500">
                              {t("shipping", "Livrare")}
                            </span>
                            <span className="font-medium">
                              {shipping === 0 ? (
                                <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md text-xs font-bold">Gratuit</span>
                              ) : (
                                <span className="text-slate-900">{formatPrice(shipping)}</span>
                              )}
                            </span>
                          </div>

                          {/* Free shipping progress message */}
                          {showFreeShippingMessage && (
                            <div className="mt-3 overflow-hidden rounded-xl bg-sky-50 border border-sky-100">
                              <div className="p-3 text-xs font-medium">
                                {freeShippingRemaining > 0 ? (
                                  <div className="flex flex-col gap-2">
                                    <div className="flex justify-between text-sky-800">
                                      <span>Adaugă {formatPrice(freeShippingRemaining)} {t("moreForFreeShipping", "pentru transport gratuit")}</span>
                                    </div>
                                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-sky-200/50">
                                      <div 
                                        className="h-full rounded-full bg-sky-500 transition-all duration-500"
                                        style={{ width: `${Math.min(100, (cartSubtotal / threshold) * 100)}%` }}
                                      />
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2 text-emerald-700">
                                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                                      <Check className="h-3 w-3" />
                                    </span>
                                    <span>Ai accesat transportul gratuit!</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Total */}
                          <div className="flex items-center justify-between border-t border-slate-100 pt-3 mt-3">
                            <span className="text-base font-bold text-slate-900">
                              {t("total", "Total")}
                            </span>
                            <span className="text-xl font-black text-slate-900">
                              {formatPrice(total)}
                            </span>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Action buttons */}
                    <div className="flex flex-col gap-2.5">
                      <Button
                        onClick={handleCheckout}
                        disabled={isCheckoutLoading}
                        className="h-12 w-full rounded-xl bg-slate-900 text-base font-bold text-white shadow-md transition-all hover:bg-slate-800 hover:shadow-lg active:scale-[0.98]"
                      >
                        {isCheckoutLoading ? (
                          <div className="flex items-center gap-2">
                            <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                            <span>{t("processing")}</span>
                          </div>
                        ) : (
                          t("checkout")
                        )}
                      </Button>

                      <Button
                        variant="ghost"
                        onClick={handleClearCart}
                        className="h-10 w-full rounded-xl text-sm font-medium text-slate-500 hover:bg-rose-50 hover:text-rose-600"
                      >
                        {t("clearCart")}
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>,
        document.body
      )
    : null;
}
