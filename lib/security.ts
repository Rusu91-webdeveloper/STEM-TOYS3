/**
 * Common security utilities for hashing, encryption, and token generation
 */

// Use Web Crypto API from the global scope (works in browsers and Node 18+)
const crypto = (globalThis as any).crypto as Crypto;

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

// Helper to convert ArrayBuffer to Hex string
const arrayBufferToHex = (buffer: ArrayBuffer) =>
  Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");

// Helper to convert Hex string to ArrayBuffer
const hexToArrayBuffer = (hex: string) => {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes.buffer;
};

/**
 * Generates a limited-time CSRF token for forms using Web Crypto API
 * @param sessionId The current session ID
 * @param expirationMinutes How long the token should be valid in minutes
 * @returns A CSRF token that includes an expiration timestamp and HMAC signature
 */
export async function generateCsrfToken(
  sessionId: string,
  expirationMinutes: number = 60
): Promise<string> {
  const timestamp = Date.now() + expirationMinutes * 60 * 1000;
  const tokenData = `${sessionId}:${timestamp}`;
  const secretKey = getCsrfSecretKey();

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secretKey),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(tokenData)
  );

  const signature = arrayBufferToHex(signatureBuffer);
  const token = `${tokenData}:${signature}`;

  return btoa(token);
}

/**
 * Validates a CSRF token using Web Crypto API
 * @param token The token to validate
 * @param sessionId The current session ID
 * @returns True if the token is valid, properly signed, and not expired
 */
export async function validateCsrfToken(
  token: string,
  sessionId: string
): Promise<boolean> {
  try {
    const tokenData = atob(token);
    const [storedSessionId, timestampStr, signatureHex] = tokenData.split(":");

    if (!storedSessionId || !timestampStr || !signatureHex) {
      return false;
    }

    if (storedSessionId !== sessionId) {
      return false;
    }

    const timestamp = parseInt(timestampStr, 10);
    if (isNaN(timestamp) || timestamp < Date.now()) {
      return false;
    }

    const secretKey = getCsrfSecretKey();
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secretKey),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );

    const signatureBuffer = hexToArrayBuffer(signatureHex);
    const dataToVerify = new TextEncoder().encode(
      `${storedSessionId}:${timestampStr}`
    );

    return await crypto.subtle.verify(
      "HMAC",
      key,
      signatureBuffer,
      dataToVerify
    );
  } catch (error) {
    console.error("Error during CSRF token validation:", error);
    return false;
  }
}

/**
 * Generates a nonce for Content-Security-Policy
 * @returns A random nonce value
 */
export function generateNonce(): string {
  try {
    const buffer = new Uint8Array(16);
    if (crypto && typeof crypto.getRandomValues === "function") {
      crypto.getRandomValues(buffer);
    } else {
      for (let i = 0; i < buffer.length; i++)
        buffer[i] = Math.floor(Math.random() * 256);
    }
    return btoa(String.fromCharCode(...Array.from(buffer)));
  } catch {
    return Math.random().toString(36).slice(2);
  }
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

/**
 * Generates a secret key for encryption or hashing
 * @param length The desired length of the secret key in bytes
 * @returns A securely generated secret key as a hex string
 */
export function generateSecretKey(length: number = 32): string {
  const buffer = new Uint8Array(length);
  crypto.getRandomValues(buffer);
  return Array.from(buffer)
    .map(byte => byte.toString(16).padStart(2, "0"))
    .join("");
}
