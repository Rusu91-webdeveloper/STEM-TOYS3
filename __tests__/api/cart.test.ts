/**
 * @jest-environment node
 */

import { NextRequest } from "next/server";

import { GET, POST } from "@/app/api/cart/route";
import { SESSION_CART_STORAGE } from "@/lib/cart-storage";

jest.mock("@/lib/db", () => ({
  db: {
    book: {
      findMany: jest.fn(),
    },
    product: {
      findMany: jest.fn(),
    },
  },
}));

jest.mock("@/lib/rate-limit", () => ({
  withRateLimit: jest.fn(handler => handler),
}));

const { db } = require("@/lib/db");

const commonHeaders = {
  "content-type": "application/json",
  "user-agent": "jest-test-agent",
  "accept-language": "en-US",
  "accept-encoding": "gzip",
  "sec-fetch-site": "same-origin",
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
  const fallback = response.headers.get("set-cookie");
  const lines = setCookies.length > 0 ? setCookies : fallback ? [fallback] : [];

  for (const line of lines) {
    const pair = line.split(";")[0] ?? "";
    const separator = pair.indexOf("=");
    if (separator === -1) continue;
    jar.set(pair.slice(0, separator).trim(), pair.slice(separator + 1).trim());
  }

  return Array.from(jar.entries())
    .map(([key, value]) => `${key}=${value}`)
    .join("; ");
}

describe("/api/cart (session cart)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    SESSION_CART_STORAGE.clear();
    db.book.findMany.mockResolvedValue([]);
    db.product.findMany.mockResolvedValue([]);
  });

  afterAll(() => {
    if (global.__CART_CLEANUP_INTERVAL__) {
      clearInterval(global.__CART_CLEANUP_INTERVAL__);
      global.__CART_CLEANUP_INTERVAL__ = undefined;
    }
  });

  it("returns an empty guest cart and sets a 30-day guest cookie", async () => {
    const request = new NextRequest("http://localhost:3000/api/cart", {
      headers: commonHeaders,
    });
    const response = await GET(request);
    const data = await response.json();
    const setCookie = response.headers.get("set-cookie") ?? "";

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.ephemeral).toBe(false);
    expect(data.data).toEqual([]);
    expect(setCookie).toContain("tt_guest_cart=");
    expect(setCookie).toContain("Max-Age=2592000");
  });

  it("stores and returns validated cart items in session storage", async () => {
    db.product.findMany.mockResolvedValue([
      {
        id: "product-1",
        isActive: true,
      },
    ]);

    const payload = [
      {
        productId: "product-1",
        name: "STEM Kit",
        price: 99.99,
        quantity: 2,
        image: "https://example.com/kit.jpg",
      },
    ];

    const postReq = new NextRequest("http://localhost:3000/api/cart", {
      method: "POST",
      headers: commonHeaders,
      body: JSON.stringify(payload),
    });
    const postRes = await POST(postReq);
    const postData = await postRes.json();
    const cookie = cookieHeaderFrom(postRes);

    expect(postRes.status).toBe(200);
    expect(postData.success).toBe(true);
    expect(postData.data).toHaveLength(1);
    expect(postData.data[0]).toMatchObject({
      id: "product-1",
      productId: "product-1",
      quantity: 2,
    });

    const getReq = new NextRequest("http://localhost:3000/api/cart", {
      headers: { ...commonHeaders, cookie },
    });
    const getRes = await GET(getReq);
    const getData = await getRes.json();

    expect(getRes.status).toBe(200);
    expect(getData.data).toHaveLength(1);
    expect(getData.data[0].productId).toBe("product-1");
  });

  it("returns 400 for invalid JSON payload", async () => {
    const request = new NextRequest("http://localhost:3000/api/cart", {
      method: "POST",
      headers: commonHeaders,
      body: "{invalid-json",
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("INVALID_JSON");
  });

  it("returns 400 for invalid cart schema payload", async () => {
    const invalidPayload = [
      {
        productId: "product-1",
        name: "STEM Kit",
        price: 99.99,
        quantity: 0,
      },
    ];

    const request = new NextRequest("http://localhost:3000/api/cart", {
      method: "POST",
      headers: commonHeaders,
      body: JSON.stringify(invalidPayload),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("VALIDATION_ERROR");
  });

  it("skips unknown products instead of storing invalid items", async () => {
    db.product.findMany.mockResolvedValue([]);

    const payload = [
      {
        productId: "missing-product",
        name: "Missing Product",
        price: 12.5,
        quantity: 1,
      },
    ];

    const request = new NextRequest("http://localhost:3000/api/cart", {
      method: "POST",
      headers: commonHeaders,
      body: JSON.stringify(payload),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toEqual([]);
  });

  it("clears cart when empty body is sent", async () => {
    db.product.findMany.mockResolvedValue([
      {
        id: "product-1",
        isActive: true,
      },
    ]);

    const seedReq = new NextRequest("http://localhost:3000/api/cart", {
      method: "POST",
      headers: commonHeaders,
      body: JSON.stringify([
        {
          productId: "product-1",
          name: "STEM Kit",
          price: 40,
          quantity: 1,
        },
      ]),
    });
    const seedRes = await POST(seedReq);
    const cookie = cookieHeaderFrom(seedRes);

    const clearReq = new NextRequest("http://localhost:3000/api/cart", {
      method: "POST",
      headers: { ...commonHeaders, cookie },
      body: "",
    });
    const clearRes = await POST(clearReq);
    const clearData = await clearRes.json();

    expect(clearRes.status).toBe(200);
    expect(clearData.message).toBe("Cart cleared");
    expect(clearData.data).toEqual([]);
  });
});
