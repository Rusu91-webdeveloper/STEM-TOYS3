/**
 * @jest-environment node
 */

import { NextRequest } from "next/server";

const mockCreate = jest.fn();
const mockUpdate = jest.fn();
const mockRetrieve = jest.fn();

jest.mock("stripe", () => {
  return jest.fn().mockImplementation(() => ({
    paymentIntents: {
      create: mockCreate,
      update: mockUpdate,
      retrieve: mockRetrieve,
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
    mockUpdate.mockResolvedValue({
      client_secret: "cs_test_existing",
      id: "pi_existing",
    });
    mockRetrieve.mockResolvedValue({
      id: "pi_existing",
      currency: "ron",
      status: "requires_payment_method",
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

  it("creates a payment intent with automatic payment methods and RON currency", async () => {
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

    expect(mockCreate).toHaveBeenCalledTimes(1);
    expect(mockCreate.mock.calls[0][0]).toMatchObject({
      amount: 12345,
      currency: "ron",
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: "always",
      },
    });
    expect(mockCreate.mock.calls[0][1]).toMatchObject({
      idempotencyKey: expect.any(String),
    });
    expect(payload).toEqual({
      success: true,
      clientSecret: "cs_test_123",
      paymentIntentId: "pi_test_123",
    });
  });

  it("updates an existing payment intent when a reusable ID is provided", async () => {
    const request = new NextRequest(
      "http://localhost/api/stripe/create-payment-intent",
      {
        method: "POST",
        body: JSON.stringify({
          amount: 5000,
          paymentIntentId: "pi_existing",
        }),
        headers: { "Content-Type": "application/json" },
      }
    );

    const response = await handler(request);
    const payload = await response.json();

    expect(mockRetrieve).toHaveBeenCalledWith("pi_existing");
    expect(mockUpdate).toHaveBeenCalledWith("pi_existing", {
      amount: 5000,
      metadata: expect.objectContaining({
        userId: "user_123",
      }),
    });
    expect(mockCreate).not.toHaveBeenCalled();
    expect(payload).toEqual({
      success: true,
      clientSecret: "cs_test_existing",
      paymentIntentId: "pi_existing",
    });
  });
});
