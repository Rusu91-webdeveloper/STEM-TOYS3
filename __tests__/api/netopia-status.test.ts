/**
 * @jest-environment node
 */

const mockFindUnique = jest.fn();
const mockFindFirst = jest.fn();
const mockUpdate = jest.fn();
const mockGetPaymentStatus = jest.fn();

jest.mock("@/lib/db", () => ({
  db: {
    order: {
      findUnique: mockFindUnique,
      findFirst: mockFindFirst,
      update: mockUpdate,
    },
  },
}));

jest.mock("@/lib/payments/NetopiaProvider", () => ({
  NetopiaProvider: jest.fn().mockImplementation(() => ({
    getPaymentStatus: mockGetPaymentStatus,
  })),
}));

describe("GET /api/payments/netopia/status", () => {
  let handler: typeof import("@/app/api/payments/netopia/status/route")["GET"];

  beforeEach(async () => {
    jest.resetModules();
    mockFindUnique.mockReset();
    mockFindFirst.mockReset();
    mockUpdate.mockReset();
    mockGetPaymentStatus.mockReset();
    handler = (await import("@/app/api/payments/netopia/status/route")).GET;
  });

  it("keeps the callback in pending state until the backend persists a paid Netopia result", async () => {
    mockFindUnique.mockResolvedValue({
      id: "ord_1",
      paymentStatus: "PENDING",
      total: 129.99,
      netopiaTransactionId: "ntp_1",
      user: null,
      shippingAddress: null,
      items: [],
    });
    mockGetPaymentStatus.mockResolvedValue({
      transactionId: "ntp_1",
      status: "paid",
      amount: 129.99,
      currency: "RON",
    });

    const response = await handler(
      new Request("http://localhost/api/payments/netopia/status?orderId=ord_1")
    );
    const payload = await response.json();

    expect(payload).toMatchObject({
      transactionId: "ntp_1",
      status: "pending",
      providerStatus: "paid",
      source: "netopia_api_pending_webhook",
    });
  });

  it("returns paid immediately when the database is already finalized", async () => {
    mockFindUnique.mockResolvedValue({
      id: "ord_paid",
      paymentStatus: "PAID",
      total: 199.99,
      netopiaTransactionId: "ntp_paid",
      user: null,
      shippingAddress: null,
      items: [],
    });

    const response = await handler(
      new Request(
        "http://localhost/api/payments/netopia/status?orderId=ord_paid"
      )
    );
    const payload = await response.json();

    expect(payload).toMatchObject({
      transactionId: "ntp_paid",
      status: "paid",
      source: "database",
    });
    expect(mockGetPaymentStatus).not.toHaveBeenCalled();
  });
});
