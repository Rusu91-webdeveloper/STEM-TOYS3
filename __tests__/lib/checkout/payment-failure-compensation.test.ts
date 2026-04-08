/**
 * @jest-environment node
 */

jest.mock("@/lib/db", () => ({
  db: {
    $transaction: jest.fn(),
  },
}));

import { compensateFailedOrder } from "@/lib/checkout/payment-failure-compensation";

const { db } = require("@/lib/db");

describe("compensateFailedOrder", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("restores stock and coupon usage for failed Netopia initiation", async () => {
    const tx = {
      order: {
        findUnique: jest.fn(async () => ({
          id: "ord_1",
          paymentStatus: "PENDING",
          status: "PENDING_REVIEW",
          notes: null,
          items: [
            {
              productId: "prod_1",
              quantity: 2,
              isDigital: false,
            },
          ],
        })),
        update: jest.fn(),
      },
      product: {
        update: jest.fn(),
      },
      couponUsage: {
        findMany: jest.fn(async () => [
          { couponId: "coupon_1" },
          { couponId: "coupon_1" },
        ]),
        deleteMany: jest.fn(),
      },
      coupon: {
        update: jest.fn(),
      },
    };

    db.$transaction.mockImplementation(async (callback: any) => callback(tx));

    await compensateFailedOrder({
      orderId: "ord_1",
      reason: "payment_creation_failed",
      source: "netopia_payment_creation_failed",
    });

    expect(tx.product.update).toHaveBeenCalledWith({
      where: { id: "prod_1" },
      data: {
        stockQuantity: { increment: 2 },
        reservedQuantity: { decrement: 2 },
      },
    });
    expect(tx.couponUsage.deleteMany).toHaveBeenCalledWith({
      where: { orderId: "ord_1" },
    });
    expect(tx.coupon.update).toHaveBeenCalledWith({
      where: { id: "coupon_1" },
      data: {
        currentUses: { decrement: 2 },
      },
    });
    expect(tx.order.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "ord_1" },
        data: expect.objectContaining({
          paymentStatus: "FAILED",
          status: "CANCELLED",
          netopiaPaymentUrl: null,
          netopiaInvoiceId: null,
          netopiaTransactionId: null,
        }),
      })
    );
  });
});
