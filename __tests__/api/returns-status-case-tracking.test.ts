/**
 * @jest-environment node
 */

export {};

const mockAuth = jest.fn();
const mockFindUnique = jest.fn();
const mockUpdate = jest.fn();

jest.mock("@/lib/auth", () => ({
  auth: () => mockAuth(),
}));

jest.mock("@/lib/db", () => ({
  db: {
    return: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
      update: (...args: unknown[]) => mockUpdate(...args),
      count: jest.fn(),
    },
    orderItem: {
      count: jest.fn(),
    },
    order: {
      update: jest.fn(),
    },
  },
}));

jest.mock("@/lib/return-label", () => ({
  generateReturnLabel: jest.fn(),
}));

jest.mock("@/lib/stripe-server", () => ({
  getStripeServerClient: jest.fn(),
}));

jest.mock("@/lib/email/return-templates", () => ({
  sendReturnApprovedEmail: jest.fn(),
  sendReturnRejectedEmail: jest.fn(),
}));

describe("PATCH /api/returns/[returnId]/status case tracking", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockAuth.mockResolvedValue({
      user: {
        id: "admin_1",
        role: "ADMIN",
      },
    });

    mockFindUnique
      .mockResolvedValueOnce({
        id: "ret_1",
        refundStatus: null,
        supplierAuthorizationRequestedAt: null,
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
          id: "item_1",
          productId: "prod_1",
          name: "Robot STEM",
          price: 100,
          quantity: 1,
          product: {
            supplier: {
              id: "sup_1",
              name: "Supplier One",
            },
          },
        },
        user: {
          id: "user_1",
          name: "Ana",
          email: "ana@example.com",
          addresses: [],
        },
      })
      .mockResolvedValueOnce({
        id: "ret_1",
        liability: "COURIER",
        resolutionStatus: "WAITING_COURIER",
        externalClaimDeadline: new Date("2026-03-12T00:00:00.000Z"),
        resolutionNotes: "Awaiting courier claim review.",
        reportLogs: [],
        refundError: "",
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
          id: "item_1",
          productId: "prod_1",
          name: "Robot STEM",
          price: 100,
          quantity: 1,
          product: {
            supplier: {
              id: "sup_1",
              name: "Supplier One",
            },
          },
        },
        user: {
          id: "user_1",
          name: "Ana",
          email: "ana@example.com",
          addresses: [],
        },
      });

    mockUpdate.mockResolvedValue({
      id: "ret_1",
      liability: "COURIER",
      resolutionStatus: "WAITING_COURIER",
      externalClaimDeadline: new Date("2026-03-12T00:00:00.000Z"),
      resolutionNotes: "Awaiting courier claim review.",
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
        id: "item_1",
        productId: "prod_1",
        name: "Robot STEM",
        price: 100,
        quantity: 1,
        product: {
          supplier: {
            id: "sup_1",
            name: "Supplier One",
          },
        },
      },
      user: {
        id: "user_1",
        name: "Ana",
        email: "ana@example.com",
        addresses: [],
      },
    });
  });

  it("stores liability, resolution status, deadline, and notes", async () => {
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
    expect(mockUpdate).toHaveBeenCalledWith(
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
    expect(payload.return.liability).toBe("COURIER");
    expect(payload.return.resolutionStatus).toBe("WAITING_COURIER");
  });
});
