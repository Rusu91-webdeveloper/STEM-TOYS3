/**
 * TikTok Pixel Tracking Hook
 * 
 * Provides tracking functions for TikTok pixel events
 * Used for e-commerce tracking in Romanian market
 */

"use client";

import { useCallback } from "react";

declare global {
  interface Window {
    ttq: any;
    trackTikTokView: (productId: string, productName: string, price: number) => void;
    trackTikTokAddToCart: (productId: string, productName: string, price: number, quantity: number) => void;
    trackTikTokPurchase: (orderId: string, value: number, productIds: string[], currency?: string) => void;
    trackTikTokInitiateCheckout: (value: number, productIds: string[], numItems: number) => void;
  }
}

export function useTikTokPixel() {
  // Track product view
  const trackView = useCallback(
    (productId: string, productName: string, price: number) => {
      if (typeof window !== "undefined" && window.trackTikTokView) {
        window.trackTikTokView(productId, productName, price);
      } else if (typeof window !== "undefined" && window.ttq) {
        // Fallback to direct ttq call
        window.ttq.track("ViewContent", {
          content_id: productId,
          content_name: productName,
          content_type: "product",
          value: price,
          currency: "RON",
        });
      }
    },
    []
  );

  // Track add to cart
  const trackAddToCart = useCallback(
    (productId: string, productName: string, price: number, quantity: number) => {
      if (typeof window !== "undefined" && window.trackTikTokAddToCart) {
        window.trackTikTokAddToCart(productId, productName, price, quantity);
      } else if (typeof window !== "undefined" && window.ttq) {
        window.ttq.track("AddToCart", {
          content_id: productId,
          content_name: productName,
          content_type: "product",
          value: price * quantity,
          currency: "RON",
          quantity: quantity,
        });
      }
    },
    []
  );

  // Track purchase (CompletePayment in TikTok)
  const trackPurchase = useCallback(
    (orderId: string, value: number, productIds: string[], currency: string = "RON") => {
      if (typeof window !== "undefined" && window.trackTikTokPurchase) {
        window.trackTikTokPurchase(orderId, value, productIds, currency);
      } else if (typeof window !== "undefined" && window.ttq) {
        window.ttq.track("CompletePayment", {
          content_ids: productIds,
          content_type: "product",
          value: value,
          currency: currency,
          order_id: orderId,
        });
      }
    },
    []
  );

  // Track initiate checkout
  const trackInitiateCheckout = useCallback(
    (value: number, productIds: string[], numItems: number) => {
      if (typeof window !== "undefined" && window.trackTikTokInitiateCheckout) {
        window.trackTikTokInitiateCheckout(value, productIds, numItems);
      } else if (typeof window !== "undefined" && window.ttq) {
        window.ttq.track("InitiateCheckout", {
          content_ids: productIds,
          content_type: "product",
          value: value,
          currency: "RON",
          quantity: numItems,
        });
      }
    },
    []
  );

  // Track search
  const trackSearch = useCallback((searchQuery: string) => {
    if (typeof window !== "undefined" && window.ttq) {
      window.ttq.track("Search", {
        query: searchQuery,
      });
    }
  }, []);

  // Track page view
  const trackPageView = useCallback(() => {
    if (typeof window !== "undefined" && window.ttq) {
      window.ttq.page();
    }
  }, []);

  // Track registration/signup
  const trackRegistration = useCallback((method: string = "email") => {
    if (typeof window !== "undefined" && window.ttq) {
      window.ttq.track("CompleteRegistration", {
        method: method,
      });
    }
  }, []);

  // Track contact (lead form submission)
  const trackContact = useCallback(() => {
    if (typeof window !== "undefined" && window.ttq) {
      window.ttq.track("Contact");
    }
  }, []);

  // Track subscribe (newsletter, etc.)
  const trackSubscribe = useCallback(() => {
    if (typeof window !== "undefined" && window.ttq) {
      window.ttq.track("Subscribe");
    }
  }, []);

  return {
    trackView,
    trackAddToCart,
    trackPurchase,
    trackInitiateCheckout,
    trackSearch,
    trackPageView,
    trackRegistration,
    trackContact,
    trackSubscribe,
  };
}

export default useTikTokPixel;
