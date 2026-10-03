import { act, renderHook } from "@testing-library/react";
import React, { StrictMode } from "react";

import { saveCookieConsent } from "@/lib/analytics/consent";
import { trackEvent, trackProductView } from "@/lib/analytics/ga4";
import {
  trackMetaCheckout,
  trackMetaProductView,
} from "@/lib/analytics/meta-events";
import {
  useCheckoutTracking,
  useProductViewTracking,
} from "@/lib/analytics/use-storefront-tracking";

jest.mock("@/lib/analytics/ga4", () => ({
  GA4_CONFIG: { EVENTS: { BEGIN_CHECKOUT: "begin_checkout" } },
  trackEvent: jest.fn(() => true),
  trackProductView: jest.fn(() => true),
}));
jest.mock("@/lib/analytics/meta-events", () => ({
  trackMetaCheckout: jest.fn(() => true),
  trackMetaProductView: jest.fn(() => true),
}));
const product = {
  id: "kit",
  name: "Kit",
  price: 50,
  category: { name: "STEM" },
};
const items = [{ item_id: "kit", item_name: "Kit", price: 50, quantity: 2 }];
beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  jest.clearAllMocks();
});

it("tracks the currently visible product after consent without replaying cart actions", () => {
  const hook = renderHook(() => useProductViewTracking(product));
  expect(trackProductView).not.toHaveBeenCalled();
  expect(trackMetaProductView).not.toHaveBeenCalled();
  act(() => {
    saveCookieConsent({ analytics: false, marketing: true });
  });
  expect(trackMetaProductView).toHaveBeenCalledTimes(1);
  expect(trackProductView).not.toHaveBeenCalled();
  hook.rerender();
  expect(trackMetaProductView).toHaveBeenCalledTimes(1);
  act(() => {
    saveCookieConsent({ analytics: true, marketing: true });
  });
  expect(trackProductView).toHaveBeenCalledTimes(1);
  expect(trackMetaProductView).toHaveBeenCalledTimes(1);
});

it("deduplicates product effects under StrictMode and tracks a different product", () => {
  saveCookieConsent({ analytics: true, marketing: true });
  const hook = renderHook(({ value }) => useProductViewTracking(value), {
    initialProps: { value: product },
    wrapper: ({ children }) => <StrictMode>{children}</StrictMode>,
  });
  expect(trackMetaProductView).toHaveBeenCalledTimes(1);
  expect(trackProductView).toHaveBeenCalledTimes(1);
  hook.rerender({ value: { ...product, id: "book" } });
  expect(trackMetaProductView).toHaveBeenCalledTimes(2);
  expect(trackProductView).toHaveBeenCalledTimes(2);
});

it("requires a loaded nonempty checkout and tracks only once per entry", () => {
  saveCookieConsent({ analytics: false, marketing: true });
  const hook = renderHook(
    ({ status, cart }) => useCheckoutTracking(status, cart),
    {
      initialProps: { status: "loading", cart: items },
    }
  );
  expect(trackMetaCheckout).not.toHaveBeenCalled();
  hook.rerender({ status: "unauthenticated", cart: [] });
  expect(trackMetaCheckout).not.toHaveBeenCalled();
  hook.rerender({ status: "unauthenticated", cart: items });
  hook.rerender({ status: "unauthenticated", cart: [...items] });
  expect(trackMetaCheckout).toHaveBeenCalledTimes(1);
  expect(trackMetaCheckout).toHaveBeenCalledWith(items);
  expect(trackEvent).not.toHaveBeenCalled();
  act(() => {
    saveCookieConsent({ analytics: true, marketing: true });
  });
  expect(trackEvent).toHaveBeenCalledTimes(1);
  expect(trackMetaCheckout).toHaveBeenCalledTimes(1);
});

it("does not track empty or already completed checkout", () => {
  saveCookieConsent({ analytics: true, marketing: true });
  sessionStorage.setItem("orderCompleted", "true");
  renderHook(() => useCheckoutTracking("unauthenticated", items));
  expect(trackMetaCheckout).not.toHaveBeenCalled();
  expect(trackEvent).not.toHaveBeenCalled();
});

it("keeps advertising and analytics choices independent", () => {
  saveCookieConsent({ analytics: true, marketing: false });
  renderHook(() => useCheckoutTracking("unauthenticated", items));
  expect(trackEvent).toHaveBeenCalledTimes(1);
  expect(trackMetaCheckout).not.toHaveBeenCalled();
});
