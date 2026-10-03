import { consentStorageFailed, type CookieConsent } from "./consent";

function removeTrackingCookies(pattern: RegExp) {
  let cookieHeader: string;
  try {
    cookieHeader = document.cookie;
  } catch {
    return;
  }
  const names = cookieHeader
    .split(";")
    .map(cookie => cookie.trim().split("=")[0]);
  const parts = window.location.hostname.split(".");
  const domains = [
    "",
    ...parts.map((_, index) => parts.slice(index).join(".")),
  ];
  for (const name of names) {
    if (!pattern.test(name)) continue;
    for (const domain of domains) {
      try {
        document.cookie = `${name}=; Max-Age=0; Path=/;${domain ? ` Domain=${domain};` : ""}`;
      } catch {}
    }
  }
}

/** A reload discards loaded SDKs, automatic listeners and Next's script cache. */
export function syncConsentRuntime(
  previous: CookieConsent | null,
  current: CookieConsent | null
) {
  const id = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID;
  if (id)
    (window as unknown as Record<string, unknown>)[`ga-disable-${id}`] =
      !current?.analytics;
  if (!current?.analytics) {
    if (window.gtag) window.gtag = () => {};
    removeTrackingCookies(/^_ga(?:_|$)|^_gid$|^_gat(?:_|$)/);
    try {
      window.sessionStorage.removeItem("conversion_session_id");
      window.localStorage.removeItem("conversion_events");
    } catch {}
  }
  if (!current?.marketing) {
    if (window.fbq) {
      try {
        window.fbq("consent", "revoke");
      } catch {}
    }
    try {
      window.ttq?.disableCookie?.();
    } catch {}
    removeTrackingCookies(/^_fbp$|^_fbc$|^_ttp$|^_tt_enable_cookie$/);
  }
  if (
    !consentStorageFailed() &&
    ((previous?.analytics && !current?.analytics) ||
      (previous?.marketing && !current?.marketing))
  ) {
    window.location.reload();
  }
}
