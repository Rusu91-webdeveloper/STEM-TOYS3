/**
 * Instagram Pixel Tracking Hook
 * 
 * Provides tracking functions for Instagram pixel events
 * Used for e-commerce tracking in Romanian market
 */

"use client";

import { useCallback } from "react";

declare global {
  interface Window {
    fbq: any;
    trackInstagramView: (productId: string, productName: string, price: number) => void;
    trackInstagramAddToCart: (productId: string, productName: string, price: number, quantity: number) => void;
    trackInstagramPurchase: (orderId: string, value: number, productIds: string[], currency?: string) => void;
    trackInstagramShare: (contentId: string, platform?: string) => void;
  }
}

export function useInstagramPixel() {
  // Track product view
  const trackView = useCallback(
    (productId: string, productName: string, price: number) => {
      if (typeof window !== "undefined" && window.trackInstagramView) {
        window.trackInstagramView(productId, productName, price);
      } else if (typeof window !== "undefined" && window.fbq) {
        // Fallback to direct fbq call
        window.fbq("track", "ViewContent", {
          content_ids: [productId],
          content_name: productName,
          content_type: "product",
          value: price,
          currency: "RON",
          custom_data: {
            source: "instagram",
            market: "romania",
          },
        });
      }
    },
    []
  );

  // Track add to cart
  const trackAddToCart = useCallback(
    (productId: string, productName: string, price: number, quantity: number) => {
      if (typeof window !== "undefined" && window.trackInstagramAddToCart) {
        window.trackInstagramAddToCart(productId, productName, price, quantity);
      } else if (typeof window !== "undefined" && window.fbq) {
        window.fbq("track", "AddToCart", {
          content_ids: [productId],
          content_name: productName,
          content_type: "product",
          value: price * quantity,
          currency: "RON",
          num_items: quantity,
          custom_data: {
            source: "instagram",
            market: "romania",
          },
        });
      }
    },
    []
  );

  // Track purchase
  const trackPurchase = useCallback(
    (orderId: string, value: number, productIds: string[], currency: string = "RON") => {
      if (typeof window !== "undefined" && window.trackInstagramPurchase) {
        window.trackInstagramPurchase(orderId, value, productIds, currency);
      } else if (typeof window !== "undefined" && window.fbq) {
        window.fbq("track", "Purchase", {
          content_ids: productIds,
          content_type: "product",
          value: value,
          currency: currency,
          custom_data: {
            order_id: orderId,
            source: "instagram",
            market: "romania",
          },
        });
      }
    },
    []
  );

  // Track share to Instagram
  const trackShare = useCallback((contentId: string, platform: string = "instagram") => {
    if (typeof window !== "undefined" && window.trackInstagramShare) {
      window.trackInstagramShare(contentId, platform);
    } else if (typeof window !== "undefined" && window.fbq) {
      window.fbq("trackCustom", "InstagramShare", {
        content_id: contentId,
        platform: platform,
        market: "romania",
      });
    }
  }, []);

  // Track initiate checkout
  const trackInitiateCheckout = useCallback(
    (value: number, productIds: string[], numItems: number) => {
      if (typeof window !== "undefined" && window.fbq) {
        window.fbq("track", "InitiateCheckout", {
          content_ids: productIds,
          content_type: "product",
          value: value,
          currency: "RON",
          num_items: numItems,
          custom_data: {
            source: "instagram",
            market: "romania",
          },
        });
      }
    },
    []
  );

  // Track search
  const trackSearch = useCallback((searchQuery: string) => {
    if (typeof window !== "undefined" && window.fbq) {
      window.fbq("track", "Search", {
        search_string: searchQuery,
        custom_data: {
          source: "instagram",
          market: "romania",
        },
      });
    }
  }, []);

  return {
    trackView,
    trackAddToCart,
    trackPurchase,
    trackShare,
    trackInitiateCheckout,
    trackSearch,
  };
}

export default useInstagramPixel;
