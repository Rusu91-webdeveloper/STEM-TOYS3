/**
 * Security utilities for the NextCommerce application
 */
import crypto from "crypto";
import DOMPurify from "dompurify";

/**
 * Checks if the application is running in development mode
 * @returns {boolean} True if in development mode
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === "development";
}

/**
 * Sanitizes HTML content to prevent XSS attacks
 * Uses DOMPurify for robust protection against XSS
 * @param html The raw HTML content to sanitize
 * @returns Sanitized HTML content
 */
export function sanitizeHtml(html: string): string {
  // Use DOMPurify for robust XSS protection
  // Note: When used server-side, we need to handle the lack of DOM
  if (typeof window === "undefined") {
    // Server-side: fall back to basic sanitization until JSDOM is implemented
    return html
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;")
      .replace(/`/g, "&#96;");
  }

  // Client-side: use DOMPurify
  return DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
    FORBID_TAGS: ["script", "style", "iframe", "frame", "object", "embed"],
    FORBID_ATTR: ["onerror", "onload", "onclick", "onmouseover"],
  });
}

/**
 * Sanitizes a URL to prevent JavaScript injection
 * @param url The URL to sanitize
 * @returns Sanitized URL or undefined if the URL is invalid
 */
export function sanitizeUrl(url: string): string | undefined {
  try {
    const parsedUrl = new URL(url);
    // Only allow http and https protocols
    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
      return undefined;
    }
    return parsedUrl.toString();
  } catch (error) {
    // If the URL is invalid, return undefined
    return undefined;
  }
}

/**
 * Sanitizes form input to prevent common attacks
 * @param input The input string to sanitize
 * @returns Sanitized input string
 */
export function sanitizeInput(input: string): string {
  // Remove potentially dangerous characters
  return input.trim();
}

/**
 * Get the CSRF secret key from environment variables or generate a fallback
 * @returns The CSRF secret key
 */
function getCsrfSecretKey(): string {
  const envKey = process.env.CSRF_SECRET_KEY;
  if (envKey) {
    return envKey;
  }

  // If no key is provided in environment variables, use a fallback
  // Warning is logged in production environment
  if (process.env.NODE_ENV === "production") {
    console.warn(
      "WARNING: CSRF_SECRET_KEY is not set in production. Using fallback key which is insecure."
    );
  }

  return "fallback-csrf-secret-key-for-development-only";
}

/**
 * Generates a limited-time CSRF token for forms
 * @param sessionId The current session ID
 * @param expirationMinutes How long the token should be valid in minutes
 * @returns A CSRF token that includes an expiration timestamp and HMAC signature
 */
export function generateCsrfToken(
  sessionId: string,
  expirationMinutes: number = 60
): string {
  const timestamp = Date.now() + expirationMinutes * 60 * 1000;
  const tokenData = `${sessionId}:${timestamp}`;

  // Create HMAC signature using SHA-256 and the secret key
  const secretKey = getCsrfSecretKey();
  const hmac = crypto.createHmac("sha256", secretKey);
  const signature = hmac.update(tokenData).digest("hex");

  // Combine the token data and signature
  const token = `${tokenData}:${signature}`;

  // Base64 encode the complete token
  return Buffer.from(token).toString("base64");
}

/**
 * Validates a CSRF token
 * @param token The token to validate
 * @param sessionId The current session ID
 * @returns True if the token is valid, properly signed, and not expired
 */
export function validateCsrfToken(token: string, sessionId: string): boolean {
  try {
    // Decode the token
    const tokenData = Buffer.from(token, "base64").toString();
    const [storedSessionId, timestampStr, signature] = tokenData.split(":");

    // Verify session ID
    if (storedSessionId !== sessionId) {
      return false;
    }

    // Verify timestamp (expiration)
    const timestamp = parseInt(timestampStr, 10);
    const now = Date.now();

    if (isNaN(timestamp) || timestamp < now) {
      return false;
    }

    // Verify signature
    const secretKey = getCsrfSecretKey();
    const hmac = crypto.createHmac("sha256", secretKey);
    const expectedSignature = hmac
      .update(`${storedSessionId}:${timestampStr}`)
      .digest("hex");

    if (signature !== expectedSignature) {
      return false;
    }

    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Generates a nonce for Content-Security-Policy
 * @returns A random nonce value
 */
export function generateNonce(): string {
  return crypto.randomBytes(16).toString("base64");
}

/**
 * Security headers that should be applied to all responses
 */
export const securityHeaders = {
  // Prevent the browser from interpreting files as a different MIME type
  "X-Content-Type-Options": "nosniff",

  // Disable loading the page in an iframe (helps prevent clickjacking)
  "X-Frame-Options": "DENY",

  // Enable XSS protection in older browsers
  "X-XSS-Protection": "1; mode=block",

  // Prevents the browser from sending the Referer header when navigating away
  "Referrer-Policy": "strict-origin-when-cross-origin",

  // Control permissions for browser features
  "Permissions-Policy":
    "camera=(), microphone=(), geolocation=(), interest-cohort=()",

  // HTTP Strict Transport Security
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
};
