/**
 * TikTok Pixel Component for Romanian E-commerce Tracking
 *
 * TikTok uses its own pixel SDK with the `ttq` API
 * This component loads config from database and initializes tracking
 */

"use client";

import { useEffect, useState } from "react";
import Script from "next/script";

interface TikTokPixelConfig {
  pixelId: string;
  isActive: boolean;
}

declare global {
  interface Window {
    ttq: any;
    TiktokAnalyticsObject: string;
    trackTikTokView: (productId: string, productName: string, price: number) => void;
    trackTikTokAddToCart: (productId: string, productName: string, price: number, quantity: number) => void;
    trackTikTokPurchase: (orderId: string, value: number, productIds: string[], currency?: string) => void;
    trackTikTokInitiateCheckout: (value: number, productIds: string[], numItems: number) => void;
  }
}

export default function TikTokPixel() {
  const [config, setConfig] = useState<TikTokPixelConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch config from API
  useEffect(() => {
    async function fetchConfig() {
      try {
        const response = await fetch("/api/admin/pixels/tiktok/config");
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data?.isActive) {
            setConfig(data.data);
          }
        }
      } catch (error) {
        console.error("Failed to fetch TikTok pixel config:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchConfig();
  }, []);

  // Initialize tracking functions
  useEffect(() => {
    if (typeof window !== "undefined" && config?.pixelId) {
      // Track product view
      window.trackTikTokView = (
        productId: string,
        productName: string,
        price: number
      ) => {
        if (window.ttq) {
          window.ttq.track("ViewContent", {
            content_id: productId,
            content_name: productName,
            content_type: "product",
            value: price,
            currency: "RON",
          });
        }
      };

      // Track add to cart
      window.trackTikTokAddToCart = (
        productId: string,
        productName: string,
        price: number,
        quantity: number
      ) => {
        if (window.ttq) {
          window.ttq.track("AddToCart", {
            content_id: productId,
            content_name: productName,
            content_type: "product",
            value: price * quantity,
            currency: "RON",
            quantity: quantity,
          });
        }
      };

      // Track purchase
      window.trackTikTokPurchase = (
        orderId: string,
        value: number,
        productIds: string[],
        currency: string = "RON"
      ) => {
        if (window.ttq) {
          window.ttq.track("CompletePayment", {
            content_ids: productIds,
            content_type: "product",
            value: value,
            currency: currency,
            order_id: orderId,
          });
        }
      };

      // Track initiate checkout
      window.trackTikTokInitiateCheckout = (
        value: number,
        productIds: string[],
        numItems: number
      ) => {
        if (window.ttq) {
          window.ttq.track("InitiateCheckout", {
            content_ids: productIds,
            content_type: "product",
            value: value,
            currency: "RON",
            quantity: numItems,
          });
        }
      };
    }
  }, [config]);

  // Don't render anything while loading or if no config
  if (isLoading || !config?.pixelId || !config?.isActive) {
    return null;
  }

  return (
    <>
      {/* TikTok Pixel Base Code */}
      <Script
        id="tiktok-pixel"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            !function (w, d, t) {
              w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
              ttq.load('${config.pixelId}');
              ttq.page();
            }(window, document, 'ttq');
          `,
        }}
      />

      {/* Track Romanian audience for TikTok */}
      <Script
        id="tiktok-pixel-custom"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.addEventListener('load', function() {
              if (window.ttq) {
                // Track Romanian visitor
                window.ttq.track('Browse', {
                  content_type: 'stem_toys',
                  market: 'romania',
                  language: 'ro'
                });
              }
            });
          `,
        }}
      />
    </>
  );
}

// Hook for using TikTok Pixel in components
export function useTikTokPixel() {
  return {
    trackView: (productId: string, productName: string, price: number) => {
      if (typeof window !== "undefined" && window.trackTikTokView) {
        window.trackTikTokView(productId, productName, price);
      }
    },

    trackAddToCart: (
      productId: string,
      productName: string,
      price: number,
      quantity: number
    ) => {
      if (typeof window !== "undefined" && window.trackTikTokAddToCart) {
        window.trackTikTokAddToCart(productId, productName, price, quantity);
      }
    },

    trackPurchase: (
      orderId: string,
      value: number,
      productIds: string[],
      currency?: string
    ) => {
      if (typeof window !== "undefined" && window.trackTikTokPurchase) {
        window.trackTikTokPurchase(orderId, value, productIds, currency);
      }
    },

    trackInitiateCheckout: (value: number, productIds: string[], numItems: number) => {
      if (typeof window !== "undefined" && window.trackTikTokInitiateCheckout) {
        window.trackTikTokInitiateCheckout(value, productIds, numItems);
      }
    },

    trackSearch: (searchQuery: string) => {
      if (typeof window !== "undefined" && window.ttq) {
        window.ttq.track("Search", {
          query: searchQuery,
        });
      }
    },

    trackPageView: () => {
      if (typeof window !== "undefined" && window.ttq) {
        window.ttq.page();
      }
    },
  };
}
