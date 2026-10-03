/** @jest-environment jsdom */
import { saveCookieConsent } from "@/lib/analytics/consent";
import { syncConsentRuntime } from "@/lib/analytics/consent-runtime";

it("clears known tracking identifiers while preserving shopping state", () => {
  localStorage.clear();
  localStorage.setItem("cart", "keep-cart");
  localStorage.setItem("conversion_events", "remove-events");
  sessionStorage.setItem("conversion_session_id", "remove-session");
  sessionStorage.setItem("homepage_conversion_session_id", "remove-homepage-session");
  document.cookie = "_ga=tracking; Path=/";
  document.cookie = "_fbp=tracking; Path=/";
  document.cookie = "cart_cookie=keep-cart; Path=/";
  document.cookie = "session_cookie=keep-session; Path=/";
  syncConsentRuntime(null, null);
  expect(document.cookie).not.toContain("_ga=");
  expect(document.cookie).not.toContain("_fbp=");
  expect(document.cookie).toContain("cart_cookie=keep-cart");
  expect(document.cookie).toContain("session_cookie=keep-session");
  expect(localStorage.getItem("cart")).toBe("keep-cart");
  expect(localStorage.getItem("conversion_events")).toBeNull();
  expect(sessionStorage.getItem("conversion_session_id")).toBeNull();
  expect(sessionStorage.getItem("homepage_conversion_session_id")).toBeNull();
});
it("sets Google's disable flag until analytics is granted", () => {
  const originalId = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID;
  process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID = "G-TEST";
  syncConsentRuntime(null, null);
  expect(
    (window as unknown as Record<string, unknown>)["ga-disable-G-TEST"]
  ).toBe(true);
  const choice = saveCookieConsent({ analytics: true, marketing: false });
  syncConsentRuntime(null, choice);
  expect(
    (window as unknown as Record<string, unknown>)["ga-disable-G-TEST"]
  ).toBe(false);
  if (originalId === undefined)
    delete process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID;
  else process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID = originalId;
});
