/**
 * @jest-environment node
 */

import { NextRequest } from "next/server";

const mockCreate = jest.fn();
const mockUpdate = jest.fn();
const mockRetrieve = jest.fn();
const mockResolveCheckoutPricing = jest.fn();

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

jest.mock("@/lib/checkout/authoritative-pricing", () => ({
  CheckoutPricingError: class CheckoutPricingError extends Error {
    code: string;
    status: number;
    details?: Record<string, unknown>;

    constructor(
      code: string,
      message: string,
      status = 400,
      details?: Record<string, unknown>
    ) {
      super(message);
      this.code = code;
      this.status = status;
      this.details = details;
    }
  },
  resolveCheckoutPricing: mockResolveCheckoutPricing,
}));

describe("POST /api/stripe/create-payment-intent", () => {
  let handler: (typeof import("@/app/api/stripe/create-payment-intent/route"))["POST"];

  beforeEach(async () => {
    jest.resetModules();
    process.env.STRIPE_SECRET_KEY = "sk_test_mock";
    process.env.STRIPE_DEFAULT_CURRENCY = "RON";
    const { auth } = require("@/lib/auth");
    auth.mockResolvedValue({
      user: { id: "user_123", email: "user@example.com" },
    });
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
    mockResolveCheckoutPricing.mockResolvedValue({
      orderTotal: 321.45,
      codGuaranteeAmount: 18,
    });
    handler = (await import("@/app/api/stripe/create-payment-intent/route"))
      .POST;
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
      amount: 12345,
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
    expect(mockUpdate).toHaveBeenCalledTimes(1);
    expect(mockUpdate.mock.calls[0][0]).toBe("pi_existing");
    expect(mockUpdate.mock.calls[0][1]).toMatchObject({
      amount: 5000,
      receipt_email: "user@example.com",
      metadata: expect.objectContaining({
        userId: "user_123",
        userEmail: "user@example.com",
      }),
    });
    expect(mockCreate).not.toHaveBeenCalled();
    expect(payload).toEqual({
      success: true,
      clientSecret: "cs_test_existing",
      paymentIntentId: "pi_existing",
      amount: 5000,
    });
  });

  it("uses authoritative checkout pricing when checkout context is provided", async () => {
    const request = new NextRequest(
      "http://localhost/api/stripe/create-payment-intent",
      {
        method: "POST",
        body: JSON.stringify({
          amount: 100,
          checkoutContext: {
            items: [
              {
                productId: "prod_1",
                quantity: 2,
              },
            ],
            shippingMethodId: "fancourier:home",
            couponCode: "WELCOME10",
            paymentMethod: "stripe_new",
          },
        }),
        headers: { "Content-Type": "application/json" },
      }
    );

    const response = await handler(request);
    const payload = await response.json();

    expect(mockResolveCheckoutPricing).toHaveBeenCalledWith({
      userId: "user_123",
      items: [
        {
          productId: "prod_1",
          quantity: 2,
        },
      ],
      shippingMethodId: "fancourier:home",
      couponCode: "WELCOME10",
      paymentMethod: "stripe_new",
    });
    expect(mockCreate).toHaveBeenCalledTimes(1);
    expect(mockCreate.mock.calls[0][0]).toMatchObject({
      amount: 32145,
      currency: "ron",
    });
    expect(payload).toEqual({
      success: true,
      clientSecret: "cs_test_123",
      paymentIntentId: "pi_test_123",
      amount: 32145,
    });
  });

  it("rejects an unauthenticated card payment", async () => {
    const { auth } = require("@/lib/auth");
    auth.mockResolvedValue(null);

    const request = new NextRequest(
      "http://localhost/api/stripe/create-payment-intent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": "203.0.113.10",
        },
        body: JSON.stringify({
          amount: 1000,
          guestEmail: "guest@example.com",
          metadata: { paymentFlow: "card" },
        }),
      }
    );

    const response = await handler(request);
    const payload = await response.json();

    expect(response.status).toBe(401);
    expect(payload.error).toBe("Authentication required");
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("creates a guest COD guarantee intent from the checkout email", async () => {
    const { auth } = require("@/lib/auth");
    auth.mockResolvedValue(null);

    const request = new NextRequest(
      "http://localhost/api/stripe/create-payment-intent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": "203.0.113.11",
        },
        body: JSON.stringify({
          amount: 100,
          guestEmail: "Guest@Example.com",
          checkoutContext: {
            items: [{ productId: "prod_1", quantity: 1 }],
            shippingMethodId: "fancourier:standard",
            paymentMethod: "cash_on_delivery",
          },
          metadata: {
            paymentFlow: "cod_guarantee",
            userId: "should-not-stick",
          },
        }),
      }
    );

    const response = await handler(request);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(mockResolveCheckoutPricing).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "",
        paymentMethod: "cash_on_delivery",
      })
    );
    expect(mockCreate.mock.calls[0][0]).toMatchObject({
      amount: 1800,
      currency: "ron",
      receipt_email: "guest@example.com",
      metadata: expect.objectContaining({
        guestEmail: "guest@example.com",
        userEmail: "guest@example.com",
        paymentFlow: "cod_guarantee",
      }),
    });
    expect(mockCreate.mock.calls[0][0].metadata.userId).toBeUndefined();
    expect(payload.amount).toBe(1800);
  });

  it("applies the guest order rate limit to COD guarantee intents", async () => {
    const { auth } = require("@/lib/auth");
    auth.mockResolvedValue(null);

    const makeRequest = () =>
      new NextRequest("http://localhost/api/stripe/create-payment-intent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": "203.0.113.12",
        },
        body: JSON.stringify({
          amount: 100,
          guestEmail: "guest@example.com",
          checkoutContext: {
            items: [{ productId: "prod_1", quantity: 1 }],
            paymentMethod: "cash_on_delivery",
          },
          metadata: { paymentFlow: "cod_guarantee" },
        }),
      });

    const statuses = [];
    for (let attempt = 0; attempt < 6; attempt += 1) {
      const response = await handler(makeRequest());
      statuses.push(response.status);
    }

    expect(statuses.slice(0, 5)).toEqual([200, 200, 200, 200, 200]);
    expect(statuses[5]).toBe(429);
  });

  it("does not rate-limit a logged-in payment intent", async () => {
    const request = new NextRequest(
      "http://localhost/api/stripe/create-payment-intent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": "203.0.113.12",
        },
        body: JSON.stringify({ amount: 2200 }),
      }
    );

    const response = await handler(request);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(mockCreate.mock.calls[0][0].metadata).toMatchObject({
      userId: "user_123",
      userEmail: "user@example.com",
    });
  });
});
