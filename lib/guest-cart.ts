import type { CartItem } from "@/features/cart";

/** HttpOnly cookie that binds a guest cart for 30 days. */
export const GUEST_CART_COOKIE = "tt_guest_cart";

export const GUEST_CART_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

/** Sent on POST /api/cart when the shopper intentionally emptied the cart. */
export const CART_CLEAR_INTENT_HEADER = "x-cart-intent";
export const CART_CLEAR_INTENT = "clear";

const COOKIE_VALUE_LIMIT = 3500;

export interface GuestCartSnapshot {
  id: string;
  items: CartItem[];
  /** True when the item list was dropped to keep the cookie under the size limit. */
  truncated: boolean;
}

export function createGuestCartId(): string {
  return crypto.randomUUID();
}

export function isExplicitCartClear(request: Request): boolean {
  return request.headers.get(CART_CLEAR_INTENT_HEADER) === CART_CLEAR_INTENT;
}

/**
 * A full-cart POST of [] is how the client sync used to wipe a cart it had
 * not finished updating. Only an explicit clear may replace a non-empty cart
 * with an empty one.
 */
export function shouldRejectEmptyCartReplace(
  existingCount: number,
  incomingCount: number,
  explicitClear: boolean
): boolean {
  return incomingCount === 0 && existingCount > 0 && !explicitClear;
}

export function encodeGuestCartCookie(
  id: string,
  items: CartItem[]
): string {
  const encode = (cartItems: CartItem[], truncated: boolean) =>
    Buffer.from(
      JSON.stringify({ v: 1, id, items: cartItems, truncated }),
      "utf8"
    ).toString("base64url");

  const full = encode(items, false);
  if (full.length <= COOKIE_VALUE_LIMIT) return full;

  // The id still has to stick. Item durability then comes from localStorage.
  // `truncated` stops a later request from treating this empty list as a clear.
  return encode([], true);
}

export function decodeGuestCartCookie(
  value: string | null | undefined
): GuestCartSnapshot | null {
  if (!value) return null;

  try {
    const parsed = JSON.parse(
      Buffer.from(value, "base64url").toString("utf8")
    ) as { id?: unknown; items?: unknown; truncated?: unknown };

    if (typeof parsed.id !== "string" || parsed.id.length === 0) return null;
    if (!Array.isArray(parsed.items)) return null;

    const items = parsed.items.filter(isCartItem);
    return { id: parsed.id, items, truncated: parsed.truncated === true };
  } catch {
    return null;
  }
}

function isCartItem(value: unknown): value is CartItem {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<CartItem>;
  return (
    typeof item.id === "string" &&
    typeof item.productId === "string" &&
    typeof item.name === "string" &&
    typeof item.price === "number" &&
    typeof item.quantity === "number"
  );
}

export function readCookie(request: Request, name: string): string | null {
  const header = request.headers.get("cookie");
  if (!header) return null;

  for (const part of header.split(";")) {
    const separator = part.indexOf("=");
    if (separator === -1) continue;
    const key = part.slice(0, separator).trim();
    if (key !== name) continue;
    const raw = part.slice(separator + 1).trim();
    try {
      return decodeURIComponent(raw);
    } catch {
      return raw;
    }
  }

  return null;
}

export function isSecureRequest(request: Request): boolean {
  const forwarded = request.headers.get("x-forwarded-proto");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() === "https";
  }

  try {
    return new URL(request.url).protocol === "https:";
  } catch {
    return false;
  }
}
