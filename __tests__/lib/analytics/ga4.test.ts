/** @jest-environment jsdom */
import {
  flushGA4Events,
  trackEvent,
  trackProductView,
} from "@/lib/analytics/ga4";

import { saveCookieConsent } from "@/lib/analytics/consent";

beforeEach(() => {
  localStorage.clear();
  saveCookieConsent({ analytics: true, marketing: false });
  window.gtag = jest.fn();
  flushGA4Events();
  jest.mocked(window.gtag).mockClear();
});

it("delivers initial product views after the deferred tag initializes", () => {
  delete (window as Partial<Window>).gtag;
  trackProductView({
    item_id: "p1",
    item_name: "Kit",
    category: "STEM",
    price: 50,
    currency: "RON",
  });
  window.gtag = jest.fn();
  flushGA4Events();
  flushGA4Events();
  expect(window.gtag).toHaveBeenCalledTimes(1);
  expect(window.gtag).toHaveBeenCalledWith(
    "event",
    "view_item",
    expect.objectContaining({
      value: 50,
      currency: "RON",
      items: [
        expect.objectContaining({ item_id: "p1", item_category: "STEM" }),
      ],
    })
  );
});

it("does not send or replay events after analytics is declined", () => {
  delete (window as Partial<Window>).gtag;
  trackEvent("begin_checkout");
  saveCookieConsent({ analytics: false, marketing: false });
  window.gtag = jest.fn();
  flushGA4Events();
  expect(trackEvent("purchase")).toBe(false);
  saveCookieConsent({ analytics: true, marketing: false });
  flushGA4Events();
  expect(window.gtag).not.toHaveBeenCalled();
});

it("does not interrupt buying when a third-party tag fails", () => {
  window.gtag = jest.fn(() => {
    throw new Error("Tag blocked");
  });
  expect(() => trackEvent("add_to_cart")).not.toThrow();
});

it("does not interrupt the page when flushing into a broken tag", () => {
  delete (window as Partial<Window>).gtag;
  trackEvent("view_item");
  window.gtag = jest.fn(() => {
    throw new Error("Tag blocked");
  });
  expect(() => flushGA4Events()).not.toThrow();
  flushGA4Events();
  expect(window.gtag).toHaveBeenCalledTimes(1);
});

it("never replays activity collected before consent", () => {
  localStorage.clear();
  delete (window as Partial<Window>).gtag;
  expect(trackEvent("view_item")).toBe(false);
  saveCookieConsent({ analytics: true, marketing: false });
  window.gtag = jest.fn();
  flushGA4Events();
  expect(window.gtag).not.toHaveBeenCalled();
});
