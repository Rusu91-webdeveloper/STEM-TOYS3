/**
 * @jest-environment node
 */

export {};

const mockAuth = jest.fn();
const mockOrderItemFindUnique = jest.fn();
const mockReturnFindFirst = jest.fn();
const mockTransaction = jest.fn();

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
      findUnique: (...args: unknown[]) => mockOrderItemFindUnique(...args),
    },
    return: {
      findFirst: (...args: unknown[]) => mockReturnFindFirst(...args),
    },
    $transaction: (...args: unknown[]) => mockTransaction(...args),
    storeSettings: {
      findFirst: jest.fn(),
    },
  },
}));

describe("POST /api/returns/create", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockAuth.mockResolvedValue({
      user: {
        id: "user_1",
        email: "ana@example.com",
        role: "CUSTOMER",
      },
    });

    mockOrderItemFindUnique.mockResolvedValue({
      id: "item_1",
      orderId: "order_1",
      isDigital: false,
      name: "Robot STEM",
      product: {
        sku: "ROBOT-1",
        images: ["robot.jpg"],
      },
      order: {
        id: "order_1",
        orderNumber: "ORD-1001",
        userId: "user_1",
        status: "DELIVERED",
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        deliveredAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
    });
    mockReturnFindFirst.mockResolvedValue(null);
  });

  it("returns a conflict response when the database blocks a duplicate active return", async () => {
    mockTransaction.mockRejectedValue({ code: "P2002" });

    const { POST } = await import("@/app/api/returns/create/route");
    const response = await POST(
      new Request("http://localhost/api/returns/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderItemId: "item_1",
          reason: "DAMAGED_OR_DEFECTIVE",
        }),
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(409);
    expect(payload.error).toContain("retur activ");
  });
});
