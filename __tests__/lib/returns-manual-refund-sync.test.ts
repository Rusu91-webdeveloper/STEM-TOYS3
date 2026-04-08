import {
  buildManualRefundRequestNote,
  extractLatestManualRefundRequestedReturnIds,
  planManualRefundReturnSync,
} from "@/lib/returns/manual-refund-sync";

describe("manual refund sync helpers", () => {
  it("extracts return ids from the latest refund request note", () => {
    const firstNote = buildManualRefundRequestNote({
      refundRequestId: "REF-1",
      refundAmount: 50,
      requestedAt: new Date("2026-04-08T08:00:00.000Z"),
      requestedBy: "admin@example.com",
      returnIds: ["ret_old"],
    });
    const secondNote = buildManualRefundRequestNote({
      refundRequestId: "REF-2",
      refundAmount: 80,
      requestedAt: new Date("2026-04-08T09:00:00.000Z"),
      requestedBy: "admin@example.com",
      returnIds: ["ret_1", "ret_2"],
    });

    expect(
      extractLatestManualRefundRequestedReturnIds(
        `${firstNote}\n${secondNote}`
      )
    ).toEqual(["ret_1", "ret_2"]);
  });

  it("flags partial refunds with multiple eligible returns for manual review", () => {
    const plan = planManualRefundReturnSync({
      orderReturns: [
        {
          id: "ret_1",
          orderItemId: "item_1",
          status: "RECEIVED",
          refundStatus: null,
        },
        {
          id: "ret_2",
          orderItemId: "item_2",
          status: "RECEIVED",
          refundStatus: null,
        },
      ],
      orderTotal: 100,
      refundedAmount: 50,
    });

    expect(plan).toEqual(
      expect.objectContaining({
        ok: true,
        manualReviewRequired: true,
        targetReturns: [],
      })
    );
  });
});
