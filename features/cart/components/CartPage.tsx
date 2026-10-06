"use client";

import { ShoppingBag, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";

import { CodPaymentNotice } from "@/components/storefront/CodPaymentNotice";
import { Button } from "@/components/ui/button";
import { CartProductImage } from "@/features/cart/components/CartProductImage";
import { useCart } from "@/features/cart/context/CartContext";
import { useCartShippingEstimate } from "@/features/cart/hooks/useCartShippingEstimate";
import { useCurrency } from "@/lib/currency";
import type { PublicCODSettings } from "@/lib/pricing/cod-settings";
import { cn } from "@/lib/utils";

export default function CartPage({
  codSettings,
}: {
  codSettings: PublicCODSettings;
}) {
  const router = useRouter();
  const { formatPrice } = useCurrency();
  const {
    items,
    isLoading,
    isEmpty,
    getTotal,
    removeItem,
    updateItemQuantity,
    clearCart,
  } = useCart();

  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
  const [stockMap, setStockMap] = useState<Record<string, number>>({});
  const subtotal = getTotal();
  const { shippingCost, freeThreshold } = useCartShippingEstimate(
    subtotal,
    items.some(item => item.isBook !== true)
  );

  useEffect(() => {
    if (items.length > 0) {
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
  }, [items]);

  const handleCheckout = () => {
    setIsCheckoutLoading(true);
    router.push("/checkout");
  };

  const needsMoreForFreeShipping = freeThreshold && subtotal < freeThreshold;
  const total = subtotal + (shippingCost ?? 0);

  if (isEmpty && !isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-slate-100">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <div className="mb-8">
              <ShoppingBag className="h-24 w-24 mx-auto text-slate-300" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-4">
              Coșul tău este gol
            </h1>
            <p className="text-slate-600 mb-8">
              Adaugă produse pentru a putea plasa o comandă
            </p>
            <Link href="/products">
              <Button
                size="lg"
                className="bg-slate-900 hover:bg-slate-800 text-white"
              >
                Descoperă produsele noastre
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-slate-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              Coșul tău de cumpărături
            </h1>
            <p className="text-slate-600">
              {items.length} {items.length === 1 ? "produs" : "produse"} în coș
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {items.map(item => {
                const stock = stockMap[item.productId];
                const isOutOfStock = !item.isBook && stock === 0;
                const isLowStock =
                  !item.isBook && stock !== undefined && stock < 5;

                return (
                  <div
                    key={item.id}
                    className={cn(
                      "bg-white rounded-lg shadow-sm p-6 transition-all",
                      isOutOfStock && "opacity-60"
                    )}
                  >
                    <div className="flex gap-6">
                      <CartProductImage
                        src={item.image}
                        name={item.name}
                        sizes="96px"
                        className="w-24 h-24 rounded-lg"
                      />
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold text-slate-900">
                            {item.name}
                          </h3>
                          <button
                            onClick={() =>
                              removeItem(
                                item.productId,
                                item.variantId,
                                item.selectedLanguage
                              )
                            }
                            className="text-red-600 hover:text-red-800 transition-colors"
                          >
                            <span className="sr-only">Șterge</span>×
                          </button>
                        </div>

                        {isOutOfStock && (
                          <p className="text-red-600 text-sm mb-2">
                            Stoc epuizat
                          </p>
                        )}

                        {isLowStock && !isOutOfStock && (
                          <p className="text-orange-600 text-sm mb-2">
                            Doar {stock} bucăți în stoc
                          </p>
                        )}

                        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <button
                              aria-label={`Scade cantitatea pentru ${item.name}`}
                              onClick={() =>
                                updateItemQuantity(
                                  item.productId,
                                  Math.max(1, item.quantity - 1),
                                  item.variantId,
                                  item.selectedLanguage
                                )
                              }
                              disabled={item.quantity <= 1 || isOutOfStock}
                              className="min-h-11 min-w-11 rounded-lg border border-slate-300 px-3 py-1 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              −
                            </button>
                            <span className="px-4 py-1 font-semibold">
                              {item.quantity}
                            </span>
                            <button
                              aria-label={`Crește cantitatea pentru ${item.name}`}
                              onClick={() =>
                                updateItemQuantity(
                                  item.productId,
                                  item.quantity + 1,
                                  item.variantId,
                                  item.selectedLanguage
                                )
                              }
                              disabled={
                                isOutOfStock ||
                                (stock !== undefined && item.quantity >= stock)
                              }
                              className="min-h-11 min-w-11 rounded-lg border border-slate-300 px-3 py-1 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              +
                            </button>
                          </div>
                          <div className="ml-auto shrink-0 text-right whitespace-nowrap">
                            <p className="text-lg font-bold text-slate-900">
                              {formatPrice(item.price * item.quantity)}
                            </p>
                            <p className="text-sm text-slate-500">
                              {formatPrice(item.price)} / buc
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              <button
                onClick={clearCart}
                className="w-full py-3 text-red-600 hover:text-red-800 font-medium transition-colors"
              >
                Golește coșul
              </button>
            </div>

            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-lg p-6 sticky top-4">
                <h2 className="text-xl font-bold text-slate-900 mb-6">
                  Rezumat comandă
                </h2>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal</span>
                    <span className="font-medium">{formatPrice(subtotal)}</span>
                  </div>

                  {needsMoreForFreeShipping && freeThreshold && (
                    <div className="text-sm text-indigo-600 bg-indigo-50 p-3 rounded-lg">
                      Mai adaugă {formatPrice(freeThreshold - subtotal)} pentru
                      livrare gratuită!
                    </div>
                  )}

                  <div className="flex justify-between text-slate-600">
                    <span>Livrare</span>
                    <span className="font-medium">
                      {shippingCost === null
                        ? "Se calculează la finalizare"
                        : shippingCost > 0
                          ? formatPrice(shippingCost)
                          : "GRATUIT"}
                    </span>
                  </div>

                  <div className="border-t border-slate-200 pt-3 mt-3">
                    <div className="flex justify-between text-lg font-bold text-slate-900">
                      <span>Total estimat</span>
                      <span>
                        {formatPrice(total)}
                        {shippingCost === null ? " + livrare" : ""}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-slate-500">
                      Costul final al livrării și eventualele costuri pentru
                      expedieri separate se confirmă la finalizare.
                    </p>
                  </div>
                </div>

                {items.some(item => item.isBook !== true) && (
                  <div className="mb-4">
                    <CodPaymentNotice settings={codSettings} />
                  </div>
                )}

                <Button
                  onClick={handleCheckout}
                  disabled={
                    isCheckoutLoading || items.length === 0 || isLoading
                  }
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white py-6 text-lg"
                >
                  {isCheckoutLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="h-5 w-5 animate-spin border-2 border-current border-t-transparent rounded-full" />
                      Se încarcă...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      Continuă către plată
                      <ArrowRight className="h-5 w-5" />
                    </span>
                  )}
                </Button>

                <Link
                  href="/products"
                  className="block text-center text-indigo-600 hover:text-indigo-800 font-medium mt-4"
                >
                  Continuă cumpărăturile
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
