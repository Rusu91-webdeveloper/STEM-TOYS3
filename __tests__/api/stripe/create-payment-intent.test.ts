/**
 * @jest-environment node
 */

import { NextRequest } from "next/server";

const mockCreate = jest.fn();

jest.mock("stripe", () => {
  return jest.fn().mockImplementation(() => ({
    paymentIntents: {
      create: mockCreate,
    },
  }));
});

jest.mock("@/lib/auth", () => ({
  auth: jest.fn().mockResolvedValue({
    user: { id: "user_123", email: "user@example.com" },
  }),
}));

describe("POST /api/stripe/create-payment-intent", () => {
  let handler: typeof import("@/app/api/stripe/create-payment-intent/route")["POST"];

  beforeEach(async () => {
    jest.resetModules();
    process.env.STRIPE_SECRET_KEY = "sk_test_mock";
    process.env.STRIPE_DEFAULT_CURRENCY = "RON";
    mockCreate.mockResolvedValue({
      client_secret: "cs_test_123",
      id: "pi_test_123",
    });
    handler = (
      await import("@/app/api/stripe/create-payment-intent/route")
    ).POST;
  });

  afterEach(() => {
    jest.clearAllMocks();
    delete process.env.STRIPE_SECRET_KEY;
    delete process.env.STRIPE_DEFAULT_CURRENCY;
  });

  it("forwards minor unit amount without re-scaling and enforces configured currency", async () => {
    const request = new NextRequest(
      "http://localhost/api/stripe/create-payment-intent",
      {
        method: "POST",
        body: JSON.stringify({ amount: 12345, currency: "usd" }),
        headers: { "Content-Type": "application/json" },
      }
    );

    const response = await handler(request);
    const payload = await response.json();

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 12345,
        currency: "ron",
      })
    );
    expect(payload).toEqual({
      success: true,
      clientSecret: "cs_test_123",
      paymentIntentId: "pi_test_123",
    });
  });
});
