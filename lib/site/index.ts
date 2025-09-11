// Centralized helpers for site base URL handling
// - getBaseUrl(): Safe for both server and client usage
// - SITE_URL: Prefer in SSR-only contexts

function normalizeBaseUrl(input: string | undefined | null): string {
  const fallback = "http://localhost:3000";
  const raw = (input && input.trim()) || "";
  const candidate =
    raw ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    fallback;
  let urlString = candidate;
  // Ensure protocol is present
  if (!/^https?:\/\//i.test(urlString)) {
    urlString = `https://${urlString}`;
  }
  try {
    const url = new URL(urlString);
    // Remove trailing slash for consistency
    url.pathname = url.pathname.replace(/\/$/, "");
    return url.toString().replace(/\/$/, "");
  } catch (_err) {
    return fallback;
  }
}

export function getBaseUrl(): string {
  return normalizeBaseUrl(undefined);
}

// SSR-only constant; avoid importing in Client Components if tree-shaking is not guaranteed
export const SITE_URL: string = normalizeBaseUrl(undefined);
