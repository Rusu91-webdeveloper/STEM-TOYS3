/**
 * @jest-environment node
 */

export {};

const mockAuth = jest.fn();
const mockFindUnique = jest.fn();
const mockReturnUpdate = jest.fn();
const mockReturnCount = jest.fn();
const mockOrderItemUpdate = jest.fn();
const mockOrderItemCount = jest.fn();
const mockOrderUpdate = jest.fn();
const mockDbTransaction = jest.fn();
const mockGenerateReturnLabel = jest.fn();
const mockSendReturnApprovedEmail = jest.fn();
const mockSendReturnRejectedEmail = jest.fn();
const mockGetStripeServerClient = jest.fn();
const mockStripeRefundCreate = jest.fn();

jest.mock("@/lib/auth", () => ({
  auth: () => mockAuth(),
}));

jest.mock("@/lib/db", () => ({
  db: {
    return: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
      update: (...args: unknown[]) => mockReturnUpdate(...args),
      count: (...args: unknown[]) => mockReturnCount(...args),
    },
    orderItem: {
      count: (...args: unknown[]) => mockOrderItemCount(...args),
      update: (...args: unknown[]) => mockOrderItemUpdate(...args),
    },
    order: {
      update: (...args: unknown[]) => mockOrderUpdate(...args),
    },
    $transaction: (...args: unknown[]) => mockDbTransaction(...args),
  },
}));

jest.mock("@/lib/return-label", () => ({
  generateReturnLabel: (...args: unknown[]) => mockGenerateReturnLabel(...args),
}));

jest.mock("@/lib/stripe-server", () => ({
  getStripeServerClient: () => mockGetStripeServerClient(),
}));

jest.mock("@/lib/email/return-templates", () => ({
  sendReturnApprovedEmail: (...args: unknown[]) =>
    mockSendReturnApprovedEmail(...args),
  sendReturnRejectedEmail: (...args: unknown[]) =>
    mockSendReturnRejectedEmail(...args),
}));

type ReturnRecordOverrides = Record<string, unknown>;

function buildOrderItem(overrides: Record<string, unknown> = {}) {
  return {
    id: "item_1",
    productId: "prod_1",
    name: "Robot STEM",
    price: 100,
    quantity: 1,
    returnStatus: "REQUESTED",
    product: {
      supplier: {
        id: "sup_1",
        name: "Supplier One",
      },
    },
    ...overrides,
  };
}

function buildReturnRecord(
  overrides: ReturnRecordOverrides = {}
): Record<string, unknown> {
  return {
    id: "ret_1",
    orderItemId: "item_1",
    status: "PENDING",
    refundStatus: null,
    refundError: "",
    supplierAuthorizationRequestedAt: null,
    liability: "UNDECIDED",
    resolutionStatus: "OPEN",
    externalClaimDeadline: null,
    resolutionNotes: null,
    reportLogs: [],
    order: {
      id: "order_1",
      orderNumber: "ORD-1001",
      createdAt: new Date("2026-03-01T10:00:00.000Z"),
      stripePaymentIntentId: null,
      total: 100,
      shippingCost: 20,
      paymentStatus: "PENDING",
    },
    orderItem: {
      ...buildOrderItem(),
    },
    user: {
      id: "user_1",
      name: "Ana",
      email: "ana@example.com",
      addresses: [],
    },
    ...overrides,
  };
}

