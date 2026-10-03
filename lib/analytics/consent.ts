export const CONSENT_STORAGE_KEY = "techtots_cookie_consent";
export const CONSENT_CHANGED_EVENT = "techtots:consent-changed";
export const OPEN_CONSENT_EVENT = "techtots:open-consent";
export const CONSENT_MAX_AGE_MS = 180 * 24 * 60 * 60 * 1000;

let failedSave = false;
export function consentStorageFailed() {
  return failedSave;
}

export interface CookieConsent {
  version: 1;
  revision: string;
  analytics: boolean;
  marketing: boolean;
  updatedAt: number;
}

/** Only a current, explicit choice from our banner can authorize tracking. */
export function readCookieConsent(): CookieConsent | null {
  if (typeof window === "undefined" || failedSave) return null;
  try {
    const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return null;
    const choice = JSON.parse(raw);
    if (
      choice?.version !== 1 ||
      typeof choice.revision !== "string" ||
      !choice.revision ||
      typeof choice.analytics !== "boolean" ||
      typeof choice.marketing !== "boolean" ||
      !Number.isFinite(choice.updatedAt) ||
      choice.updatedAt > Date.now() ||
      Date.now() - choice.updatedAt >= CONSENT_MAX_AGE_MS
    )
      return null;
    return choice;
  } catch {
    // Missing, corrupt, expired or unavailable storage never grants consent.
    return null;
  }
}

export function saveCookieConsent(
  choices: Pick<CookieConsent, "analytics" | "marketing">
): CookieConsent | null {
  if (typeof window === "undefined") return null;
  const consent: CookieConsent = {
    ...choices,
    version: 1,
    revision: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    updatedAt: Date.now(),
  };
  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(consent));
    failedSave = false;
    window.dispatchEvent(new Event(CONSENT_CHANGED_EVENT));
    return consent;
  } catch {
    // A failed withdrawal must not retain previously granted permission in this document.
    failedSave = true;
    try {
      window.localStorage.removeItem(CONSENT_STORAGE_KEY);
    } catch {}
    window.dispatchEvent(new Event(CONSENT_CHANGED_EVENT));
    return null;
  }
}

export function hasAnalyticsConsent(): boolean {
  return readCookieConsent()?.analytics === true;
}

export function hasMarketingConsent(): boolean {
  return readCookieConsent()?.marketing === true;
}

export function openCookiePreferences() {
  window.dispatchEvent(new Event(OPEN_CONSENT_EVENT));
}
