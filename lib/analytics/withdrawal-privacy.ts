/** Next client navigation leaves SDK listeners in the existing document.
 * A fresh withdrawal document omits AnalyticsWrapper; keep the form unavailable
 * until previously loaded SDKs have been removed by a full reload. */
const trackerScripts = [
  "#google-analytics",
  "#facebook-pixel",
  "#instagram-pixel",
  "#tiktok-pixel",
  'script[src*="connect.facebook.net/"]',
  'script[src*="googletagmanager.com/"]',
  'script[src*="analytics.tiktok.com/"]',
  'script[src*="/_vercel/insights/"]',
  'script[src*="/_vercel/speed-insights/"]',
].join(",");

export function preparePrivateWithdrawalPage(
  reload = () => window.location.reload()
): boolean {
  if (document.querySelector(trackerScripts)) {
    reload();
    return false;
  }
  return true;
}
