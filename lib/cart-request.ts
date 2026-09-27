import { NextResponse } from "next/server";

import type { CartItem } from "@/features/cart";
import {
  createGuestCartId,
  decodeGuestCartCookie,
  encodeGuestCartCookie,
  GUEST_CART_COOKIE,
  GUEST_CART_MAX_AGE_SECONDS,
  isSecureRequest,
  readCookie,
  type GuestCartSnapshot,
} from "@/lib/guest-cart";

import { migrateCart, SESSION_CART_STORAGE } from "./cart-storage";

export interface CartRequestContext {
  cartId: string;
  isGuest: boolean;
  guestCartId: string | null;
}

const cartRequestContext = new WeakMap<Request, CartRequestContext>();

function rememberGuestSnapshot(snapshot: GuestCartSnapshot | null): void {
  if (!snapshot) return;

  // A size-truncated cookie only carries the cart id. Do not replace a cart
  // that this process already has, and do not invent an empty cart.
  if (snapshot.truncated) {
    const existing = SESSION_CART_STORAGE.get(snapshot.id);
    if (existing && existing.length > 0) return;
    if (snapshot.items.length === 0) return;
  }

  // The cookie is the durable copy. Another server instance may still be
  // holding an older list for this id; the cookie the browser just sent wins.
  SESSION_CART_STORAGE.set(snapshot.id, snapshot.items);
}

function hasAuthCookie(request: Request): boolean {
  const cookieHeader = request.headers.get("cookie") || "";
  return /(?:^|;\s*)(?:next-auth\.session-token|__Secure-next-auth\.session-token)=/.test(
    cookieHeader
  );
}

/**
 * Guest carts are keyed by tt_guest_cart. Logged-in carts stay keyed by email,
 * and a guest cart is merged in once (higher quantity wins, no duplicate rows).
 */
export async function resolveCartRequest(
  request: Request
): Promise<CartRequestContext> {
  const cached = cartRequestContext.get(request);
  if (cached) return cached;

  const guestSnapshot = decodeGuestCartCookie(
    readCookie(request, GUEST_CART_COOKIE)
  );
  rememberGuestSnapshot(guestSnapshot);

  let context: CartRequestContext = {
    cartId: guestSnapshot?.id ?? createGuestCartId(),
    isGuest: true,
    guestCartId: guestSnapshot?.id ?? null,
  };

  if (hasAuthCookie(request)) {
    try {
      // Guest requests never enter this branch, so NextAuth stays unloaded
      // until a session cookie is actually present.
      const authPromise = import("@/lib/auth").then(({ auth }) => auth());
      const timeoutPromise = new Promise<null>(resolve => {
        setTimeout(() => resolve(null), 2000);
      });
      const session = await Promise.race([authPromise, timeoutPromise]);

      if (session?.user?.email) {
        const email = session.user.email;
        if (guestSnapshot?.id) {
          migrateCart(guestSnapshot.id, email);
        }
        context = {
          cartId: email,
          isGuest: false,
          guestCartId: guestSnapshot?.id ?? null,
        };
      }
    } catch (error) {
      console.log(`⚠️ [CART ID] Auth failed, using guest cart cookie:`, error);
    }
  }

  if (context.isGuest && !context.guestCartId) {
    context = { ...context, guestCartId: context.cartId };
  }

  cartRequestContext.set(request, context);
  return context;
}

export async function getCartId(request: Request): Promise<string> {
  const context = await resolveCartRequest(request);
  return context.cartId;
}

export function attachGuestCartCookie(
  response: NextResponse,
  request: Request,
  items: CartItem[]
): NextResponse {
  const context = cartRequestContext.get(request);
  if (!context) return response;

  // Login already merged this guest cart. Drop the cookie so a later cold
  // start does not merge the same guest items into the user cart again.
  if (!context.isGuest) {
    if (context.guestCartId) {
      response.cookies.set({
        name: GUEST_CART_COOKIE,
        value: "",
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 0,
        secure: isSecureRequest(request),
      });
    }
    return response;
  }

  const cartId = context.guestCartId ?? context.cartId;
  response.cookies.set({
    name: GUEST_CART_COOKIE,
    value: encodeGuestCartCookie(cartId, items),
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: GUEST_CART_MAX_AGE_SECONDS,
    secure: isSecureRequest(request),
  });
  return response;
}
