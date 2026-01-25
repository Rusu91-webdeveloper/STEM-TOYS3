/**
 * Instagram Pixel Component for Romanian E-commerce Tracking
 *
 * Instagram uses Meta's pixel infrastructure (same as Facebook)
 * This component loads config from database and initializes tracking
 */

"use client";

import { useEffect, useState } from "react";
import Script from "next/script";

interface InstagramPixelConfig {
  pixelId: string;
  isActive: boolean;
}

declare global {
  interface Window {
    fbq: any;
    _fbq: any;
    trackInstagramView: (productId: string, productName: string, price: number) => void;
    trackInstagramAddToCart: (productId: string, productName: string, price: number, quantity: number) => void;
    trackInstagramPurchase: (orderId: string, value: number, productIds: string[], currency?: string) => void;
    trackInstagramShare: (contentId: string, platform?: string) => void;
  }
}

export default function InstagramPixel() {
  const [config, setConfig] = useState<InstagramPixelConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch config from API
  useEffect(() => {
    async function fetchConfig() {
      try {
        const response = await fetch("/api/admin/pixels/instagram/config");
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data?.isActive) {
            setConfig(data.data);
          }
        }
      } catch (error) {
        console.error("Failed to fetch Instagram pixel config:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchConfig();
  }, []);

  // Initialize tracking functions
  useEffect(() => {
    if (typeof window !== "undefined" && config?.pixelId) {
      // Track product view from Instagram traffic
      window.trackInstagramView = (
        productId: string,
        productName: string,
        price: number
      ) => {
        if (window.fbq) {
          window.fbq("track", "ViewContent", {
            content_ids: [productId],
            content_name: productName,
            content_type: "product",
            value: price,
            currency: "RON",
            custom_data: {
              source: "instagram",
              market: "romania",
              timestamp: Date.now(),
            },
          });
        }
      };

      // Track add to cart from Instagram
      window.trackInstagramAddToCart = (
        productId: string,
        productName: string,
        price: number,
        quantity: number
      ) => {
        if (window.fbq) {
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
              timestamp: Date.now(),
            },
          });
        }
      };

      // Track purchase from Instagram traffic
      window.trackInstagramPurchase = (
        orderId: string,
        value: number,
        productIds: string[],
        currency: string = "RON"
      ) => {
        if (window.fbq) {
          window.fbq("track", "Purchase", {
            content_ids: productIds,
            content_type: "product",
            value: value,
            currency: currency,
            custom_data: {
              order_id: orderId,
              source: "instagram",
              market: "romania",
              timestamp: Date.now(),
            },
          });
        }
      };

      // Track Instagram share
      window.trackInstagramShare = (contentId: string, platform: string = "instagram") => {
        if (window.fbq) {
          window.fbq("trackCustom", "InstagramShare", {
            content_id: contentId,
            platform: platform,
            market: "romania",
            timestamp: Date.now(),
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
      {/* Instagram Pixel uses Meta's fbevents.js (same as Facebook) */}
      <Script
        id="instagram-pixel"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${config.pixelId}');
            fbq('track', 'PageView');
            
            // Track Instagram-specific Romanian audience
            fbq('trackCustom', 'InstagramRomanianVisitor', {
              content_type: 'stem_education',
              market: 'romania',
              language: 'ro',
              source: 'instagram',
              timestamp: ${Date.now()}
            });
          `,
        }}
      />

      {/* NoScript fallback */}
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          src={`https://www.facebook.com/tr?id=${config.pixelId}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  );
}

// Hook for using Instagram Pixel in components
export function useInstagramPixel() {
  return {
    trackView: (productId: string, productName: string, price: number) => {
      if (typeof window !== "undefined" && window.trackInstagramView) {
        window.trackInstagramView(productId, productName, price);
      }
    },

    trackAddToCart: (
      productId: string,
      productName: string,
      price: number,
      quantity: number
    ) => {
      if (typeof window !== "undefined" && window.trackInstagramAddToCart) {
        window.trackInstagramAddToCart(productId, productName, price, quantity);
      }
    },

    trackPurchase: (
      orderId: string,
      value: number,
      productIds: string[],
      currency?: string
    ) => {
      if (typeof window !== "undefined" && window.trackInstagramPurchase) {
        window.trackInstagramPurchase(orderId, value, productIds, currency);
      }
    },

    trackShare: (contentId: string, platform?: string) => {
      if (typeof window !== "undefined" && window.trackInstagramShare) {
        window.trackInstagramShare(contentId, platform);
      }
    },
  };
}
