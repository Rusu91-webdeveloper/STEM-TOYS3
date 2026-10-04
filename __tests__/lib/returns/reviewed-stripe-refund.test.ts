/** @jest-environment node */
import type Stripe from "stripe";
import {
  refundReviewSchema,
  reviewedStripeRefund,
} from "@/lib/returns/reviewed-stripe-refund";

const retrieve = jest.fn();
const list = jest.fn();
const create = jest.fn();
const stripe = {
  paymentIntents: { retrieve },
  refunds: { list, create },
} as unknown as Stripe;
const input = {
  review: {
    amountRon: 120,
    notes: "Full withdrawal: goods 100 plus standard delivery 20.",
    confirmed: true as const,
  },
  returnId: "r1",
  orderNumber: "O1",
  orderItemId: "i1",
  paymentIntentId: "pi_1",
  orderTotal: 120,
  reviewerId: "admin",
};
const intent = (refunded = 0) => ({
  status: "succeeded",
  currency: "ron",
  latest_charge: {
    amount: 12000,
    amount_refunded: refunded,
    paid: true,
    disputed: false,
  },
});
beforeEach(() => {
  jest.resetAllMocks();
  retrieve.mockResolvedValueOnce(intent()).mockResolvedValue(intent(12000));
  list.mockResolvedValue({ data: [], has_more: false });
  create.mockResolvedValue({ amount: 12000, status: "succeeded" });
});
test("can refund the goods plus initial delivery, and records a stable retry key", async () => {
  expect(await reviewedStripeRefund(stripe, input)).toMatchObject({
    succeeded: true,
    fullyRefunded: true,
  });
  expect(create).toHaveBeenCalledWith(
    expect.objectContaining({ amount: 12000 }),
    { idempotencyKey: "return-refund-r1" }
  );
});
test("recovers from a successful Stripe refund followed by a failed database update without sending money twice", async () => {
  retrieve.mockReset().mockResolvedValue(intent(12000));
  list.mockResolvedValue({
    data: [
      { amount: 12000, status: "succeeded", metadata: { returnId: "r1" } },
    ],
    has_more: false,
  });
  expect(await reviewedStripeRefund(stripe, input)).toMatchObject({
    succeeded: true,
    fullyRefunded: true,
  });
  expect(create).not.toHaveBeenCalled();
});
test("a pending refund is not a successful reimbursement", async () => {
  create.mockResolvedValue({ status: "pending" });
  expect(await reviewedStripeRefund(stripe, input)).toMatchObject({
    succeeded: false,
    fullyRefunded: false,
  });
});
test("a partial refund does not mark the entire payment as refunded", async () => {
  retrieve
    .mockReset()
    .mockResolvedValueOnce(intent())
    .mockResolvedValue(intent(10000));
  expect(
    await reviewedStripeRefund(stripe, {
      ...input,
      review: { ...input.review, amountRon: 100 },
    })
  ).toMatchObject({ succeeded: true, fullyRefunded: false });
});
test("blocks an amount exceeding the remaining charge", async () => {
  retrieve.mockReset().mockResolvedValue(intent(10000));
  await expect(reviewedStripeRefund(stripe, input)).rejects.toThrow(
    "soldul rambursabil"
  );
  expect(create).not.toHaveBeenCalled();
});
test("blocks changing the reviewed amount on a retry", async () => {
  list.mockResolvedValue({
    data: [
      { amount: 10000, status: "succeeded", metadata: { returnId: "r1" } },
    ],
    has_more: false,
  });
  await expect(reviewedStripeRefund(stripe, input)).rejects.toThrow(
    "altă sumă"
  );
  expect(create).not.toHaveBeenCalled();
});
test.each([0, -1, 1.234, NaN, Infinity])(
  "does not accept an invalid reviewed amount: %s",
  amountRon => {
    expect(
      refundReviewSchema.safeParse({ ...input.review, amountRon }).success
    ).toBe(false);
  }
);
test("blocks disputed or uncaptured payments", async () => {
  retrieve
    .mockReset()
    .mockResolvedValue({ ...intent(), status: "requires_capture" });
  await expect(reviewedStripeRefund(stripe, input)).rejects.toThrow(
    "verificate"
  );
  expect(create).not.toHaveBeenCalled();
});
