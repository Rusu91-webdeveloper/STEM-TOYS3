/**
 * @jest-environment node
 */

import { NextRequest } from "next/server";

import { GET, POST } from "@/app/api/cart/route";
import { SESSION_CART_STORAGE } from "@/lib/cart-storage";
import { decodeGuestCartCookie, GUEST_CART_COOKIE } from "@/lib/guest-cart";

jest.mock("@/lib/db", () => ({
  db: {
    book: { findMany: jest.fn() },
    product: { findMany: jest.fn() },
  },
}));

jest.mock("@/lib/rate-limit", () => ({
  withRateLimit: jest.fn(handler => handler),
}));

jest.mock("@/lib/auth", () => ({
  auth: jest.fn(),
}));

const { auth } = require("@/lib/auth");
const { db } = require("@/lib/db");

const headers = {
  "content-type": "application/json",
};

const stemKit = {
  productId: "product-1",
  name: "STEM Kit",
  price: 99,
  quantity: 1,
};

function cookieHeaderFrom(response: Response, existing?: string): string {
  const jar = new Map<string, string>();
  if (existing) {
    for (const part of existing.split(";")) {
      const separator = part.indexOf("=");
      if (separator === -1) continue;
      jar.set(part.slice(0, separator).trim(), part.slice(separator + 1).trim());
    }
  }

  const setCookies =
    typeof response.headers.getSetCookie === "function"
      ? response.headers.getSetCookie()
      : [];

  for (const line of setCookies) {
    const pair = line.split(";")[0] ?? "";
    const separator = pair.indexOf("=");
    if (separator === -1) continue;
    jar.set(pair.slice(0, separator).trim(), pair.slice(separator + 1).trim());
  }

  return Array.from(jar.entries())
    .map(([key, value]) => `${key}=${value}`)
    .join("; ");
}

function postCart(body: unknown, cookie?: string, extraHeaders?: HeadersInit) {
  return POST(
    new NextRequest("http://localhost:3000/api/cart", {
      method: "POST",
      headers: {
        ...headers,
        ...(cookie ? { cookie } : {}),
        ...extraHeaders,
      },
      body: typeof body === "string" ? body : JSON.stringify(body),
    })
  );
}

describe("guest cart durability", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    SESSION_CART_STORAGE.clear();
    db.book.findMany.mockResolvedValue([]);
    db.product.findMany.mockResolvedValue([
      { id: "product-1", isActive: true, stockQuantity: 5 },
      { id: "product-2", isActive: true, stockQuantity: 5 },
    ]);
    auth.mockResolvedValue(null);
  });

  it("keeps a guest item after the in-memory cart is wiped", async () => {
    const added = await postCart([stemKit]);
    const addedBody = await added.json();
    const cookie = cookieHeaderFrom(added);

    expect(added.status).toBe(200);
    expect(addedBody.data).toHaveLength(1);
    expect(cookie).toContain(`${GUEST_CART_COOKIE}=`);

    SESSION_CART_STORAGE.clear();

    const reloaded = await GET(
      new NextRequest("http://localhost:3000/api/cart", {
        headers: { cookie },
      })
    );
    const reloadedBody = await reloaded.json();

    expect(reloaded.status).toBe(200);
    expect(reloadedBody.data).toHaveLength(1);
    expect(reloadedBody.data[0].productId).toBe("product-1");
    expect(reloadedBody.data[0].quantity).toBe(1);
  });

  it("replaces a stale in-memory cart with the cookie snapshot", async () => {
    const added = await postCart([stemKit]);
    const cookie = cookieHeaderFrom(added);
    const rawValue = cookie
      .split(";")
      .map(part => part.trim())
      .find(part => part.startsWith(`${GUEST_CART_COOKIE}=`))
      ?.slice(`${GUEST_CART_COOKIE}=`.length);
    const snapshot = decodeGuestCartCookie(rawValue);

    expect(snapshot?.id).toEqual(expect.any(String));
    if (!snapshot) {
      throw new Error("guest cart cookie did not decode");
    }
    SESSION_CART_STORAGE.set(snapshot.id, [
      {
        id: "product-2",
        productId: "product-2",
        name: "Stale Puzzle",
        price: 10,
        quantity: 9,
      },
    ]);

    const reloaded = await GET(
      new NextRequest("http://localhost:3000/api/cart", {
        headers: { cookie },
      })
    );
    const reloadedBody = await reloaded.json();

    expect(reloadedBody.data).toHaveLength(1);
    expect(reloadedBody.data[0].productId).toBe("product-1");
    expect(reloadedBody.data[0].quantity).toBe(1);
  });

  it("does not let an empty cart sync overwrite a non-empty guest cart", async () => {
    const added = await postCart([stemKit]);
    const cookie = cookieHeaderFrom(added);

    const staleEmpty = await postCart([], cookie);
    const staleBody = await staleEmpty.json();

    expect(staleEmpty.status).toBe(200);
    expect(staleBody.data).toHaveLength(1);
    expect(staleBody.data[0].productId).toBe("product-1");

    SESSION_CART_STORAGE.clear();
    const reloaded = await GET(
      new NextRequest("http://localhost:3000/api/cart", {
        headers: { cookie: cookieHeaderFrom(staleEmpty, cookie) },
      })
    );
    const reloadedBody = await reloaded.json();
    expect(reloadedBody.data).toHaveLength(1);
  });

  it("clears the cart when the shopper explicitly empties it", async () => {
    const added = await postCart([stemKit]);
    const cookie = cookieHeaderFrom(added);

    const cleared = await postCart([], cookie, { "x-cart-intent": "clear" });
    const clearedBody = await cleared.json();

    expect(clearedBody.data).toEqual([]);

    SESSION_CART_STORAGE.clear();
    const reloaded = await GET(
      new NextRequest("http://localhost:3000/api/cart", {
        headers: { cookie: cookieHeaderFrom(cleared, cookie) },
      })
    );
    const reloadedBody = await reloaded.json();
    expect(reloadedBody.data).toEqual([]);
  });

  it("merges a guest cart into the user cart without duplicating items", async () => {
    const guestAdd = await postCart([
      { ...stemKit, quantity: 1 },
      {
        productId: "product-2",
        name: "Logic Puzzle",
        price: 40,
        quantity: 2,
      },
    ]);
    const guestCookie = cookieHeaderFrom(guestAdd);

    auth.mockResolvedValue({ user: { email: "parent@techtots.ro" } });
    const userSeed = await postCart(
      [{ ...stemKit, quantity: 3 }],
      "next-auth.session-token=test-session"
    );
    expect((await userSeed.json()).data[0].quantity).toBe(3);

    const merged = await GET(
      new NextRequest("http://localhost:3000/api/cart", {
        headers: {
          cookie: `${guestCookie}; next-auth.session-token=test-session`,
        },
      })
    );
    const mergedBody = await merged.json();
    const items = mergedBody.data as Array<{ productId: string; quantity: number }>;

    expect(mergedBody.user).toBe("parent@techtots.ro");
    expect(merged.headers.get("set-cookie") ?? "").toContain("Max-Age=0");
    expect(items).toHaveLength(2);
    expect(items.filter(item => item.productId === "product-1")).toHaveLength(1);
    expect(items.find(item => item.productId === "product-1")?.quantity).toBe(3);
    expect(items.find(item => item.productId === "product-2")?.quantity).toBe(2);
  });
});
