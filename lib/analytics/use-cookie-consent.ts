"use client";

import { useEffect, useState } from "react";

import {
  CONSENT_CHANGED_EVENT,
  CONSENT_MAX_AGE_MS,
  CONSENT_STORAGE_KEY,
  readCookieConsent,
  type CookieConsent,
} from "./consent";
import { syncConsentRuntime } from "./consent-runtime";

export function useCookieConsent(manageRuntime = false) {
  const [consent, setConsent] = useState<CookieConsent | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let previous: CookieConsent | null = null;
    let expiryTimer: ReturnType<typeof setTimeout> | undefined;
    const refresh = () => {
      const current = readCookieConsent();
      if (manageRuntime) syncConsentRuntime(previous, current);
      previous = current;
      setConsent(current);
      setReady(true);
      clearTimeout(expiryTimer);
      if (current)
        expiryTimer = setTimeout(
          refresh,
          Math.min(
            2147483647,
            Math.max(0, current.updatedAt + CONSENT_MAX_AGE_MS - Date.now())
          )
        );
    };
    const storageChanged = (event: StorageEvent) => {
      if (event.key === CONSENT_STORAGE_KEY || event.key === null) refresh();
    };
    refresh();
    window.addEventListener(CONSENT_CHANGED_EVENT, refresh);
    window.addEventListener("storage", storageChanged);
    window.addEventListener("focus", refresh);
    return () => {
      clearTimeout(expiryTimer);
      window.removeEventListener(CONSENT_CHANGED_EVENT, refresh);
      window.removeEventListener("storage", storageChanged);
      window.removeEventListener("focus", refresh);
    };
  }, [manageRuntime]);
  return { consent, ready };
}
