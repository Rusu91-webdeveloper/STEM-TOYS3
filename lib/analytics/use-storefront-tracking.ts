"use client";

import { useEffect, useRef } from "react";

import { GA4_CONFIG, trackEvent, trackProductView } from "./ga4";
import {
  trackMetaCheckout,
  trackMetaProductView,
  type MetaItem,
} from "./meta-events";
import { useCookieConsent } from "./use-cookie-consent";

export function useProductViewTracking(product: {
  id: string;
  name: string;
  price: number;
  category?: { name?: string };
}) {
  const { consent } = useCookieConsent();
  const googleViewed = useRef<string | null>(null);
  const metaViewed = useRef<string | null>(null);
  useEffect(() => {
    if (
      consent?.analytics &&
      googleViewed.current !== product.id &&
      trackProductView({
        item_id: product.id,
        item_name: product.name,
        category: product.category?.name ?? "",
        price: product.price,
        currency: "RON",
      })
    )
      googleViewed.current = product.id;
    if (
      consent?.marketing &&
      metaViewed.current !== product.id &&
      trackMetaProductView({
        item_id: product.id,
        item_name: product.name,
        price: product.price,
        quantity: 1,
      })
    )
      metaViewed.current = product.id;
  }, [
    consent,
    product.id,
    product.name,
    product.price,
    product.category?.name,
  ]);
}

export function useCheckoutTracking(status: string, items: MetaItem[]) {
  const { consent } = useCookieConsent();
  const googleTracked = useRef(false);
  const metaTracked = useRef(false);
  useEffect(() => {
    if (status === "loading" || !items.length) return;
    try {
      if (sessionStorage.getItem("orderCompleted") === "true") return;
    } catch {}
    if (consent?.analytics && !googleTracked.current) {
      googleTracked.current = trackEvent(GA4_CONFIG.EVENTS.BEGIN_CHECKOUT, {
        currency: "RON",
        value: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
        items,
      });
    }
    if (consent?.marketing && !metaTracked.current)
      metaTracked.current = trackMetaCheckout(items);
  }, [status, items, consent]);
}
