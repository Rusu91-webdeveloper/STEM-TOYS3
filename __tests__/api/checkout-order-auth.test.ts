/**
 * @jest-environment node
 */

import { NextRequest } from "next/server";

import { POST } from "@/app/api/checkout/order/route";

jest.mock("@/lib/auth", () => ({
  auth: jest.fn(),
}));

jest.mock("@/lib/csrf", () => ({
  validateCsrfForRequest: jest.fn(),
}));

jest.mock("@/lib/db", () => ({
  db: {},
}));

const { auth } = require("@/lib/auth");
const { validateCsrfForRequest } = require("@/lib/csrf");

describe("POST /api/checkout/order auth contract", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    validateCsrfForRequest.mockResolvedValue({ valid: true });
  });

  it("requires a guest email when the shopper is not signed in", async () => {
    auth.mockResolvedValue(null);

    const request = new NextRequest("http://localhost/api/checkout/order", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        shippingAddress: {
          fullName: "Test User",
          addressLine1: "Street 1",
          city: "Bucharest",
          state: "B",
          postalCode: "010101",
          country: "RO",
          phone: "+40700000000",
        },
        items: [
          {
            productId: "prod_1",
            name: "Product 1",
            price: 10,
            quantity: 1,
          },
        ],
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("GUEST_EMAIL_REQUIRED");
  });

  it("returns 429 after five guest order attempts from the same IP", async () => {
    auth.mockResolvedValue(null);
    const headers = {
      "content-type": "application/json",
      "x-forwarded-for": "203.0.113.44",
    };
    const body = JSON.stringify({
      shippingAddress: {
        fullName: "Test User",
        addressLine1: "Street 1",
        city: "Bucharest",
        state: "B",
        postalCode: "010101",
        country: "RO",
        phone: "+40700000000",
      },
      items: [
        {
          productId: "prod_1",
          name: "Product 1",
          price: 10,
          quantity: 1,
        },
      ],
    });

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const response = await POST(
        new NextRequest("http://localhost/api/checkout/order", {
          method: "POST",
          headers,
          body,
        })
      );
      expect(response.status).toBe(400);
    }

    const blocked = await POST(
      new NextRequest("http://localhost/api/checkout/order", {
        method: "POST",
        headers,
        body,
      })
    );
    const blockedBody = await blocked.json();
    expect(blocked.status).toBe(429);
    expect(blockedBody.message).toMatch(/fără cont/i);

    auth.mockResolvedValue({
      user: { id: "user_1", email: "buyer@example.com", role: "CUSTOMER" },
    });
    const signedIn = await POST(
      new NextRequest("http://localhost/api/checkout/order", {
        method: "POST",
        headers,
        body,
      })
    );
    expect(signedIn.status).not.toBe(429);
  });
});
