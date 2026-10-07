/** @jest-environment node */
import { markCODOrderAsRejected } from "@/lib/analytics/cod-analytics";
import { db } from "@/lib/db";

jest.mock("@/lib/db", () => ({
  db: { order: { findUnique: jest.fn(), update: jest.fn() } },
}));
beforeEach(() => jest.clearAllMocks());
test.each(["cod", "cash_on_delivery"])(
  "records refusal for %s while preserving authorization evidence",
  async paymentMethod => {
    jest
      .mocked(db.order.findUnique)
      .mockResolvedValue({
        paymentMethod,
        notes: "COD Guarantee authorized at fixture - PI: pi_hold",
      } as never);
    await markCODOrderAsRejected("order", "Refused", "Fixture review");
    expect(db.order.update).toHaveBeenCalledWith({
      where: { id: "order" },
      data: {
        status: "CANCELLED",
        paymentStatus: "FAILED",
        notes:
          "COD Guarantee authorized at fixture - PI: pi_hold | COD REJECTED - Reason: Refused | Fixture review",
      },
    });
  }
);
