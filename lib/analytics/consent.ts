export function hasAnalyticsConsent(): boolean {
  try {
    const localStorageKeys = [
      "analytics_consent",
      "cookie_consent",
      "consent_analytics",
      "gdpr_analytics_consent",
    ];
    const acceptedValues = new Set([
      "true",
      "1",
      "yes",
      "accepted",
      "granted",
      "all",
    ]);
    const rejectedValues = new Set(["false", "0", "no", "denied", "rejected"]);

    for (const key of localStorageKeys) {
      const value = window.localStorage.getItem(key);
      if (!value) continue;
      const normalized = value.toLowerCase();
      if (acceptedValues.has(normalized)) return true;
      if (rejectedValues.has(normalized)) return false;
    }

    const cookie = document.cookie
      .split(";")
      .map(item => item.trim())
      .find(item =>
        /^(analytics_consent|cookie_consent|consent_analytics)=/i.test(item)
      );

    if (cookie) {
      const [, rawValue = ""] = cookie.split("=");
      const normalized = decodeURIComponent(rawValue).toLowerCase();
      if (acceptedValues.has(normalized)) return true;
      if (rejectedValues.has(normalized)) return false;
    }
  } catch {
    // Keep defaults if storage/cookie access fails.
  }

  // Preserve current behavior when no explicit consent signal exists.
  return true;
}
