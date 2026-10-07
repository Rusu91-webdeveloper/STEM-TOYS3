/** @jest-environment node */
export {};
const mockAuth = jest.fn();
const mockCsrf = jest.fn();
const mockFind = jest.fn();
const mockUpdate = jest.fn();
const mockItems = jest.fn();
const mockSend = jest.fn();
jest.mock("@/lib/auth", () => ({ auth: () => mockAuth() }));
jest.mock("@/lib/csrf", () => ({ validateCsrfForRequest: () => mockCsrf() }));
jest.mock("@/lib/db", () => ({
  db: {
    return: { findMany: (...args: unknown[]) => mockFind(...args) },
    $transaction: (callback: (tx: unknown) => unknown) =>
      callback({
        return: { update: mockUpdate },
        orderItem: { updateMany: mockItems },
      }),
  },
}));
jest.mock("@/lib/returns/approval-notification", () => ({
  sendBulkReturnApprovalNotification: (...args: unknown[]) => mockSend(...args),
}));
const record = {
  id: "ret",
  orderId: "order",
  orderItemId: "item",
  status: "APPROVED",
  updatedAt: new Date("2026-10-07T12:00:00Z"),
  order: { orderNumber: "TEST" },
  user: { email: "qa@example.invalid" },
};
async function approve(body: unknown = { returnIds: ["ret"] }) {
  const { POST } = await import("@/app/api/returns/bulk-approve/route");
  return POST(
    new Request("http://localhost/api/returns/bulk-approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
  );
}
beforeEach(() => {
  jest.clearAllMocks();
  mockAuth.mockResolvedValue({ user: { id: "admin", role: "ADMIN" } });
  mockCsrf.mockResolvedValue({ valid: true });
  mockFind.mockResolvedValue([record]);
  mockUpdate.mockResolvedValue(record);
  mockItems.mockResolvedValue({ count: 1 });
  mockSend.mockResolvedValue({ success: true });
});
test.each([null, { user: { id: "customer", role: "CUSTOMER" } }])(
  "denies non-admin before database or mail",
  async session => {
    mockAuth.mockResolvedValue(session);
    expect((await approve()).status).toBe(403);
    expect(mockFind).not.toHaveBeenCalled();
    expect(mockSend).not.toHaveBeenCalled();
  }
);
test("CSRF failure prevents review and mail", async () => {
  mockCsrf.mockResolvedValue({ valid: false });
  expect((await approve()).status).toBe(403);
  expect(mockUpdate).not.toHaveBeenCalled();
});
test("approved retry awaits actual email acceptance without downgrading a stale return", async () => {
  const response = await approve();
  expect(response.status).toBe(200);
  expect(mockUpdate.mock.calls[0][0].where).toEqual({
    id: record.id,
    status: "APPROVED",
    updatedAt: record.updatedAt,
  });
  expect(mockSend).toHaveBeenCalledWith([record]);
  expect((await response.json()).data.notifications[0].success).toBe(true);
});
test("saved approval with failed email reports incomplete delivery", async () => {
  mockSend.mockResolvedValue({ success: false });
  const response = await approve();
  expect(response.status).toBe(202);
  expect(mockUpdate).toHaveBeenCalled();
  expect((await response.json()).data.notifications[0].success).toBe(false);
});
test("a concurrent state change stops email dispatch", async () => {
  mockUpdate.mockRejectedValue(new Error("stale updatedAt"));
  expect((await approve()).status).toBe(500);
  expect(mockSend).not.toHaveBeenCalled();
});
