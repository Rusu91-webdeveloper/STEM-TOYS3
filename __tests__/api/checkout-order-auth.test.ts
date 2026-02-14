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

  it("returns AUTH_REQUIRED when session is missing", async () => {
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

    expect(response.status).toBe(401);
    expect(data.error).toBe("AUTH_REQUIRED");
  });
});
