/**
 * @jest-environment node
 */

export {};

const mockAuth = jest.fn();
const mockOrderItemFindMany = jest.fn();
const mockReturnFindMany = jest.fn();
const mockUserFindUnique = jest.fn();
const mockTransaction = jest.fn();
const mockCreateMany = jest.fn();
const mockUpdateMany = jest.fn();
const mockTxReturnFindMany = jest.fn();
const mockSendBulkReturnNotificationEmail = jest.fn();
const mockSendBulkReturnConfirmationEmail = jest.fn();

jest.mock("@/lib/auth", () => ({
  auth: () => mockAuth(),
}));

jest.mock("@/lib/config/app-config", () => ({
  appConfig: {
    adminEmail: "admin@techtots.ro",
  },
}));

jest.mock("@/lib/db", () => ({
  db: {
    orderItem: {
      findMany: (...args: unknown[]) => mockOrderItemFindMany(...args),
    },
    return: {
      findMany: (...args: unknown[]) => mockReturnFindMany(...args),
    },
    user: {
      findUnique: (...args: unknown[]) => mockUserFindUnique(...args),
    },
    $transaction: (...args: unknown[]) => mockTransaction(...args),
  },
}));

jest.mock("@/lib/email/migration-helper", () => ({
  sendBulkReturnNotificationEmail: (...args: unknown[]) =>
    mockSendBulkReturnNotificationEmail(...args),
  sendBulkReturnConfirmationEmail: (...args: unknown[]) =>
    mockSendBulkReturnConfirmationEmail(...args),
}));

function buildOrderItem(overrides: Record<string, unknown> = {}) {
  const deliveredAt = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
  const createdAt = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  return {
    id: "item_1",
    orderId: "order_1",
    name: "Robot STEM",
    quantity: 1,
    isDigital: false,
    returnStatus: "NONE",
    order: {
      id: "order_1",
      orderNumber: "ORD-1001",
      userId: "user_1",
      status: "DELIVERED",
      createdAt,
      deliveredAt,
    },
    product: {
      sku: "ROBOT-1",
      name: "Robot STEM",
    },
    ...overrides,
  };
}

describe("POST /api/returns/create-bulk", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockAuth.mockResolvedValue({
      user: {
        id: "user_1",
        email: "ana@example.com",
      },
    });

    mockReturnFindMany.mockResolvedValue([]);
    mockUserFindUnique.mockResolvedValue({
      name: "Ana",
      email: "ana@example.com",
    });
    mockCreateMany.mockResolvedValue({ count: 1 });
    mockUpdateMany.mockResolvedValue({ count: 1 });
    mockTxReturnFindMany.mockResolvedValue([{ id: "ret_1" }]);
    mockTransaction.mockImplementation(async callback =>
      callback({
        return: {
          createMany: mockCreateMany,
          findMany: mockTxReturnFindMany,
        },
        orderItem: {
          updateMany: mockUpdateMany,
        },
      })
    );
    mockSendBulkReturnNotificationEmail.mockResolvedValue({ success: true });
    mockSendBulkReturnConfirmationEmail.mockResolvedValue({ success: true });
  });

  it("rejects requests when some submitted item ids are missing or not owned", async () => {
    mockOrderItemFindMany.mockResolvedValue([buildOrderItem()]);

    const { POST } = await import("@/app/api/returns/create-bulk/route");
    const response = await POST(
      new Request("http://localhost/api/returns/create-bulk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderItemIds: ["item_1", "item_2"],
          reason: "DAMAGED_OR_DEFECTIVE",
          photos: ["https://utfs.io/f/photo-1"],
        }),
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toContain("nu au fost găsite");
    expect(mockTransaction).not.toHaveBeenCalled();
  });

  it("rejects returns for orders that are not delivered", async () => {
    mockOrderItemFindMany.mockResolvedValue([
      buildOrderItem({
        order: {
          id: "order_1",
          orderNumber: "ORD-1001",
          userId: "user_1",
          status: "SHIPPED",
          createdAt: new Date("2026-03-01T10:00:00.000Z"),
          deliveredAt: null,
        },
      }),
    ]);

    const { POST } = await import("@/app/api/returns/create-bulk/route");
    const response = await POST(
      new Request("http://localhost/api/returns/create-bulk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderItemIds: ["item_1"],
          reason: "CHANGED_MIND",
          photos: ["https://utfs.io/f/photo-1"],
        }),
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toBe(
      "Poți returna doar produse din comenzi livrate."
    );
    expect(mockTransaction).not.toHaveBeenCalled();
  });

  it("rejects digital items even if they are submitted directly to the API", async () => {
    mockOrderItemFindMany.mockResolvedValue([
      buildOrderItem({
        name: "Carte Digitală",
        isDigital: true,
      }),
    ]);

    const { POST } = await import("@/app/api/returns/create-bulk/route");
    const response = await POST(
      new Request("http://localhost/api/returns/create-bulk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderItemIds: ["item_1"],
          reason: "OTHER",
          details: "Nu ar trebui acceptat",
          photos: ["https://utfs.io/f/photo-1"],
        }),
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toContain("Produsele digitale nu pot fi returnate");
    expect(payload.error).toContain("Carte Digitală");
    expect(mockTransaction).not.toHaveBeenCalled();
  });

  it("normalizes duplicate item ids and still creates a valid bulk return", async () => {
    mockOrderItemFindMany.mockResolvedValue([buildOrderItem()]);

    const { POST } = await import("@/app/api/returns/create-bulk/route");
    const response = await POST(
      new Request("http://localhost/api/returns/create-bulk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderItemIds: ["item_1", "item_1", "  item_1  "],
          reason: "DAMAGED_OR_DEFECTIVE",
          details: "Cutia a ajuns deteriorată.",
          photos: ["https://utfs.io/f/photo-1"],
        }),
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(mockOrderItemFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: { in: ["item_1"] },
        }),
      })
    );
    expect(mockCreateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: [
          expect.objectContaining({
            orderItemId: "item_1",
            status: "PENDING",
          }),
        ],
      })
    );
    expect(mockUpdateMany).toHaveBeenCalledWith({
      where: {
        id: { in: ["item_1"] },
      },
      data: {
        returnStatus: "REQUESTED",
      },
    });
  });

  it("returns a conflict response when the database blocks a duplicate active return", async () => {
    mockOrderItemFindMany.mockResolvedValue([buildOrderItem()]);
    mockTransaction.mockRejectedValue({ code: "P2002" });

    const { POST } = await import("@/app/api/returns/create-bulk/route");
    const response = await POST(
      new Request("http://localhost/api/returns/create-bulk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderItemIds: ["item_1"],
          reason: "DAMAGED_OR_DEFECTIVE",
          photos: ["https://utfs.io/f/photo-1"],
        }),
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(409);
    expect(payload.error).toContain("retur activ");
  });
});
