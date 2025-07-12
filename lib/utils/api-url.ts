/**
 * Get the base URL for API calls in all environments
 * This function handles the complexity of determining the correct URL
 * for server-side rendering, client-side rendering, and production deployments
 */
export function getApiUrl(): string {
  // Client-side: Use the current origin
  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  // Server-side: Check environment variables in order of preference

  // 1. NEXTAUTH_URL - Most reliable for production
  if (process.env.NEXTAUTH_URL) {
    // eslint-disable-next-line no-console
    console.log("[getApiUrl] Using NEXTAUTH_URL:", process.env.NEXTAUTH_URL);
    return process.env.NEXTAUTH_URL;
  }

  // 2. NEXT_PUBLIC_SITE_URL - Public site URL
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    // eslint-disable-next-line no-console
    console.log(
      "[getApiUrl] Using NEXT_PUBLIC_SITE_URL:",
      process.env.NEXT_PUBLIC_SITE_URL
    );
    return process.env.NEXT_PUBLIC_SITE_URL;
  }

  // 3. VERCEL_URL - Automatically set by Vercel
  if (process.env.VERCEL_URL) {
    const url = `https://${process.env.VERCEL_URL}`;
    // eslint-disable-next-line no-console
    console.log("[getApiUrl] Using VERCEL_URL:", url);
    return url;
  }

  // 4. Production fallback - Your actual domain
  if (process.env.NODE_ENV === "production") {
    console.warn(
      "[getApiUrl] WARNING: No environment variables found, using hardcoded production URL"
    );
    return "https://stem-toys-3.vercel.app";
  }

  // 5. Development fallback
  // eslint-disable-next-line no-console
  console.log("[getApiUrl] Using localhost for development");
  return "http://localhost:3000";
}

/**
 * Construct a full API URL with the given path
 */
export function buildApiUrl(path: string): string {
  const baseUrl = getApiUrl();

  // Ensure baseUrl has protocol
  const urlWithProtocol = baseUrl.startsWith("http")
    ? baseUrl
    : `https://${baseUrl}`;

  // Remove trailing slash from base URL
  const cleanBaseUrl = urlWithProtocol.endsWith("/")
    ? urlWithProtocol.slice(0, -1)
    : urlWithProtocol;

  // Ensure path starts with /
  const cleanPath = path.startsWith("/") ? path : `/${path}`;

  return `${cleanBaseUrl}${cleanPath}`;
}
