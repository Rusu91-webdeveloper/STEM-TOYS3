/** @jest-environment node */
import { settleCodHold } from "@/lib/checkout/cod-hold-settlement";
import {
  releaseCodGuaranteeHoldIfNeeded,
  reconcileTerminalCodHolds,
} from "@/lib/checkout/release-cod-hold";
import { db } from "@/lib/db";

jest.mock("@/lib/db", () => ({
  db: {
    order: {
      findUnique: jest.fn(),
      updateMany: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));
jest.mock("@/lib/stripe-server", () => ({ getStripeServerClient: () => ({}) }));
jest.mock("@/lib/checkout/cod-hold-settlement", () => ({
  settleCodHold: jest.fn(),
}));
const note =
  "COD Guarantee authorized at 2026-10-01T10:00:00Z - PI: pi_hold - Amount: 19.99 RON";
const input = { orderId: "o1", notes: note };
beforeEach(() => {
  jest.resetAllMocks();
  (settleCodHold as jest.Mock).mockResolvedValue({
    outcome: "expired",
    expiresAt: "2026-10-06T10:00:00Z",
  });
  (db.order.findUnique as jest.Mock).mockResolvedValue({
    notes: `${note} | Cancellation reason: test`,
  });
  (db.order.updateMany as jest.Mock).mockResolvedValue({ count: 1 });
});
test.each(["delivery", "cancellation", "refusal"] as const)(
  "records post-expiry %s without losing current notes",
  async event => {
    expect(
      (await releaseCodGuaranteeHoldIfNeeded({ ...input, event })).outcome
    ).toBe("expired");
    expect(db.order.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          notes: expect.stringContaining(
            `Cancellation reason: test | COD Guarantee settlement - PI: pi_hold - Outcome: expired - Event: ${event}`
          ),
        },
      })
    );
  }
);
test("re-reads and preserves a concurrent note update", async () => {
  (db.order.updateMany as jest.Mock)
    .mockResolvedValueOnce({ count: 0 })
    .mockResolvedValue({ count: 1 });
  (db.order.findUnique as jest.Mock)
    .mockResolvedValueOnce({ notes: note })
    .mockResolvedValue({ notes: `${note} | Courier evidence` });
  await releaseCodGuaranteeHoldIfNeeded(input);
  expect(db.order.updateMany).toHaveBeenLastCalledWith(
    expect.objectContaining({
      where: { id: "o1", notes: `${note} | Courier evidence` },
      data: {
        notes: expect.stringContaining(
          "Courier evidence | COD Guarantee settlement"
        ),
      },
    })
  );
});
test("retries do not duplicate the same settlement evidence", async () => {
  (db.order.findUnique as jest.Mock).mockResolvedValue({
    notes: `${note} | COD Guarantee settlement - PI: pi_hold - Outcome: expired - Event: delivery`,
  });
  await releaseCodGuaranteeHoldIfNeeded(input);
  expect(db.order.updateMany).not.toHaveBeenCalled();
});
test("records a retriable failure and never claims release", async () => {
  const log = jest.spyOn(console, "error").mockImplementation(() => {});
  (settleCodHold as jest.Mock).mockRejectedValue(new Error("Provider down"));
  expect((await releaseCodGuaranteeHoldIfNeeded(input)).outcome).toBe(
    "retry_required"
  );
  expect(db.order.updateMany).toHaveBeenCalledWith(
    expect.objectContaining({
      data: { notes: expect.stringContaining("Outcome: retry_required") },
    })
  );
  log.mockRestore();
});
test("orders without an authorization never call Stripe", async () => {
  expect(
    (await releaseCodGuaranteeHoldIfNeeded({ orderId: "o1" })).outcome
  ).toBe("not_required");
  expect(settleCodHold).not.toHaveBeenCalled();
});
test("nightly retries are bounded to terminal COD orders and retain financial status", async () => {
  (db.order.findMany as jest.Mock).mockResolvedValue([
    { id: "o1", notes: note, status: "CANCELLED" },
  ]);
  expect(await reconcileTerminalCodHolds()).toEqual({
    checked: 1,
    outcomes: { expired: 1 },
  });
  expect(db.order.findMany).toHaveBeenCalledWith(
    expect.objectContaining({
      take: 3,
      where: expect.objectContaining({
        status: { in: ["DELIVERED", "COMPLETED", "CANCELLED"] },
      }),
    })
  );
  expect(db.order.updateMany).toHaveBeenCalledWith(
    expect.objectContaining({ data: { notes: expect.any(String) } })
  );
});
