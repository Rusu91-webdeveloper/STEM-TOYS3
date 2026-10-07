/** @jest-environment node */
import type Stripe from "stripe";

import { settleCodHold } from "@/lib/checkout/cod-hold-settlement";

const retrieve = jest.fn();
const cancel = jest.fn();
const capture = jest.fn();
const create = jest.fn();
const stripe = {
  paymentIntents: { retrieve, cancel, capture, create },
} as unknown as Stripe;
const now = new Date("2026-10-07T12:00:00Z");
const input = { paymentIntentId: "pi_hold", orderId: "o1", now };
const intent = (overrides: object = {}) => ({
  status: "requires_capture",
  capture_method: "manual",
  currency: "ron",
  amount_received: 0,
  metadata: { paymentFlow: "cod_guarantee", orderId: "o1" },
  latest_charge: {
    payment_method_details: {
      card: { capture_before: now.getTime() / 1000 + 3600 },
    },
  },
  ...overrides,
});
beforeEach(() => {
  jest.resetAllMocks();
  retrieve.mockResolvedValue(intent());
  cancel.mockResolvedValue(intent({ status: "canceled" }));
});
afterEach(() => {
  expect(capture).not.toHaveBeenCalled();
  expect(create).not.toHaveBeenCalled();
});
test("releases a valid hold using a stable retry key", async () => {
  expect(await settleCodHold(stripe, input)).toEqual({
    outcome: "released",
    expiresAt: "2026-10-07T13:00:00.000Z",
  });
  expect(cancel).toHaveBeenCalledWith(
    "pi_hold",
    { cancellation_reason: "abandoned" },
    expect.objectContaining({ idempotencyKey: "cod-hold-release-o1-pi_hold" })
  );
});
test("records confirmed automatic expiry without attempting cancellation or replacement", async () => {
  retrieve.mockResolvedValue(
    intent({
      status: "canceled",
      cancellation_reason: "automatic",
      latest_charge: {
        payment_method_details: {
          card: { capture_before: now.getTime() / 1000 - 1 },
        },
      },
    })
  );
  expect((await settleCodHold(stripe, input)).outcome).toBe("expired");
  expect(cancel).not.toHaveBeenCalled();
});
test("an already-released hold needs no refund or second cancellation", async () => {
  retrieve.mockResolvedValue(
    intent({ status: "canceled", cancellation_reason: "abandoned" })
  );
  expect((await settleCodHold(stripe, input)).outcome).toBe("already_released");
  expect(cancel).not.toHaveBeenCalled();
});
test("captured money goes to review, never masquerades as a hold release", async () => {
  retrieve.mockResolvedValue(
    intent({ status: "succeeded", amount_received: 1999 })
  );
  expect((await settleCodHold(stripe, input)).outcome).toBe("captured_review");
  expect(cancel).not.toHaveBeenCalled();
});
test.each(["canceled", "succeeded"])(
  "recovers a cancellation race ending in %s",
  async status => {
    retrieve
      .mockResolvedValueOnce(intent())
      .mockResolvedValue(intent({ status }));
    cancel.mockRejectedValue(new Error("State changed"));
    expect((await settleCodHold(stripe, input)).outcome).toBe(
      status === "canceled" ? "already_released" : "captured_review"
    );
  }
);
test("a provider failure cannot be reported as a successful release", async () => {
  cancel.mockRejectedValue(new Error("Stripe unavailable"));
  await expect(settleCodHold(stripe, input)).rejects.toThrow(
    "Stripe unavailable"
  );
});
test.each([
  { metadata: { paymentFlow: "checkout" } },
  { metadata: { paymentFlow: "cod_guarantee", orderId: "other" } },
  { currency: "eur" },
  { capture_method: "automatic" },
  { status: "processing" },
])(
  "requires review before any mutation of an unexpected intent: %j",
  async overrides => {
    retrieve.mockResolvedValue(intent(overrides));
    expect((await settleCodHold(stripe, input)).outcome).toBe(
      "review_required"
    );
    expect(cancel).not.toHaveBeenCalled();
  }
);
test("uses processor state even when capture_before is past but the intent is still capturable", async () => {
  retrieve.mockResolvedValue(
    intent({
      latest_charge: {
        payment_method_details: {
          card: { capture_before: now.getTime() / 1000 - 1 },
        },
      },
    })
  );
  expect((await settleCodHold(stripe, input)).outcome).toBe("released");
  expect(cancel).toHaveBeenCalledTimes(1);
});
