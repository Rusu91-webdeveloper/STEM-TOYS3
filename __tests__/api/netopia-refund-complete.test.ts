/**
 * @jest-environment node
 */

export {};

const mockAuth = jest.fn();
const mockOrderFindUnique = jest.fn();
const mockReturnFindMany = jest.fn();
const mockOrderUpdate = jest.fn();
const mockReturnUpdate = jest.fn();
const mockOrderItemUpdate = jest.fn();
const mockDbTransaction = jest.fn();
const mockSendEmail = jest.fn();

jest.mock("@/lib/auth", () => ({
  auth: () => mockAuth(),
}));

jest.mock("@/lib/db", () => ({
  db: {
    order: {
      findUnique: (...args: unknown[]) => mockOrderFindUnique(...args),
      update: (...args: unknown[]) => mockOrderUpdate(...args),
    },
    return: {
      findMany: (...args: unknown[]) => mockReturnFindMany(...args),
      update: (...args: unknown[]) => mockReturnUpdate(...args),
    },
    orderItem: {
      update: (...args: unknown[]) => mockOrderItemUpdate(...args),
    },
    $transaction: (...args: unknown[]) => mockDbTransaction(...args),
  },
}));

jest.mock("@/lib/email/database-template-service", () => ({
  DatabaseTemplateService: {
    sendEmail: (...args: unknown[]) => mockSendEmail(...args),
  },
}));

describe("POST /api/payments/netopia/refund/complete", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockAuth.mockResolvedValue({
      user: {
        id: "admin_1",
        role: "ADMIN",
        email: "admin@example.com",
      },
    });

    mockOrderFindUnique.mockResolvedValue({
      id: "order_1",
      orderNumber: "ORD-1001",
      total: 100,
      paymentStatus: "REFUND_PENDING",
      notes: "[REFUND_REQUESTED: REF-1 - Amount: 100.00 RON - reason - 2026-04-08T09:00:00.000Z - Requested by: admin@example.com - returnIds=ret_1]",
      user: {
        name: "Ana",
        email: "ana@example.com",
      },
    });

    mockReturnFindMany.mockResolvedValue([
      {
        id: "ret_1",
        orderItemId: "item_1",
        status: "RECEIVED",
        refundStatus: null,
        resolutionNotes: null,
      },
    ]);

    mockOrderUpdate.mockResolvedValue({
      id: "order_1",
      paymentStatus: "REFUNDED",
    });
    mockReturnUpdate.mockResolvedValue({
      id: "ret_1",
      status: "REFUNDED",
      refundStatus: "SUCCESS",
    });
    mockOrderItemUpdate.mockResolvedValue({
      id: "item_1",
      returnStatus: "REFUNDED",
    });
    mockDbTransaction.mockImplementation(async callback =>
      callback({
        order: {
          update: (...args: unknown[]) => mockOrderUpdate(...args),
        },
        return: {
          update: (...args: unknown[]) => mockReturnUpdate(...args),
        },
        orderItem: {
          update: (...args: unknown[]) => mockOrderItemUpdate(...args),
        },
      })
    );
    mockSendEmail.mockResolvedValue({ success: true });
  });

  it("syncs linked returns when a manual refund is completed", async () => {
    const { POST } = await import(
      "@/app/api/payments/netopia/refund/complete/route"
    );

    const response = await POST(
      new Request("http://localhost/api/payments/netopia/refund/complete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId: "order_1",
          netopiaRefundId: "NP-REF-1",
          refundedAmount: 100,
        }),
      })
    );

    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.data.syncedReturnIds).toEqual(["ret_1"]);
    expect(mockDbTransaction).toHaveBeenCalled();
    expect(mockReturnUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "ret_1" },
        data: expect.objectContaining({
          status: "REFUNDED",
          refundStatus: "SUCCESS",
          resolutionStatus: "REFUNDED",
        }),
      })
    );
    expect(mockOrderItemUpdate).toHaveBeenCalledWith({
      where: { id: "item_1" },
      data: { returnStatus: "REFUNDED" },
    });
  });

  it("returns a warning instead of syncing ambiguous partial refunds", async () => {
    mockOrderFindUnique.mockResolvedValue({
      id: "order_1",
      orderNumber: "ORD-1001",
      total: 100,
      paymentStatus: "REFUND_PENDING",
      notes: "",
      user: {
        name: "Ana",
        email: "ana@example.com",
      },
    });
    mockReturnFindMany.mockResolvedValue([
      {
        id: "ret_1",
        orderItemId: "item_1",
        status: "RECEIVED",
        refundStatus: null,
        resolutionNotes: null,
      },
      {
        id: "ret_2",
        orderItemId: "item_2",
        status: "RECEIVED",
        refundStatus: null,
        resolutionNotes: null,
      },
    ]);

    const { POST } = await import(
      "@/app/api/payments/netopia/refund/complete/route"
    );

    const response = await POST(
      new Request("http://localhost/api/payments/netopia/refund/complete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId: "order_1",
          netopiaRefundId: "NP-REF-2",
          refundedAmount: 50,
        }),
      })
    );

    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.data.syncedReturnIds).toEqual([]);
    expect(payload.data.manualReviewRequired).toBe(true);
    expect(payload.data.manualReviewReason).toContain("returnIds");
    expect(mockReturnUpdate).not.toHaveBeenCalled();
    expect(mockOrderItemUpdate).not.toHaveBeenCalled();
  });
});
