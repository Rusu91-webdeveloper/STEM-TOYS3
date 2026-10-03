/** @jest-environment jsdom */
import {
  CONSENT_MAX_AGE_MS,
  CONSENT_STORAGE_KEY,
  hasAnalyticsConsent,
  hasMarketingConsent,
  readCookieConsent,
  saveCookieConsent,
} from "@/lib/analytics/consent";

beforeEach(() => {
  localStorage.clear();
  jest.restoreAllMocks();
});
it("requires our explicit choice and rejects legacy permissive signals", () => {
  expect(hasAnalyticsConsent()).toBe(false);
  expect(hasMarketingConsent()).toBe(false);
  localStorage.setItem("analytics_consent", "granted");
  document.cookie = "cookie_consent=accepted; Path=/";
  expect(hasAnalyticsConsent()).toBe(false);
});
it.each([
  { analytics: true, marketing: false },
  { analytics: false, marketing: true },
  { analytics: false, marketing: false },
])("keeps category choices separate: %o", choices => {
  expect(saveCookieConsent(choices)).toMatchObject(choices);
  expect(hasAnalyticsConsent()).toBe(choices.analytics);
  expect(hasMarketingConsent()).toBe(choices.marketing);
});
it.each([
  "invalid",
  "null",
  JSON.stringify({
    version: 1,
    revision: "fixture",
    analytics: "true",
    marketing: true,
    updatedAt: Date.now(),
  }),
  JSON.stringify({
    version: 2,
    analytics: true,
    marketing: true,
    updatedAt: Date.now(),
  }),
  JSON.stringify({
    version: 1,
    revision: "fixture",
    analytics: true,
    marketing: true,
    updatedAt: Date.now() - CONSENT_MAX_AGE_MS,
  }),
  JSON.stringify({
    version: 1,
    revision: "fixture",
    analytics: true,
    marketing: true,
    updatedAt: Date.now() + 60000,
  }),
])("denies malformed, incompatible or expired choices", value => {
  localStorage.setItem(CONSENT_STORAGE_KEY, value);
  expect(readCookieConsent()).toBeNull();
  expect(hasAnalyticsConsent()).toBe(false);
  expect(hasMarketingConsent()).toBe(false);
});
it("fails closed if storage is unavailable", () => {
  jest.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
    throw new Error("blocked");
  });
  jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new Error("blocked");
  });
  expect(saveCookieConsent({ analytics: true, marketing: true })).toBeNull();
  expect(hasAnalyticsConsent()).toBe(false);
  expect(hasMarketingConsent()).toBe(false);
});

it("withdraws in memory if a previously granted choice cannot be overwritten", () => {
  saveCookieConsent({ analytics: true, marketing: true });
  const blocked = jest
    .spyOn(Storage.prototype, "setItem")
    .mockImplementation(() => {
      throw new Error("blocked");
    });
  expect(saveCookieConsent({ analytics: false, marketing: false })).toBeNull();
  expect(hasAnalyticsConsent()).toBe(false);
  expect(hasMarketingConsent()).toBe(false);
  blocked.mockRestore();
});