describe("PATCH /api/returns/[returnId]/status", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockAuth.mockResolvedValue({
      user: {
        id: "admin_1",
        role: "ADMIN",
      },
    });

    mockOrderItemUpdate.mockResolvedValue({
      id: "item_1",
      returnStatus: "APPROVED",
    });
    mockOrderItemCount.mockResolvedValue(1);
    mockReturnCount.mockResolvedValue(0);
    mockOrderUpdate.mockResolvedValue({
      id: "order_1",
      paymentStatus: "REFUNDED",
    });
    mockDbTransaction.mockImplementation(async callback =>
      callback({
        return: {
          update: (...args: unknown[]) => mockReturnUpdate(...args),
        },
        orderItem: {
          update: (...args: unknown[]) => mockOrderItemUpdate(...args),
        },
        order: {
          update: (...args: unknown[]) => mockOrderUpdate(...args),
        },
      })
    );
    mockGenerateReturnLabel.mockResolvedValue(Buffer.from("pdf"));
    mockSendReturnApprovedEmail.mockResolvedValue({ success: true });
    mockSendReturnRejectedEmail.mockResolvedValue({ success: true });
    mockGetStripeServerClient.mockReturnValue({
      refunds: {
        create: (...args: unknown[]) => mockStripeRefundCreate(...args),
      },
    });
    mockStripeRefundCreate.mockResolvedValue({ id: "re_1" });
  });

  it("stores liability, resolution status, deadline, and notes", async () => {
    mockFindUnique
      .mockResolvedValueOnce(buildReturnRecord())
      .mockResolvedValueOnce(
        buildReturnRecord({
          liability: "COURIER",
          resolutionStatus: "WAITING_COURIER",
          externalClaimDeadline: new Date("2026-03-12T00:00:00.000Z"),
          resolutionNotes: "Awaiting courier claim review.",
        })
      );

    mockReturnUpdate.mockResolvedValue(
      buildReturnRecord({
        liability: "COURIER",
        resolutionStatus: "WAITING_COURIER",
        externalClaimDeadline: new Date("2026-03-12T00:00:00.000Z"),
        resolutionNotes: "Awaiting courier claim review.",
      })
    );

    const { PATCH } = await import(
      "@/app/api/returns/[returnId]/status/route"
    );

    const response = await PATCH(
      new Request("http://localhost/api/returns/ret_1/status", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          liability: "COURIER",
          resolutionStatus: "WAITING_COURIER",
          externalClaimDeadline: "2026-03-12",
          resolutionNotes: "Awaiting courier claim review.",
        }),
      }),
      { params: Promise.resolve({ returnId: "ret_1" }) }
    );

    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(mockReturnUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "ret_1" },
        data: expect.objectContaining({
          liability: "COURIER",
          resolutionStatus: "WAITING_COURIER",
          externalClaimDeadline: expect.any(Date),
          resolutionNotes: "Awaiting courier claim review.",
        }),
      })
    );
    expect(mockOrderItemUpdate).not.toHaveBeenCalled();
    expect(payload.return.liability).toBe("COURIER");
    expect(payload.return.resolutionStatus).toBe("WAITING_COURIER");
  });

  it("allows a valid lifecycle transition and syncs the order item status", async () => {
    mockFindUnique
      .mockResolvedValueOnce(buildReturnRecord())
      .mockResolvedValueOnce(
        buildReturnRecord({
          status: "APPROVED",
          orderItem: buildOrderItem({ returnStatus: "APPROVED" }),
        })
      );

    mockReturnUpdate.mockResolvedValue(
      buildReturnRecord({
        status: "APPROVED",
      })
    );

    const { PATCH } = await import(
      "@/app/api/returns/[returnId]/status/route"
    );

    const response = await PATCH(
      new Request("http://localhost/api/returns/ret_1/status", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "APPROVED",
        }),
      }),
      { params: Promise.resolve({ returnId: "ret_1" }) }
    );

    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(mockReturnUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "ret_1" },
        data: expect.objectContaining({
          status: "APPROVED",
        }),
      })
    );
    expect(mockOrderItemUpdate).toHaveBeenCalledWith({
      where: { id: "item_1" },
      data: { returnStatus: "APPROVED" },
    });
  });

  it("rejects invalid lifecycle jumps", async () => {
    mockFindUnique.mockResolvedValueOnce(buildReturnRecord());

    const { PATCH } = await import(
      "@/app/api/returns/[returnId]/status/route"
    );

    const response = await PATCH(
      new Request("http://localhost/api/returns/ret_1/status", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "REFUNDED",
        }),
      }),
      { params: Promise.resolve({ returnId: "ret_1" }) }
    );

    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toContain("Invalid status transition");
    expect(payload.allowedTransitions).toEqual(["APPROVED", "REJECTED"]);
    expect(mockReturnUpdate).not.toHaveBeenCalled();
    expect(mockOrderItemUpdate).not.toHaveBeenCalled();
  });

  it("does not mark manual-payment returns refunded before refund confirmation", async () => {
    mockFindUnique.mockResolvedValueOnce(
      buildReturnRecord({
        status: "RECEIVED",
        order: {
          id: "order_1",
          orderNumber: "ORD-1001",
          createdAt: new Date("2026-03-01T10:00:00.000Z"),
          paymentMethod: "netopia_card",
          stripePaymentIntentId: null,
          total: 100,
          shippingCost: 20,
          paymentStatus: "PAID",
        },
        orderItem: buildOrderItem({ returnStatus: "RECEIVED" }),
      })
    );

    mockReturnUpdate.mockResolvedValue(
      buildReturnRecord({
        status: "RECEIVED",
        refundStatus: "FAILED",
        refundError:
          "Refundul trebuie confirmat în procesatorul de plăți înainte să marchezi returul ca REFUNDED.",
      })
    );

    const { PATCH } = await import(
      "@/app/api/returns/[returnId]/status/route"
    );

    const response = await PATCH(
      new Request("http://localhost/api/returns/ret_1/status", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "REFUNDED",
        }),
      }),
      { params: Promise.resolve({ returnId: "ret_1" }) }
    );

    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.refundStatus).toBe("FAILED");
    expect(payload.error).toContain("procesatorul de plăți");
    expect(mockStripeRefundCreate).not.toHaveBeenCalled();
    expect(mockOrderItemUpdate).not.toHaveBeenCalled();
    expect(mockReturnUpdate).toHaveBeenCalledWith({
      where: { id: "ret_1" },
      data: {
        refundStatus: "FAILED",
        refundError:
          "Refundul trebuie confirmat în procesatorul de plăți înainte să marchezi returul ca REFUNDED.",
      },
    });
    expect(mockDbTransaction).not.toHaveBeenCalled();
  });

  it("finalizes Stripe refunds only after Stripe succeeds", async () => {
    mockFindUnique
      .mockResolvedValueOnce(
        buildReturnRecord({
          status: "RECEIVED",
          order: {
            id: "order_1",
            orderNumber: "ORD-1001",
            createdAt: new Date("2026-03-01T10:00:00.000Z"),
            paymentMethod: "stripe_new",
            stripePaymentIntentId: "pi_123",
            total: 100,
            shippingCost: 20,
            paymentStatus: "PAID",
          },
          orderItem: buildOrderItem({
            returnStatus: "RECEIVED",
            price: 100,
            quantity: 1,
          }),
        })
      )
      .mockResolvedValueOnce(
        buildReturnRecord({
          status: "REFUNDED",
          refundStatus: "SUCCESS",
          refundError: "",
          order: {
            id: "order_1",
            orderNumber: "ORD-1001",
            createdAt: new Date("2026-03-01T10:00:00.000Z"),
            paymentMethod: "stripe_new",
            stripePaymentIntentId: "pi_123",
            total: 100,
            shippingCost: 20,
            paymentStatus: "REFUNDED",
          },
          orderItem: buildOrderItem({
            returnStatus: "REFUNDED",
            price: 100,
            quantity: 1,
          }),
        })
      );

    mockReturnUpdate.mockResolvedValue(
      buildReturnRecord({
        status: "REFUNDED",
        refundStatus: "SUCCESS",
        refundError: "",
      })
    );

    const { PATCH } = await import(
      "@/app/api/returns/[returnId]/status/route"
    );

    const response = await PATCH(
      new Request("http://localhost/api/returns/ret_1/status", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "REFUNDED",
        }),
      }),
      { params: Promise.resolve({ returnId: "ret_1" }) }
    );

    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(mockStripeRefundCreate).toHaveBeenCalledWith({
      payment_intent: "pi_123",
      amount: 10000,
      metadata: {
        returnId: "ret_1",
        orderNumber: "ORD-1001",
        orderItemId: "item_1",
      },
    });
    expect(mockDbTransaction).toHaveBeenCalled();
    expect(mockReturnUpdate).toHaveBeenCalledWith({
      where: { id: "ret_1" },
      data: {
        status: "REFUNDED",
        refundStatus: "SUCCESS",
        refundError: "",
      },
    });
    expect(mockOrderItemUpdate).toHaveBeenCalledWith({
      where: { id: "item_1" },
      data: { returnStatus: "REFUNDED" },
    });
    expect(mockOrderUpdate).toHaveBeenCalledWith({
      where: { id: "order_1" },
      data: { paymentStatus: "REFUNDED" },
    });
  });

  it("keeps the return non-refunded when Stripe refund fails", async () => {
    mockFindUnique.mockResolvedValueOnce(
      buildReturnRecord({
        status: "RECEIVED",
        order: {
          id: "order_1",
          orderNumber: "ORD-1001",
          createdAt: new Date("2026-03-01T10:00:00.000Z"),
          paymentMethod: "stripe_new",
          stripePaymentIntentId: "pi_123",
          total: 100,
          shippingCost: 20,
          paymentStatus: "PAID",
        },
        orderItem: buildOrderItem({
          returnStatus: "RECEIVED",
          price: 100,
          quantity: 1,
        }),
      })
    );

    mockStripeRefundCreate.mockRejectedValueOnce(new Error("stripe boom"));
    mockReturnUpdate.mockResolvedValue(
      buildReturnRecord({
        status: "RECEIVED",
        refundStatus: "FAILED",
        refundError: "stripe boom",
      })
    );

    const { PATCH } = await import(
      "@/app/api/returns/[returnId]/status/route"
    );

    const response = await PATCH(
      new Request("http://localhost/api/returns/ret_1/status", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "REFUNDED",
        }),
      }),
      { params: Promise.resolve({ returnId: "ret_1" }) }
    );

    const payload = await response.json();

    expect(response.status).toBe(500);
    expect(payload.refundStatus).toBe("FAILED");
    expect(payload.error).toBe("Stripe refund failed");
    expect(mockReturnUpdate).toHaveBeenCalledWith({
      where: { id: "ret_1" },
      data: {
        refundStatus: "FAILED",
        refundError: "stripe boom",
      },
    });
    expect(mockOrderItemUpdate).not.toHaveBeenCalled();
  });
});
