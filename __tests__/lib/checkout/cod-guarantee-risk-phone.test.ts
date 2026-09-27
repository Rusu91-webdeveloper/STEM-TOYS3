/**
 * @jest-environment node
 */

import { resolveCodGuaranteeCustomerStats } from "@/lib/checkout/cod-guarantee-risk";

jest.mock("@/lib/db", () => ({
  db: {
    user: { findUnique: jest.fn() },
    order: { count: jest.fn(), findMany: jest.fn() },
  },
}));

const { db } = require("@/lib/db");

describe("COD refusal history by phone", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    db.user.findUnique.mockResolvedValue(null);
    db.order.count.mockResolvedValue(0);
    db.order.findMany.mockResolvedValue([]);
  });

  it("counts a refused COD order on another email when the phone matches", async () => {
    db.order.findMany.mockResolvedValue([
      {
        id: "ord_refused",
        shippingAddress: { phone: "+40 722-111-222" },
      },
    ]);

    const stats = await resolveCodGuaranteeCustomerStats({
      guestEmail: "other@example.com",
      phone: "0722 111 222",
    });

    expect(stats).toEqual({ priorOrderCount: 0, priorCodRtoCount: 1 });
    expect(db.user.findUnique).toHaveBeenCalledWith({
      where: { email: "other@example.com" },
      select: { id: true, role: true },
    });
  });

  it("counts a user refusal and a phone refusal once when they are the same order", async () => {
    db.order.count.mockResolvedValue(2);
    db.order.findMany.mockImplementation(
      (args: { select?: { shippingAddress?: unknown } }) => {
        if (args.select?.shippingAddress) {
          return Promise.resolve([
            { id: "same", shippingAddress: { phone: "0722111222" } },
            { id: "other", shippingAddress: { phone: "0040-722-111-222" } },
          ]);
        }
        return Promise.resolve([{ id: "same" }]);
      }
    );

    const stats = await resolveCodGuaranteeCustomerStats({
      userId: "user_1",
      phone: "40722111222",
    });

    expect(stats).toEqual({ priorOrderCount: 2, priorCodRtoCount: 2 });
  });

  it("ignores a refused order whose phone does not match", async () => {
    db.order.findMany.mockResolvedValue([
      {
        id: "ord_other",
        shippingAddress: { phone: "0733000000" },
      },
    ]);

    const stats = await resolveCodGuaranteeCustomerStats({
      guestEmail: "new@example.com",
      phone: "0722111222",
    });

    expect(stats.priorCodRtoCount).toBe(0);
  });
});
