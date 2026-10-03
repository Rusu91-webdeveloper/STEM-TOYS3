/** @jest-environment jsdom */
import { saveCookieConsent } from "@/lib/analytics/consent";
import { trackEvent } from "@/lib/analytics/ga4";
import {
  HOMEPAGE_CONVERSION_EVENTS,
  trackHomepageConversionEvent,
} from "@/lib/analytics/homepage-conversion-events";

jest.mock("@/lib/analytics/ga4", () => ({ trackEvent: jest.fn() }));

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  jest.clearAllMocks();
  jest.mocked(fetch).mockResolvedValue({ ok: true } as Response);
});

it("does not send a homepage impression or create a session before consent", () => {
  trackHomepageConversionEvent(HOMEPAGE_CONVERSION_EVENTS.HERO_IMPRESSION);
  expect(trackEvent).not.toHaveBeenCalled();
  expect(fetch).not.toHaveBeenCalled();
  expect(sessionStorage.getItem("homepage_conversion_session_id")).toBeNull();
});

it("keeps homepage analytics disabled with advertising-only permission", () => {
  saveCookieConsent({ analytics: false, marketing: true });
  trackHomepageConversionEvent(HOMEPAGE_CONVERSION_EVENTS.HERO_IMPRESSION);
  expect(trackEvent).not.toHaveBeenCalled();
  expect(fetch).not.toHaveBeenCalled();
});

it("mirrors a permitted impression and stops sending after withdrawal", () => {
  saveCookieConsent({ analytics: true, marketing: false });
  trackHomepageConversionEvent(HOMEPAGE_CONVERSION_EVENTS.HERO_IMPRESSION);
  expect(fetch).toHaveBeenCalledTimes(1);
  expect(fetch).toHaveBeenCalledWith(
    "/api/analytics/conversions",
    expect.objectContaining({ method: "POST" })
  );
  expect(sessionStorage.getItem("homepage_conversion_session_id")).not.toBeNull();
  saveCookieConsent({ analytics: false, marketing: false });
  trackHomepageConversionEvent(HOMEPAGE_CONVERSION_EVENTS.HERO_IMPRESSION);
  expect(fetch).toHaveBeenCalledTimes(1);
  expect(trackEvent).toHaveBeenCalledTimes(1);
});
